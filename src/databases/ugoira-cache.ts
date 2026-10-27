import {
  UGOIRA_FRAME_CACHE_MAX_BYTES,
  UGOIRA_FRAME_CACHE_MAX_ENTRIES,
  UGOIRA_FRAME_CACHE_TIME,
} from "../constants";
import { iLog } from "../utils/logger";
import {
  CACHE_DATE_INDEX,
  getDatabase,
  runRequest,
  runTransaction,
  toTimestamp,
  UGOIRA_FRAMES_CACHE_TABLE_KEY,
} from "./connection";

export interface UgoiraCachedFrame {
  /** 帧在 zip 内的文件名 */
  file: string;
  /** 帧的播放时长（毫秒） */
  delay: number;
  blob: Blob;
}

export interface UgoiraFramesCache {
  id: string;
  frames: UgoiraCachedFrame[];
  /** 所有帧的字节数之和 */
  size: number;
  cacheDate: number;
}

/** 剩余可用空间比例低于该值时不再写入缓存，避免挤占 Pixiv 自身的存储 */
const MIN_FREE_STORAGE_RATIO = 0.2;

const sumFrameSize = (frames: UgoiraCachedFrame[]) =>
  frames.reduce((total, frame) => total + frame.blob.size, 0);

/** 存储空间是否足够写入新的动图帧缓存 */
const hasEnoughStorage = async (size: number) => {
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate?.quota || estimate.usage === undefined) return true;
    const free = estimate.quota - estimate.usage;
    return free - size > estimate.quota * MIN_FREE_STORAGE_RATIO;
  } catch {
    return true;
  }
};

/** 读取缓存的动图帧，过期或超出有效期时返回 `null` */
export const getCachedUgoiraFrames = async (
  id: string,
  now: number = Date.now()
): Promise<Omit<UgoiraFramesCache, "id" | "size" | "cacheDate"> | null> => {
  const entry = await runRequest<UgoiraFramesCache | undefined>(
    UGOIRA_FRAMES_CACHE_TABLE_KEY,
    "readonly",
    (store) => store.get(id)
  );
  if (!entry?.frames?.length) return null;

  if (now - toTimestamp(entry.cacheDate, 0) > UGOIRA_FRAME_CACHE_TIME) {
    void runTransaction(UGOIRA_FRAMES_CACHE_TABLE_KEY, (store) => {
      store.delete(id);
    });
    return null;
  }

  // 损坏的条目会让 `URL.createObjectURL` 抛错并使预览永远停在加载状态，
  // 这里校验后返回 `null`，让调用方回退到正常的 zip 解包路径
  const valid = entry.frames.every(
    (frame) =>
      frame && typeof frame.file === "string" && frame.blob instanceof Blob
  );
  if (!valid) {
    iLog.w(`Cached ugoira frames of ${id} are corrupted, dropping them.`);
    void runTransaction(UGOIRA_FRAMES_CACHE_TABLE_KEY, (store) => {
      store.delete(id);
    });
    return null;
  }

  return { frames: entry.frames };
};

/** 缓存动图帧。空间不足或数据超出容量上限时跳过缓存 */
export const cacheUgoiraFrames = async (
  id: string,
  data: UgoiraCachedFrame[]
): Promise<boolean> => {
  const size = sumFrameSize(data);
  if (!data.length || size > UGOIRA_FRAME_CACHE_MAX_BYTES) return false;
  if (!(await hasEnoughStorage(size))) return false;

  const cached = await runTransaction(
    UGOIRA_FRAMES_CACHE_TABLE_KEY,
    (store) => {
      const entry: UgoiraFramesCache = {
        id,
        frames: data,
        size,
        cacheDate: Date.now(),
      };
      const request = store.put(entry);
      request.onerror = () => {
        iLog.w(`Failed to cache ugoira frames of ${id}:`, request.error);
      };
    }
  );

  if (cached) void pruneUgoiraFrameCache();
  return cached;
};

/**
 * 清理动图帧缓存：删除过期条目，并按“最旧优先”删除直到满足条目与字节上限。
 * Blob 在 IndexedDB 中是惰性引用，读取时不会真正加载字节。
 */
export const pruneUgoiraFrameCache = async (): Promise<void> => {
  const db = await getDatabase();
  if (!db) return;

  const now = Date.now();
  await new Promise<void>((resolve) => {
    try {
      const transaction = db.transaction(
        UGOIRA_FRAMES_CACHE_TABLE_KEY,
        "readwrite"
      );
      const store = transaction.objectStore(UGOIRA_FRAMES_CACHE_TABLE_KEY);
      const request = store.index(CACHE_DATE_INDEX).openCursor();
      let totalSize = 0;
      let totalCount = 0;
      const entries: { id: string; size: number; cacheDate: number }[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          // 先统计全部条目，再按时间升序删除最旧的记录
          entries.sort((a, b) => a.cacheDate - b.cacheDate);
          for (const entry of entries) {
            const expired = now - entry.cacheDate > UGOIRA_FRAME_CACHE_TIME;
            if (
              !expired &&
              totalCount <= UGOIRA_FRAME_CACHE_MAX_ENTRIES &&
              totalSize <= UGOIRA_FRAME_CACHE_MAX_BYTES
            ) {
              break;
            }
            store.delete(entry.id);
            totalCount -= 1;
            totalSize -= entry.size;
          }
          return;
        }
        const value = cursor.value as UgoiraFramesCache;
        entries.push({
          id: value.id,
          size: value.size ?? 0,
          cacheDate: toTimestamp(value.cacheDate, 0),
        });
        totalCount += 1;
        totalSize += value.size ?? 0;
        cursor.continue();
      };
      request.onerror = () => {
        iLog.w("Failed to read ugoira frames cache:", request.error);
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        iLog.w("Failed to prune ugoira frames cache:", transaction.error);
        resolve();
      };
      transaction.onabort = () => {
        iLog.w("Pruning ugoira frames cache was aborted:", transaction.error);
        resolve();
      };
    } catch (error) {
      iLog.w("Failed to prune ugoira frames cache:", error);
      resolve();
    }
  });
};

/** 统计动图帧缓存的条目数与占用字节数 */
export const getUgoiraFrameCacheStats = async (): Promise<{
  count: number;
  bytes: number;
}> => {
  const db = await getDatabase();
  if (!db) return { count: 0, bytes: 0 };

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(
        UGOIRA_FRAMES_CACHE_TABLE_KEY,
        "readonly"
      );
      const request = transaction
        .objectStore(UGOIRA_FRAMES_CACHE_TABLE_KEY)
        .getAll();
      request.onsuccess = () => {
        const entries = request.result as UgoiraFramesCache[];
        resolve({
          count: entries.length,
          bytes: entries.reduce((total, entry) => total + (entry.size ?? 0), 0),
        });
      };
      request.onerror = () => resolve({ count: 0, bytes: 0 });
    } catch {
      resolve({ count: 0, bytes: 0 });
    }
  });
};
