import request, { PixivStandardResponse } from "./request";

/** 获取用户发布的所有作品，按照发布时间倒叙 */
export const getUserArtworks = async (userId: string) => {
  const response = await request({
    url: `https://www.pixiv.net/ajax/user/${userId}/profile/all?sensitiveFilterMode=userSetting&lang=zh`,
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
