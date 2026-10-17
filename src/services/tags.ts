import {
  cacheLocalTagDetails,
  getCachedLocalTagDetails,
  hasLocalTag,
  recordLocalTagTotal,
} from "../utils/tags";
import { type PixivStandardResponse, request } from "./request";

export interface TagDetails {
  tag: string;
  abstract: string | null;
  thumbnail: string | null;
}

interface TagSearchBody {
  illustManga?: { total?: number };
  illust?: { total?: number };
  manga?: { total?: number };
  tagTranslation?: Record<string, { zh?: string }>;
}

const pendingDetails = new Map<string, Promise<TagDetails>>();
const pendingTotals = new Map<string, Promise<number | undefined>>();

/** 从标签搜索响应中提取插画漫画作品总数 */
const getIllustMangaTotal = (body: unknown): number | undefined => {
  const searchBody = body as TagSearchBody | null | undefined;
  const illustMangaTotal = searchBody?.illustManga?.total;
  if (typeof illustMangaTotal === "number") return illustMangaTotal;
  if (!searchBody?.illust && !searchBody?.manga) return undefined;
  const illustTotal = searchBody.illust?.total ?? 0;
  const mangaTotal = searchBody.manga?.total ?? 0;
  if (typeof illustTotal === "number" && typeof mangaTotal === "number")
    return illustTotal + mangaTotal;
  return undefined;
};

/** 如果标签在本地列表中，记录其插画漫画作品总数 */
export const recordTagTotal = (tag: string, body: unknown) => {
  if (!hasLocalTag(tag)) return;
  const total = getIllustMangaTotal(body);
  if (total !== undefined) recordLocalTagTotal(tag, total);
};

const requestTagTopBody = async (tag: string) => {
  const response = await request({
    method: "GET",
    url: `/ajax/search/top/${encodeURIComponent(tag)}?lang=zh`,
    timeout: 10000,
  });
  const data = response.response as PixivStandardResponse<TagSearchBody>;
  if (response.status !== 200 || data.error || !data.body) {
    throw new Error(data.message || "标签信息加载失败");
  }
  recordTagTotal(tag, data.body);
  return data.body;
};

/** 获取标签的中文翻译，未找到翻译或翻译与标签相同时返回空字符串 */
export const getTagTranslation = async (tag: string) => {
  const body = await requestTagTopBody(tag);
  const translation = body.tagTranslation?.[tag]?.zh?.trim() ?? "";
  return translation === tag ? "" : translation;
};

/** 获取标签当前的插画漫画作品总数，同时记录为上次访问总数 */
export const getTagCurrentTotal = (tag: string) => {
  const pending = pendingTotals.get(tag);
  if (pending) return pending;

  const loading = requestTagTopBody(tag)
    .then(getIllustMangaTotal)
    .finally(() => pendingTotals.delete(tag));
  pendingTotals.set(tag, loading);
  return loading;
};

export const getTagDetails = (tag: string): Promise<TagDetails> => {
  const pending = pendingDetails.get(tag);
  if (pending) return pending;
  const cached = getCachedLocalTagDetails(tag);
  if (cached) return Promise.resolve(cached);

  const requestDetails = request({
    method: "GET",
    url: `/ajax/tag/info?tag=${encodeURIComponent(tag)}&lang=zh`,
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
