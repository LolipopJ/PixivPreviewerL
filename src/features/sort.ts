import {
  g_loadingImage,
  SORT_BUTTON_ID,
  SORT_EVENT_NAME,
  SORT_NEXT_PAGE_EVENT_NAME,
} from "../constants";
import { IllustSortOrder, IllustSortType } from "../enums";
import Texts, { formatText } from "../i18n";
import heartIcon from "../icons/heart.svg";
import heartFilledIcon from "../icons/heart-filled.svg";
import pageIcon from "../icons/page.svg";
import playIcon from "../icons/play.svg";
import {
  getIllustrationDetailsWithCache,
  getUserIllustrationsWithCache,
  type PixivStandardResponse,
  requestWithRetry,
} from "../services";
import type { GlobalSettings, IllustrationListItem } from "../types";
import { markSortedArtworkLink } from "../utils/artwork-link";
import debounce from "../utils/debounce";
import { injectStyle } from "../utils/dom";
import {
  checkIsAiAssisted,
  checkIsAiGenerated,
  checkIsR18,
  checkIsR18G,
  checkIsUgoira,
} from "../utils/illustration";
import { iLog } from "../utils/logger";
import { execLimitConcurrentPromises } from "../utils/promise";
import { getSettings } from "../utils/setting";

type SortRuntimeSettings = Pick<
  GlobalSettings,
  | "pageCount"
  | "favFilter"
  | "orderType"
  | "hideFavorite"
  | "hideByTag"
  | "hideByTagList"
  | "aiFilter"
  | "aiAssistedFilter"
>;

const BOOKMARK_USER_PAGE_ILLUSTRATION_LIST_SELECTOR = "ul.sc-e967f3f1-1.cEOodl";

const USER_TYPE_ARTWORKS_PER_PAGE = 48;

const parseExcludedTags = (raw: string) =>
  raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

const SORT_ERROR_PANEL_ID = "pp-sort-error";

const showSortError = (error: unknown) => {
  injectStyle(
    `
      #${SORT_ERROR_PANEL_ID} {
        position: fixed; right: 20px; bottom: 20px; z-index: 100002;
        width: min(400px, calc(100vw - 40px)); max-height: calc(100vh - 40px);
        box-sizing: border-box; padding: 14px 16px; overflow: auto;
        overflow-wrap: anywhere; font: 14px/1.5 sans-serif;
        color-scheme: light dark; background: Canvas; color: CanvasText;
        border: 1px solid GrayText; border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, .24);
      }
      #${SORT_ERROR_PANEL_ID} p { margin: 6px 0 12px; }
      #${SORT_ERROR_PANEL_ID} footer {
        display: flex; align-items: center; flex-wrap: wrap;
        justify-content: space-between; gap: 8px;
      }
      #${SORT_ERROR_PANEL_ID} a { color: LinkText; text-decoration: underline; }
      #${SORT_ERROR_PANEL_ID} button {
        padding: 4px 8px; border: 1px solid GrayText; border-radius: 6px;
        background: Canvas; color: inherit; font: inherit; cursor: pointer;
      }
      #${SORT_ERROR_PANEL_ID} :is(a, button):focus-visible {
        outline: 2px solid Highlight; outline-offset: 2px;
      }
    `,
    "pp-sort-error-style"
  );

  const close = () => {
    const hadFocus = panel.get(0)?.contains(document.activeElement);
    panel.remove();
    if (hadFocus) document.getElementById(SORT_BUTTON_ID)?.focus();
  };
  const message = error instanceof Error ? error.message : String(error);
  const alert = $("<div>").attr("role", "alert");
  const panel = $("<aside>")
    .attr("id", SORT_ERROR_PANEL_ID)
    .append(
      alert,
      $("<footer>").append(
        $("<a>")
          .attr({
            href: process.env.BUG_REPORT_PAGE,
            target: "_blank",
            rel: "noopener noreferrer",
          })
          .text(Texts.sort_reportIssue),
        $("<button>")
          .attr("type", "button")
          .text(Texts.close)
          .on("click", close)
      )
    )
    .on("keydown", (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      close();
    })
    .appendTo("body");
  alert.append($("<strong>").text(Texts.sort_failed), $("<p>").text(message));
};

