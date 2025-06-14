import {
  cacheIllustrationDetails,
  getCachedIllustrationDetails,
} from "../databases";
import type { IllustrationDetails } from "../types";
import { iLog } from "../utils/logger";
import { convertObjectKeysFromSnakeToCamel } from "../utils/utils";
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
    iLog.d(`Use cached details of illustration ${id}`, illustDetails);
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
      // 解析作品详细信息，统一最外层键命名为小驼峰（例如 bookmark_user_total -> bookmarkUserTotal）
      illustDetails = convertObjectKeysFromSnakeToCamel(
        (
          getIllustDetailsRes.response as PixivStandardResponse<{
            illust_details: IllustrationDetails;
          }>
        ).body.illust_details
      );
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
  const userIllustrationsCacheKey = `PIXIV_PREVIEWER_CACHED_ARTWORKS_OF_USER_${userId}`;
  try {
    const userIllustrationsCacheString = sessionStorage.getItem(
      userIllustrationsCacheKey
    );
    if (!userIllustrationsCacheString)
      throw new Error("Illustrations cache not existed.");

    userIllustrations = JSON.parse(userIllustrationsCacheString);
  } catch (error) {
    iLog.i(
      `Get illustrations of current user from session storage failed, re-getting...`,
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
