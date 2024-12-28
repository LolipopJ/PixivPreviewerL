import { AiType, IllustCategory, IllustType } from "../enums";
import { iLog } from "../utils/logger";
import request, {
  PixivStandardResponse,
  RequestOptions,
} from "./xml-http-request";

export interface Illust {
  /** AI 生成类型 */
  aiType: AiType;
  /** 收藏信息 */
  bookmarkData: { id: string; private: boolean } | null;
  /** 作品发布时间 */
  createDate: string;
  /** 作品 ID */
  id: string;
  /** 作品类型 */
  illustType: IllustType;
  /** 作品页数 */
  pageCount: number;
  /** 作者头像链接 */
  profileImageUrl: string;
  /** 标签列表。包含 `R-18` 时为 r18 作品 */
  tags: string[];
  /** 作品标题 */
  title: string;
  /** 作品更新时间 */
  updateDate: string;
  /** 缩略图链接 */
  url: string;
  /** 作者 ID */
  userId: string;
  /** 作者用户名 */
  userName: string;
}

type IllustTagData = {
  data: Illust[];
  lastPage: number;
  total: number;
};
/**
 * 获取指定标签的作品列表详情
 * @param options
 * @description 适用于 https://www.pixiv.net/tags/${tag}/${type}，每页 60 张
 */
export const getIllustByTag = (
  page: number = 1,
  options: Omit<
    RequestOptions<
      PixivStandardResponse<Partial<Record<IllustCategory, IllustTagData>>>
    >,
    "url" | "method"
  > = {}
) => {
  const pathnameParts = location.pathname.split("/");
  const type = pathnameParts.pop() ?? "";
  const tag = pathnameParts.pop() ?? "";

  const searchParams = new URLSearchParams(location.search);
  searchParams.set("word", encodeURIComponent(tag));
  searchParams.set("p", String(page));
  // 不整合相同作者的作品
  searchParams.set("csw", "0");

  const requestUrl = `/ajax/search/${type}/${tag}?${searchParams}`;
  request({ ...options, url: requestUrl, method: "GET" });
};

/**
 * 获取关注画师的作品列表详情
 * @param options
 * @description 适用于 https://www.pixiv.net/bookmark_new_illust.php 和 https://www.pixiv.net/bookmark_new_illust_r18.php，每页 60 张
 */
export const getIllustByFollow = (
  page: number = 1,
  options: Omit<
    RequestOptions<PixivStandardResponse<{ thumbnails: { illust: Illust[] } }>>,
    "url" | "method"
  > = {}
) => {
  const searchParams = new URLSearchParams(location.search);
  searchParams.set("p", String(page));

  const mode =
    location.pathname === "/bookmark_new_illust_r18.php" ? "r18" : "all";
  searchParams.set("mode", mode);

  const requestUrl = `/ajax/follow_latest/illust?${searchParams}`;
  request({ ...options, url: requestUrl, method: "GET" });
};

const userIllustListCache: Record<string, UserIllustList> = {};
type UserIllustList = Record<IllustCategory, string[]>;
/**
 * 获取指定画师的作品列表
 * @param userId
 * @param options
 */
export const getUserIllustList = (
  userId: string,
  options: Omit<
    RequestOptions<
      PixivStandardResponse<{
        illusts: Record<string, null>;
        manga: Record<string, null>;
      }>
    >,
    "url" | "method" | "onload"
  > & {
    onload?: (illustList: UserIllustList) => void;
  } = {}
) => {
  const cache = userIllustListCache[userId];
  if (cache) return options.onload?.(cache);

  const getIllustList = `https://www.pixiv.net/ajax/user/${userId}/profile/all?sensitiveFilterMode=userSetting`;
  request({
    ...options,
    url: getIllustList,
    method: "GET",
    onload: (resp) => {
      const { illusts, manga } = resp.response.body;
      const illustList: UserIllustList = {
        [IllustCategory.ILLUST_AND_MANGA]: Object.keys(
          Object.assign({}, illusts, manga)
        ),
        [IllustCategory.ILLUST]: Object.keys(illusts),
        [IllustCategory.MANGA]: Object.keys(manga),
      };
      userIllustListCache[userId] = illustList;
      options.onload?.(illustList);
    },
  });
};

/**
 * 获取指定画师的作品列表详情
 * @param options
 * @description 适用于 https://www.pixiv.net/users/${userId}/${type}，每页 48 张
 */
export const getIllustByUser = (
  page: number = 1,
  options: Omit<
    RequestOptions<
      PixivStandardResponse<{
        works: Record<string, Illust>[];
      }>
    >,
    "url" | "method"
  > = {}
) => {
  const pathnameParts = location.pathname.split("/");
  const type = pathnameParts.pop() ?? "";
  const userId = pathnameParts.pop() ?? "";

  getUserIllustList(userId, {
    onload: (illustList) => {
      const searchParams = new URLSearchParams(location.search);

      searchParams.set("sensitiveFilterMode", "userSetting");
      searchParams.set("is_first_page", page === 1 ? "1" : "0");

      const PER_PAGE = 48;
      const sliceStart = (page - 1) * PER_PAGE;
      const sliceEnd = page * PER_PAGE;

      let workCategory: IllustCategory;
      let searchIllustIds: string[];
      switch (type) {
        case "illustrations":
          workCategory = IllustCategory.ILLUST;
          searchIllustIds = illustList.illust.slice(sliceStart, sliceEnd);
          break;
        case "manga":
          workCategory = IllustCategory.MANGA;
          searchIllustIds = illustList.manga.slice(sliceStart, sliceEnd);
          break;
        case "artworks":
        default:
          workCategory = IllustCategory.ILLUST_AND_MANGA;
          searchIllustIds = illustList.illustManga.slice(sliceStart, sliceEnd);
      }
      searchParams.set("work_category", workCategory);

      const requestUrl = `/ajax/user/${userId}/profile/illusts?${searchIllustIds.map((id) => encodeURIComponent(`ids[]=${id}`)).join("&")}&${searchParams}`;
      request({
        ...options,
        url: requestUrl,
        method: "GET",
      });
    },
    onerror: (resp) => {
      options.onerror?.({
        ...resp,
        response: { ...resp.response, body: { works: [] } },
      });
      iLog.e(`Get user illust list failed: ${resp.responseText}`);
    },
  });
};
