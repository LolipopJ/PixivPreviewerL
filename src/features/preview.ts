import {
  PAGE_LOADING_OVERLAY_DELAY_MS,
  PREVIEW_CACHE_MAX_SIZE,
  PREVIEW_DETAILS_MAX_STALE_TIME,
  PREVIEW_IMAGE_CACHE_MAX_SIZE,
  PREVIEW_PRELOAD_NUM,
  PREVIEW_STYLE_ID,
  PREVIEW_WRAPPER_BORDER_RADIUS,
  PREVIEW_WRAPPER_BORDER_WIDTH,
  PREVIEW_WRAPPER_DISTANCE_TO_MOUSE,
} from "../constants";
import {
  cacheIllustPages,
  cacheUgoiraFrames,
  getCachedIllustPages,
  getCachedUgoiraFrames,
  type UgoiraCachedFrame,
} from "../databases";
import { IllustType } from "../enums";
import downloadIcon from "../icons/download.svg";
import loadingIcon from "../icons/loading.svg";
import pageIcon from "../icons/page.svg";
import {
  downloadIllust,
  getIllustPagesRequestUrl,
  type GetIllustPagesResponse,
  getIllustrationDetailsWithCache,
  getUgoiraMetadataRequestUrl,
  type GetUgoiraMetaResponse,
  type GetUgoiraMetaResponseData,
} from "../services";
import type { GlobalSettings, IllustrationDetails } from "../types";
import debounce from "../utils/debounce";
import { injectStyle } from "../utils/dom";
import { stopEventPropagation } from "../utils/event";
import {
  checkIsAiAssisted,
  checkIsAiGenerated,
  checkIsR18,
  checkIsR18G,
  checkIsUgoiraUsingTags,
  getDownloadDirectory,
} from "../utils/illustration";
import { iLog } from "../utils/logger";
import mouseMonitor from "../utils/mouse-monitor";
import ZipImagePlayer, {
  type ZipImagePlayerOptions,
} from "../utils/ugoira-player";
import { createLRUCache, sanitizeIllustFilename } from "../utils/utils";

const ONE_HANDED_MODE_HOLD_MS = 500;

/**
 * 已解码预览图片的 LRU 缓存。同一个作品反复悬停时复用最近解码的位图，
 * 无需等待浏览器重新解码。数量上限刻意保守：原图预览单张解码后可达数 MB，
 * 超出上限的记录交给浏览器自身的图片缓存。
 */
const decodedPreviewImages = createLRUCache<HTMLImageElement>(
  PREVIEW_IMAGE_CACHE_MAX_SIZE
);

const getDecodedImageCacheKey = (illustId: string, page: number) =>
  `${illustId}_p${page}`;

/** 创建带旋转动画的 loading 图标，预览窗口的加载状态共用 */
const createLoadingSpinner = () =>
  $(loadingIcon).css({
    padding: "12px",
    animation: "pp-spin 1s linear infinite",
  });

