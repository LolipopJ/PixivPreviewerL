import { iLog } from "../utils/logger";

const INDEX_DB_NAME = "PIXIV_PREVIEWER_L";
/** 2：拆分静态/可变字段的缓存时间，并新增动图帧缓存表 */
const INDEX_DB_VERSION = 2;

export const ILLUSTRATION_DETAILS_CACHE_TABLE_KEY = "illustrationDetailsCache";
export const ILLUST_PAGES_CACHE_TABLE_KEY = "illustPagesCache";
export const UGOIRA_FRAMES_CACHE_TABLE_KEY = "ugoiraFramesCache";

export const STATIC_DATE_INDEX = "staticDate";
export const CACHE_DATE_INDEX = "cacheDate";

export const CACHE_TABLE_KEYS = [
  ILLUSTRATION_DETAILS_CACHE_TABLE_KEY,
  ILLUST_PAGES_CACHE_TABLE_KEY,
  UGOIRA_FRAMES_CACHE_TABLE_KEY,
] as const;

export type CacheTableKey = (typeof CACHE_TABLE_KEYS)[number];

let dbPromise: Promise<IDBDatabase> | null = null;
let hasLoggedOpenError = false;

/** 等待打开数据库的超时时间：升级被其他标签页阻塞时不能无限挂起 */
const OPEN_DATABASE_TIMEOUT = 10_000;

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    let settled = false;
    const settle = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      action();
    };

    // 兜底：`onblocked` 之后浏览器可能永远不再回调，不能让调用方一直等待
    const timeout = setTimeout(() => {
      settle(() => reject(new Error("Opening IndexedDB timed out")));
    }, OPEN_DATABASE_TIMEOUT);

    const request = indexedDB.open(INDEX_DB_NAME, INDEX_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      // 旧版本的缓存结构不兼容，直接重建以免读到脏数据
      CACHE_TABLE_KEYS.forEach((key) => {
        if (db.objectStoreNames.contains(key)) db.deleteObjectStore(key);
      });

      const detailsStore = db.createObjectStore(
        ILLUSTRATION_DETAILS_CACHE_TABLE_KEY,
        { keyPath: "id" }
      );
      detailsStore.createIndex(STATIC_DATE_INDEX, "staticDate");

      const pagesStore = db.createObjectStore(ILLUST_PAGES_CACHE_TABLE_KEY, {
        keyPath: "id",
      });
      pagesStore.createIndex(CACHE_DATE_INDEX, "cacheDate");

      const framesStore = db.createObjectStore(UGOIRA_FRAMES_CACHE_TABLE_KEY, {
        keyPath: "id",
      });
      framesStore.createIndex(CACHE_DATE_INDEX, "cacheDate");
    };

    request.onsuccess = () => {
      const db = request.result;
      iLog.d("Open IndexedDB successfully:", db);
      // 其他标签页升级数据库时主动关闭连接，下次访问会重新打开
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      settle(() => resolve(db));
    };

    request.onerror = () => {
      if (!hasLoggedOpenError) {
        hasLoggedOpenError = true;
        iLog.e("An error occurred while requesting IndexedDB", request.error);
      }
      settle(() =>
        reject(request.error ?? new Error("Failed to open IndexedDB"))
      );
    };

    request.onblocked = () => {
      // 旧标签页仍持有低版本连接时升级会被阻塞，且此后可能不再有任何回调。
      // 立即失败以让缓存降级为直接回源，而不是让预览一直停在加载状态。
      iLog.w("IndexedDB upgrade is blocked by another tab, cache disabled.");
      settle(() => reject(new Error("IndexedDB upgrade is blocked")));
    };
  });

