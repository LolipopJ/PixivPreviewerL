import {
  ILLUSTRATION_DETAILS_CACHE_TIME,
  USER_ILLUSTRATIONS_CACHE_TIME,
} from "../constants";
import {
  cacheIllustrationDetails,
  getCachedIllustrationDetails,
} from "../databases";
import type { IllustrationDetails } from "../types";
import { iLog } from "../utils/logger";
import { createPendingPromiseCache } from "../utils/promise";
import { convertObjectKeysFromSnakeToCamel } from "../utils/utils";
import request, {
  type PixivStandardResponse,
  requestWithRetry,
} from "./request";

const USER_ILLUSTRATIONS_CACHE_PREFIX =
  "PIXIV_PREVIEWER_CACHED_ARTWORKS_OF_USER_";
const USER_ILLUSTRATIONS_CACHE_VERSION = 1;

const pendingIllustrationDetails =
  createPendingPromiseCache<IllustrationDetails | null>();

/** 请求指定作品的详细信息 */
const requestIllustrationDetails = async (id: string, retry: boolean) => {
  const requestUrl = `/touch/ajax/illust/details?illust_id=${id}`;
  const getIllustDetailsRes = retry
    ? await requestWithRetry({
        url: requestUrl,
        onRetry: (response, retryTimes) => {
          iLog.w(
            `Get illustration details via api \`${requestUrl}\` failed:`,
            response,
            `${retryTimes} times retrying...`
          );
        },
      })
    : await request({ url: requestUrl });

  if (getIllustDetailsRes.status !== 200) return null;
  // 解析作品详细信息，统一最外层键命名为小驼峰（例如 bookmark_user_total -> bookmarkUserTotal）
  return convertObjectKeysFromSnakeToCamel(
    (
      getIllustDetailsRes.response as PixivStandardResponse<{
        illust_details: IllustrationDetails;
      }>
    ).body.illust_details
  );
};

/**
 * 从 IndexedDB 或接口获取指定作品的详细信息。
 * 静态字段与可变字段分别控制有效期：可变字段过期时会重新请求，
 * 请求失败则退回缓存数据，避免排序因单个作品请求失败而中断。
 *
 * @param maxStale 可变字段的额外容忍时长（毫秒）。预览等不要求收藏数实时的场景
 * 可以传入更大的值，减少重复请求。
 */
export const getIllustrationDetailsWithCache = (
  id: string,
  retry = false,
  { maxStale = 0 }: { maxStale?: number } = {}
): Promise<IllustrationDetails | null> =>
  // 去重键必须包含参数：预览（maxStale=24h）与排序（maxStale=0）对缓存新鲜度的
  // 要求不同，共用同一个 Promise 会让排序拿到过时的收藏数并据此过滤作品
  pendingIllustrationDetails.run(`${id}|${retry}|${maxStale}`, async () => {
    const cached = await getCachedIllustrationDetails(
      id,
      Date.now(),
      ILLUSTRATION_DETAILS_CACHE_TIME + maxStale
    );
    if (cached?.mutableFresh) {
      iLog.d(`Use cached details of illustration ${id}`, cached.details);
      return cached.details;
    }

    try {
      const illustDetails = await requestIllustrationDetails(id, retry);
      if (illustDetails) {
        void cacheIllustrationDetails([illustDetails]);
        return illustDetails;
      }
    } catch (error) {
      iLog.w(`Failed to fetch details of illustration ${id}:`, error);
    }

    if (cached) {
      iLog.d(`Use stale cached details of illustration ${id}`, cached.details);
      return cached.details;
    }
    return null;
  });

