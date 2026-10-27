import { iLog } from "../utils/logger";
import request from "./request";

export type DownloadRecord = {
  id: string;
  url: string;
  filename: string;
  /** 下载保存的子目录（相对于浏览器默认下载目录） */
  directory?: string;
  status: "downloading" | "completed" | "interrupted" | "failed";
  loaded: number;
  total: number;
  createdAt: number;
  /** 下载完成时间 */
  completedAt?: number;
  error?: string;
  /** 执行下载的标签页标识，仅下载中有效 */
  owner?: string;
  /** 下载状态的最后更新时间，用于判断执行下载的标签页是否仍存活 */
  updatedAt?: number;
};

const STORAGE_KEY = "pp-downloads";
/** 已完成的下载记录最多保留的条数 */
const MAX_COMPLETED_RECORDS = 200;
/** 待重试（失败或中断）的下载记录最多保留的条数 */
const MAX_RETRYABLE_RECORDS = 200;
/** 当前标签页的标识 */
const TAB_ID = crypto.randomUUID();
/** 执行下载的标签页超过该时长未更新状态时，视为该标签页已崩溃或卸载 */
const OWNER_TIMEOUT = 180_000;
/** 刷新下载状态存活时间的心跳间隔 */
const HEARTBEAT_INTERVAL = 15_000;

const listeners = new Set<() => void>();
const attempts = new Map<string, symbol>();
const requests = new Map<string, { abort: () => void }>();
/** 被用户主动中止的尝试 */
const abortedAttempts = new Set<symbol>();
let downloads: DownloadRecord[] | undefined;
let heartbeat: ReturnType<typeof setInterval> | undefined;

/** 清除记录上的下载归属信息 */
const releaseOwnership = (record: DownloadRecord) => {
  delete record.owner;
  record.updatedAt = Date.now();
};

/** 读取存储中由各标签页共享的下载记录 */
const readStoredDownloads = (): DownloadRecord[] => {
  const saved: unknown = GM_getValue(STORAGE_KEY, []);
  if (!Array.isArray(saved)) return [];
  const now = Date.now();
  return saved
    .filter(
      (item): item is DownloadRecord =>
        item &&
        typeof item.id === "string" &&
        typeof item.url === "string" &&
        /^https?:\/\//.test(item.url) &&
        typeof item.filename === "string" &&
        ["downloading", "completed", "interrupted", "failed"].includes(
          item.status
        ) &&
        Number.isFinite(item.loaded) &&
        Number.isFinite(item.total) &&
        Number.isFinite(item.createdAt) &&
        (item.completedAt === undefined || Number.isFinite(item.completedAt))
    )
    .map((item) => {
      const record: DownloadRecord = {
        id: item.id,
        url: item.url,
        filename: item.filename,
        status: item.status,
        loaded: item.loaded,
        total: item.total,
        createdAt: item.createdAt,
      };
      if (typeof item.directory === "string" && item.directory) {
        record.directory = item.directory;
      }
      if (Number.isFinite(item.completedAt)) {
        record.completedAt = item.completedAt;
      }
      if (typeof item.error === "string") record.error = item.error;
      if (typeof item.owner === "string") record.owner = item.owner;
      if (Number.isFinite(item.updatedAt)) record.updatedAt = item.updatedAt;
      if (
        record.status === "downloading" &&
        (!record.owner ||
          record.updatedAt === undefined ||
          now - record.updatedAt > OWNER_TIMEOUT)
      ) {
        // 执行下载的标签页已关闭，保留记录以便重试
        record.status = "interrupted";
        releaseOwnership(record);
      }
      return record;
    });
};

/** 本标签页已删除的记录，避免合并存储快照时被旧数据带回 */
const removedIds = new Set<string>();

/** 其他标签页写入存储后置为 `true`，下次落盘前才需要重新读取 */
let remoteChangePending = false;

/**
 * 合并存储快照与本地记录：按更新时间取较新状态，本标签页进行中的下载始终以本地对象为准。
 * `allowDelete` 用于同步其他标签页的删除操作。
 */
