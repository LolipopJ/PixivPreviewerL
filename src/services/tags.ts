import { type PixivStandardResponse, request } from "./request";

export interface TagDetails {
  tag: string;
  abstract: string | null;
  thumbnail: string | null;
}

const detailsCache = new Map<string, Promise<TagDetails>>();

export const getTagDetails = (tag: string): Promise<TagDetails> => {
  const cached = detailsCache.get(tag);
  if (cached) return cached;

  const pending = request({
    method: "GET",
    url: `https://www.pixiv.net/ajax/tag/info?tag=${encodeURIComponent(tag)}&lang=zh`,
    timeout: 10000,
  })
    .then((response) => {
      const data = response.response as PixivStandardResponse<TagDetails>;
      if (response.status !== 200 || data.error || !data.body) {
        throw new Error(data.message || "标签详情加载失败");
      }
      return data.body;
    })
    .catch((error: unknown) => {
      detailsCache.delete(tag);
      throw error;
    });

  if (detailsCache.size >= 100) {
    detailsCache.delete(detailsCache.keys().next().value!);
  }
  detailsCache.set(tag, pending);
  return pending;
};
