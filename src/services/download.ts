import { iLog } from "../utils/logger";
import request from "./request";

export type DownloadRecord = {
  id: string;
  url: string;
  filename: string;
  status: "downloading" | "completed" | "interrupted" | "failed";
  loaded: number;
  total: number;
  createdAt: number;
  error?: string;
};

const STORAGE_KEY = "pp-downloads";
const listeners = new Set<() => void>();
const attempts = new Map<string, symbol>();
let downloads: DownloadRecord[] | undefined;

export const getDownloads = (): readonly DownloadRecord[] => {
  if (!downloads) {
    const saved: unknown = GM_getValue(STORAGE_KEY, []);
    downloads = Array.isArray(saved)
      ? saved
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
              Number.isFinite(item.createdAt)
          )
          .map((item) => ({
            ...item,
            status: item.status === "downloading" ? "interrupted" : item.status,
          }))
      : [];
  }
  return downloads.map((item) => ({ ...item }));
};

export const subscribeDownloads = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const publish = (persist = true) => {
  if (persist) {
    try {
      GM_setValue(STORAGE_KEY, downloads);
    } catch (error) {
      iLog.e("保存下载记录失败：", error);
    }
  }
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      iLog.e("更新下载列表失败：", error);
    }
  });
};

type DownloadOptions = Omit<
  Tampermonkey.Request,
  "url" | "method" | "responseType"
>;

const startDownload = (
  record: DownloadRecord,
  options: DownloadOptions = {}
) => {
  const { onload, onerror, onprogress, ontimeout, onabort, ...restOptions } =
    options;
  record.status = "downloading";
  record.loaded = 0;
  record.total = 0;
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
          const blobUrl = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          try {
            anchor.href = blobUrl;
            anchor.download = record.filename;
            document.body.appendChild(anchor);
            anchor.click();
          } finally {
            document.body.removeChild(anchor);
            URL.revokeObjectURL(blobUrl);
          }
          record.status = "completed";
          attempts.delete(record.id);
          record.loaded = blob.size;
          record.total = blob.size;
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
        if (!isActive()) return;
        fail("下载已取消");
        onabort?.call(this);
      },
    });
    // GM.xmlHttpRequest 在触发错误回调后也可能拒绝 Promise。
    void Promise.resolve(pending).catch((error: unknown) =>
      fail(String(error))
    );
  } catch (error) {
    fail(String(error));
  }
};

export const downloadFile = (
  url: string,
  filename: string,
  options: DownloadOptions = {}
) => {
  getDownloads();
  const record: DownloadRecord = {
    id: crypto.randomUUID(),
    url,
    filename,
    status: "downloading",
    loaded: 0,
    total: 0,
    createdAt: Date.now(),
  };
  downloads!.unshift(record);
  startDownload(record, options);
};

export const retryDownload = (id: string) => {
  getDownloads();
  const record = downloads!.find((item) => item.id === id);
  if (record?.status === "failed" || record?.status === "interrupted") {
    startDownload(record);
  }
};

export const clearCompletedDownloads = () => {
  getDownloads();
  downloads = downloads!.filter((record) => record.status !== "completed");
  publish();
};

export const ignoreRetryableDownloads = () => {
  getDownloads();
  downloads = downloads!.filter(
    (record) => record.status !== "failed" && record.status !== "interrupted"
  );
  publish();
};
