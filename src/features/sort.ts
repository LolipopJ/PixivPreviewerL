import {
  g_defaultSettings,
  g_loadingImage,
  SORT_EVENT_NAME,
} from "../constants";
import { AiType, IllustSortOrder, IllustSortType, Lang } from "../enums";
import Texts from "../i18n";
import { PixivStandardResponse, request } from "../services";
import type {
  GlobalSettings,
  Illustration,
  IllustrationDetails,
} from "../types";
import { iLog } from "../utils/logger";

type LoadIllustSortOptions = Pick<
  GlobalSettings,
  | "pageCount"
  | "favFilter"
  | "orderType"
  | "hideFavorite"
  | "hideByTag"
  | "hideByTagList"
  | "aiFilter"
  | "lang"
> & { csrfToken: string };

let isInitialized = false;
export const loadIllustSort = (options: LoadIllustSortOptions) => {
  if (isInitialized) return;

  const {
    pageCount: optionPageCount,
    favFilter: optionFavFilter,
    orderType = IllustSortOrder.BY_BOOKMARK_COUNT,
    hideFavorite = false,
    hideByTag = false,
    hideByTagList = [],
    aiFilter = false,
    lang = Lang.zh_CN,
    csrfToken,
  } = options;

  // 修正不符合实际的参数
  let pageCount = optionPageCount,
    favFilter = optionFavFilter;
  if (pageCount <= 0) {
    pageCount = g_defaultSettings.pageCount;
  }
  if (favFilter < 0) {
    favFilter = g_defaultSettings.favFilter;
  }

  class IllustSorter {
    type: IllustSortType;
    illustrations: IllustrationDetails[];
    sorting: boolean = false;
    progressElement: JQuery = $();
    progressText: JQuery = $();

    constructor() {
      this.reset({
        type: undefined,
      });
    }

    reset({ type }: { type: IllustSortType }) {
      this.type = type;
      this.illustrations = [];
      this.sorting = false;
      this.progressElement?.remove();
      this.progressElement = $(document.createElement("div"))
        .attr({
          id: "sort-progress",
        })
        .css({
          width: "100%",
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
          gap: "6px",
        })
        .append(
          $(new Image(96, 96))
            .attr({
              id: "sort-progress__loading",
              src: g_loadingImage,
            })
            .css({
              "border-radius": "50%",
            })
        )
        .hide();
      this.progressText = $(document.createElement("div"))
        .attr({
          id: "sort-progress__text",
        })
        .appendTo(this.progressElement);
    }

    async sort({
      type,
      api,
      searchParams,
    }: {
      type: IllustSortType;
      api: string;
      searchParams: URLSearchParams;
    }) {
      this.sorting = true;

      //#region 获取作品分页列表
      let illustrations: Illustration[] = [];
      const startPage = Number(searchParams.get("p")) || 1;
      for (let page = startPage; page < startPage + pageCount; page += 1) {
        const requestUrl = `${api}?${searchParams}`;
        const getIllustRes = await request({
          url: requestUrl,
          responseType: "json",
          onerror: (error) => {
            throw new Error(
              `An error occurred while requesting ${requestUrl}: ${error.responseText}`
            );
          },
        });
        const extractedIllustrations = getIllustrationsFromResponse(
          type,
          getIllustRes.response
        );
        illustrations = illustrations.concat(extractedIllustrations);
      }
      //#endregion

      //#region 获取作品详情信息，合并到列表中
      const detailedIllustrations: IllustrationDetails[] = [];
      // TODO: 限制请求频率，降低风控风险
      for (let i = 0; i < illustrations.length; i += 1) {
        const currentIllustration = illustrations[i];
        const getIllustDetailsRes = await request({
          url: `/touch/ajax/illust/details?illust_id=${currentIllustration.id}`,
          responseType: "json",
          onerror: (error) => {
            throw new Error(
              `An error occurred while requesting details of illustration ${currentIllustration.id}: ${error.responseText}`
            );
          },
        });
        const illustDetails = (
          getIllustDetailsRes.response as PixivStandardResponse<{
            illust_details: IllustrationDetails;
          }>
        ).body.illust_details;
        detailedIllustrations.push({
          ...illustDetails,
          ...currentIllustration,
        });
      }
      iLog.d("Queried detailed illustrations:", detailedIllustrations);
      //#endregion

      //#region 过滤作品
      const filteredIllustrations = detailedIllustrations.filter(
        (illustration) => {
          if (hideFavorite && !illustration.bookmarkData) {
            return false;
          }

          if (hideByTag && hideByTagList.length) {
            for (const tag of illustration.tags) {
              if (hideByTagList.includes(tag)) {
                return false;
              }
            }
          }

          if (aiFilter && illustration.aiType !== AiType.NONE_AI) {
            return false;
          }

          return true;
        }
      );
      //#endregion

      //#region 排序作品
      const sortedIllustrations =
        orderType === IllustSortOrder.BY_BOOKMARK_COUNT
          ? filteredIllustrations.sort(
              (a, b) => b.bookmark_user_total - a.bookmark_user_total
            )
          : filteredIllustrations;
      iLog.d("Filtered and sorted illustrations:", sortedIllustrations);
      //#endregion

      this.illustrations = sortedIllustrations;
      this.sorting = false;
    }

    updateGetPageProgress(page: number) {
      this.progressText.text(
        Texts[lang].sort_getWorks
          .replace("%1", String(page))
          .replace("%2", String(pageCount))
      );
      this.progressElement.show();
    }

    updateSortProgress(current: number, total: number) {
      this.progressText.text(
        Texts[lang].sort_getBookmarkCount
          .replace("%1", String(current))
          .replace("%2", String(total))
      );
      this.progressElement.show();
    }
  }

  const illustSorter = new IllustSorter();
  window.addEventListener(SORT_EVENT_NAME, () => {
    if (illustSorter.sorting) {
      iLog.w("Current is in sorting progress.");
      return;
    }

    const url = new URL(location.href);
    const { pathname, searchParams } = url;

    const {
      type,
      api,
      searchParams: defaultSearchParams,
    } = getSortOptionsFromPathname(pathname);
    if (type === undefined) {
      iLog.w("Current page doesn't support sorting artworks.");
      return;
    }

    const mergedSearchParams = new URLSearchParams([
      ...defaultSearchParams,
      ...searchParams,
    ]);

    illustSorter.reset({
      type,
    });
    illustSorter.sort({
      type,
      api,
      searchParams: mergedSearchParams,
    });
  });

  isInitialized = true;
};

