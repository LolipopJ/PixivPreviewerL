import {
  g_loadingImage,
  SORT_BUTTON_ID,
  SORT_EVENT_NAME,
  SORT_NEXT_PAGE_EVENT_NAME,
} from "../constants";
import { IllustSortOrder, IllustSortType } from "../enums";
import Texts, { formatText } from "../i18n";
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
import { waitFor } from "../utils/dom";
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
import { createSortBookmarkButton } from "./sort-bookmark";
import {
  showSortError,
  showSortRateLimit,
  SORT_ERROR_PANEL_ID,
  SORT_RATE_LIMIT_PANEL_ID,
} from "./sort-notice";

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
const ARTWORK_LINK_SELECTOR = 'a[href*="/artworks/"]';
const NEXT_SORT_PAGE_STORAGE_KEY = "PIXIV_PREVIEWER_L_NEXT_SORT_PAGE";

const getSortPathname = (url: URL) => url.pathname.replace(/^\/en(?=\/)/, "");

const getSortPageKey = (url: URL) => {
  const params = new URLSearchParams(url.search);
  params.sort();
  return `${getSortPathname(url)}?${params}`;
};

const takeNextSortPage = () => {
  try {
    const pageKey = sessionStorage.getItem(NEXT_SORT_PAGE_STORAGE_KEY);
    if (pageKey !== null) sessionStorage.removeItem(NEXT_SORT_PAGE_STORAGE_KEY);
    return pageKey;
  } catch (error) {
    iLog.w("Failed to read pending artwork sort page:", error);
    return null;
  }
};

const parseExcludedTags = (raw: string) =>
  raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