/** 获取用户发布的所有作品，按照发布时间倒叙 */
const getUserIllustrations = async (userId: string) => {
  const response = await request({
    url: `/ajax/user/${userId}/profile/all?sensitiveFilterMode=userSetting&lang=zh`,
  });
  const responseData = (
    response.response as PixivStandardResponse<{
      illusts: Record<number, null>;
      manga: Record<number, null>;
    }>
  ).body;
  const illusts = Object.keys(responseData.illusts).reverse();
  const manga = Object.keys(responseData.manga).reverse();
  const artworks = [...illusts, ...manga].sort((a, b) => Number(b) - Number(a));
  return {
    illusts,
    manga,
    artworks,
  };
};

type UserIllustrations = Awaited<ReturnType<typeof getUserIllustrations>>;

interface UserIllustrationsCacheEntry extends UserIllustrations {
  version: number;
  /** 缓存写入时间（毫秒时间戳） */
  cachedAt: number;
}

const getUserIllustrationsCacheKey = (userId: string) =>
  `${USER_ILLUSTRATIONS_CACHE_PREFIX}${userId}`;

/** 读取未过期的用户作品列表缓存 */
const readUserIllustrationsCache = (userId: string) => {
  try {
    const cacheString = sessionStorage.getItem(
      getUserIllustrationsCacheKey(userId)
    );
    if (!cacheString) return null;

    const entry = JSON.parse(
      cacheString
    ) as Partial<UserIllustrationsCacheEntry>;
    if (
      entry.version !== USER_ILLUSTRATIONS_CACHE_VERSION ||
      typeof entry.cachedAt !== "number" ||
      !Array.isArray(entry.artworks) ||
      !Array.isArray(entry.illusts) ||
      !Array.isArray(entry.manga)
    ) {
      return null;
    }
    if (Date.now() - entry.cachedAt > USER_ILLUSTRATIONS_CACHE_TIME)
      return null;

    return entry as UserIllustrationsCacheEntry;
  } catch (error) {
    iLog.i("Failed to read user illustrations cache:", error);
    return null;
  }
};

/** 列出 Session Storage 中本功能写入的 key（先在遍历中收集，避免边删边遍历） */
const listUserIllustrationsCacheKeys = () => {
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(USER_ILLUSTRATIONS_CACHE_PREFIX)) keys.push(key);
  }
  return keys;
};

/** 写入用户作品列表缓存；超出配额时清理后重试一次 */
const writeUserIllustrationsCache = (
  userId: string,
  illustrations: UserIllustrations
) => {
  const key = getUserIllustrationsCacheKey(userId);
  const entry: UserIllustrationsCacheEntry = {
    ...illustrations,
    version: USER_ILLUSTRATIONS_CACHE_VERSION,
    cachedAt: Date.now(),
  };
  const value = JSON.stringify(entry);
  try {
    sessionStorage.setItem(key, value);
    return;
  } catch (error) {
    iLog.w("Failed to write user illustrations cache, retrying:", error);
  }

  try {
    // 清空本功能写入的其他用户缓存后重试，避免占用 Pixiv 自身的存储配额
    listUserIllustrationsCacheKeys().forEach((item) =>
      sessionStorage.removeItem(item)
    );
    sessionStorage.setItem(key, value);
  } catch (error) {
    iLog.w("Failed to write user illustrations cache:", error);
  }
};

/** 从 Session Storage 或接口获取指定用户的作品列表 */
export const getUserIllustrationsWithCache = async (
  userId: string,
  { onRequesting }: { onRequesting?: () => void } = {}
) => {
  const cached = readUserIllustrationsCache(userId);
  if (cached) {
    return {
      illusts: cached.illusts,
      manga: cached.manga,
      artworks: cached.artworks,
    };
  }

  onRequesting?.();
  const userIllustrations = await getUserIllustrations(userId);
  writeUserIllustrationsCache(userId, userIllustrations);
  return userIllustrations;
};

/** 清理用户作品列表缓存，供“清除缓存”使用 */
export const clearUserIllustrationsCache = () => {
  listUserIllustrationsCacheKeys().forEach((item) =>
    sessionStorage.removeItem(item)
  );
};
