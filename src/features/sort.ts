import {
  g_defaultSettings,
  g_loadingImage,
  SORT_EVENT_NAME,
} from "../constants";
import { IllustSortType, Lang } from "../enums";
import Texts from "../i18n";
import { PixivStandardResponse, request } from "../services";
import type { GlobalSettings, Illustration } from "../types";
import { iLog } from "../utils/logger";

type LoadIllustSortOptions = Pick<
  GlobalSettings,
  | "pageCount"
  | "favFilter"
  | "hideFollowed"
  | "hideFavorite"
  | "hideByTag"
  | "hideByTagList"
  | "aiFilter"
  | "lang"
> & { csrfToken: string };

const ILLUST_PER_PAGE = 60;

let isInitialized = false;
export const loadIllustSort = (options: LoadIllustSortOptions) => {
  if (isInitialized) return;

  const {
    pageCount: optionPageCount,
    favFilter: optionFavFilter,
    hideFollowed = false,
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
    illustrations: Illustration[];
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

      let illustrations: Illustration[] = [];

      const startPage = Number(searchParams.get("p")) || 1;
      try {
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
      } catch (error) {
        iLog.e(error);
      }

      this.illustrations = illustrations;
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

    updateSortProgress(current: number) {
      this.progressText.text(
        Texts[lang].sort_getBookmarkCount
          .replace("%1", String(current))
          .replace("%2", String(pageCount * ILLUST_PER_PAGE))
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