let isInitialized = false;
export const loadIllustSort = (
  setButtonsVisible: (visible: boolean) => void
) => {
  if (isInitialized) return;

  class IllustSorter {
    type: IllustSortType | undefined;
    illustrations: (IllustrationListItem & { bookmarkUserTotal: number })[] =
      [];
    sorting: boolean = false;
    nextSortPage: number | undefined;
    listElement: JQuery<HTMLElement> = $();

    progressElement = $();
    progressText = $();

    /** 按钮由本脚本创建，构造时可能尚未挂载，因此每次使用前再查询 */
    get sortButtonElement() {
      return $(`#${SORT_BUTTON_ID}`);
    }

    reset(type: IllustSortType) {
      this.type = type;
      this.illustrations = [];
      this.nextSortPage = undefined;
      this.listElement = getIllustrationsListDom(type);
      this.progressElement.remove();
      this.progressElement = $(document.createElement("div"))
        .attr({
          id: "pp-sort-progress",
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
        .prependTo(this.listElement)
        .hide();
      this.progressText = $(document.createElement("div"))
        .attr({
          id: "pp-sort-progress__text",
        })
        .css({
          "text-align": "center",
          "font-size": "16px",
          "font-weight": "bold",
          color: "initial",
        })
        .appendTo(this.progressElement);
    }

    async sort({
      type,
      api,
      searchParams,
      settings,
      isCurrentPage,
    }: {
      type: IllustSortType;
      api: string;
      searchParams: URLSearchParams;
      settings: SortRuntimeSettings;
      isCurrentPage: () => boolean;
    }) {
      this.sorting = true;
      iLog.i("Start to sort illustrations.");

      const {
        pageCount,
        favFilter,
        orderType,
        hideFavorite,
        hideByTag,
        hideByTagList,
        aiFilter,
        aiAssistedFilter,
      } = settings;
      const excludedTags = hideByTag ? parseExcludedTags(hideByTagList) : [];

      try {
        this.sortButtonElement.attr({
          title: Texts.label_sorting,
          "aria-label": Texts.label_sorting,
          "aria-busy": "true",
        });

        //#region 获取作品分页列表
        let illustrations: IllustrationListItem[] = [];
        const startPage = Number(searchParams.get("p") ?? 1);

        for (let page = startPage; page < startPage + pageCount; page += 1) {
          searchParams.set("p", String(page));

          if (
            [
              IllustSortType.USER_ARTWORK,
              IllustSortType.USER_ILLUST,
              IllustSortType.USER_MANGA,
            ].includes(type)
          ) {
            searchParams.set("is_first_page", page > 1 ? "0" : "1");
            searchParams.delete("ids[]");

            const userId = searchParams.get("user_id") || "";
            const userIllustrations = await getUserIllustrationsWithCache(
              userId,
              {
                onRequesting: () => this.setProgress(Texts.sort_getUserWorks),
              }
            );
            if (!isCurrentPage()) return;
            const fromIndex = (page - 1) * USER_TYPE_ARTWORKS_PER_PAGE;
            const toIndex = page * USER_TYPE_ARTWORKS_PER_PAGE;
            switch (type) {
              case IllustSortType.USER_ARTWORK:
                userIllustrations.artworks
                  .slice(fromIndex, toIndex)
                  .forEach((id) => searchParams.append("ids[]", id));
                break;
              case IllustSortType.USER_ILLUST:
                userIllustrations.illusts
                  .slice(fromIndex, toIndex)
                  .forEach((id) => searchParams.append("ids[]", id));
                break;
              case IllustSortType.USER_MANGA:
                userIllustrations.manga
                  .slice(fromIndex, toIndex)
                  .forEach((id) => searchParams.append("ids[]", id));
                break;
            }
          } else if ([IllustSortType.USER_BOOKMARK].includes(type)) {
            searchParams.set(
              "offset",
              String((page - 1) * USER_TYPE_ARTWORKS_PER_PAGE)
            );
          }

          this.setProgress(formatText(Texts.sort_getWorks, page));
          const requestUrl = `${api}?${searchParams}`;
          const getIllustRes = await requestWithRetry({
            url: requestUrl,
            onRetry: (response, retryTimes) => {
              if (!isCurrentPage()) {
                throw new DOMException(
                  "The sorting page changed.",
                  "AbortError"
                );
              }
              iLog.w(
                `Get illustration list through \`${requestUrl}\` failed:`,
                response,
                `${retryTimes} times retrying...`
              );
              this.setProgress(
                formatText(Texts.sort_retryWorks, page, retryTimes)
              );
            },
          });
          if (!isCurrentPage()) return;
          const extractedIllustrations = getIllustrationsFromResponse(
            type,
            getIllustRes.response
          );
          illustrations = illustrations.concat(extractedIllustrations);
        }
        //#endregion

        //#region 获取作品详情信息，合并到列表中
        const getDetailedIllustrationPromises: (() => Promise<
          IllustrationListItem & { bookmarkUserTotal: number }
        >)[] = [];
        for (let i = 0; i < illustrations.length; i += 1) {
          const illustration = illustrations[i];
          const illustrationId = illustration.id;
          const illustrationAuthorId = illustration.userId;

          if (String(illustrationAuthorId) === "0") {
            // 跳过已删除或不可查看的作品
            continue;
          }

          getDetailedIllustrationPromises.push(async () => {
            this.setProgress(
              formatText(Texts.sort_getDetails, i + 1, illustrations.length)
            );
            const illustrationDetails = await getIllustrationDetailsWithCache(
              illustrationId,
              true
            );
            return {
              ...illustration,
              bookmarkUserTotal: illustrationDetails?.bookmarkUserTotal ?? -1,
            };
          });
        }
        const detailedIllustrations = await execLimitConcurrentPromises(
          getDetailedIllustrationPromises
        );
        if (!isCurrentPage()) return;
        iLog.d("Queried detailed illustrations:", detailedIllustrations);
        //#endregion

        //#region 过滤作品
        this.setProgress(Texts.sort_filtering);
        const filteredIllustrations = detailedIllustrations.filter(
          (illustration) => {
            if (hideFavorite && illustration.bookmarkData) {
              return false;
            }

            if (aiFilter && checkIsAiGenerated(illustration.aiType)) {
              return false;
            }

            if (aiAssistedFilter && checkIsAiAssisted(illustration.tags)) {
              return false;
            }

            if (
              excludedTags.length > 0 &&
              illustration.tags.some((tag) =>
                excludedTags.includes(tag.toLowerCase())
              )
            ) {
              return false;
            }

            return illustration.bookmarkUserTotal >= favFilter;
          }
        );
        //#endregion

        //#region 排序作品
        this.setProgress(Texts.sort_sorting);
        const sortedIllustrations =
          orderType === IllustSortOrder.BY_BOOKMARK_COUNT
            ? filteredIllustrations.sort(
                (a, b) => b.bookmarkUserTotal - a.bookmarkUserTotal
              )
            : filteredIllustrations;
        iLog.d("Filtered and sorted illustrations:", sortedIllustrations);
        //#endregion

        if (!this.listElement.get(0)?.isConnected) {
          throw new Error(Texts.sort_listMissing);
        }
        this.illustrations = sortedIllustrations;
        this.showIllustrations();
        this.nextSortPage = startPage + pageCount;
        iLog.i("Sort illustrations successfully.");
      } finally {
        this.sorting = false;
        this.hideProgress();
        this.sortButtonElement.attr({
          title: Texts.label_sort,
          "aria-label": Texts.label_sort,
          "aria-busy": "false",
        });
      }
    }

    setProgress(text: string) {
      this.progressText.text(text);
      this.progressElement.show();
    }

    hideProgress() {
      this.progressText.text("");
      this.progressElement.hide();
    }

    showIllustrations() {
      const fragment = document.createDocumentFragment();
      for (const {
        aiType,
        alt,
        bookmarkData,
        bookmarkUserTotal,
        id,
        illustType,
        pageCount,
        profileImageUrl,
        tags,
        title,
        url,
        userId,
        userName,
      } of this.illustrations) {
        const isR18 = checkIsR18(tags);
        const isR18G = checkIsR18G(tags);
        const isUgoira = checkIsUgoira(illustType);
        const isAi = checkIsAiGenerated(aiType);
        const isAiAssisted = checkIsAiAssisted(tags);

        const listItem = document.createElement("li");
        listItem.className = "col-span-2";

        const container = document.createElement("div");
        container.style = "width: 184px;";

        const illustrationAnchor = document.createElement("a");
        illustrationAnchor.setAttribute("data-gtm-value", id);
        illustrationAnchor.setAttribute("data-gtm-user-id", userId);
        illustrationAnchor.href = `/artworks/${id}`;
        markSortedArtworkLink(illustrationAnchor, getSettings().linkBlank);
        illustrationAnchor.style =
          "display: block; position: relative; width: 184px;";

        const illustrationImageWrapper = document.createElement("div");
        illustrationImageWrapper.style =
          "position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;";

        const illustrationImage = document.createElement("img");
        illustrationImage.src = url;
        illustrationImage.alt = alt;
        illustrationImage.style =
          "object-fit: cover; object-position: center center; width: 100%; height: 100%; border-radius: 4px; background-color: rgb(31, 31, 31);";

        const ugoriaSvg = document.createElement("div");
        ugoriaSvg.style = "position: absolute;";
        ugoriaSvg.innerHTML = playIcon;

        const illustrationMeta = document.createElement("div");
        illustrationMeta.style =
          "position: absolute; top: 0px; left: 0px; right: 0px; display: flex; align-items: flex-start; padding: 4px 4px 0; pointer-events: none; font-size: 10px;";
        illustrationMeta.innerHTML = `
          ${
            isR18G
              ? '<div style="padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(255, 64, 96); font-weight: bold; line-height: 16px; user-select: none;">R-18G</div>'
              : isR18
                ? '<div style="padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(255, 64, 96); font-weight: bold; line-height: 16px; user-select: none;">R-18</div>'
                : ""
          }
          ${
            isAi
              ? `<div style="padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(162, 28, 175); font-weight: bold; line-height: 16px; user-select: none;">${Texts.artwork_aiGenerated}</div>`
              : isAiAssisted
                ? `<div style="padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(109, 40, 217); font-weight: bold; line-height: 16px; user-select: none;">${Texts.artwork_aiAssisted}</div>`
                : ""
          }
          ${
            pageCount > 1
              ? `
                <div style="margin-left: auto;">
                  <div style="display: flex; justify-content: center; align-items: center; height: 20px; min-width: 20px; color: rgb(245, 245, 245); font-weight: bold; padding: 0px 6px; background: rgba(0, 0, 0, 0.32); border-radius: 10px; line-height: 10px;">
                    ${pageIcon}
                    <span>${pageCount}</span>
                  </div>
                </div>`
              : ""
          }
        `;

        const illustrationToolbar = document.createElement("div");
        illustrationToolbar.style =
          "position: absolute; top: 164px; left: 0px; right: 0px; display: flex; align-items: center; padding: 0 4px 4px; pointer-events: none; font-size: 12px;";
        // TODO: 支持收藏 / 取消收藏作品
        illustrationToolbar.innerHTML = `
          <div style="padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: ${bookmarkUserTotal > 50000 ? "rgb(159, 18, 57)" : bookmarkUserTotal > 10000 ? "rgb(220, 38, 38)" : bookmarkUserTotal > 5000 ? "rgb(29, 78, 216)" : bookmarkUserTotal > 1000 ? "rgb(21, 128, 61)" : "rgb(71, 85, 105)"}; font-weight: bold; line-height: 16px; user-select: none;">❤ ${bookmarkUserTotal}</div>
          <div style="margin-left: auto; display: none;">${bookmarkData ? heartFilledIcon : heartIcon}</div>
        `;

        const illustrationTitle = document.createElement("div");
        illustrationTitle.innerHTML = title;
        illustrationTitle.style =
          "margin-top: 4px; max-width: 100%; overflow: hidden; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; line-height: 22px; font-size: 14px; font-weight: bold; color: rgb(245, 245, 245); transition: color 0.2s;";

        const illustrationAuthor = document.createElement("a");
        illustrationAuthor.setAttribute("data-gtm-value", userId);
        illustrationAuthor.href = `/users/${userId}`;
        illustrationAuthor.target = "_blank";
        illustrationAuthor.rel = "external";
        illustrationAuthor.style =
          "display: flex; align-items: center; margin-top: 4px;";
        illustrationAuthor.innerHTML = `
          <img src="${profileImageUrl}" alt="${userName}" style="object-fit: cover; object-position: center top; width: 24px; height: 24px; border-radius: 50%; margin-right: 4px;">
          <span style="min-width: 0px; line-height: 22px; font-size: 14px; color: rgb(214, 214, 214); text-decoration: none; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${userName}</span>
        `;

        illustrationImageWrapper.appendChild(illustrationImage);
        if (isUgoira) illustrationImageWrapper.appendChild(ugoriaSvg);
        illustrationAnchor.appendChild(illustrationImageWrapper);
        illustrationAnchor.appendChild(illustrationMeta);
        illustrationAnchor.appendChild(illustrationToolbar);
        illustrationAnchor.appendChild(illustrationTitle);
        container.appendChild(illustrationAnchor);
        container.appendChild(illustrationAuthor);
        listItem.appendChild(container);
        fragment.appendChild(listItem);
      }

      if (
        [
          IllustSortType.BOOKMARK_NEW,
          IllustSortType.BOOKMARK_NEW_R18,
          IllustSortType.USER_ARTWORK,
          IllustSortType.USER_ILLUST,
          IllustSortType.USER_MANGA,
          IllustSortType.USER_BOOKMARK,
        ].includes(this.type as IllustSortType)
      ) {
        this.listElement.css({
          gap: "24px",
        });
      }

      this.listElement.children().remove();
      this.listElement.append(fragment);
    }
  }

  const illustSorter = new IllustSorter();
  let currentPage: URL | undefined;

  const diagnoseSortPage = debounce(
    (url: URL, type: IllustSortType) => {
      if (url.href !== location.href) return;
      try {
        getIllustrationsListDom(type);
      } catch (error) {
        iLog.w(
          "Artwork sorting page check failed:",
          url.href,
          IllustSortType[type],
          error
        );
      }
    },
    () => {
      const { domProbeIntervalMs, domProbeMaxAttempts } = getSettings();
      return domProbeIntervalMs * (domProbeMaxAttempts - 1);
    }
  );

  const refreshSortPage = () => {
    const url = new URL(location.href);
    if (url.href === currentPage?.href) return;

    currentPage = url;
    illustSorter.nextSortPage = undefined;
    illustSorter.progressElement.remove();
    $(`#${SORT_ERROR_PANEL_ID}`).remove();

    const options = getSortOptionsFromUrl(url);
    setButtonsVisible(Boolean(options));

    // 路由变化时页面可能仍保留上一个列表，等异步渲染完成后再检查。
    diagnoseSortPage.cancel();
    if (options) diagnoseSortPage(url, options.type);
  };

  window.addEventListener(SORT_EVENT_NAME, async () => {
    if (illustSorter.sorting) {
      iLog.w("Current is in sorting progress.");
      return;
    }

    const url = new URL(location.href);
    const page = currentPage;
    const isCurrentPage = () =>
      page === currentPage && url.href === location.href;
    try {
      const options = getSortOptionsFromUrl(url);
      if (!options) return;
      const { type, api, searchParams } = options;

      url.searchParams.forEach((value, key) => {
        searchParams.set(key, value);
      });

      $(`#${SORT_ERROR_PANEL_ID}`).remove();
      illustSorter.reset(type);
      await illustSorter.sort({
        type,
        api,
        searchParams,
        settings: getSettings(),
        isCurrentPage,
      });
    } catch (error) {
      if (!isCurrentPage()) return;
      iLog.e("Sort illustrations failed:", url.href, error);
      showSortError(error);
    }
  });

  window.addEventListener(SORT_NEXT_PAGE_EVENT_NAME, () => {
    const url = new URL(location.href);
    if (!getSortOptionsFromUrl(url)) return;
    const { origin, pathname, searchParams } = url;

    const currentPageNumber = Number(searchParams.get("p") ?? 1);
    let nextPage = currentPageNumber + 1;

    if (
      url.href === currentPage?.href &&
      illustSorter.nextSortPage &&
      illustSorter.listElement.get(0)?.isConnected
    ) {
      iLog.i(
        "Illustrations in current page are sorted, jump to next available page..."
      );
      nextPage = illustSorter.nextSortPage;
    }

    searchParams.set("p", String(nextPage));
    location.href = `${origin}${pathname}?${searchParams}`;
  });

  window.addEventListener("urlchange", refreshSortPage);
  refreshSortPage();

  isInitialized = true;
};

/** 获取作品节点 li 的父节点 ul */
function getIllustrationsListDom(type: IllustSortType) {
  const isSearchResult = [
    IllustSortType.TAG_ARTWORK,
    IllustSortType.TAG_ILLUST,
    IllustSortType.TAG_MANGA,
    IllustSortType.SEARCH_ILLUST,
    IllustSortType.SEARCH_MANGA,
  ].includes(type);
  let dom = isSearchResult
    ? $('div[data-ga4-label="works_content"]').children("div").last()
    : $(BOOKMARK_USER_PAGE_ILLUSTRATION_LIST_SELECTOR);

  if (!dom.length) {
    const isUserArtworkList = [
      IllustSortType.USER_ARTWORK,
      IllustSortType.USER_ILLUST,
      IllustSortType.USER_MANGA,
    ].includes(type);
    const selector = isUserArtworkList
      ? ".__top_side_menu_body ul"
      : "section ul";
    dom = $(selector).has('a[href*="/artworks/"]');
  }

  if (!dom.length) {
    throw new Error(Texts.sort_listMissing);
  }
  if (dom.length > 1) {
    throw new Error(formatText(Texts.sort_listAmbiguous, dom.length));
  }

  return dom;
}

/** 根据当前路由获取接口参数 */
function getSortOptionsFromUrl(url: URL) {
  const { searchParams } = url;
  const pathname = url.pathname.replace(/^\/en(?=\/)/, "");

  let type: IllustSortType | undefined;
  let api: string | undefined;
  let defaultSearchParams: string | undefined;

  let match: RegExpMatchArray | null;
  if (
    (match = pathname.match(
      /^\/tags\/([^/]+)\/(artworks|illustrations|manga)$/
    ))
  ) {
    const tagName = match[1];
    const filterType = match[2];

    switch (filterType) {
      case "artworks":
        type = IllustSortType.TAG_ARTWORK;
        api = `/ajax/search/artworks/${tagName}`;
        defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=all&lang=zh`;
        break;
      case "illustrations":
        type = IllustSortType.TAG_ILLUST;
        api = `/ajax/search/illustrations/${tagName}`;
        defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=illust_and_ugoira&lang=zh`;
        break;
      case "manga":
        type = IllustSortType.TAG_MANGA;
        api = `/ajax/search/manga/${tagName}`;
        defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=manga&lang=zh`;
        break;
    }
  } else if (pathname === "/search") {
    const tagName = searchParams.get("q")?.trim();
    if (!tagName) return;
    const filterType = searchParams.get("type");

    switch (filterType) {
      case "illust_ugoira":
        type = IllustSortType.SEARCH_ILLUST;
        api = `/ajax/search/illustrations/${tagName}`;
        defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=illust_and_ugoira&lang=zh`;
        break;
      case "manga":
        type = IllustSortType.SEARCH_MANGA;
        api = `/ajax/search/manga/${tagName}`;
        defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=manga&lang=zh`;
        break;
    }
  } else if ((match = pathname.match(/^\/bookmark_new_illust(_r18)?\.php$/))) {
    const isR18 = !!match[1];

    api = "/ajax/follow_latest/illust";
    type = isR18
      ? IllustSortType.BOOKMARK_NEW_R18
      : IllustSortType.BOOKMARK_NEW;
    defaultSearchParams = `mode=${isR18 ? "r18" : "all"}&lang=zh`;
  } else if (
    (match = pathname.match(/^\/users\/(\d+)\/bookmarks\/artworks$/))
  ) {
    const userId = match[1];

    type = IllustSortType.USER_BOOKMARK;
    api = `/ajax/user/${userId}/illusts/bookmarks`;
    defaultSearchParams = `tag=&offset=0&limit=${USER_TYPE_ARTWORKS_PER_PAGE}&rest=show&lang=zh`;
  } else if (
    (match = pathname.match(/^\/users\/(\d+)\/(artworks|illustrations|manga)$/))
  ) {
    const userId = match[1];
    const filterType = match[2];

    api = `/ajax/user/${userId}/profile/illusts`;
    switch (filterType) {
      case "artworks":
        type = IllustSortType.USER_ARTWORK;
        // 特别的，为默认的查询参数添加 `user_id=${userId}`，供后续处理使用
        defaultSearchParams = `work_category=illustManga&is_first_page=1&sensitiveFilterMode=userSetting&user_id=${userId}&lang=zh`;
        break;
      case "illustrations":
        type = IllustSortType.USER_ILLUST;
        defaultSearchParams = `work_category=illust&is_first_page=1&sensitiveFilterMode=userSetting&user_id=${userId}&lang=zh`;
        break;
      case "manga":
        type = IllustSortType.USER_MANGA;
        defaultSearchParams = `work_category=manga&is_first_page=1&sensitiveFilterMode=userSetting&user_id=${userId}&lang=zh`;
        break;
    }
  }

  if (
    type === undefined ||
    api === undefined ||
    defaultSearchParams === undefined
  ) {
    return;
  }

  return {
    type,
    api,
    searchParams: new URLSearchParams(defaultSearchParams),
  };
}

/** 从响应值里提取作品数据列表 */
function getIllustrationsFromResponse(
  type: IllustSortType,
  response: PixivStandardResponse<unknown>
) {
  if (type === IllustSortType.TAG_ARTWORK) {
    return (
      (
        response as PixivStandardResponse<{
          illustManga: { data: IllustrationListItem[] };
        }>
      ).body.illustManga.data ?? []
    );
  } else if (
    type === IllustSortType.TAG_ILLUST ||
    type === IllustSortType.SEARCH_ILLUST
  ) {
    return (
      (
        response as PixivStandardResponse<{
          illust: { data: IllustrationListItem[] };
        }>
      ).body.illust.data ?? []
    );
  } else if (
    type === IllustSortType.TAG_MANGA ||
    type === IllustSortType.SEARCH_MANGA
  ) {
    return (
      (
        response as PixivStandardResponse<{
          manga: { data: IllustrationListItem[] };
        }>
      ).body.manga.data ?? []
    );
  } else if (
    [IllustSortType.BOOKMARK_NEW, IllustSortType.BOOKMARK_NEW_R18].includes(
      type
    )
  ) {
    return (
      (
        response as PixivStandardResponse<{
          thumbnails: { illust: IllustrationListItem[] };
        }>
      ).body.thumbnails.illust ?? []
    );
  } else if (
    [
      IllustSortType.USER_ARTWORK,
      IllustSortType.USER_ILLUST,
      IllustSortType.USER_MANGA,
      IllustSortType.USER_BOOKMARK,
    ].includes(type)
  ) {
    return Object.values(
      (
        response as PixivStandardResponse<{
          works: Record<string, IllustrationListItem>;
        }>
      ).body.works
    );
  }

  return [];
}