const applyStored = (stored: DownloadRecord[], allowDelete: boolean) => {
  const remote = stored.filter((record) => !removedIds.has(record.id));
  if (!downloads) {
    downloads = remote;
    return;
  }
  const remoteById = new Map(remote.map((record) => [record.id, record]));
  const result: DownloadRecord[] = [];
  for (const record of downloads) {
    if (attempts.has(record.id)) {
      result.push(record);
      continue;
    }
    const remoteRecord = remoteById.get(record.id);
    if (!remoteRecord) {
      if (!allowDelete) result.push(record);
      continue;
    }
    result.push(
      (remoteRecord.updatedAt ?? 0) >= (record.updatedAt ?? 0)
        ? remoteRecord
        : record
    );
  }
  const known = new Set(result.map((record) => record.id));
  for (const record of remote) {
    if (!known.has(record.id)) result.push(record);
  }
  downloads = result.sort((a, b) => b.createdAt - a.createdAt);
};

const syncFromStorage = (allowDelete = false) => {
  applyStored(readStoredDownloads(), allowDelete);
};

/** 记录数超出上限时，移除最早的已完成记录和最早的待重试记录 */
const trimDownloads = () => {
  if (!downloads) return;
  // 按创建时间倒序排列，保证被移除的是最早的记录
  downloads = [...downloads].sort((a, b) => b.createdAt - a.createdAt);
  const counts = { completed: 0, retryable: 0 };
  const kept = downloads.filter((record) => {
    const type =
      record.status === "completed"
        ? "completed"
        : record.status === "failed" || record.status === "interrupted"
          ? "retryable"
          : undefined;
    if (!type) return true;
    const limit =
      type === "completed" ? MAX_COMPLETED_RECORDS : MAX_RETRYABLE_RECORDS;
    if (counts[type] < limit) {
      counts[type] += 1;
      return true;
    }
    removedIds.add(record.id);
    return false;
  });
  if (kept.length === downloads.length) return;
  downloads = kept;
};

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      iLog.e("更新下载列表失败：", error);
    }
  });
};

const publish = (persist = true) => {
  if (persist) {
    // 刷新本标签页负责的下载的存活时间，作为心跳之外的保底刷新
    const now = Date.now();
    for (const record of downloads ?? []) {
      if (record.status === "downloading" && attempts.has(record.id)) {
        record.owner = TAB_ID;
        record.updatedAt = now;
      }
    }
    // 只有其他标签页写入过新数据时才需要读回存储，避免每次进度更新都全量反序列化
    if (remoteChangePending) {
      remoteChangePending = false;
      if (downloads) applyStored(readStoredDownloads(), true);
    }
    trimDownloads();
    try {
      GM_setValue(STORAGE_KEY, downloads);
      removedIds.clear();
    } catch (error) {
      iLog.e("保存下载记录失败：", error);
    }
  }
  notify();
  ensureHeartbeat();
};

/** 刷新本标签页下载的存活时间，并将已关闭标签页遗留的下载标记为中断 */
const tick = () => {
  const now = Date.now();
  let changed = false;
  for (const record of downloads ?? []) {
    if (record.status !== "downloading") continue;
    if (attempts.has(record.id)) {
      record.updatedAt = now;
      changed = true;
      continue;
    }
    if (now - (record.updatedAt ?? 0) <= OWNER_TIMEOUT) continue;
    iLog.w(`下载所在标签页已关闭，标记为中断：${record.filename}`);
    record.status = "interrupted";
    releaseOwnership(record);
    changed = true;
  }
  if (changed) publish();
  if (!downloads?.some((record) => record.status === "downloading")) {
    if (heartbeat !== undefined) clearInterval(heartbeat);
    heartbeat = undefined;
  }
};

const ensureHeartbeat = () => {
  if (heartbeat !== undefined) return;
  if (!downloads?.some((record) => record.status === "downloading")) return;
  heartbeat = setInterval(tick, HEARTBEAT_INTERVAL);
};

GM_addValueChangeListener(STORAGE_KEY, (_key, _oldValue, _newValue, remote) => {
  if (!remote) return;
  remoteChangePending = true;
  syncFromStorage(true);
  publish(false);
});

export const getDownloads = (): readonly DownloadRecord[] => {
  if (!downloads) {
    downloads = readStoredDownloads();
    trimDownloads();
    ensureHeartbeat();
  }
  return downloads.map((item) => ({ ...item }));
};

