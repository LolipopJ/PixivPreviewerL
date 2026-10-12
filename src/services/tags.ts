import { cacheLocalTagDetails, getCachedLocalTagDetails } from "../utils/tags";
import { type PixivStandardResponse, request } from "./request";

export interface TagDetails {
  tag: string;
  abstract: string | null;
  thumbnail: string | null;
}

const pendingDetails = new Map<string, Promise<TagDetails>>();

export const getTagDetails = (tag: string): Promise<TagDetails> => {
  const pending = pendingDetails.get(tag);
  if (pending) return pending;
  const cached = getCachedLocalTagDetails(tag);
  if (cached) return Promise.resolve(cached);

  const requestDetails = request({
    method: "GET",
    url: `https://www.pixiv.net/ajax/tag/info?tag=${encodeURIComponent(tag)}&lang=zh`,
    timeout: 10000,
  })
    .then((response) => {
      const data = response.response as PixivStandardResponse<TagDetails>;
      if (response.status !== 200 || data.error || !data.body) {
        throw new Error(data.message || "标签详情加载失败");
      }
      cacheLocalTagDetails(tag, data.body);
      return data.body;
    })
    .finally(() => {
      pendingDetails.delete(tag);
    });

  pendingDetails.set(tag, requestDetails);
  return requestDetails;
};
