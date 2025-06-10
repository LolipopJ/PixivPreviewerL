import {
  AI_ASSISTED_TAGS,
  g_defaultSettings,
  g_loadingImage,
  SORT_BUTTON_ID,
  SORT_EVENT_NAME,
  SORT_NEXT_PAGE_EVENT_NAME,
} from "../constants";
import {
  cacheIllustrationDetails,
  getCachedIllustrationDetails,
} from "../databases";
import { AiType, IllustSortOrder, IllustSortType, IllustType } from "../enums";
import Texts from "../i18n";
import heartIcon from "../icons/heart.svg";
import heartFilledIcon from "../icons/heart-filled.svg";
import pageIcon from "../icons/page.svg";
import playIcon from "../icons/play.svg";
import {
  getUserIllustrations,
  PixivStandardResponse,
  requestWithRetry,
} from "../services";
import type {
  GlobalSettings,
  Illustration,
  IllustrationDetails,
} from "../types";
import { checkIsAiAssisted } from "../utils/illustration";
import { iLog } from "../utils/logger";
import { execLimitConcurrentPromises } from "../utils/promise";

type LoadIllustSortOptions = Pick<
  GlobalSettings,
  | "pageCount"
  | "favFilter"
  | "orderType"
  | "hideFavorite"
  | "hideByTag"
  | "hideByTagList"
  | "aiFilter"
  | "aiAssistedFilter"
> & { csrfToken: string };

const USER_ARTWORKS_CACHE_PREFIX = "PIXIV_PREVIEWER_USER_ARTWORKS_";
const USER_TYPE_ARTWORKS_PER_PAGE = 48;