export const subscribeDownloads = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** 下载是否正在当前标签页执行 */
export const isDownloadingInThisTab = (id: string) => attempts.has(id);

type DownloadOptions = Omit<
  Tampermonkey.Request,
  "url" | "method" | "responseType"
>;

let hasWarnedDirectoryFallback = false;

/** 使用 `<a download>` 保存文件，子目录会被浏览器替换为下划线，仅用于无目录场景 */
const saveWithAnchor = (blob: Blob, filename: string) => {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  try {
    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  }
};

/**
 * 保存下载的文件。存在子目录时借助 `GM_download` 保存到子目录，
 * 该能力依赖 Tampermonkey 的「浏览器 API」下载模式，不可用时回退到默认下载目录。
 */
const saveBlob = (blob: Blob, record: DownloadRecord) => {
  const { directory, filename } = record;
  const saveToDefaultDirectory = () => {
    if (directory && !hasWarnedDirectoryFallback) {
      hasWarnedDirectoryFallback = true;
      iLog.w(
        `无法保存到子目录 ${directory}，已改为默认下载目录。如需按子目录保存，请在 Tampermonkey 设置中将「下载模式」设为「浏览器 API」。`
      );
    }
    saveWithAnchor(blob, filename);
  };
  // 仅 Tampermonkey 的「浏览器 API」下载模式支持子目录，其他模式直接回退
  const canSaveToDirectory =
    globalThis.GM_info?.downloadMode !== "native" &&
    globalThis.GM_info?.downloadMode !== "disabled" &&
    typeof GM_download === "function";

  if (!directory || !canSaveToDirectory) {
    saveToDefaultDirectory();
    return;
  }

  try {
    GM_download({
      url: blob,
      name: `${directory}/${filename}`,
      onerror: saveToDefaultDirectory,
    });
  } catch {
    saveToDefaultDirectory();
  }
};

const startDownload = (
  record: DownloadRecord,
  options: DownloadOptions = {}
) => {
  const { onload, onerror, onprogress, ontimeout, onabort, ...restOptions } =
    options;
  record.status = "downloading";
  record.loaded = 0;
  record.total = 0;
  record.owner = TAB_ID;
  record.updatedAt = Date.now();
  delete record.completedAt;
  delete record.error;
  const attempt = Symbol();
  attempts.set(record.id, attempt);
  const isActive = () =>
    record.status === "downloading" && attempts.get(record.id) === attempt;
  publish();

  const fail = (message: string) => {
    if (!isActive()) return;
    record.status = "failed";
    attempts.delete(record.id);
    releaseOwnership(record);
    record.error = message;
    publish();
    iLog.e(`Download ${record.filename} from ${record.url} failed: ${message}`);
  };
  let lastProgressSave = 0;
  try {
    const pending = request({
      ...restOptions,
      url: record.url,
      method: "GET",
      responseType: "blob",
      onprogress: function (this, response) {
        if (!isActive()) return;
        record.loaded = Math.max(0, response.loaded || 0);
        record.total = response.lengthComputable
          ? Math.max(0, response.total || 0)
          : 0;
        const now = Date.now();
        const persist = now - lastProgressSave >= 1000;
        if (persist) lastProgressSave = now;
        publish(persist);
        onprogress?.call(this, response);
      },
      onload: function (this, response) {
        if (!isActive()) return;
        if (response.status < 200 || response.status >= 300) {
          const message = `HTTP ${response.status}`;
          fail(message);
          const errorResponse = { ...response, error: message };
          onerror?.call(errorResponse, errorResponse);
          return;
        }

        try {
          const blob =
            response.response instanceof Blob
              ? response.response
              : new Blob([response.response]);
          saveBlob(blob, record);
          record.status = "completed";
          attempts.delete(record.id);
          releaseOwnership(record);
          record.loaded = blob.size;
          record.total = blob.size;
          record.completedAt = Date.now();
          publish();
        } catch (error) {
          const message = String(error);
          fail(message);
          const errorResponse = { ...response, error: message };
          onerror?.call(errorResponse, errorResponse);
          return;
        }
        onload?.call(this, response);
      },
      onerror: function (this, response) {
        if (!isActive()) return;
        fail(response.error || "网络错误");
        onerror?.call(this, response);
      },
      ontimeout: function (this) {
        if (!isActive()) return;
        fail("下载超时");
        ontimeout?.call(this);
      },
      onabort: function (this) {
        if (abortedAttempts.delete(attempt)) {
          // 用户主动中止：记录已标记为中断，仍需通知调用方重置界面
          onabort?.call(this);
          return;
        }
        if (!isActive()) return;
        fail("下载已取消");
        onabort?.call(this);
      },
    });
    requests.set(record.id, pending);
    // GM.xmlHttpRequest 在触发错误回调后也可能拒绝 Promise。
    void Promise.resolve(pending)
      .catch((error: unknown) => fail(String(error)))
      .finally(() => {
        abortedAttempts.delete(attempt);
        if (requests.get(record.id) === pending) requests.delete(record.id);
      });
  } catch (error) {
    fail(String(error));
  }
};

