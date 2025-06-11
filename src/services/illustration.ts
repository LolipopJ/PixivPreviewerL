import {
  cacheIllustrationDetails,
  getCachedIllustrationDetails,
} from "../databases";
import type { IllustrationDetails } from "../types";
import { iLog } from "../utils/logger";
import request, {
  type PixivStandardResponse,
  requestWithRetry,
} from "./request";

/** 从 IndexedDB 或接口获取指定作品的详细信息 */
export const getIllustrationDetailsWithCache = async (
  id: string,
  retry = false
) => {
  let illustDetails = await getCachedIllustrationDetails(id);

  if (illustDetails) {
    iLog.d(`Use cached details for illustration ${id}`, illustDetails);
  } else {
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

    if (getIllustDetailsRes.status === 200) {
      illustDetails = (
        getIllustDetailsRes.response as PixivStandardResponse<{
          illust_details: IllustrationDetails;
        }>
      ).body.illust_details;

      cacheIllustrationDetails([illustDetails]);
    } else {
      illustDetails = null;
    }
  }

  return illustDetails;
};

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

const USER_ARTWORKS_CACHE_PREFIX = "PIXIV_PREVIEWER_USER_ARTWORKS_";
/** 从 Session Storage 或接口获取指定用户的作品列表 */
export const getUserIllustrationsWithCache = async (
  userId: string,
  { onRequesting }: { onRequesting?: () => void } = {}
) => {
  let userIllustrations: Awaited<ReturnType<typeof getUserIllustrations>> = {
    illusts: [],
    manga: [],
    artworks: [],
  };
  const userIllustrationsCacheKey = `${USER_ARTWORKS_CACHE_PREFIX}${userId}`;
  try {
    const userIllustrationsCacheString = sessionStorage.getItem(
      userIllustrationsCacheKey
    );
    if (!userIllustrationsCacheString)
      throw new Error("Illustrations cache not existed.");

    userIllustrations = JSON.parse(userIllustrationsCacheString);
  } catch (error) {
    iLog.i(
      `Illustrations of current user is not available in session storage, re-getting...`,
      error
    );
    onRequesting?.();

    userIllustrations = await getUserIllustrations(userId);
    sessionStorage.setItem(
      userIllustrationsCacheKey,
      JSON.stringify(userIllustrations)
    );
  }
  return userIllustrations;
};