function getSortOptionsFromPathname(pathname: string) {
  let type: IllustSortType;
  let api: string;
  let defaultSearchParams: string;

  let match: RegExpMatchArray;
  if ((match = pathname.match(/^\/tags\/(.+)\/(.+)$/))) {
    const tagName = match[1];
    const tagFilterType = match[2];

    if (tagFilterType === "artworks") {
      type = IllustSortType.TAG_ARTWORK;
      api = `/ajax/search/artworks/${tagName}`;
      defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=all&lang=zh`;
    } else if (tagFilterType === "illustrations") {
      type = IllustSortType.TAG_ILLUST;
      api = `/ajax/search/illustrations/${tagName}`;
      defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=illust_and_ugoira&lang=zh`;
    } else if (tagFilterType === "manga") {
      type = IllustSortType.TAG_MANGA;
      api = `/ajax/search/manga/${tagName}`;
      defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=manga&lang=zh`;
    }
  }

  return { type, api, searchParams: new URLSearchParams(defaultSearchParams) };
}

function getIllustrationsFromResponse(
  type: IllustSortType,
  response: PixivStandardResponse<unknown>
) {
  if (type === IllustSortType.TAG_ARTWORK) {
    return (
      (
        response as PixivStandardResponse<{
          illustManga: { data: Illustration[] };
        }>
      ).body.illustManga.data ?? []
    );
  } else if (type === IllustSortType.TAG_ILLUST) {
    return (
      (
        response as PixivStandardResponse<{
          illust: { data: Illustration[] };
        }>
      ).body.illust.data ?? []
    );
  } else if (type === IllustSortType.TAG_MANGA) {
    return (
      (
        response as PixivStandardResponse<{
          manga: { data: Illustration[] };
        }>
      ).body.manga.data ?? []
    );
  }
  return [];
}