/** 中止下载中的作品，被中止的下载视为待重试 */
export const abortDownload = (id: string) => {
  getDownloads();
  const record = downloads!.find((item) => item.id === id);
  if (record?.status !== "downloading") return;
  // 其他标签页执行的下载无法在此中止，只能等待其完成或所在标签页关闭
  if (!attempts.has(id)) return;
  const pending = requests.get(id);
  const attempt = attempts.get(id);
  // 先使当前尝试失效，避免中止产生的回调改写记录状态
  requests.delete(id);
  attempts.delete(id);
  if (attempt) abortedAttempts.add(attempt);
  record.status = "interrupted";
  releaseOwnership(record);
  delete record.error;
  publish();
  try {
    pending?.abort();
  } catch (error) {
    if (attempt) abortedAttempts.delete(attempt);
    iLog.e(`中止下载 ${record.filename} 失败：`, error);
  }
};

export const downloadFile = (
  url: string,
  filename: string,
  options: DownloadOptions = {},
  directory?: string
) => {
  getDownloads();
  syncFromStorage();
  const record: DownloadRecord = {
    id: crypto.randomUUID(),
    url,
    filename,
    status: "downloading",
    loaded: 0,
    total: 0,
    createdAt: Date.now(),
  };
  if (directory) record.directory = directory;
  downloads!.unshift(record);
  startDownload(record, options);
};

export const retryDownload = (id: string) => {
  getDownloads();
  syncFromStorage();
  const record = downloads!.find((item) => item.id === id);
  if (record?.status === "failed" || record?.status === "interrupted") {
    startDownload(record);
  }
};

export const clearCompletedDownloads = () => {
  getDownloads();
  syncFromStorage(true);
  const removed = downloads!.filter((record) => record.status === "completed");
  for (const record of removed) removedIds.add(record.id);
  downloads = downloads!.filter((record) => record.status !== "completed");
  publish();
};

export const ignoreRetryableDownloads = () => {
  getDownloads();
  syncFromStorage(true);
  const removed = downloads!.filter(
    (record) => record.status === "failed" || record.status === "interrupted"
  );
  for (const record of removed) removedIds.add(record.id);
  downloads = downloads!.filter(
    (record) => record.status !== "failed" && record.status !== "interrupted"
  );
  publish();
};

// 标签页关闭时立即把本页负责的下载标记为中断，其他标签页可据此重试
window.addEventListener("pagehide", (event) => {
  // 进入往返缓存时页面可能恢复，且下载请求仍在进行，不做中断处理
  if (event.persisted) return;
  const local = downloads?.filter(
    (record) => record.status === "downloading" && attempts.has(record.id)
  );
  if (!local?.length) return;
  for (const record of local) {
    record.status = "interrupted";
    releaseOwnership(record);
  }
  attempts.clear();
  publish();
});

// 切回标签页时重新读取共享状态，避免后台节流导致的状态滞后
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  syncFromStorage(true);
  publish(false);
});

// 从往返缓存恢复的页面中，下载请求已随页面冻结失效，需按中断处理
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  attempts.clear();
  requests.clear();
  for (const record of downloads ?? []) {
    if (record.status === "downloading" && record.owner === TAB_ID) {
      record.status = "interrupted";
      releaseOwnership(record);
    }
  }
  syncFromStorage(true);
  publish();
});
