import {
  PREVIEW_CACHE_MAX_SIZE,
  PREVIEW_PRELOAD_NUM,
  PREVIEW_WRAPPER_BORDER_RADIUS,
  PREVIEW_WRAPPER_BORDER_WIDTH,
  PREVIEW_WRAPPER_DISTANCE_TO_MOUSE,
} from "../constants";
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
import { stopEventPropagation } from "../utils/event";
import {
  checkIsAiAssisted,
  checkIsAiGenerated,
  checkIsR18,
  checkIsUgoiraUsingTags,
} from "../utils/illustration";
import { iLog } from "../utils/logger";
import mouseMonitor from "../utils/mouse-monitor";
import ZipImagePlayer, {
  type ZipImagePlayerOptions,
} from "../utils/ugoira-player";
import { createLRUCache } from "../utils/utils";

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
    const previewPage = Number(illustHrefMatch[3] ?? 1);

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
  const previewIllust = (() => {
    const previewedIllust = new PreviewedIllust();
    let currentHoveredIllustId = "";
    let getIllustPagesRequest = $.ajax();

    const getIllustPagesCache = createLRUCache<{
      regularUrls: string[];
      originalUrls: string[];
    }>(PREVIEW_CACHE_MAX_SIZE);
    const getUgoiraMetadataCache = createLRUCache<GetUgoiraMetaResponseData>(
      PREVIEW_CACHE_MAX_SIZE
    );

    return ({
      target,
      illustId,
      previewPage = 1,
      illustType,
    }: {
      target: JQuery<HTMLElement>;
      illustId: string;
      previewPage?: number;
      illustType: IllustType;
    }) => {
      // 停止正在处理的获取元数据请求
      getIllustPagesRequest.abort();

      // 更新当前鼠标悬浮作品 ID，避免异步任务结束后显示之前悬浮的作品
      currentHoveredIllustId = illustId;

      // 当前鼠标悬浮作品为动图，但是用户禁用了动图预览，跳过
      if (illustType === IllustType.UGOIRA && !enableAnimePreview) {
        iLog.i("动图预览已禁用，跳过");
        return;
      }

      if ([IllustType.ILLUST, IllustType.MANGA].includes(illustType)) {
        const illustPagesCached = getIllustPagesCache.get(illustId);
        if (illustPagesCached) {
          // 命中缓存，直接使用缓存中的元数据
          previewedIllust.setImage({
            illustId,
            illustElement: target,
            previewPage,
            ...illustPagesCached,
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
              return;
            }

            const urls = data.body.map((item) => item.urls);
            const regularUrls = urls.map((url) => url.regular);
            const originalUrls = urls.map((url) => url.original);

            // 设置缓存
            getIllustPagesCache.set(illustId, {
              regularUrls,
              originalUrls,
            });

            // 当前鼠标悬浮的作品发生了改变，结束处理
            if (currentHoveredIllustId !== illustId) return;

            previewedIllust.setImage({
              illustId,
              illustElement: target,
              previewPage,
              regularUrls,
              originalUrls,
            });
          },
          error: (err) => {
            iLog.e(
              `An error occurred while requesting preview urls of illust ${illustId}: ${err}`
            );
          },
        });
      } else if (illustType === IllustType.UGOIRA) {
        const ugoiraMetadataCached = getUgoiraMetadataCache.get(illustId);
        if (ugoiraMetadataCached) {
          // 命中缓存，直接使用缓存中的元数据
          previewedIllust.setUgoira({
            illustId,
            illustElement: target,
            ...ugoiraMetadataCached,
          });
          return;
        }

        // 根据动图的 ID 获取动图的元数据
        getIllustPagesRequest = $.ajax(getUgoiraMetadataRequestUrl(illustId), {
          method: "GET",
          success: (data: GetUgoiraMetaResponse) => {
            if (data.error) {
              iLog.e(
                `An error occurred while requesting metadata of ugoira ${illustId}: ${data.message}`
              );
              return;
            }

            getUgoiraMetadataCache.set(illustId, data.body);

            if (currentHoveredIllustId !== illustId) return;

            const { src, originalSrc, mime_type, frames } = data.body;
            previewedIllust.setUgoira({
              illustId,
              illustElement: target,
              src,
              originalSrc,
              mime_type,
              frames,
            });
          },
          error: (err) => {
            iLog.e(
              `An error occurred while requesting metadata of ugoira ${illustId}: ${err.responseText}`
            );
          },
        });
      } else {
        iLog.e("Unknown illust type.");
        return;
      }
    };
  })();

  //#region 绑定鼠标悬浮图片监听事件
  const onMouseOverIllust = (target: JQuery<HTMLElement>) => {
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
      if (mouseMoveEvent.ctrlKey || mouseMoveEvent.metaKey) {
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
    const styleRules = $("<style>").prop("type", "text/css");
    // 添加旋转动画样式
    styleRules.append(`
@keyframes pp-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`);
    // https://www.pixiv.net/ranking.php 排行榜页面加载后续作品时，
    // 会插入一个影响鼠标悬浮判定的空节点，在此处将其设置为不触发鼠标事件
    styleRules.append(`
._layout-thumbnail img + div {
  pointer-events: none;
}`);
    // https://www.pixiv.net/ranking.php?content=ugoira 排行榜动图页面
    // 会在动图封面上插入一个 svg 播放图标，在此处将其设置为不触发鼠标事件
    styleRules.append(`
pixiv-icon[name="24/Play"] {
  pointer-events: none;
}`);
    styleRules.appendTo("head");
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

class PreviewedIllust {
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
  /** 当前预览的图片或动图 DOM */
  previewImageElement: JQuery<HTMLElement> = $();

  /** 预加载图片的列表 */
  #images: (HTMLImageElement | undefined)[] = [];
  /** 下载按钮重置定时器 */
  #downloadResetTimeout: ReturnType<typeof setTimeout> | null = null;
  /** 保存的鼠标位置 */
  #prevMousePos: [number, number] = [0, 0];
  /** 当前预览图片的实际尺寸 */
  #currentIllustSize: [number, number] = [0, 0];
  /** 当前预览的动图播放器 */
  // @ts-expect-error: ignore type defines
  #currentUgoiraPlayer: ZipImagePlayer;

  constructor() {
    this.reset();
  }

  /** 初始化预览组件 */
  reset() {
    this.illustId = "";
    this.illustDetails = null;
    this.illustElement = $();
    this.illustLoaded = false;

    this.regularUrls = [];
    this.originalUrls = [];
    this.currentPage = 1;
    this.pageCount = 1;

    // 重新创建预览容器节点
    this.previewWrapperElement?.remove();
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
      .css({
        height: "20px",
        "border-radius": "12px",
        color: "white",
        background: "rgba(0, 0, 0, 0.32)",
        "font-size": "12px",
        "line-height": "1",
        "font-weight": "bold",
        padding: "3px 6px",
        cursor: "pointer",
        display: "flex",
        "align-items": "center",
        gap: "4px",
      })
      .append(pageIcon)
      .append(this.pageCountText)
      .hide()
      .appendTo(this.previewWrapperHeader);
    this.downloadOriginalElement = $(document.createElement("a"))
      .css({
        height: "20px",
        "border-radius": "12px",
        color: "white",
        background: "rgba(0, 0, 0, 0.32)",
        "font-size": "12px",
        "line-height": "1",
        "font-weight": "bold",
        padding: "3px 6px",
        cursor: "pointer",
        display: "flex",
        "align-items": "center",
        gap: "4px",
      })
      .append(`${downloadIcon}<span>原图</span>`)
      .appendTo(this.previewWrapperHeader);
    this.previewLoadingElement = $(loadingIcon)
      .css({ padding: "12px", animation: "pp-spin 1s linear infinite" })
      .appendTo(this.previewWrapperElement);
    this.previewImageElement = $(new Image())
      .css({
        "border-radius": `${PREVIEW_WRAPPER_BORDER_RADIUS}px`,
      })
      .hide()
      .appendTo(this.previewWrapperElement);

    // 初始化私有变量值
    this.#images.forEach((image) => {
      // 取消未开始的预加载图片请求
      if (image) image.src = "";
    });
    this.#images = [];
    this.#prevMousePos = [0, 0];
    this.#currentIllustSize = [0, 0];
    this.#currentUgoiraPlayer?.stop();
    if (this.#downloadResetTimeout !== null) {
      clearTimeout(this.#downloadResetTimeout);
      this.#downloadResetTimeout = null;
    }

    // 取消所有绑定的监听事件
    this.unbindPreviewImageEvents();
    this.unbindUgoiraPreviewEvents();
  }

  //#region 预览图片功能
  /** 初始化预览容器，默认显示第一张图片 */
  setImage({
    illustId,
    illustElement,
    previewPage = 1,
    regularUrls,
    originalUrls,
  }: {
    illustId: string;
    illustElement: JQuery<HTMLElement>;
    previewPage?: number;
    regularUrls: string[];
    originalUrls: string[];
  }) {
    this.reset();
    this.initPreviewWrapper();

    this.illustId = illustId;
    this.illustElement = illustElement;
    this.regularUrls = regularUrls;
    this.originalUrls = originalUrls;
    this.currentPage = previewPage;
    this.pageCount = regularUrls.length;

    // 预加载前 PREVIEW_PRELOAD_NUM 张图片
    this.preloadImages();

    // 绑定图片预览监听事件
    this.bindPreviewImageEvents();

    // 初始化图片显示
    this.updatePreviewImage();

    // 获取图片详情信息并展示
    this.showIllustrationDetails();
  }

  bindPreviewImageEvents() {
    // 监听图片加载完毕事件
    this.previewImageElement.on("load", this.onImageLoad);
    // 监听鼠标点击切换图片事件
    this.previewImageElement.on("click", this.onPreviewImageMouseClick);
    // 监听点击下载按钮事件
    this.downloadOriginalElement.on("click", this.onDownloadImage);

    // 监听鼠标滚轮切换图片事件
    $(document).on("wheel", this.onPreviewImageMouseWheel);
    // 监听方向键切换图片事件
    $(document).on("keydown", this.onPreviewImageKeyDown);
    // 监听鼠标移动事件
    $(document).on("mousemove", this.onMouseMove);

    // 监听鼠标滚动事件
    window.addEventListener("wheel", this.preventPageZoom, { passive: false });
  }

  unbindPreviewImageEvents() {
    this.previewImageElement.off();
    this.downloadOriginalElement.off();

    $(document).off("wheel", this.onPreviewImageMouseWheel);
    $(document).off("keydown", this.onPreviewImageKeyDown);
    $(document).off("mousemove", this.onMouseMove);

    window.removeEventListener("wheel", this.preventPageZoom);
  }

  /** 显示 pageIndex 指向的图片 */
  updatePreviewImage(page: number = this.currentPage) {
    const currentImageUrl = this.regularUrls[page - 1];
    this.previewImageElement.attr("src", currentImageUrl);

    this.pageCountText.text(`${page}/${this.pageCount}`);
  }

  onImageLoad = () => {
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

  preloadImages(
    from: number = this.currentPage - 1,
    to: number = this.currentPage - 1 + PREVIEW_PRELOAD_NUM
  ) {
    if (!this.#images.length) {
      this.#images = new Array(this.regularUrls.length);
    }

    for (let i = from; i < to && i < this.regularUrls.length; i += 1) {
      const preloadImage = new Image();
      preloadImage.src = this.regularUrls[i];
      this.#images[i] = preloadImage;
    }
  }

  onPreviewImageMouseClick = () => {
    this.nextPage();
  };

  onPreviewImageMouseWheel = (mouseWheelEvent: JQuery.TriggeredEvent) => {
    if (mouseWheelEvent.ctrlKey || mouseWheelEvent.metaKey) {
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
    if (keyDownEvent.ctrlKey || keyDownEvent.metaKey) {
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
    const currentImageFilename =
      currentImageOriginalUrl.split("/").pop() || "illust.jpg";

    const textSpan = this.downloadOriginalElement.find("span");
    const originalText = textSpan.text();

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
      options: {
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
  }: GetUgoiraMetaResponseData & {
    illustId: string;
    illustElement: JQuery<HTMLElement>;
  }) {
    this.reset();

    this.initPreviewWrapper();

    this.illustId = illustId;
    this.illustElement = illustElement;

    // 鼠标悬浮在动图中间播放图标上，不关闭预览窗口
    illustElement.siblings("svg").css({ "pointer-events": "none" });

    this.#currentUgoiraPlayer = this.createUgoiraPlayer({
      source: src,
      metadata: {
        mime_type,
        frames,
      },
    });

    this.bindUgoiraPreviewEvents();

    this.showIllustrationDetails();
  }

  createUgoiraPlayer(
    options: Pick<ZipImagePlayerOptions, "source" | "metadata">
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
    $(document).on("mousemove", this.onMouseMove);
  }

  unbindUgoiraPreviewEvents() {
    this.#currentUgoiraPlayer?.off("frameLoaded");
    $(document).off("mousemove", this.onMouseMove);
  }

  onUgoiraFrameLoaded = (frame: number) => {
    if (frame !== 0) {
      return;
    }

    this.illustLoaded = true;
    this.previewLoadingElement.hide();

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
  async showIllustrationDetails() {
    const illustrationDetails = await getIllustrationDetailsWithCache(
      this.illustId
    );

    if (illustrationDetails && illustrationDetails.id === this.illustId) {
      this.illustMeta.empty();

      const { aiType, bookmarkId, bookmarkUserTotal, tags } =
        illustrationDetails;
      const isR18 = checkIsR18(tags);
      const isUgoira = checkIsUgoiraUsingTags(tags);
      const isAi = checkIsAiGenerated(aiType);
      const isAiAssisted = checkIsAiAssisted(tags);

      const illustrationDetailsElements: JQuery<HTMLElement>[] = [];

      if (isR18) {
        illustrationDetailsElements.push(
          $(document.createElement("div"))
            .css({
              ...DETAIL_BADGE_CSS,
              background: "rgb(255, 64, 96)",
            })
            .text("R-18")
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
    this.previewWrapperElement.show();
    this.previewLoadingElement.show();
    this.adjustPreviewWrapper({
      baseOnMousePos: true,
    });
  }

  /** 阻止页面缩放事件 */
  preventPageZoom = (mouseWheelEvent: WheelEvent) => {
    if (mouseWheelEvent.ctrlKey || mouseWheelEvent.metaKey) {
      mouseWheelEvent.preventDefault();
    }
  };

  /**
   * 根据鼠标移动调整预览容器位置与显隐
   * @param mouseMoveEvent
   */
  onMouseMove = (mouseMoveEvent: JQuery.MouseMoveEvent) => {
    if (mouseMoveEvent.ctrlKey || mouseMoveEvent.metaKey) {
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