let isInitialized = false;
export const loadIllustSort = (
  setButtonsVisible: (visible: boolean) => void
) => {
  if (isInitialized) return;

  class IllustSorter {
    type: IllustSortType | undefined;
    illustrations: (IllustrationListItem & { bookmarkUserTotal: number })[] =
      [];
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
      retryControls,
    }: {
      type: IllustSortType;
      api: string;
      searchParams: URLSearchParams;
      settings: SortRuntimeSettings;
      isCurrentPage: () => boolean;
      retryControls: {
        signal: AbortSignal;
        onRateLimit: (retryTimes: number) => void;
      };
    }) {
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
        const illustrationsById = new Map<string, IllustrationListItem>();
        const startPage = Number(searchParams.get("p") ?? 1);
        let nextPage = startPage;
        let lastPage: number | undefined;

        for (
          let page = startPage;
          page < startPage + pageCount && page <= (lastPage ?? Infinity);
          page += 1
        ) {
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
                ...retryControls,
                onRequesting: () => this.setProgress(Texts.sort_getUserWorks),
              }
            );
            if (!isCurrentPage()) return;
            const ids =
              type === IllustSortType.USER_ARTWORK
                ? userIllustrations.artworks
                : type === IllustSortType.USER_ILLUST
                  ? userIllustrations.illusts
                  : userIllustrations.manga;
            lastPage = Math.ceil(ids.length / USER_TYPE_ARTWORKS_PER_PAGE);
            if (page > lastPage) {
              throw new Error(formatText(Texts.sort_emptyWorksPage, page));
            }
            const fromIndex = (page - 1) * USER_TYPE_ARTWORKS_PER_PAGE;
            ids
              .slice(fromIndex, page * USER_TYPE_ARTWORKS_PER_PAGE)
              .forEach((id) => searchParams.append("ids[]", id));
          } else if ([IllustSortType.USER_BOOKMARK].includes(type)) {
            searchParams.set(
              "offset",
              String((page - 1) * USER_TYPE_ARTWORKS_PER_PAGE)
            );
          }

          this.setProgress(formatText(Texts.sort_getWorks, page));
          const requestUrl = `${api}?${searchParams}`;
          const getIllustRes = await requestWithRetry({
            ...retryControls,
            url: requestUrl,
            onRetry: (response, retryTimes) => {
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
          const artworkPage = getArtworkPageFromResponse(
            type,
            getIllustRes.response
          );
          if (artworkPage.illustrations.length === 0) {
            // 末页未知时，已取到作品后的空页可作为列表末尾。
            const expectedLastPage = lastPage ?? artworkPage.lastPage;
            if (
              page === startPage ||
              (expectedLastPage !== undefined && page <= expectedLastPage)
            ) {
              throw new Error(formatText(Texts.sort_emptyWorksPage, page));
            }
            break;
          }
          lastPage = artworkPage.lastPage ?? lastPage;
          for (const illustration of artworkPage.illustrations) {
            illustrationsById.set(illustration.id, illustration);
          }
          nextPage = page + 1;
        }
        //#endregion

        //#region 获取作品详情信息，合并到列表中
        const illustrations = Array.from(illustrationsById.values());
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
            retryControls.signal.throwIfAborted();
            this.setProgress(
              formatText(Texts.sort_getDetails, i + 1, illustrations.length)
            );
            const illustrationDetails = await getIllustrationDetailsWithCache(
              illustrationId,
              { retry: retryControls }
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
        this.nextSortPage = nextPage;
        iLog.i("Sort illustrations successfully.");
      } finally {
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
        const illustrationTitle =
          illustrationAnchor.cloneNode() as HTMLAnchorElement;
        const linkBlank = getSettings().linkBlank;
        markSortedArtworkLink(illustrationAnchor, linkBlank);
        markSortedArtworkLink(illustrationTitle, linkBlank);
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

        const bookmarkCount = document.createElement("span");
        bookmarkCount.style = `position: absolute; bottom: 4px; left: 4px; padding: 0 4px; border-radius: 4px; color: rgb(245, 245, 245); background: ${bookmarkUserTotal > 50000 ? "rgb(159, 18, 57)" : bookmarkUserTotal > 10000 ? "rgb(220, 38, 38)" : bookmarkUserTotal > 5000 ? "rgb(29, 78, 216)" : bookmarkUserTotal > 1000 ? "rgb(21, 128, 61)" : "rgb(71, 85, 105)"}; font-size: 12px; font-weight: bold; line-height: 16px; pointer-events: none; user-select: none;`;
        let visibleBookmarkCount = bookmarkUserTotal;
        bookmarkCount.textContent = `❤ ${visibleBookmarkCount}`;
        const bookmarkButton = createSortBookmarkButton(
          id,
          bookmarkData?.id,
          (bookmarked) => {
            visibleBookmarkCount = Math.max(
              0,
              visibleBookmarkCount + (bookmarked ? 1 : -1)
            );
            bookmarkCount.textContent = `❤ ${visibleBookmarkCount}`;
          }
        );

        illustrationTitle.textContent = title;
        illustrationTitle.style =
          "display: block; margin-top: 4px; max-width: 100%; overflow: hidden; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; line-height: 22px; font-size: 14px; font-weight: bold; color: rgb(245, 245, 245); transition: color 0.2s;";

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
        illustrationAnchor.appendChild(bookmarkCount);
        const thumbnail = document.createElement("div");
        thumbnail.style.position = "relative";
        thumbnail.append(illustrationAnchor, bookmarkButton[0]);
        container.append(thumbnail, illustrationTitle, illustrationAuthor);
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
  let activeSort: AbortController | undefined;
  let cancelAutoSort: (() => void) | undefined;

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
    cancelAutoSort?.();
    cancelAutoSort = undefined;
    activeSort?.abort();
    illustSorter.nextSortPage = undefined;
    illustSorter.progressElement.remove();
    $(`#${SORT_ERROR_PANEL_ID}, #${SORT_RATE_LIMIT_PANEL_ID}`).remove();

    const options = getSortOptionsFromUrl(url);
    setButtonsVisible(Boolean(options));

    // 路由变化时页面可能仍保留上一个列表，等异步渲染完成后再检查。
    diagnoseSortPage.cancel();
    const pendingNextPage = takeNextSortPage();
    if (!options) return;

    if (pendingNextPage !== getSortPageKey(url)) {
      diagnoseSortPage(url, options.type);
      return;
    }

    const isDestination = () =>
      currentPage === url && location.href === url.href;
    cancelAutoSort = waitFor(
      () => {
        if (activeSort) return false;
        const list = findIllustrationsListDom(options.type);
        return list.length === 1 && list.find(ARTWORK_LINK_SELECTOR).length > 0;
      },
      () => {
        if (isDestination()) void sortCurrentPage();
      },
      {
        onGiveUp: () => {
          cancelAutoSort = undefined;
          if (!isDestination()) return;
          const error = new Error(Texts.sort_nextPageNotReady);
          iLog.e("Next artwork page did not render:", url.href, error);
          showSortError(error);
        },
      }
    );
  };

  const sortCurrentPage = async () => {
    cancelAutoSort?.();
    cancelAutoSort = undefined;
    if (activeSort) {
      iLog.w("Current is in sorting progress.");
      return;
    }

    const url = new URL(location.href);
    const page = currentPage;
    const isCurrentPage = () =>
      page === currentPage && url.href === location.href;

    const controller = new AbortController();
    let rateLimitPanel: ReturnType<typeof showSortRateLimit> | undefined;
    let highestRetry = 0;
    const logRateLimit = debounce(() => {
      iLog.w("Pixiv rate-limited artwork sorting (HTTP 429):", url.href);
    }, 250);
    const onRateLimit = (retryTimes: number) => {
      logRateLimit();
      rateLimitPanel ??= showSortRateLimit(() => controller.abort());
      if (retryTimes <= highestRetry) return;
      highestRetry = retryTimes;
      rateLimitPanel.setRetryTimes(highestRetry);
    };

    activeSort = controller;
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
        retryControls: { signal: controller.signal, onRateLimit },
      });
    } catch (error) {
      if (controller.signal.aborted || !isCurrentPage()) return;
      iLog.e("Sort illustrations failed:", url.href, error);
      showSortError(error);
    } finally {
      controller.abort();
      rateLimitPanel?.remove();
      activeSort = undefined;
    }
  };

  window.addEventListener(SORT_EVENT_NAME, sortCurrentPage);
  window.addEventListener(SORT_NEXT_PAGE_EVENT_NAME, () => {
    const url = new URL(location.href);
    if (!getSortOptionsFromUrl(url)) return;
    const { searchParams } = url;

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
    url.hash = "";
    try {
      sessionStorage.setItem(NEXT_SORT_PAGE_STORAGE_KEY, getSortPageKey(url));
      location.href = url.href;
    } catch (error) {
      iLog.e("Failed to open the next artwork sort page:", url.href, error);
      showSortError(error);
    }
  });

  window.addEventListener("urlchange", refreshSortPage);
  refreshSortPage();

  isInitialized = true;
};

