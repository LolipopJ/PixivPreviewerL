import { g_loadingImage, SORT_EVENT_NAME } from "../constants";
import { Lang } from "../enums";
import Texts from "../i18n";
import { GlobalSettings } from "../types";
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
    hideFollowed = false,
    hideFavorite = false,
    hideByTag = false,
    hideByTagList = [],
    aiFilter = false,
    lang = Lang.zh_CN,
    csrfToken,
  } = options;
  let { pageCount, favFilter } = options;
  if (pageCount <= 0) {
    pageCount = 1;
  }
  if (favFilter < 0) {
    favFilter = 100;
  }

  class IllustSorter {
    currentPage: number = 1;

    progressElement: JQuery = $();
    progressText: JQuery = $();

    constructor() {
      this.reset();
    }

    reset() {
      this.currentPage = 1;

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

  window.addEventListener(SORT_EVENT_NAME, () => {
    iLog.i("Sorting artworks...");
  });

  isInitialized = true;
};
