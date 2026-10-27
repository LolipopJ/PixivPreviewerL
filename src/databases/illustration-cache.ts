import {
  ILLUST_PAGES_CACHE_MAX_ENTRIES,
  ILLUST_PAGES_CACHE_TIME,
  ILLUSTRATION_DETAILS_CACHE_MAX_ENTRIES,
  ILLUSTRATION_DETAILS_CACHE_TIME,
  ILLUSTRATION_STATIC_CACHE_TIME,
  NEW_ILLUSTRATION_NOT_CACHE_TIME,
} from "../constants";
import type { IllustrationDetails } from "../types";
import { iLog } from "../utils/logger";
import {
  CACHE_DATE_INDEX,
  ILLUST_PAGES_CACHE_TABLE_KEY,
  ILLUSTRATION_DETAILS_CACHE_TABLE_KEY,
  pruneCacheTable,
  runRequest,
  runTransaction,
  STATIC_DATE_INDEX,
  toTimestamp,
} from "./connection";

export interface IllustrationDetailsCache extends IllustrationDetails {
  /** 静态字段（标题、标签、页数等）首次写入缓存的时间 */
  staticDate: number;
  /** 可变字段（收藏数、收藏状态等）最后一次成功更新的时间 */
  cacheDate: number;
}

export interface CachedIllustrationDetails {
  details: IllustrationDetails;
  /** 可变字段是否仍在有效期内；为 `false` 时应尝试重新获取 */
  mutableFresh: boolean;
}

export interface IllustPagesCache {
  id: string;
  regularUrls: string[];
  originalUrls: string[];
  cacheDate: number;
}

/** 缓存作品详情；发布不足 1 小时的作品跳过缓存 */
export const cacheIllustrationDetails = (
  illustrations: IllustrationDetails[],
  now: number = Date.now()
): Promise<boolean> => {
  const cacheable = illustrations.filter(
    (illustration) =>
      now - illustration.uploadTimestamp * 1000 >
      NEW_ILLUSTRATION_NOT_CACHE_TIME
  );
  if (!cacheable.length) return Promise.resolve(true);

  return runTransaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, (store) => {
    cacheable.forEach((illustration) => {
      const request = store.get(illustration.id);
      request.onsuccess = () => {
        const existing = request.result as IllustrationDetailsCache | undefined;
        const entry: IllustrationDetailsCache = {
          ...illustration,
          // 保留静态字段的首次缓存时间，只刷新可变字段的时间
          staticDate: toTimestamp(existing?.staticDate, now),
          cacheDate: now,
        };
        const putRequest = store.put(entry);
        putRequest.onerror = () => {
          iLog.e(
            `An error occurred while caching illustration details of ${illustration.id}`,
            putRequest.error
          );
        };
      };
      request.onerror = () => {
        iLog.e(
          `An error occurred while reading cached details of illustration ${illustration.id}`,
          request.error
        );
      };
    });
  });
};

/** 读取作品详情缓存。静态字段超过有效期时删除缓存并返回 `null` */
export const getCachedIllustrationDetails = async (
  id: string,
  now: number = Date.now(),
  /** 可变字段的有效期，默认为 6 小时 */
  mutableMaxAge: number = ILLUSTRATION_DETAILS_CACHE_TIME
): Promise<CachedIllustrationDetails | null> => {
  const entry = await runRequest<IllustrationDetailsCache | undefined>(
    ILLUSTRATION_DETAILS_CACHE_TABLE_KEY,
    "readonly",
    (store) => store.get(id)
  );
  if (!entry) return null;

  const cacheDate = toTimestamp(entry.cacheDate, 0);
  const staticDate = toTimestamp(entry.staticDate, cacheDate);

  if (now - staticDate > ILLUSTRATION_STATIC_CACHE_TIME) {
    void deleteCachedIllustrationDetails([id]);
    return null;
  }

  return {
    details: stripCacheMetadata(entry),
    mutableFresh: now - cacheDate <= mutableMaxAge,
  };
};

/** 移除只用于缓存管理的时间字段，避免泄露到业务数据中 */
const stripCacheMetadata = (
  entry: IllustrationDetailsCache
): IllustrationDetails => {
  const details: Partial<IllustrationDetailsCache> = { ...entry };
  delete details.staticDate;
  delete details.cacheDate;
  return details as IllustrationDetails;
};

export const deleteCachedIllustrationDetails = (
  ids: string[]
): Promise<boolean> => {
  if (!ids.length) return Promise.resolve(true);
  return runTransaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, (store) => {
    ids.forEach((id) => {
      const request = store.delete(id);
      request.onerror = () => {
        iLog.w(
          `An error occurred while deleting cached details of illustration ${id}`,
          request.error
        );
      };
    });
  });
};

/** 缓存作品分页信息（图片访问链接） */
export const cacheIllustPages = (
  id: string,
  urls: { regularUrls: string[]; originalUrls: string[] },
  now: number = Date.now()
): Promise<boolean> =>
  runTransaction(ILLUST_PAGES_CACHE_TABLE_KEY, (store) => {
    const entry: IllustPagesCache = {
      id,
      regularUrls: urls.regularUrls,
      originalUrls: urls.originalUrls,
      cacheDate: now,
    };
    const request = store.put(entry);
    request.onerror = () => {
      iLog.e(
        `An error occurred while caching pages of illust ${id}`,
        request.error
      );
    };
  });

/** 读取作品分页信息缓存，过期时删除 */
export const getCachedIllustPages = async (
  id: string,
  now: number = Date.now()
): Promise<Omit<IllustPagesCache, "id" | "cacheDate"> | null> => {
  const entry = await runRequest<IllustPagesCache | undefined>(
    ILLUST_PAGES_CACHE_TABLE_KEY,
    "readonly",
    (store) => store.get(id)
  );
  if (!entry) return null;

  if (now - toTimestamp(entry.cacheDate, 0) > ILLUST_PAGES_CACHE_TIME) {
    void runTransaction(ILLUST_PAGES_CACHE_TABLE_KEY, (store) => {
      store.delete(id);
    });
    return null;
  }

  return {
    regularUrls: entry.regularUrls,
    originalUrls: entry.originalUrls,
  };
};

/** 清理过期的作品详情与分页缓存 */
export const pruneIllustrationCaches = async (): Promise<void> => {
  await pruneCacheTable(
    ILLUSTRATION_DETAILS_CACHE_TABLE_KEY,
    STATIC_DATE_INDEX,
    ILLUSTRATION_STATIC_CACHE_TIME,
    ILLUSTRATION_DETAILS_CACHE_MAX_ENTRIES
  );
  await pruneCacheTable(
    ILLUST_PAGES_CACHE_TABLE_KEY,
    CACHE_DATE_INDEX,
    ILLUST_PAGES_CACHE_TIME,
    ILLUST_PAGES_CACHE_MAX_ENTRIES
  );
};
