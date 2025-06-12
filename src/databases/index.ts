import type { IllustrationDetails } from "../types";
import { iLog } from "../utils/logger";

const INDEX_DB_NAME = "PIXIV_PREVIEWER_L";
const INDEX_DB_VERSION = 1;

const ILLUSTRATION_DETAILS_CACHE_TABLE_KEY = "illustrationDetailsCache";
/** 缓存过期时间 */
const ILLUSTRATION_DETAILS_CACHE_TIME = 1000 * 60 * 60 * 6; // 6 小时
/** 新作品发布初期不添加缓存 */
const NEW_ILLUSTRATION_NOT_CACHE_TIME = 1000 * 60 * 60 * 1; // 1 小时

export interface IllustrationDetailsCache extends IllustrationDetails {
  cacheDate: Date;
}

const request = indexedDB.open(INDEX_DB_NAME, INDEX_DB_VERSION);

let db: IDBDatabase;

request.onupgradeneeded = (event) => {
  const db = (event.target as IDBOpenDBRequest).result;
  db.createObjectStore(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, {
    keyPath: "id",
  });
};

request.onsuccess = (event) => {
  db = (event.target as IDBOpenDBRequest).result;
  console.log("Open IndexedDB successfully:", db);

  deleteExpiredIllustrationDetails();
};

request.onerror = (event) => {
  iLog.e(`An error occurred while requesting IndexedDB`, event);
};

export const cacheIllustrationDetails = (
  illustrations: IllustrationDetails[],
  now: Date = new Date()
) => {
  return new Promise<void>(() => {
    const cachedIllustrationDetailsObjectStore = db
      .transaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, "readwrite")
      .objectStore(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY);

    illustrations.forEach((illustration) => {
      const uploadTimestamp = illustration.uploadTimestamp * 1000;

      if (now.getTime() - uploadTimestamp > NEW_ILLUSTRATION_NOT_CACHE_TIME) {
        // 作品发布超过一定时间，添加缓存
        const illustrationDetails: IllustrationDetailsCache = {
          ...illustration,
          cacheDate: now,
        };

        const addCachedIllustrationDetailsRequest =
          cachedIllustrationDetailsObjectStore.put(illustrationDetails);

        addCachedIllustrationDetailsRequest.onerror = (event) => {
          iLog.e(`An error occurred while caching illustration details`, event);
        };
      }
    });
  });
};

export const getCachedIllustrationDetails = (
  id: string,
  now: Date = new Date()
): Promise<IllustrationDetails | null> => {
  return new Promise((resolve) => {
    const cachedIllustrationDetailsObjectStore = db
      .transaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, "readwrite")
      .objectStore(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY);

    const getCachedIllustrationDetailsRequest =
      cachedIllustrationDetailsObjectStore.get(id);

    getCachedIllustrationDetailsRequest.onsuccess = (event) => {
      const illustrationDetails = (
        event.target as IDBRequest<IllustrationDetailsCache | undefined>
      ).result;
      if (illustrationDetails) {
        const { cacheDate } = illustrationDetails;
        if (
          now.getTime() - cacheDate.getTime() <=
          ILLUSTRATION_DETAILS_CACHE_TIME
        ) {
          // 缓存未过期，返回缓存结果
          resolve(illustrationDetails);
        } else {
          cachedIllustrationDetailsObjectStore.delete(id).onerror = (event) => {
            iLog.e(
              `An error occurred while deleting outdated illustration details`,
              event
            );
          };
        }
      }
      resolve(null);
    };

    getCachedIllustrationDetailsRequest.onerror = (event) => {
      iLog.e(
        `An error occurred while getting cached illustration details`,
        event
      );
      resolve(null);
    };
  });
};

export const deleteCachedIllustrationDetails = (
  ids: string[]
): Promise<void> => {
  return new Promise((resolve) => {
    const cachedIllustrationDetailsObjectStore = db
      .transaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, "readwrite")
      .objectStore(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY);

    for (const id of ids) {
      const deleteCachedIllustrationDetailsRequest =
        cachedIllustrationDetailsObjectStore.delete(id);

      deleteCachedIllustrationDetailsRequest.onsuccess = () => {
        resolve();
      };

      deleteCachedIllustrationDetailsRequest.onerror = (event) => {
        iLog.w(
          `An error occurred while deleting cached details of illustration ${id}`,
          event
        );
        resolve();
      };
    }
  });
};

/** 移除过期的缓存 */
function deleteExpiredIllustrationDetails(): Promise<void> {
  return new Promise((resolve) => {
    const now = new Date().getTime();

    const cachedIllustrationDetailsObjectStore = db
      .transaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, "readwrite")
      .objectStore(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY);

    const getAllRequest = cachedIllustrationDetailsObjectStore.getAll();

    getAllRequest.onsuccess = (event) => {
      const allEntries = (
        event.target as IDBRequest<IllustrationDetailsCache[]>
      ).result;

      allEntries.forEach((entry) => {
        if (now - entry.cacheDate.getTime() > ILLUSTRATION_DETAILS_CACHE_TIME) {
          cachedIllustrationDetailsObjectStore.delete(entry.id);
        }
      });

      resolve();
    };
  });
}