/** 获取数据库连接；打开失败时返回 `null`，所有缓存操作降级为直接回源 */
export const getDatabase = (): Promise<IDBDatabase | null> => {
  if (!dbPromise) {
    // 失败后清空缓存，使下一次调用可以重试，避免一次临时故障永久关闭缓存
    dbPromise = openDatabase().catch((error: unknown) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise.catch((error: unknown) => {
    iLog.e("IndexedDB is unavailable, cache is disabled:", error);
    return null;
  });
};

/** 执行单次请求，任何失败都返回 `null` 而不是抛出 */
export const runRequest = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> => {
  const db = await getDatabase();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(storeName, mode);
      const request = createRequest(transaction.objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        iLog.e(`IndexedDB request on \`${storeName}\` failed`, request.error);
        resolve(null);
      };
      transaction.onabort = () => {
        iLog.e(
          `IndexedDB transaction on \`${storeName}\` aborted`,
          transaction.error
        );
        resolve(null);
      };
    } catch (error) {
      iLog.e(`IndexedDB transaction on \`${storeName}\` failed`, error);
      resolve(null);
    }
  });
};

/** 在一个事务中执行多次写入，以事务完成作为成功标志 */
export const runTransaction = async (
  storeName: string,
  mutate: (store: IDBObjectStore) => void
): Promise<boolean> => {
  const db = await getDatabase();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(storeName, "readwrite");
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => {
        iLog.e(
          `IndexedDB transaction on \`${storeName}\` failed`,
          transaction.error
        );
        resolve(false);
      };
      transaction.onabort = () => {
        iLog.e(
          `IndexedDB transaction on \`${storeName}\` aborted`,
          transaction.error
        );
        resolve(false);
      };
      mutate(transaction.objectStore(storeName));
    } catch (error) {
      iLog.e(`IndexedDB transaction on \`${storeName}\` failed`, error);
      resolve(false);
    }
  });
};

/** 兼容旧版本以 `Date` 保存的时间字段 */
export const toTimestamp = (
  value: number | Date | undefined,
  fallback: number
) => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
};

/**
 * 清理单个缓存表：在同一次游标遍历中删除过期与超出上限（按时间升序）的记录。
 */
export const pruneCacheTable = async (
  storeName: string,
  indexName: string,
  maxAge: number,
  maxEntries: number
): Promise<void> => {
  const db = await getDatabase();
  if (!db) return;

  const cutoff = Date.now() - maxAge;

  await new Promise<void>((resolve) => {
    try {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);

      const countRequest = store.count();
      countRequest.onsuccess = () => {
        // 索引按时间升序，最旧的记录排在最前面
        let overLimit = Math.max(0, countRequest.result - maxEntries);
        const cursorRequest = index.openKeyCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          const expired = Number(cursor.key) <= cutoff;
          if (!expired && overLimit <= 0) return;
          if (!expired) overLimit -= 1;
          store.delete(cursor.primaryKey);
          cursor.continue();
        };
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        iLog.w(`Failed to prune \`${storeName}\`:`, transaction.error);
        resolve();
      };
      transaction.onabort = () => {
        iLog.w(`Pruning \`${storeName}\` was aborted:`, transaction.error);
        resolve();
      };
    } catch (error) {
      iLog.w(`Failed to prune \`${storeName}\`:`, error);
      resolve();
    }
  });
};

/** 清空指定缓存表 */
export const clearCacheTables = async (
  storeNames: readonly CacheTableKey[]
): Promise<boolean> => {
  const results = await Promise.all(
    storeNames.map((storeName) =>
      runTransaction(storeName, (store) => {
        store.clear();
      })
    )
  );
  return results.every(Boolean);
};

/** 统计指定缓存表的条目数 */
export const countCacheTable = async (
  storeNames: readonly CacheTableKey[]
): Promise<Record<string, number>> => {
  const counts = await Promise.all(
    storeNames.map((storeName) =>
      runRequest<number>(storeName, "readonly", (store) => store.count())
    )
  );
  return Object.fromEntries(
    storeNames.map((storeName, index) => [storeName, counts[index] ?? 0])
  );
};