let isInitialized = false;
export const loadIllustPreview = (
  options: Pick<
    GlobalSettings,
    "previewDelay" | "enableAnimePreview" | "linkBlank"
  >
) => {
  if (isInitialized) return;

  const { previewDelay, enableAnimePreview, linkBlank } = options;
  const mouseHoverDebounceWait = previewDelay / 5;
  const mouseHoverPreviewWait = previewDelay - mouseHoverDebounceWait;

  /**
   * 获取作品的元数据信息
   * @param target 查找的 JQuery 对象
   * @returns 作品的元数据
   */
  const getIllustMetadata = (target: JQuery<HTMLElement>) => {
    const imgLink = target.closest("a");
    if (!imgLink.length) return null;

    const illustHref = imgLink.attr("href");
    const illustHrefMatch = illustHref?.match(/\/artworks\/(\d+)(#(\d+))?/);
    if (!illustHrefMatch) {
      // iLog.w("当前链接非作品链接，或当前作品不支持预览，跳过");
      return null;
    }
    const illustId = illustHrefMatch[1];
    // 页码锚点异常时（例如 0 或负数），回退到第一页，避免数组越界
    // 无锚点时保持 undefined，交由预览组件沿用该作品上次预览的页码
    const previewPage = illustHrefMatch[3]
      ? Math.max(1, Number(illustHrefMatch[3]))
      : undefined;

    const ugoiraSvg = imgLink.children("div:first").find("svg:first");
    const playIcon = imgLink
      .children("div:first")
      .find('pixiv-icon[name="24/Play"]');
    const illustType =
      ugoiraSvg.length || playIcon.length || imgLink.hasClass("ugoku-illust")
        ? IllustType.UGOIRA
        : // 合并漫画类型作品 IllustType.MANGA 为 IllustType.ILLUST 统一处理
          IllustType.ILLUST;

    return {
      /** 作品 ID */
      illustId,
      /** 作品页码 */
      previewPage,
      /** 作品类型 */
      illustType,
      /** 作品链接 DOM */
      illustLinkDom: imgLink,
    };
  };

  /**
   * 获取作品访问链接并在前端显示预览
   * @param target 作品的元数据
   */
  const previewedIllust = new PreviewedIllust();
  const previewIllust = (() => {
    let currentHoveredIllustId = "";
    // 初始值为 null，避免调用 `$.ajax()` 时因缺省 url 而意外请求当前页面
    let getIllustPagesRequest: JQuery.jqXHR | null = null;

    const getIllustPagesCache = createLRUCache<{
      regularUrls: string[];
      originalUrls: string[];
    }>(PREVIEW_CACHE_MAX_SIZE);
    const getUgoiraMetadataCache = createLRUCache<GetUgoiraMetaResponseData>(
      PREVIEW_CACHE_MAX_SIZE
    );

    /** 获取动图元数据并展示动图预览（命中缓存时直接展示） */
    const previewAsUgoira = ({
      target,
      illustId,
      illustDetailsPromise,
    }: {
      target: JQuery<HTMLElement>;
      illustId: string;
      illustDetailsPromise: Promise<IllustrationDetails | null>;
    }) => {
      // 元数据就绪后立即打开动图预览窗口，作品详情（标签、收藏数）稍后补渲染，
      // 否则详情请求的耗时会让命中缓存的动图也要等网络
      const showUgoira = (
        metadata: GetUgoiraMetaResponseData,
        placeholderShown = false
      ) => {
        // 占位窗口已被鼠标移出关闭时不再重新打开
        if (placeholderShown && !previewedIllust.isActiveIllust(illustId))
          return;

        previewedIllust.setUgoira({
          illustId,
          illustElement: target,
          illustrationDetails: null,
          ...metadata,
        });

        void illustDetailsPromise.then((illustrationDetails) => {
          if (currentHoveredIllustId !== illustId) return;
          previewedIllust.updateIllustrationDetails(illustrationDetails);
        });
      };

      const ugoiraMetadataCached = getUgoiraMetadataCache.get(illustId);
      if (ugoiraMetadataCached) {
        // 命中缓存，直接使用缓存中的元数据
        showUgoira(ugoiraMetadataCached);
        return;
      }

      // 元数据请求期间先开窗，避免窗口等到数据就绪才出现
      previewedIllust.showLoading({ illustId, illustElement: target });

      // 根据动图的 ID 获取动图的元数据
      getIllustPagesRequest = $.ajax(getUgoiraMetadataRequestUrl(illustId), {
        method: "GET",
        success: (data: GetUgoiraMetaResponse) => {
          if (data.error) {
            iLog.e(
              `An error occurred while requesting metadata of ugoira ${illustId}: ${data.message}`
            );
            previewedIllust.dismissLoading(illustId);
            return;
          }

          getUgoiraMetadataCache.set(illustId, data.body);
          if (currentHoveredIllustId !== illustId) return;
          showUgoira(data.body, true);
        },
        error: (jqXHR, textStatus) => {
          // 切换悬浮目标时会主动 abort 上一个请求，属于预期行为，无需记录为错误
          if (textStatus === "abort") return;
          previewedIllust.dismissLoading(illustId);
          iLog.e(
            `An error occurred while requesting metadata of ugoira ${illustId}: ${jqXHR.responseText}`
          );
        },
      });
    };

    /** 获取图片分页信息并展示插画预览；若作品详情标签显示实际为动图，则切换为动图预览 */
    const previewAsIllust = ({
      target,
      illustId,
      previewPage,
      regularUrls,
      originalUrls,
      illustDetailsPromise,
      placeholderShown = false,
    }: {
      target: JQuery<HTMLElement>;
      illustId: string;
      previewPage?: number;
      regularUrls: string[];
      originalUrls: string[];
      illustDetailsPromise: Promise<IllustrationDetails | null>;
      placeholderShown?: boolean;
    }) => {
      // 占位窗口已被鼠标移出关闭时不再重新打开
      if (placeholderShown && !previewedIllust.isActiveIllust(illustId)) return;

      // 分页信息已就绪，立即打开预览窗口；作品详情稍后补渲染。
      // 详情中的标签可能表明该作品实际是动图，此时再切换为动图预览。
      previewedIllust.setImage({
        illustId,
        illustElement: target,
        previewPage,
        regularUrls,
        originalUrls,
        illustrationDetails: null,
      });

      void illustDetailsPromise.then((illustrationDetails) => {
        if (currentHoveredIllustId !== illustId) return;
        // 鼠标已移开、窗口已关闭时不再重新打开（例如标签判定为动图后切到动图预览）
        if (!previewedIllust.isActiveIllust(illustId)) return;

        if (
          enableAnimePreview &&
          illustrationDetails &&
          checkIsUgoiraUsingTags(illustrationDetails.tags)
        ) {
          // 作品详情标签显示该作品实际为动图，切换为动图预览
          previewAsUgoira({
            target,
            illustId,
            illustDetailsPromise: Promise.resolve(illustrationDetails),
          });
          return;
        }

        previewedIllust.updateIllustrationDetails(illustrationDetails);
      });
    };

    return ({
      target,
      illustId,
      previewPage,
      illustType,
    }: {
      target: JQuery<HTMLElement>;
      illustId: string;
      previewPage?: number;
      illustType: IllustType;
    }) => {
      // 停止正在处理的获取元数据请求
      getIllustPagesRequest?.abort();

      // 更新当前鼠标悬浮作品 ID，避免异步任务结束后显示之前悬浮的作品
      currentHoveredIllustId = illustId;

      // 当前鼠标悬浮作品为动图，但是用户禁用了动图预览，跳过
      if (illustType === IllustType.UGOIRA && !enableAnimePreview) {
        iLog.i("动图预览已禁用，跳过");
        return;
      }

      // 与获取图片/动图信息同时发起，避免因串行等待造成的延迟
      // 预览对收藏数的实时性要求较低，容忍更久的缓存以减少请求
      const illustDetailsPromise = getIllustrationDetailsWithCache(
        illustId,
        false,
        {
          maxStale: PREVIEW_DETAILS_MAX_STALE_TIME,
        }
      ).catch((error) => {
        iLog.e(
          `An error occurred while fetching illustration details of ${illustId}: ${error}`
        );
        return null;
      });

      if ([IllustType.ILLUST, IllustType.MANGA].includes(illustType)) {
        const illustPagesCached = getIllustPagesCache.get(illustId);
        if (illustPagesCached) {
          // 命中缓存，直接使用缓存中的元数据
          previewAsIllust({
            target,
            illustId,
            previewPage,
            illustDetailsPromise,
            ...illustPagesCached,
          });
          return;
        }

        // 内存缓存未命中：先把预览窗口打开，再查持久化缓存并发起请求，
        // 避免窗口要等到数据全部就绪才出现
        previewedIllust.showLoading({ illustId, illustElement: target });

        // 查询 IndexedDB 中的持久化缓存
        void getCachedIllustPages(illustId).then((persistedPages) => {
          if (currentHoveredIllustId !== illustId) return;
          if (persistedPages) {
            getIllustPagesCache.set(illustId, persistedPages);
            previewAsIllust({
              target,
              illustId,
              previewPage,
              illustDetailsPromise,
              placeholderShown: true,
              ...persistedPages,
            });
            return;
          }

          // 根据作品的 ID 获取作品的页数和访问链接
          // 例如：`125424620` -> `https://i.pximg.net/img-master/img/2024/12/22/19/13/41/125424620_p0_master1200.jpg`
          getIllustPagesRequest = $.ajax(getIllustPagesRequestUrl(illustId), {
            method: "GET",
            success: (data: GetIllustPagesResponse) => {
              if (data.error) {
                iLog.e(
                  `An error occurred while requesting preview urls of illust ${illustId}: ${data.message}`
                );
                previewedIllust.dismissLoading(illustId);
                return;
              }

              const urls = data.body.map((item) => item.urls);
              const regularUrls = urls.map((url) => url.regular);
              const originalUrls = urls.map((url) => url.original);

              // 设置内存缓存与持久化缓存
              getIllustPagesCache.set(illustId, {
                regularUrls,
                originalUrls,
              });
              void cacheIllustPages(illustId, { regularUrls, originalUrls });

              // 当前鼠标悬浮的作品发生了改变，结束处理
              if (currentHoveredIllustId !== illustId) return;

              previewAsIllust({
                target,
                illustId,
                previewPage,
                regularUrls,
                originalUrls,
                illustDetailsPromise,
                placeholderShown: true,
              });
            },
            error: (jqXHR, textStatus) => {
              // 切换悬浮目标时会主动 abort 上一个请求，属于预期行为，无需记录为错误
              if (textStatus === "abort") return;
              previewedIllust.dismissLoading(illustId);
              iLog.e(
                `An error occurred while requesting preview urls of illust ${illustId}: ${jqXHR.responseText || textStatus}`
              );
            },
          });
        });
      } else if (illustType === IllustType.UGOIRA) {
        previewAsUgoira({ target, illustId, illustDetailsPromise });
      } else {
        iLog.e("Unknown illust type.");
        return;
      }
    };
  })();

  //#region 绑定鼠标悬浮图片监听事件
  const onMouseOverIllust = (target: JQuery<HTMLElement>) => {
    if (previewedIllust.oneHandedMode) return;

    const { illustId, previewPage, illustType, illustLinkDom } =
      getIllustMetadata(target) || {};
    if (illustId === undefined || illustType === undefined) {
      // 获取当前鼠标悬浮元素的元数据失败，跳过
      return;
    }

    if (linkBlank && illustLinkDom) {
      // 设置在新标签打开作品详情页
      illustLinkDom.attr({ target: "_blank", rel: "external" });
      illustLinkDom.off("click", stopEventPropagation);
      illustLinkDom.on("click", stopEventPropagation);
    }

    const previewIllustTimeout = setTimeout(() => {
      if (previewedIllust.oneHandedMode) return;
      previewIllust({ target, illustId, previewPage, illustType });
    }, mouseHoverPreviewWait);

    const onMouseMove = (mouseMoveEvent: JQuery.MouseMoveEvent) => {
      if (mouseMoveEvent.ctrlKey || mouseMoveEvent.metaKey) {
        // 鼠标悬浮在作品上时若按住了 ctrl 或 meta 键，跳过显示预览
        clearTimeout(previewIllustTimeout);
        target.off("mousemove", onMouseMove);
      }
    };
    target.on("mousemove", onMouseMove);

    const onMouseOut = () => {
      // 鼠标移出作品，跳过显示预览
      clearTimeout(previewIllustTimeout);
      target.off("mouseout", onMouseOut);
    };
    target.on("mouseout", onMouseOut);
  };

  const onMouseMoveDocument = (() => {
    const debouncedOnMouseOverIllust = debounce(
      onMouseOverIllust,
      mouseHoverDebounceWait
    );
    let prevTarget: EventTarget | null = null;

    return (mouseMoveEvent: JQuery.MouseMoveEvent) => {
      if (
        previewedIllust.oneHandedMode ||
        mouseMoveEvent.ctrlKey ||
        mouseMoveEvent.metaKey
      ) {
        // 按住 Ctrl 或 Meta 键时，跳过
        return;
      }

      if (mouseMoveEvent.target === prevTarget) {
        // 鼠标在同一个 DOM 元素上移动时，跳过
        return;
      }
      prevTarget = mouseMoveEvent.target;

      const currentTarget = $(
        mouseMoveEvent.target
      ) as unknown as JQuery<HTMLElement>;
      debouncedOnMouseOverIllust(currentTarget);
    };
  })();

  // 监听 MouseMove 事件而非 MouseOver 事件，以避免事件中的 ctrlKey 等值出现预期外的 false
  $(document).on("mousemove", onMouseMoveDocument);
  //#endregion

  //#region 取消预期外节点的鼠标事件
  (function inactiveUnexpectedDoms() {
    // 添加旋转动画样式
    // https://www.pixiv.net/ranking.php 排行榜页面加载后续作品时，
    // 会插入一个影响鼠标悬浮判定的空节点，在此处将其设置为不触发鼠标事件
    // https://www.pixiv.net/ranking.php?content=ugoira 排行榜动图页面
    // 会在动图封面上插入一个 svg 播放图标，在此处将其设置为不触发鼠标事件
    injectStyle(
      `
@keyframes pp-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes pp-one-handed-progress {
  to { stroke-dashoffset: 0; }
}
._layout-thumbnail img + div {
  pointer-events: none;
}
pixiv-icon[name="24/Play"] {
  pointer-events: none;
}`,
      PREVIEW_STYLE_ID
    );
  })();
  //#endregion

  isInitialized = true;
};

const DETAIL_BADGE_CSS = {
  height: "20px",
  "border-radius": "12px",
  color: "rgb(245, 245, 245)",
  background: "rgba(0, 0, 0, 0.32)",
  "font-size": "12px",
  "line-height": "1",
  "font-weight": "bold",
  padding: "3px 6px",
  display: "flex",
  "align-items": "center",
  gap: "4px",
} as const;

/** 预览容器顶部工具栏中可交互徽章（页码 / 下载按钮）的通用样式 */
const INTERACTIVE_BADGE_CSS = {
  ...DETAIL_BADGE_CSS,
  cursor: "pointer",
} as const;

class PreviewedIllust {
  oneHandedMode = false;

  #longPressTimeout: ReturnType<typeof setTimeout> | null = null;

  #longPressProgress: JQuery<HTMLElement> = $();

  #suppressLongPressClick = false;

  /** 当前正在预览的作品的 ID */
  illustId = "";
  /** 当前正在预览的作品的详细信息 */
  illustDetails: IllustrationDetails | null = null;
  /** 当前正在预览的作品 DOM 元素 */
  illustElement: JQuery<HTMLElement> = $();
  /** 当前预览的作品是否加载完毕 */
  illustLoaded = false;

  /** 图片的链接 */
  regularUrls: string[] = [];
  /** 图片的原图链接 */
  originalUrls: string[] = [];
  /** 当前预览图片的页数 */
  currentPage: number = 1;
  /** 当前预览图片的总页数 */
  pageCount: number = 1;

  /** 预览图片或动图容器 DOM */
  previewWrapperElement: JQuery<HTMLElement> = $();
  /** 预览容器顶部栏 DOM */
  previewWrapperHeader: JQuery<HTMLElement> = $();
  /** 当前预览作品的元数据 */
  illustMeta: JQuery<HTMLElement> = $();
  /** 当前预览的是第几张图片标记 DOM */
  pageCountElement: JQuery<HTMLElement> = $();
  pageCountText: JQuery<HTMLElement> = $();
  /** 下载原图按钮 DOM */
  downloadOriginalElement: JQuery<HTMLElement> = $();
  /** 预览图片或动图加载状态 DOM */
  previewLoadingElement: JQuery<HTMLElement> = $();
  /** 翻页加载新图片时覆盖在图片上方的毛玻璃遮罩 DOM */
  pageLoadingOverlayElement: JQuery<HTMLElement> = $();
  /** 当前预览的图片或动图 DOM */
  previewImageElement: JQuery<HTMLElement> = $();

  /** 当前页面中各多图作品上次预览的页码，重置预览组件时保留 */
  #previewPages = new Map<string, number>();
  /** 下载按钮重置定时器 */
  #downloadResetTimeout: ReturnType<typeof setTimeout> | null = null;
  /** 翻页加载遮罩的延迟显示定时器 */
  #pageLoadingOverlayTimeout: ReturnType<typeof setTimeout> | null = null;
  /** 当前页图片是否仍在加载（用于判断遮罩是否需要常驻） */
  #isPageImageLoading = false;
  /** 保存的鼠标位置 */
  #prevMousePos: [number, number] = [0, 0];
  /** 当前预览图片的实际尺寸 */
  #currentIllustSize: [number, number] = [0, 0];
  /** 当前预览的动图播放器 */
  #currentUgoiraPlayer: ZipImagePlayer | null = null;
  /** 预览窗口是否已由 `showLoading` 提前展示、尚未填入内容 */
  #isPlaceholder = false;
  /** 预览窗口的鼠标事件是否已绑定，避免重复绑定 */
  #mouseEventsBound = false;

  constructor() {
    this.reset();
  }

  /** 初始化预览组件 */
  reset() {
    this.oneHandedMode = false;
    this.#suppressLongPressClick = false;
    this.cancelLongPress();

    this.illustId = "";
    this.illustDetails = null;
    this.illustElement = $();
    this.illustLoaded = false;
    this.#isPlaceholder = false;

    this.regularUrls = [];
    this.originalUrls = [];
    this.currentPage = 1;
    this.pageCount = 1;

    // 销毁预览容器节点，下次显示预览时由 `#ensureWrapperDom` 重建
    this.#destroyWrapperDom();

    // 预加载的图片由 `decodedPreviewImages` 统一持有，这里只需解除引用
    this.#prevMousePos = [0, 0];
    this.#currentIllustSize = [0, 0];
    this.#currentUgoiraPlayer?.stop();
    // 必须置空：`loadUgoiraPlayer` 在等待缓存后才创建播放器，
    // 残留的旧实例会让重建逻辑误判为「已创建」，也会阻断去重
    this.#currentUgoiraPlayer = null;
    if (this.#downloadResetTimeout !== null) {
      clearTimeout(this.#downloadResetTimeout);
      this.#downloadResetTimeout = null;
    }
    this.#clearPageLoadingOverlayTimeout();
    this.#isPageImageLoading = false;

    // 取消所有绑定的监听事件
    this.unbindPreviewImageEvents();
    this.unbindUgoiraPreviewEvents();
  }

  /** 移除预览容器节点，重置时不立即重建 */
  #destroyWrapperDom() {
    this.previewWrapperElement?.remove();
    this.previewWrapperElement = $();
    this.previewWrapperHeader = $();
    this.illustMeta = $();
    this.pageCountElement = $();
    this.pageCountText = $();
    this.downloadOriginalElement = $();
    this.previewLoadingElement = $();
    this.pageLoadingOverlayElement = $();
    this.previewImageElement = $();
  }

  /**
   * 创建预览容器节点。
   * 延迟到真正需要显示预览时才创建，使初始化不再依赖 `body` 是否已存在。
   */
  #ensureWrapperDom() {
    if (this.previewWrapperElement.length) return;

    this.previewWrapperElement = $(document.createElement("div"))
      .attr({ id: "pp-wrapper" })
      .css({
        position: "fixed",
        "z-index": "999999",
        border: `${PREVIEW_WRAPPER_BORDER_WIDTH}px solid rgb(0, 150, 250)`,
        "border-radius": `${PREVIEW_WRAPPER_BORDER_RADIUS}px`,
        background: "rgba(31, 31, 31, 0.8)",
        "backdrop-filter": "blur(4px)",
        "text-align": "center",
        "pointer-events": "none",
      })
      .hide()
      .appendTo($("body"));
    this.previewWrapperHeader = $(document.createElement("div"))
      .css({
        position: "absolute",
        top: "0px",
        left: "0px",
        right: "0px",
        padding: "5px",
        display: "flex",
        gap: "5px",
        "align-items": "center",
        "z-index": "2",
      })
      .hide()
      .appendTo(this.previewWrapperElement);
    this.illustMeta = $(document.createElement("div"))
      .css({
        display: "flex",
        gap: "5px",
        "align-items": "center",
        "margin-right": "auto",
      })
      .appendTo(this.previewWrapperHeader);
    this.pageCountText = $(document.createElement("span")).text("1/1");
    this.pageCountElement = $(document.createElement("div"))
      .css(INTERACTIVE_BADGE_CSS)
      .append(pageIcon)
      .append(this.pageCountText)
      .hide()
      .appendTo(this.previewWrapperHeader);
    this.downloadOriginalElement = $(document.createElement("a"))
      .css(INTERACTIVE_BADGE_CSS)
      .append(`${downloadIcon}<span>原图</span>`)
      .appendTo(this.previewWrapperHeader);
    this.previewLoadingElement = createLoadingSpinner().appendTo(
      this.previewWrapperElement
    );
    this.previewImageElement = $(new Image())
      .css({
        "border-radius": `${PREVIEW_WRAPPER_BORDER_RADIUS}px`,
      })
      .hide()
      .appendTo(this.previewWrapperElement);
    // 翻页时覆盖在旧图上方的毛玻璃加载遮罩，新图就绪后隐藏
    this.pageLoadingOverlayElement = $(document.createElement("div"))
      .css({
        position: "absolute",
        top: "0px",
        left: "0px",
        right: "0px",
        bottom: "0px",
        "z-index": "1",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "border-radius": `${PREVIEW_WRAPPER_BORDER_RADIUS}px`,
        background: "rgba(31, 31, 31, 0.32)",
        "backdrop-filter": "blur(4px)",
        // 遮罩不拦截鼠标事件，保持原有的点击切换与一键模式交互
        "pointer-events": "none",
      })
      .hide()
      .append(createLoadingSpinner())
      .appendTo(this.previewWrapperElement);
  }

  //#region 预览图片功能
  /**
   * 立即显示预览窗口并停留在加载状态。
   * 缓存未命中时先开窗再发请求，避免窗口要等到数据全部就绪才出现。
   * 若当前窗口已在展示同一个作品，则不做任何处理，避免反复重置打断已显示的内容。
   */
  showLoading({
    illustId,
    illustElement,
  }: {
    illustId: string;
    illustElement: JQuery<HTMLElement>;
  }) {
    // 已在展示同一个作品时不做任何处理，避免打断已显示的内容
    if (this.isActiveIllust(illustId)) return;

    this.reset();
    this.initPreviewWrapper();

    this.illustId = illustId;
    this.illustElement = illustElement;
    this.#isPlaceholder = true;

    // 加载期间同样需要响应鼠标移出与长按，否则窗口无法关闭
    this.bindPreviewMouseEvents();
  }

  /**
   * 指定作品的内容仍停留在加载状态时关闭窗口，避免请求或初始化失败后一直转圈。
   * 已经显示出内容时不做处理，否则会把正常显示中的预览关掉。
   */
  dismissLoading(illustId: string) {
    if (this.illustId === illustId && !this.illustLoaded) {
      this.reset();
    }
  }

  /**
   * 预览窗口当前是否仍在展示（或正在加载）指定作品。
   * 异步回调返回时用它校验，避免鼠标已移开、窗口已关闭后又把窗口重新打开。
   * 以 `illustId` 作为唯一事实：`reset()` 会把它清空。
   */
  isActiveIllust(illustId: string) {
    return this.illustId === illustId;
  }

  /**
   * 准备预览窗口并接管占位状态。
   * 占位窗口仍在展示同一个作品时直接复用其 DOM 节点 —— 重建会让
   * 加载动画的 CSS animation 从头播放，视觉上像是又加载了一次。
   */
  #prepareWrapper(illustId: string) {
    if (this.#isPlaceholder && this.illustId === illustId) {
      this.#isPlaceholder = false;
      return;
    }
    this.reset();
    this.initPreviewWrapper();
  }

  /** 初始化预览容器，优先显示指定页码，其次恢复当前页面中记忆的预览页码 */
  setImage({
    illustId,
    illustElement,
    previewPage,
    regularUrls,
    originalUrls,
    illustrationDetails,
  }: {
    illustId: string;
    illustElement: JQuery<HTMLElement>;
    previewPage?: number;
    regularUrls: string[];
    originalUrls: string[];
    illustrationDetails: IllustrationDetails | null;
  }) {
    this.#prepareWrapper(illustId);

    this.illustId = illustId;
    this.illustDetails = illustrationDetails;
    this.illustElement = illustElement;
    this.regularUrls = regularUrls;
    this.originalUrls = originalUrls;
    this.pageCount = regularUrls.length;
    // 链接带有页码锚点（例如下载记录里的 `_p4`）时以其为准，否则恢复该作品上次预览的页码
    const initialPage = previewPage ?? this.#previewPages.get(illustId) ?? 1;
    this.currentPage =
      initialPage >= 1 && initialPage <= this.pageCount ? initialPage : 1;

    // 从当前页预加载 PREVIEW_PRELOAD_NUM 张图片
    this.preloadImages();

    // 绑定图片预览监听事件
    this.bindPreviewImageEvents();

    // 初始化图片显示
    this.updatePreviewImage();

    // 展示作品详情
    this.renderIllustrationDetails(illustrationDetails);
  }

  bindPreviewImageEvents() {
    // 监听图片加载完毕事件
    this.previewImageElement.on("load", this.onImageLoad);
    // 监听图片加载失败事件，避免翻页遮罩一直停留
    this.previewImageElement.on("error", this.onImageError);
    // 监听鼠标点击切换图片事件
    this.previewImageElement.on("click", this.onPreviewImageMouseClick);
    // 监听点击下载按钮事件
    this.downloadOriginalElement.on("click", this.onDownloadImage);

    // 监听鼠标滚轮切换图片事件
    $(document).on("wheel", this.onPreviewImageMouseWheel);
    // 监听方向键切换图片事件
    $(document).on("keydown", this.onPreviewImageKeyDown);
    this.bindPreviewMouseEvents();
  }

  unbindPreviewImageEvents() {
    this.previewImageElement.off();
    this.downloadOriginalElement.off();

    $(document).off("wheel", this.onPreviewImageMouseWheel);
    $(document).off("keydown", this.onPreviewImageKeyDown);
    this.unbindPreviewMouseEvents();
  }

  /** 显示 pageIndex 指向的图片 */
  updatePreviewImage(page: number = this.currentPage) {
    const currentImageUrl = this.regularUrls[page - 1];
    const isSameImage =
      this.previewImageElement.attr("src") === currentImageUrl;

    // 已经有图片在显示时，翻页期间先盖上毛玻璃遮罩，
    // 避免新图尚未就绪时用户看到的仍是上一页的画面。
    // 单页作品重复设同一地址不会触发 load，不能进入加载态；
    // 预加载已解码完成的图片同样跳过加载态，避免多余的闪烁
    if (this.illustLoaded && !isSameImage && !this.#isPageImageDecoded(page)) {
      this.#isPageImageLoading = true;
      this.#schedulePageLoadingOverlay();
    } else {
      // 目标页无需等待时立即收起上一页残留的遮罩
      this.#finishPageLoading();
    }

    this.previewImageElement.attr("src", currentImageUrl);

    this.pageCountText.text(`${page}/${this.pageCount}`);
    if (this.pageCount > 1) {
      this.#previewPages.set(this.illustId, page);
    }
  }

  /** 延迟显示翻页加载遮罩，图片在延迟内就绪时不显示，避免闪烁 */
  #schedulePageLoadingOverlay() {
    // 每次切换到未就绪的页面都重新计时，否则上一个页面遗留的定时器
    // 会让新页面的遮罩提前显示（遮罩已显示时重复 show 无副作用，不会闪烁）
    this.#clearPageLoadingOverlayTimeout();
    this.#pageLoadingOverlayTimeout = setTimeout(() => {
      this.#pageLoadingOverlayTimeout = null;
      if (!this.#isPageImageLoading) return;
      this.pageLoadingOverlayElement.show();
    }, PAGE_LOADING_OVERLAY_DELAY_MS);
  }

  #clearPageLoadingOverlayTimeout() {
    if (this.#pageLoadingOverlayTimeout !== null) {
      clearTimeout(this.#pageLoadingOverlayTimeout);
      this.#pageLoadingOverlayTimeout = null;
    }
  }

  /** 当前页图片已就绪（或加载失败）时收起翻页加载遮罩 */
  #finishPageLoading() {
    this.#isPageImageLoading = false;
    this.#clearPageLoadingOverlayTimeout();
    this.pageLoadingOverlayElement.hide();
  }

  onImageLoad = () => {
    this.#finishPageLoading();

    this.illustLoaded = true;
    this.previewLoadingElement.hide();
    this.previewImageElement.show();

    this.previewWrapperHeader.show();
    if (this.pageCount > 1) {
      this.pageCountElement.show();
    }

    // 移除图片调整后的宽高，获取图片的实际宽高
    this.previewImageElement.css({
      width: "",
      height: "",
    });
    this.#currentIllustSize = [
      this.previewImageElement.width() ?? 0,
      this.previewImageElement.height() ?? 0,
    ];

    // 滚动切换图片时，使用之前的鼠标位置
    this.adjustPreviewWrapper({
      baseOnMousePos: false,
    });
  };

  onImageError = () => {
    // 加载失败时同样要收起遮罩，否则会一直停在加载动画上
    this.#finishPageLoading();
  };

  nextPage() {
    if (this.currentPage < this.pageCount) {
      this.currentPage += 1;
    } else {
      this.currentPage = 1;
    }
    this.resetDownloadButton();
    this.updatePreviewImage();

    this.preloadImages();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    } else {
      this.currentPage = this.pageCount;
    }
    this.resetDownloadButton();
    this.updatePreviewImage();
  }

  resetDownloadButton() {
    if (this.#downloadResetTimeout !== null) {
      clearTimeout(this.#downloadResetTimeout);
      this.#downloadResetTimeout = null;
    }
    const textSpan = this.downloadOriginalElement.find("span");
    textSpan.text("原图");
    this.downloadOriginalElement.css({
      pointerEvents: "",
      backgroundImage: "",
      backgroundSize: "",
      backgroundRepeat: "",
    });
  }

  /** 指定页的图片是否已经预加载解码完成，可直接显示而无需等待 */
  #isPageImageDecoded(page: number) {
    const cachedImage = decodedPreviewImages.get(
      getDecodedImageCacheKey(this.illustId, page)
    );
    return !!cachedImage?.complete && cachedImage.naturalWidth > 0;
  }

  preloadImages(
    from: number = this.currentPage - 1,
    to: number = this.currentPage - 1 + PREVIEW_PRELOAD_NUM
  ) {
    for (let i = from; i < to && i < this.regularUrls.length; i += 1) {
      const cacheKey = getDecodedImageCacheKey(this.illustId, i + 1);
      if (decodedPreviewImages.get(cacheKey)) continue;

      const preloadImage = new Image();
      preloadImage.src = this.regularUrls[i];
      decodedPreviewImages.set(cacheKey, preloadImage);
    }
  }

  onPreviewImageMouseClick = () => {
    this.nextPage();
  };

  onPreviewImageMouseWheel = (mouseWheelEvent: JQuery.TriggeredEvent) => {
    if (
      this.oneHandedMode ||
      mouseWheelEvent.ctrlKey ||
      mouseWheelEvent.metaKey
    ) {
      mouseWheelEvent.preventDefault();

      if ((mouseWheelEvent.originalEvent as WheelEvent).deltaY > 0) {
        // 滑轮向下滚动，切换到下一张图片预览
        this.nextPage();
      } else {
        // 滑轮向上滚动，切换到上一张图片预览
        this.prevPage();
      }
    }
  };

  onPreviewImageKeyDown = (keyDownEvent: JQuery.KeyDownEvent) => {
    if (this.oneHandedMode || keyDownEvent.ctrlKey || keyDownEvent.metaKey) {
      keyDownEvent.preventDefault();

      switch (keyDownEvent.key) {
        case "ArrowUp":
        case "ArrowRight":
          this.nextPage();
          break;
        case "ArrowDown":
        case "ArrowLeft":
          this.prevPage();
          break;
      }
    }
  };

  onDownloadImage = (onClickEvent: JQuery.ClickEvent) => {
    onClickEvent.preventDefault();

    const downloadPage = this.currentPage;
    const currentImageOriginalUrl = this.originalUrls[downloadPage - 1];
    const currentImageFilename = sanitizeIllustFilename(
      currentImageOriginalUrl.split("/").pop() || "illust.jpg"
    );

    const textSpan = this.downloadOriginalElement.find("span");
    const originalText = textSpan.text();
    const downloadElement = this.downloadOriginalElement;
    const onDownloadFailed = () => {
      if (this.downloadOriginalElement !== downloadElement) return;
      textSpan.text(originalText);
      downloadElement.css({
        backgroundImage: "",
        backgroundSize: "",
        pointerEvents: "",
      });
    };

    this.downloadOriginalElement.css({
      pointerEvents: "none",
      backgroundImage:
        "linear-gradient(to right, rgba(0,150,250,0.28), rgba(0,150,250,0.28))",
      backgroundSize: "0% 100%",
      backgroundRepeat: "no-repeat",
    });
    textSpan.text("下载中");

    downloadIllust({
      url: currentImageOriginalUrl,
      filename: currentImageFilename,
      directory: getDownloadDirectory(this.illustDetails?.tags ?? []),
      options: {
        onerror: onDownloadFailed,
        ontimeout: onDownloadFailed,
        onabort: onDownloadFailed,
        onprogress: (ev) => {
          if (this.currentPage !== downloadPage) return;

          try {
            const loaded = ev.loaded ?? 0;
            const total = ev.total ?? 0;
            let percent = 0;
            if (total && total > 0) {
              percent = Math.min(100, Math.round((loaded / total) * 100));
            }
            this.downloadOriginalElement.css({
              backgroundSize: `${percent}% 100%`,
            });
          } catch (e) {
            console.error(
              `An error occurred in download progress callback: ${e}`
            );
          }
        },
        onload: () => {
          if (this.currentPage !== downloadPage) return;

          textSpan.text("已下载");
          this.downloadOriginalElement.css({
            backgroundImage: "",
            backgroundSize: "",
            pointerEvents: "",
          });

          this.#downloadResetTimeout = setTimeout(() => {
            textSpan.text(originalText);
            this.#downloadResetTimeout = null;
          }, 3000);
        },
      },
    });
  };
  //#endregion

  //#region 预览动图功能
  setUgoira({
    illustId,
    illustElement,
    src,
    // originalSrc,
    mime_type,
    frames,
    illustrationDetails,
  }: GetUgoiraMetaResponseData & {
    illustId: string;
    illustElement: JQuery<HTMLElement>;
    illustrationDetails: IllustrationDetails | null;
  }) {
    this.#prepareWrapper(illustId);

    this.illustId = illustId;
    this.illustDetails = illustrationDetails;
    this.illustElement = illustElement;

    // 鼠标悬浮在动图中间播放图标上，不关闭预览窗口
    illustElement.siblings("svg").css({ "pointer-events": "none" });

    // 播放器需要等待帧缓存读取，期间先绑定鼠标事件，保证窗口可被关闭
    this.bindPreviewMouseEvents();

    void this.loadUgoiraPlayer({ illustId, src, mime_type, frames });

    this.renderIllustrationDetails(illustrationDetails);
  }

  /**
   * 先查询帧缓存，再决定使用缓存帧还是解包 zip。
   * 解包到全部帧时把帧写入缓存，供下次悬停时直接播放。
   */
  async loadUgoiraPlayer({
    illustId,
    src,
    mime_type,
    frames,
  }: {
    illustId: string;
    src: string;
    mime_type: string;
    frames: { file: string; delay: number }[];
  }) {
    const cached = await getCachedUgoiraFrames(illustId).catch(() => null);
    // 等待缓存期间用户可能已切换到其他作品；同一个作品被重复触发时
    // （鼠标在缩略图的子元素间移动）只允许第一个调用创建播放器，
    // 否则旧播放器会被直接覆盖而不 stop()，继续下载 zip 并触发异常
    if (this.illustId !== illustId || this.#currentUgoiraPlayer) return;

    const decodedFrames: UgoiraCachedFrame[] = [];
    let decodedFrameCount = 0;
    const hasCachedFrames = cached?.frames.length === frames.length;

    try {
      this.#currentUgoiraPlayer = this.createUgoiraPlayer({
        source: src,
        metadata: { mime_type, frames },
        cachedFrames: hasCachedFrames
          ? cached.frames.map((frame) => frame.blob)
          : null,
        onFrameDecoded: ({ index, file, delay, blob }) => {
          decodedFrames[index] = { file, delay, blob };
          decodedFrameCount += 1;
          if (decodedFrameCount < frames.length) return;
          // 全部帧解包完毕，写入缓存供下次悬停时直接播放
          void cacheUgoiraFrames(illustId, decodedFrames);
        },
      });
    } catch (error) {
      // 播放器构造失败（例如无法获得 canvas 上下文）时关闭占位窗口，
      // 否则预览会一直停在加载动画上
      iLog.e(`Failed to create ugoira player of illust ${illustId}:`, error);
      this.dismissLoading(illustId);
      return;
    }
    this.bindUgoiraPreviewEvents();
  }

  createUgoiraPlayer(
    options: Pick<
      ZipImagePlayerOptions,
      "source" | "metadata" | "cachedFrames" | "onFrameDecoded"
    >
  ) {
    const canvas = document.createElement("canvas");
    const p = new ZipImagePlayer({
      canvas,
      chunkSize: 300000,
      loop: true,
      autoStart: true,
      debug: false,
      ...options,
    });
    return p;
  }

  bindUgoiraPreviewEvents() {
    this.#currentUgoiraPlayer?.on("frameLoaded", this.onUgoiraFrameLoaded);
    this.bindPreviewMouseEvents();
  }

  unbindUgoiraPreviewEvents() {
    this.#currentUgoiraPlayer?.off("frameLoaded");
    this.unbindPreviewMouseEvents();
  }

  onUgoiraFrameLoaded = (frame: number) => {
    if (frame !== 0 || !this.#currentUgoiraPlayer) {
      return;
    }

    this.illustLoaded = true;
    this.previewLoadingElement.hide();
    this.previewWrapperHeader.show();

    const canvas = $(this.#currentUgoiraPlayer.canvas);
    this.previewImageElement.after(canvas);
    this.previewImageElement.remove();
    this.previewImageElement = canvas;

    const frameImages = this.#currentUgoiraPlayer.getLoadedFrameImages();
    const ugoiraOriginWidth = frameImages[0].width;
    const ugoiraOriginHeight = frameImages[0].height;
    this.#currentIllustSize = [ugoiraOriginWidth, ugoiraOriginHeight];
    this.previewImageElement.attr({
      width: ugoiraOriginWidth,
      height: ugoiraOriginHeight,
    });

    // 滚动切换图片时，使用之前的鼠标位置
    this.adjustPreviewWrapper({
      baseOnMousePos: false,
    });
  };
  //#endregion

  //#region 预览组件通用能力
  /**
   * 补渲染作品详情。
   * 预览窗口会在作品详情返回前就打开，因此详情是异步补上的；
   * 期间用户可能已切换到其他作品，需要校验 ID 避免渲染到错误的窗口。
   */
  updateIllustrationDetails(illustrationDetails: IllustrationDetails | null) {
    if (!illustrationDetails || illustrationDetails.id !== this.illustId) {
      return;
    }
    this.illustDetails = illustrationDetails;
    this.renderIllustrationDetails(illustrationDetails);
  }

  /** 展示作品详情信息（标签、收藏数等） */
  renderIllustrationDetails(illustrationDetails: IllustrationDetails | null) {
    if (illustrationDetails && illustrationDetails.id === this.illustId) {
      this.illustMeta.empty();

      const { aiType, bookmarkId, bookmarkUserTotal, tags } =
        illustrationDetails;
      const isR18 = checkIsR18(tags);
      const isR18G = checkIsR18G(tags);
      const isUgoira = checkIsUgoiraUsingTags(tags);
      const isAi = checkIsAiGenerated(aiType);
      const isAiAssisted = checkIsAiAssisted(tags);

      const illustrationDetailsElements: JQuery<HTMLElement>[] = [];

      if (isR18 || isR18G) {
        illustrationDetailsElements.push(
          $(document.createElement("div"))
            .css({
              ...DETAIL_BADGE_CSS,
              background: "rgb(255, 64, 96)",
            })
            .text(isR18G ? "R-18G" : "R-18")
        );
      }

      if (isUgoira) {
        this.downloadOriginalElement.hide();
        illustrationDetailsElements.push(
          $(document.createElement("div"))
            .css({
              ...DETAIL_BADGE_CSS,
              background: "rgb(14, 116, 144)",
            })
            .text("动图")
        );
      }

      if (isAi) {
        illustrationDetailsElements.push(
          $(document.createElement("div"))
            .css({
              ...DETAIL_BADGE_CSS,
              background: "rgb(162, 28, 175)",
            })
            .text("AI 生成")
        );
      } else if (isAiAssisted) {
        illustrationDetailsElements.push(
          $(document.createElement("div"))
            .css({
              ...DETAIL_BADGE_CSS,
              background: "rgb(109, 40, 217)",
            })
            .text("AI 辅助")
        );
      }

      illustrationDetailsElements.push(
        $(document.createElement("div"))
          .css({
            ...DETAIL_BADGE_CSS,
            background:
              bookmarkUserTotal > 50000
                ? "rgb(159, 18, 57)"
                : bookmarkUserTotal > 10000
                  ? "rgb(220, 38, 38)"
                  : bookmarkUserTotal > 5000
                    ? "rgb(29, 78, 216)"
                    : bookmarkUserTotal > 1000
                      ? "rgb(21, 128, 61)"
                      : "rgb(71, 85, 105)",
          })
          .text(`${bookmarkId ? "❤️" : "❤"} ${bookmarkUserTotal}`)
      );

      this.illustMeta.append(illustrationDetailsElements);
    }
  }

  /** 初始化显示预览容器 */
  initPreviewWrapper() {
    this.#ensureWrapperDom();
    this.previewWrapperElement.show();
    this.previewLoadingElement.show();
    this.adjustPreviewWrapper({
      baseOnMousePos: true,
    });
  }

  bindPreviewMouseEvents() {
    if (this.#mouseEventsBound) return;
    this.#mouseEventsBound = true;

    $(document).on("mousemove", this.onMouseMove);
    document.addEventListener("mousedown", this.onMouseDown, true);
    document.addEventListener("mouseup", this.cancelLongPress, true);
    document.addEventListener("click", this.onDocumentClick, true);
    document.addEventListener("dragstart", this.cancelLongPress, true);
    document.addEventListener("mouseleave", this.cancelLongPress);
    window.addEventListener("blur", this.cancelLongPress);
    window.addEventListener("wheel", this.preventPageZoom, { passive: false });
  }

  unbindPreviewMouseEvents() {
    this.#mouseEventsBound = false;
    this.cancelLongPress();
    $(document).off("mousemove", this.onMouseMove);
    document.removeEventListener("mousedown", this.onMouseDown, true);
    document.removeEventListener("mouseup", this.cancelLongPress, true);
    document.removeEventListener("click", this.onDocumentClick, true);
    document.removeEventListener("dragstart", this.cancelLongPress, true);
    document.removeEventListener("mouseleave", this.cancelLongPress);
    window.removeEventListener("blur", this.cancelLongPress);
    window.removeEventListener("wheel", this.preventPageZoom);
  }

  onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) return;
    this.#suppressLongPressClick = false;
    if (this.oneHandedMode || !this.illustElement.is(event.target as Element)) {
      return;
    }

    this.cancelLongPress();
    this.#longPressProgress = $(
      `<svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="12" fill="none"
          stroke="rgba(0, 0, 0, 0.35)" stroke-width="4" />
        <circle cx="16" cy="16" r="12" fill="none"
          stroke="rgb(0, 150, 250)" stroke-width="4" stroke-linecap="round"
          pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"
          transform="rotate(-90 16 16)"
          style="animation: pp-one-handed-progress ${ONE_HANDED_MODE_HOLD_MS}ms linear forwards" />
      </svg>`
    )
      .css({
        position: "fixed",
        left: `${event.clientX - 16}px`,
        top: `${event.clientY - 16}px`,
        width: "32px",
        height: "32px",
        "z-index": "1000000",
        "pointer-events": "none",
      })
      .appendTo(document.body);

    this.#longPressTimeout = setTimeout(() => {
      this.oneHandedMode = true;
      this.#suppressLongPressClick = true;
      this.previewWrapperElement.css({ "pointer-events": "auto" });
      this.cancelLongPress();
    }, ONE_HANDED_MODE_HOLD_MS);
  };

  cancelLongPress = () => {
    if (this.#longPressTimeout !== null) {
      clearTimeout(this.#longPressTimeout);
      this.#longPressTimeout = null;
    }
    this.#longPressProgress.remove();
    this.#longPressProgress = $();
  };

  onDocumentClick = (event: MouseEvent) => {
    // 下载等操作触发的程序点击不属于用户手势。
    if (!event.isTrusted) return;

    // 长按结束后的 click 属于进入手势，避免打开作品链接或立即退出模式。
    if (this.#suppressLongPressClick) {
      this.#suppressLongPressClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (
      this.oneHandedMode &&
      !this.previewWrapperElement[0]?.contains(event.target as Node)
    ) {
      this.reset();
    }
  };

  /** 阻止页面缩放事件 */
  preventPageZoom = (mouseWheelEvent: WheelEvent) => {
    if (
      this.oneHandedMode ||
      mouseWheelEvent.ctrlKey ||
      mouseWheelEvent.metaKey
    ) {
      mouseWheelEvent.preventDefault();
    }
  };

  /**
   * 根据鼠标移动调整预览容器位置与显隐
   * @param mouseMoveEvent
   */
  onMouseMove = (mouseMoveEvent: JQuery.MouseMoveEvent) => {
    if (this.#longPressTimeout !== null) {
      this.#longPressProgress.css({
        left: `${mouseMoveEvent.clientX - 16}px`,
        top: `${mouseMoveEvent.clientY - 16}px`,
      });
    }
    if (
      this.oneHandedMode ||
      mouseMoveEvent.ctrlKey ||
      mouseMoveEvent.metaKey
    ) {
      this.previewWrapperElement.css({ "pointer-events": "auto" });
      return;
    }
    // 避免鼠标快速移动时预览窗口闪烁
    this.previewWrapperElement.css({ "pointer-events": "none" });

    const currentElement = $(mouseMoveEvent.target);
    if (currentElement.is(this.illustElement)) {
      // 鼠标在作品对象上移动，调整预览组件位置与大小
      this.adjustPreviewWrapper({
        baseOnMousePos: true,
      });
    } else {
      // 鼠标在其他地方移动，关闭预览组件
      this.reset();
    }
  };

  /**
   * 调整预览容器的位置与大小
   * @param `baseOnMousePos` 是否根据当前鼠标所在位置调整
   * @param `illustSize` 作品的实际大小
   */
  adjustPreviewWrapper({
    baseOnMousePos = true,
  }: {
    baseOnMousePos?: boolean;
  } = {}) {
    const [mousePosX, mousePosY] = baseOnMousePos
      ? mouseMonitor.mouseAbsPos
      : this.#prevMousePos;
    this.#prevMousePos = [mousePosX, mousePosY];

    const [illustWidth, illustHeight] = this.#currentIllustSize;

    const screenWidth = document.documentElement.clientWidth;
    const screenHeight = document.documentElement.clientHeight;

    const DIST = PREVIEW_WRAPPER_DISTANCE_TO_MOUSE;

    // 如果没有尺寸信息或为 0，直接使用默认位置和不缩放
    if (!illustWidth || !illustHeight) {
      const defaultPos = {
        left: `${mousePosX + DIST}px`,
        top: `${mousePosY}px`,
      };
      this.previewWrapperElement.css(defaultPos);
      this.previewImageElement.css({ width: "", height: "" });
      return;
    }

    // 计算四个方向的可用区域，并计算图片按比例适配后的面积
    type Side = "left" | "right" | "top" | "bottom";
    const candidates: { side: Side; availW: number; availH: number }[] = [
      {
        side: "left",
        availW: Math.max(0, mousePosX - DIST),
        availH: screenHeight,
      },
      {
        side: "right",
        availW: Math.max(0, screenWidth - mousePosX - DIST),
        availH: screenHeight,
      },
      {
        side: "top",
        availW: screenWidth,
        availH: Math.max(0, mousePosY - DIST),
      },
      {
        side: "bottom",
        availW: screenWidth,
        availH: Math.max(0, screenHeight - mousePosY - DIST),
      },
    ];

    let best: { side: Side; fitW: number; fitH: number; area: number } | null =
      null;

    for (const c of candidates) {
      let scale = 1;
      if (this.illustLoaded) {
        const sx = c.availW / illustWidth;
        const sy = c.availH / illustHeight;
        // 使用能完全容纳在可用区域的最大比例
        scale = Number(Math.min(sx, sy).toFixed(3));
      }
      const fitW = Math.max(0, Math.floor(illustWidth * scale));
      const fitH = Math.max(0, Math.floor(illustHeight * scale));
      const area = fitW * fitH;

      if (!best || area > best.area) {
        best = { side: c.side, fitW, fitH, area };
      }
    }

    const previewImageFitWidth = best?.fitW ?? 0;
    const previewImageFitHeight = best?.fitH ?? 0;

    // 根据选中的方向计算锚点位置，并保证不超出屏幕
    const clamp = (v: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(v, hi));

    const side = best?.side ?? "bottom";
    const isHorizontal = side === "left" || side === "right";

    // 水平方向：锚点 X 基于鼠标偏移，Y 居中；垂直方向：反之
    const anchorX = isHorizontal
      ? side === "right"
        ? mousePosX + DIST
        : mousePosX - DIST - previewImageFitWidth
      : Math.floor(mousePosX - previewImageFitWidth / 2);

    const anchorY = isHorizontal
      ? Math.floor(mousePosY - previewImageFitHeight / 2)
      : side === "bottom"
        ? mousePosY + DIST
        : mousePosY - DIST - previewImageFitHeight;

    const left = clamp(
      anchorX,
      0,
      Math.max(0, screenWidth - previewImageFitWidth)
    );
    const top = clamp(
      anchorY,
      0,
      Math.max(0, screenHeight - previewImageFitHeight)
    );

    this.previewWrapperElement.css({
      left: `${left}px`,
      top: `${top}px`,
      right: "",
      bottom: "",
    });
    this.previewImageElement.css({
      width: `${previewImageFitWidth}px`,
      height: `${previewImageFitHeight}px`,
    });
  }
  //#endregion
}

export default loadIllustPreview;