let isInitialized = false;
export const loadIllustSort = (options: LoadIllustSortOptions) => {
  if (isInitialized) return;

  const {
    pageCount: optionPageCount,
    favFilter: optionFavFilter,
    orderType = IllustSortOrder.BY_BOOKMARK_COUNT,
    hideFavorite = false,
    hideByTag = false,
    hideByTagList: hideByTagListString,
    aiFilter = false,
    aiAssistedFilter = false,
    // csrfToken,
  } = options;

  // 修正不符合实际的参数
  let pageCount = Number(optionPageCount),
    favFilter = Number(optionFavFilter);
  if (pageCount <= 0) {
    pageCount = g_defaultSettings.pageCount;
  }
  if (favFilter < 0) {
    favFilter = g_defaultSettings.favFilter;
  }

  // 添加过滤标签列表
  const hideByTagList = hideByTagListString
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => !!tag);
  if (aiAssistedFilter) {
    hideByTagList.push(...AI_ASSISTED_TAGS);
  }

  class IllustSorter {
    type: IllustSortType;
    illustrations: IllustrationDetails[];
    sorting: boolean = false;
    nextSortPage: number;
    listElement: JQuery<HTMLUListElement> = $();

    progressElement = $();
    progressText = $();

    sortButtonElement = $(`#${SORT_BUTTON_ID}`);

    reset({ type }: { type: IllustSortType }) {
      try {
        this.type = type;
        this.illustrations = [];
        this.sorting = false;
        this.nextSortPage = undefined;
        this.listElement = getIllustrationsListDom(type);
        this.progressElement?.remove();
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
        this.sortButtonElement.text(Texts.label_sort);
      } catch (error) {
        iLog.e(`An error occurred while resetting sorter:`, error);
        throw new Error(error);
      }
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
      iLog.i("Start to sort illustrations.");

      this.sortButtonElement.text(Texts.label_sorting);

      try {
        //#region 获取作品分页列表
        let illustrations: Illustration[] = [];
        const startPage = Number(searchParams.get("p") ?? 1);
        this.nextSortPage = startPage + pageCount;

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

            const userId = searchParams.get("user_id");
            const userIllustrations = await getUserIllustrationsWithCache(
              userId,
              {
                onRequesting: () =>
                  this.setProgress(`Getting illustrations of current user...`),
              }
            );
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

          this.setProgress(`Getting illustration list of page ${page} ...`);
          const requestUrl = `${api}?${searchParams}`;
          const getIllustRes = await requestWithRetry({
            url: requestUrl,
            onRetry: (response, retryTimes) => {
              iLog.w(
                `Get illustration list through \`${requestUrl}\` failed:`,
                response,
                `${retryTimes} times retrying...`
              );
              this.setProgress(
                `Retry to get illustration list of page ${page} (${retryTimes} times)...`
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
        const getDetailedIllustrationPromises: (() => Promise<IllustrationDetails>)[] =
          [];
        for (let i = 0; i < illustrations.length; i += 1) {
          getDetailedIllustrationPromises.push(async () => {
            this.setProgress(
              `Getting details of ${i + 1}/${illustrations.length} illustration...`
            );
            const illustration = illustrations[i];
            const illustrationId = illustration.id;
            const illustrationDetails =
              await getIllustrationDetailsWithCache(illustrationId);
            return {
              ...illustration,
              bookmark_user_total: illustrationDetails.bookmark_user_total,
            } as IllustrationDetails;
          });
        }
        const detailedIllustrations = await execLimitConcurrentPromises(
          getDetailedIllustrationPromises
        );
        cacheIllustrationDetails(detailedIllustrations);
        iLog.d("Queried detailed illustrations:", detailedIllustrations);
        //#endregion

        //#region 过滤作品
        this.setProgress("Filtering illustrations...");
        const filteredIllustrations = detailedIllustrations.filter(
          (illustration) => {
            if (hideFavorite && illustration.bookmarkData) {
              return false;
            }

            if (aiFilter && illustration.aiType === AiType.AI) {
              return false;
            }

            if ((hideByTag || aiAssistedFilter) && hideByTagList.length) {
              for (const tag of illustration.tags) {
                if (hideByTagList.includes(tag.toLowerCase())) {
                  return false;
                }
              }
            }

            return illustration.bookmark_user_total >= favFilter;
          }
        );
        //#endregion

        //#region 排序作品
        this.setProgress("Sorting filtered illustrations...");
        const sortedIllustrations =
          orderType === IllustSortOrder.BY_BOOKMARK_COUNT
            ? filteredIllustrations.sort(
                (a, b) => b.bookmark_user_total - a.bookmark_user_total
              )
            : filteredIllustrations;
        iLog.d("Filtered and sorted illustrations:", sortedIllustrations);
        //#endregion

        iLog.i("Sort illustrations successfully.");
        this.illustrations = sortedIllustrations;
        this.showIllustrations();
      } catch (error) {
        iLog.e("Sort illustrations failed:", error);
      }

      this.hideProgress();
      this.sorting = false;
      this.sortButtonElement.text(Texts.label_sort);
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
        bookmark_user_total,
        // createDate,
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
        const isR18 = tags.includes("R-18");
        const isUgoira = illustType === IllustType.UGOIRA;
        const isAi = aiType === AiType.AI;
        const isAiAssisted = checkIsAiAssisted(tags);

        const listItem = document.createElement("li");

        const container = document.createElement("div");
        container.style = "width: 184px;";

        const illustrationAnchor = document.createElement("a");
        illustrationAnchor.setAttribute("data-gtm-value", id);
        illustrationAnchor.setAttribute("data-gtm-user-id", userId);
        illustrationAnchor.href = `/artworks/${id}`;
        illustrationAnchor.target = "_blank";
        illustrationAnchor.rel = "external";
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
          ${isR18 ? '<div style="padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(255, 64, 96); font-weight: bold; line-height: 16px; user-select: none;">R-18</div>' : ""}
          ${
            isAi
              ? '<div style="padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: #1d4ed8; font-weight: bold; line-height: 16px; user-select: none;">AI</div>'
              : isAiAssisted
                ? '<div style="padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: #6d28d9; font-weight: bold; line-height: 16px; user-select: none;">AI-辅助</div>'
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
          "position: absolute; top: 154px; left: 0px; right: 0px; display: flex; align-items: center; padding: 0 4px 4px; pointer-events: none; font-size: 12px;";
        // TODO: 支持收藏 / 取消收藏作品
        illustrationToolbar.innerHTML = `
          <div style="padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: ${bookmark_user_total > 50000 ? "#9f1239" : bookmark_user_total > 10000 ? "#dc2626" : bookmark_user_total > 5000 ? "#1d4ed8" : bookmark_user_total > 1000 ? "#15803d" : "#475569"}; font-weight: bold; line-height: 16px; user-select: none;">❤ ${bookmark_user_total}</div>
          <div style="margin-left: auto;">${bookmarkData ? heartFilledIcon : heartIcon}</div>
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
        ].includes(this.type)
      ) {
        this.listElement.css({
          gap: "24px",
        });
      }

      this.listElement.find("li").remove();
      this.listElement.append(fragment);
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
      iLog.w("Current page doesn't support sorting illustrations.");
      return;
    }

    const mergedSearchParams = new URLSearchParams(defaultSearchParams);
    searchParams.forEach((value, key) => {
      mergedSearchParams.set(key, value);
    });

    illustSorter.reset({
      type,
    });
    illustSorter.sort({
      type,
      api,
      searchParams: mergedSearchParams,
    });
  });

  window.addEventListener(SORT_NEXT_PAGE_EVENT_NAME, () => {
    const url = new URL(location.href);
    const { origin, pathname, searchParams } = url;

    const currentPage = Number(searchParams.get("p") ?? 1);
    let nextPage = currentPage + 1;

    if (illustSorter.listElement?.length && illustSorter.nextSortPage) {
      iLog.i(
        "Illustrations in current page are sorted, jump to next available page..."
      );
      nextPage = illustSorter.nextSortPage;
    }

    searchParams.set("p", String(nextPage));
    location.href = `${origin}${pathname}?${searchParams}`;
  });

  isInitialized = true;
};

/** 获取作品节点 li 的父节点 ul */
function getIllustrationsListDom(type: IllustSortType) {
  let dom: JQuery<HTMLUListElement>;
  if (
    [
      IllustSortType.TAG_ARTWORK,
      IllustSortType.TAG_ILLUST,
      IllustSortType.TAG_MANGA,
    ].includes(type)
  ) {
    dom = $("ul.sc-ad8346e6-1.iwHaa-d");
  } else if (
    [
      IllustSortType.BOOKMARK_NEW,
      IllustSortType.BOOKMARK_NEW_R18,
      IllustSortType.USER_ARTWORK,
      IllustSortType.USER_ILLUST,
      IllustSortType.USER_MANGA,
      IllustSortType.USER_BOOKMARK,
    ].includes(type)
  ) {
    dom = $("ul.sc-7d21cb21-1.jELUak");
  }

  if (dom) {
    return dom;
  } else {
    throw new Error(
      `Illustrations list DOM not found. Please create a new issue here: ${process.env.BUG_REPORT_PAGE}`
    );
  }
}

/** 根据当前路由获取接口参数 */
function getSortOptionsFromPathname(pathname: string) {
  let type: IllustSortType;
  let api: string;
  let defaultSearchParams: string;

  let match: RegExpMatchArray;
  if (
    (match = pathname.match(/\/tags\/(.+)\/(artworks|illustrations|manga)$/))
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
  } else if ((match = pathname.match(/\/bookmark_new_illust(_r18)?\.php$/))) {
    const isR18 = !!match[1];

    api = "/ajax/follow_latest/illust";
    if (isR18) {
      type = IllustSortType.BOOKMARK_NEW;
      defaultSearchParams = "mode=r18&lang=zh";
    } else {
      type = IllustSortType.BOOKMARK_NEW_R18;
      defaultSearchParams = "mode=all&lang=zh";
    }
  } else if ((match = pathname.match(/\/users\/(\d+)\/bookmarks\/artworks$/))) {
    const userId = match[1];

    type = IllustSortType.USER_BOOKMARK;
    api = `/ajax/user/${userId}/illusts/bookmarks`;
    defaultSearchParams = `tag=&offset=0&limit=${USER_TYPE_ARTWORKS_PER_PAGE}&rest=show&lang=zh`;
  } else if (
    (match = pathname.match(/\/users\/(\d+)\/(artworks|illustrations|manga)$/))
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
  } else if (
    [IllustSortType.BOOKMARK_NEW, IllustSortType.BOOKMARK_NEW_R18].includes(
      type
    )
  ) {
    return (
      (
        response as PixivStandardResponse<{
          thumbnails: { illust: Illustration[] };
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
          works: Record<string, Illustration>;
        }>
      ).body.works
    );
  }

  return [];
}

/** 从 Session Storage 或接口获取指定用户的作品列表 */
async function getUserIllustrationsWithCache(
  userId: string,
  { onRequesting }: { onRequesting?: () => void } = {}
) {
  let userIllustrations: Awaited<ReturnType<typeof getUserIllustrations>> = {
    illusts: [],
    manga: [],
    artworks: [],
  };
  const userIllustrationsCacheKey = `${USER_ARTWORKS_CACHE_PREFIX}${userId}`;
  try {
    const userIllustrationsCacheString = sessionStorage.getItem(
      userIllustrationsCacheKey
    );
    if (!userIllustrationsCacheString)
      throw new Error("Illustrations cache not existed.");

    userIllustrations = JSON.parse(userIllustrationsCacheString);
  } catch (error) {
    iLog.i(
      `Illustrations of current user is not available in session storage, re-getting...`,
      error
    );
    onRequesting?.();

    userIllustrations = await getUserIllustrations(userId);
    sessionStorage.setItem(
      userIllustrationsCacheKey,
      JSON.stringify(userIllustrations)
    );
  }
  return userIllustrations;
}

async function getIllustrationDetailsWithCache(id: string) {
  let illustDetails: IllustrationDetails =
    await getCachedIllustrationDetails(id);

  if (illustDetails) {
    iLog.d(`Use cached details for illustration ${id}`, illustDetails);
  } else {
    const requestUrl = `/touch/ajax/illust/details?illust_id=${id}`;
    const getIllustDetailsRes = await requestWithRetry({
      url: requestUrl,
      onRetry: (response, retryTimes) => {
        iLog.w(
          `Get illustration details through \`${requestUrl}\` failed:`,
          response,
          `${retryTimes} times retrying...`
        );
      },
    });
    illustDetails = (
      getIllustDetailsRes.response as PixivStandardResponse<{
        illust_details: IllustrationDetails;
      }>
    ).body.illust_details;
  }

  return illustDetails;
}