/** 获取作品列表候选节点 */
function findIllustrationsListDom(type: IllustSortType) {
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
    dom = $(selector).has(ARTWORK_LINK_SELECTOR);
  }
  return dom;
}

function getIllustrationsListDom(type: IllustSortType) {
  const dom = findIllustrationsListDom(type);
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
  const pathname = getSortPathname(url);

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
type RawArtworkPage = { data?: unknown; lastPage?: number };

function getArtworkPageFromResponse(
  type: IllustSortType,
  response: PixivStandardResponse<unknown>
) {
  const body = response?.body as
    | {
        illustManga?: RawArtworkPage;
        illust?: RawArtworkPage;
        manga?: RawArtworkPage;
        thumbnails?: { illust?: unknown };
        works?: unknown;
        total?: number;
      }
    | null
    | undefined;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error(Texts.sort_invalidWorksResponse);
  }

  let page: RawArtworkPage | undefined;
  switch (type) {
    case IllustSortType.TAG_ARTWORK:
      page = body.illustManga;
      break;
    case IllustSortType.TAG_ILLUST:
    case IllustSortType.SEARCH_ILLUST:
      page = body.illust;
      break;
    case IllustSortType.TAG_MANGA:
    case IllustSortType.SEARCH_MANGA:
      page = body.manga;
      break;
    case IllustSortType.BOOKMARK_NEW:
    case IllustSortType.BOOKMARK_NEW_R18:
      page = { data: body.thumbnails?.illust };
      break;
    case IllustSortType.USER_ARTWORK:
    case IllustSortType.USER_ILLUST:
    case IllustSortType.USER_MANGA:
    case IllustSortType.USER_BOOKMARK:
      if (body.works && typeof body.works === "object") {
        page = { data: Object.values(body.works) };
        if (
          type === IllustSortType.USER_BOOKMARK &&
          typeof body.total === "number"
        ) {
          page.lastPage = Math.ceil(body.total / USER_TYPE_ARTWORKS_PER_PAGE);
        }
      }
      break;
  }

  const { data, lastPage } = page ?? {};
  if (
    !Array.isArray(data) ||
    data.some(
      (work) =>
        !work || (typeof work.id !== "string" && typeof work.id !== "number")
    )
  ) {
    throw new Error(Texts.sort_invalidWorksResponse);
  }
  return {
    illustrations: data as IllustrationListItem[],
    lastPage:
      lastPage !== undefined && Number.isSafeInteger(lastPage) && lastPage >= 0
        ? lastPage
        : undefined,
  };
}
