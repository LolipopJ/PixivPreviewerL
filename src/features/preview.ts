import {
  g_loadingImage,
  PREVIEW_WRAPPER_BORDER_RADIUS,
  PREVIEW_WRAPPER_BORDER_WIDTH,
  PREVIEW_WRAPPER_DISTANCE_TO_MOUSE,
  PREVIEW_WRAPPER_MIN_SIZE,
} from "../constants";
import { IllustType } from "../enums";
import {
  GetIllustPagesResponse,
  GetUgoiraMetaResponse,
  GlobalSettings,
} from "../types";
import debounce from "../utils/debounce";
import { iLog } from "../utils/logger";
import mouseMonitor from "../utils/mouse-monitor";
import {
  getIllustPagesRequestUrl,
  getUgoiraMetadataRequestUrl,
} from "../utils/url";

type LoadPreviewImageOptions = Pick<
  GlobalSettings,
  "previewDelay" | "enableAnimePreview"
>;

interface IllustMetadata {
  /** 作品 ID */
  illustId: string;
  /** 作品类型 */
  illustType: IllustType;
}

let isLoad = false;
export const loadIllustPreview = (options: LoadPreviewImageOptions) => {
  if (isLoad) return;

  const { previewDelay, enableAnimePreview } = options;

  class PreviewedIllust {
    /** 当前正在预览的作品元素 */
    illustElement: JQuery;
    /** 预览作品是否初始化 */
    initialized = false;

    /** 图片的链接 */
    regularUrls: string[];
    /** 图片的原图链接 */
    originalUrls: string[];
    /** 当前预览图片的页数 */
    currentPage: number;
    /** 当前预览图片的总页数 */
    pageCount: number;

    /** 预览图片或动图容器 */
    previewWrapperElement: JQuery;
    /** 预览图片或动图加载状态 */
    previewLoadingElement: JQuery;
    /** 当前预览的图片或动图 */
    previewImageElement: JQuery;
    /** 当前预览的是第几张图片标记 */
    pageCountElement: JQuery;
    /** 下载原图按钮 */
    downloadOriginalElement: JQuery;

    /** 当前预览图片的实际尺寸 */
    #currentIllustSize: [number, number];
    /** 保存的鼠标位置 */
    #prevMousePos: [number, number];
    /** 当前预览的动图播放器 */
    #currentUgoriaPlayer: ZipImagePlayer & { canvas: HTMLCanvasElement };

    /** 关闭预览组件，重置初始值 */
    reset() {
      this.illustElement = $();
      this.initialized = false;

      this.regularUrls = [];
      this.originalUrls = [];
      this.currentPage = 1;
      this.pageCount = 1;

      // 重新创建预览容器节点
      this.previewWrapperElement?.remove();
      this.previewWrapperElement = $(document.createElement("div"))
        .attr("id", "pp-wrapper")
        .css({
          position: "fixed",
          "z-index": "999999",
          border: `${PREVIEW_WRAPPER_BORDER_WIDTH}px solid rgb(0, 150, 250)`,
          "border-radius": `${PREVIEW_WRAPPER_BORDER_RADIUS}px`,
          background: "rgba(31, 31, 31, 0.8)",
          "backdrop-filter": "blur(4px)",
          "text-align": "center",
        })
        .hide()
        .appendTo($("body"));
      this.previewLoadingElement = $(
        new Image(PREVIEW_WRAPPER_MIN_SIZE, PREVIEW_WRAPPER_MIN_SIZE)
      )
        .attr("id", "pp-loading")
        .attr("src", g_loadingImage)
        .css({
          "border-radius": "50%",
        })
        .hide()
        .appendTo(this.previewWrapperElement);
      this.previewImageElement = $(new Image())
        .attr("id", "pp-image")
        .css({
          "border-radius": `${PREVIEW_WRAPPER_BORDER_RADIUS}px`,
        })
        .hide()
        .appendTo(this.previewWrapperElement);
      this.pageCountElement = $(
        '<div style="display: flex;-webkit-box-align: center;align-items: center;box-sizing: border-box;margin-left: auto;height: 20px;color: rgb(255, 255, 255);font-size: 10px;line-height: 12px;font-weight: bold;flex: 0 0 auto;padding: 4px 6px;background: rgba(0, 0, 0, 0.32);border-radius: 10px;margin-top:5px;margin-right:5px;"><svg viewBox="0 0 9 10" width="9" height="10" style="stroke: none;line-height: 0;font-size: 0px;fill: currentcolor;"><path d="M8,3 C8.55228475,3 9,3.44771525 9,4 L9,9 C9,9.55228475 8.55228475,10 8,10 L3,10 C2.44771525,10 2,9.55228475 2,9 L6,9 C7.1045695,9 8,8.1045695 8,7 L8,3 Z M1,1 L6,1 C6.55228475,1 7,1.44771525 7,2 L7,7 C7,7.55228475 6.55228475,8 6,8 L1,8 C0.44771525,8 0,7.55228475 0,7 L0,2 C0,1.44771525 0.44771525,1 1,1 Z"></path></svg><span style="margin-left:2px;" class="pp-page">0/0</span></div>'
      )
        .attr("id", "pp-page-count")
        .css({
          position: "absolute",
          top: "0px",
          right: "0px",
        })
        .hide()
        .appendTo(this.previewWrapperElement);
      // TODO
      this.downloadOriginalElement = $();

      this.#prevMousePos = [0, 0];
      this.#currentIllustSize = [
        PREVIEW_WRAPPER_MIN_SIZE,
        PREVIEW_WRAPPER_MIN_SIZE,
      ];
      this.#currentUgoriaPlayer?.stop();

      // 取消所有绑定的监听事件
      this.unbindPreviewImageEvents();
      this.unbindUgoriaPreviewEvents();
    }

    constructor() {
      this.reset();
    }

    //#region 预览图片功能
    /** 初始化预览容器，显示第一张图片 */
    setImage({
      illustElement,
      regularUrls,
      originalUrls,
    }: {
      illustElement: JQuery;
      regularUrls: string[];
      originalUrls: string[];
    }) {
      this.reset();

      this.initPreviewWrapper();

      this.illustElement = illustElement;
      this.regularUrls = regularUrls;
      this.originalUrls = originalUrls;
      this.currentPage = 1;
      this.pageCount = regularUrls.length;
      // 预加载图片资源
      regularUrls.map((url) => {
        const preloadImage = new Image();
        preloadImage.src = url;
      });

      // 绑定图片预览监听事件
      this.bindPreviewImageEvents();
      // 初始化图片显示
      this.updatePreviewImage();
    }

    bindPreviewImageEvents() {
      // 监听图片加载完毕事件
      this.previewImageElement.on("load", this.onImageLoad);
      // 监听鼠标滚动切换图片事件
      this.previewImageElement.on("mousewheel", this.onPreviewImageMouseWheel);
      // 监听鼠标移动事件
      $(document).on("mousemove", this.onMouseMove);
    }

    unbindPreviewImageEvents() {
      this.previewImageElement.off();
      $(document).off("mousemove", this.onMouseMove);
    }

    /** 显示 this.currentPage 指向的图片 */
    updatePreviewImage() {
      const currentImageUrl = this.regularUrls[this.currentPage - 1];
      this.previewImageElement.attr("src", currentImageUrl);

      // 更新右上角正在查看的图片页码信息
      if (this.pageCount > 1) {
        this.pageCountElement.text(`${this.currentPage}/${this.pageCount}`);
        this.pageCountElement.show();
      }
    }

    onImageLoad = () => {
      this.initialized = true;
      this.previewLoadingElement.hide();
      this.previewImageElement.show();

      // 移除图片调整后的宽高，获取图片的实际宽高
      this.previewImageElement.css({
        width: "",
        height: "",
      });
      this.#currentIllustSize = [
        this.previewImageElement.width(),
        this.previewImageElement.height(),
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
      this.updatePreviewImage();
    }

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage -= 1;
      } else {
        this.currentPage = this.pageCount;
      }
      this.updatePreviewImage();
    }

    onPreviewImageMouseWheel = (mouseWheelEvent: JQueryEventObject) => {
      mouseWheelEvent.preventDefault();

      if (mouseWheelEvent.originalEvent.wheelDelta < 0) {
        // 滑轮向下滚动，切换到下一张图片预览
        this.nextPage();
      } else {
        // 滑轮向上滚动，切换到上一张图片预览
        this.prevPage();
      }
    };
    //#endregion

    //#region 预览动图功能
    setUgoira({
      illustElement,
      src,
      originalSrc,
      mime_type,
      frames,
    }: GetUgoiraMetaResponse["body"] & { illustElement: JQuery }) {
      this.reset();

      this.initPreviewWrapper();

      this.illustElement = illustElement;
      this.#currentUgoriaPlayer = createPlayer({
        source: src,
        metadata: {
          mime_type,
          frames,
        },
      });

      this.bindUgoriaPreviewEvents();
    }

    bindUgoriaPreviewEvents() {
      $(this.#currentUgoriaPlayer).on("frameLoaded", this.onUgoriaFrameLoaded);
      $(document).on("mousemove", this.onMouseMove);
    }

    unbindUgoriaPreviewEvents() {
      $(this.#currentUgoriaPlayer).off();
      $(document).off("mousemove", this.onMouseMove);
    }

    onUgoriaFrameLoaded = (ev, frame) => {
      if (frame !== 0) {
        return;
      }

      this.initialized = true;
      this.previewLoadingElement.hide();

      const canvas = $(this.#currentUgoriaPlayer.canvas);
      this.previewImageElement.after(canvas);
      this.previewImageElement.remove();
      this.previewImageElement = canvas;

      const ugoriaOriginWidth = ev.currentTarget._frameImages[0].width;
      const ugoriaOriginHeight = ev.currentTarget._frameImages[0].height;
      this.#currentIllustSize = [ugoriaOriginWidth, ugoriaOriginHeight];
      this.previewImageElement.attr({
        width: ugoriaOriginWidth,
        height: ugoriaOriginHeight,
      });

      // 滚动切换图片时，使用之前的鼠标位置
      this.adjustPreviewWrapper({
        baseOnMousePos: false,
      });
    };
    //#endregion

    /** 初始化显示预览容器 */
    initPreviewWrapper() {
      this.previewWrapperElement.show();
      this.previewLoadingElement.show();
      this.adjustPreviewWrapper({
        baseOnMousePos: true,
      });
    }

    onMouseMove = (mouseMoveEvent: JQueryMouseEventObject) => {
      if (mouseMoveEvent.ctrlKey) {
        return;
      }

      const currentElement = $(mouseMoveEvent.target);
      if (
        currentElement.is(this.previewWrapperElement) ||
        currentElement.is(this.previewImageElement)
      ) {
        // 鼠标在预览组件上移动，跳过处理
      } else if (currentElement.is(this.illustElement)) {
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

      /** 预览容器是否显示在鼠标左侧 */
      const isShowLeft = mousePosX > screenWidth / 2;
      /** 预览容器是否显示在鼠标上方 */
      const isShowTop = mousePosY > screenHeight / 2;

      /** 预览作品宽高比 */
      const illustRatio = illustWidth / illustHeight;

      /** 鼠标到左（右）边的距离 */
      const screenRestWidth = isShowLeft
        ? mousePosX - PREVIEW_WRAPPER_DISTANCE_TO_MOUSE
        : screenWidth - mousePosX - PREVIEW_WRAPPER_DISTANCE_TO_MOUSE;
      /** 显示预览容器的可用空间宽高比 */
      const screenRestRatio = screenRestWidth / screenHeight;

      /** 作品缩放后是否占满可视区域高度，宽度自适应；若否，则作品缩放后占满剩余宽度，高度自适应 */
      const isFitToFullHeight = screenRestRatio > illustRatio;

      let fitToScreenScale = 1;
      if (this.initialized) {
        // 当前预览的是实际作品，进行缩放处理
        if (isFitToFullHeight) {
          // 作品高度缩放占满可视区域，宽度自适应
          fitToScreenScale = Number((screenHeight / illustHeight).toFixed(3));
        } else {
          // 作品宽度缩放占满鼠标左（右）边区域，高度自适应
          fitToScreenScale = Number((screenRestWidth / illustWidth).toFixed(3));
        }
      }
      const previewImageFitWidth = Math.floor(illustWidth * fitToScreenScale);
      const previewImageFitHeight = Math.floor(illustHeight * fitToScreenScale);

      const previewWrapperElementPos = {
        left: "",
        right: "",
        top: "",
        bottom: "",
      };
      // 设置预览容器的水平位置
      if (isShowLeft) {
        previewWrapperElementPos.right = `${screenWidth - mousePosX + PREVIEW_WRAPPER_DISTANCE_TO_MOUSE}px`;
      } else {
        previewWrapperElementPos.left = `${mousePosX + PREVIEW_WRAPPER_DISTANCE_TO_MOUSE}px`;
      }
      // 设置预览容器的垂直位置
      if (this.initialized) {
        if (isFitToFullHeight) {
          // 图片高度占满可视区域
          previewWrapperElementPos.top = "0px";
        } else {
          // 图片宽度占满鼠标到左（右）边的距离
          /** 鼠标到顶（底）边的距离 */
          const screenRestHeight = isShowTop
            ? mousePosY
            : screenHeight - mousePosY;
          if (previewImageFitHeight > screenRestHeight) {
            // 垂直方向上，图片高度大于鼠标到顶（底）边的距离，设置预览容器贴顶（底）边
            if (isShowTop) {
              previewWrapperElementPos.top = "0px";
            } else {
              previewWrapperElementPos.bottom = "0px";
            }
          } else {
            // 垂直方向上，图片高度小于鼠标到顶（底）边的距离，设置预览容器跟随鼠标
            if (isShowTop) {
              previewWrapperElementPos.bottom = `${screenHeight - mousePosY}px`;
            } else {
              previewWrapperElementPos.top = `${mousePosY}px`;
            }
          }
        }
      } else {
        if (isShowTop) {
          previewWrapperElementPos.bottom = `${screenHeight - mousePosY}px`;
        } else {
          previewWrapperElementPos.top = `${mousePosY}px`;
        }
      }

      this.previewWrapperElement.css(previewWrapperElementPos);
      this.previewImageElement.css({
        width: `${previewImageFitWidth}px`,
        height: `${previewImageFitHeight}px`,
      });
    }
  }

  const mouseHoverDebounceWait = previewDelay / 5;
  const mouseHoverPreviewWait = previewDelay - mouseHoverDebounceWait;

  const previewIllust = previewIllustWithCache();
  const debouncedOnMouseOverIllust = debounce(
    onMouseOverIllust,
    mouseHoverDebounceWait
  );
  $(document).mouseover(debouncedOnMouseOverIllust);
  function onMouseOverIllust(mouseOverEvent: JQueryMouseEventObject) {
    const target = $(mouseOverEvent.target);
    // 当前悬浮元素不是作品，跳过
    // TODO: 兼容动图显示，悬浮在播放按钮上加载动图预览
    if (!target.is("IMG")) {
      return;
    }

    // 按住 Ctrl 键时跳过
    if (mouseOverEvent.ctrlKey) {
      return;
    }

    // TODO: 特殊情况不显示预览
    // TODO: 作品页作者作品列表，当前访问的作品不显示预览

    const previewIllustTimeout = setTimeout(() => {
      previewIllust(target);
    }, mouseHoverPreviewWait);

    target.on("mouseout", () => {
      clearTimeout(previewIllustTimeout);
      target.off("mouseout");
    });
  }

  function previewIllustWithCache() {
    const previewedIllust = new PreviewedIllust();
    let currentHoveredIllustId: string = "";

    // TODO: 自动清理缓存，避免占用内存过大
    const getIllustPagesCache: Record<
      string,
      { regularUrls: string[]; originalUrls: string[] }
    > = {};
    const getUgoiraMetadataCache: Record<
      string,
      GetUgoiraMetaResponse["body"]
    > = {};

    /**
     * 获取作品访问链接并在前端显示预览
     * @param target 作品的元数据
     */
    return (target: JQuery) => {
      const illustMetadata = getIllustMetadata(target);
      // 获取作品元数据失败，跳过
      if (!illustMetadata) {
        return;
      }
      const { illustId, illustType } = illustMetadata;
      // 立即更新当前鼠标悬浮作品 ID，防止异步完成时显示之前悬浮的作品预览
      currentHoveredIllustId = illustId;

      // 当前悬浮的作品为动图，但是用户禁用了动图预览，跳过
      if (illustType === IllustType.UGOIRA && !enableAnimePreview) {
        iLog.i("Anime preview disabled.");
        return;
      }

      if (illustType === IllustType.ILLUST) {
        // 命中缓存，直接使用缓存中的访问链接
        if (getIllustPagesCache[illustId]) {
          previewedIllust.setImage({
            illustElement: target,
            ...getIllustPagesCache[illustId],
          });
          return;
        }

        // 根据作品的 ID 获取作品的访问链接
        // 例如：`125424620` -> `https://i.pximg.net/img-master/img/2024/12/22/19/13/41/125424620_p0_master1200.jpg`
        $.ajax(getIllustPagesRequestUrl(illustId), {
          method: "GET",
          success: (data: GetIllustPagesResponse) => {
            if (data.error) {
              iLog.e(
                `Get an error while requesting illust url: ${data.message}`
              );
              return;
            }

            const urls = data.body.map((item) => item.urls);
            const regularUrls = urls.map((url) => url.regular);
            const originalUrls = urls.map((url) => url.original);

            // 设置缓存
            getIllustPagesCache[illustId] = {
              regularUrls,
              originalUrls,
            };

            // 当前鼠标悬浮的作品发生了改变，结束处理
            if (currentHoveredIllustId !== illustId) return;

            previewedIllust.setImage({
              illustElement: target,
              regularUrls,
              originalUrls,
            });
          },
          error: (err) => {
            iLog.e(`Get an error while requesting illust url: ${err}`);
          },
        });
      } else if (illustType === IllustType.UGOIRA) {
        // 命中缓存，直接使用缓存中的元数据
        if (getUgoiraMetadataCache[illustId]) {
          previewedIllust.setUgoira({
            illustElement: target,
            ...getUgoiraMetadataCache[illustId],
          });
          return;
        }

        // 根据动图的 ID 获取动图的元数据
        $.ajax(getUgoiraMetadataRequestUrl(illustId), {
          method: "GET",
          success: (data: GetUgoiraMetaResponse) => {
            if (data.error) {
              iLog.e(
                `Get an error while requesting ugoira metadata: ${data.message}`
              );
              return;
            }

            getUgoiraMetadataCache[illustId] = data.body;

            if (currentHoveredIllustId !== illustId) return;

            const { src, originalSrc, mime_type, frames } = data.body;
            previewedIllust.setUgoira({
              illustElement: target,
              src,
              originalSrc,
              mime_type,
              frames,
            });
          },
          error: (err) => {
            iLog.e(`Get an error while requesting ugoira metadata: ${err}`);
          },
        });
      } else {
        iLog.e("Unknown illust type.");
        return;
      }
    };
  }

  /**
   * 获取作品的元数据信息
   * @param img <img /> 的 JQuery 对象
   * @returns 作品的元数据
   */
  function getIllustMetadata(img: JQuery): IllustMetadata | null {
    let imgLink = img.parent();
    while (!imgLink.is("A")) {
      imgLink = imgLink.parent();

      if (!imgLink.length) {
        iLog.i("未能找到当前作品的链接元素");
        return null;
      }
    }

    const illustHref = imgLink.attr("href");
    const illustHrefMatch = illustHref.match(/\/artworks\/(\d+)/);
    if (!illustHrefMatch) {
      iLog.w("当前作品不支持预览，跳过");
      return null;
    }
    const illustId = illustHrefMatch[1];

    const ugoiraSvg = imgLink.children("div:first").find("svg:first");
    const illustType = ugoiraSvg.length ? IllustType.UGOIRA : IllustType.ILLUST;

    return {
      /** 作品 ID */
      illustId,
      /** 作品类型 */
      illustType,
    };
  }

  function createPlayer(options) {
    const canvas = document.createElement("canvas");
    const p = new ZipImagePlayer({
      canvas: canvas,
      chunkSize: 300000,
      loop: true,
      autoStart: true,
      debug: false,
      ...options,
    });
    p.canvas = canvas;
    return p;
  }

  isLoad = true;
};

//#region ZipImagePlayer
function ZipImagePlayer(options) {
  this.op = options;
  this._URL = window.URL || window.webkitURL || window.MozURL || window.MSURL;
  this._Blob =
    window.Blob || window.WebKitBlob || window.MozBlob || window.MSBlob;
  this._BlobBuilder =
    window.BlobBuilder ||
    window.WebKitBlobBuilder ||
    window.MozBlobBuilder ||
    window.MSBlobBuilder;
  this._Uint8Array =
    window.Uint8Array ||
    window.WebKitUint8Array ||
    window.MozUint8Array ||
    window.MSUint8Array;
  this._DataView =
    window.DataView ||
    window.WebKitDataView ||
    window.MozDataView ||
    window.MSDataView;
  this._ArrayBuffer =
    window.ArrayBuffer ||
    window.WebKitArrayBuffer ||
    window.MozArrayBuffer ||
    window.MSArrayBuffer;
  this._maxLoadAhead = 0;
  if (!this._URL) {
    this._debugLog("No URL support! Will use slower data: URLs.");
    // Throttle loading to avoid making playback stalling completely while
    // loading images...
    this._maxLoadAhead = 10;
  }
  if (!this._Blob) {
    this._error("No Blob support");
  }
  if (!this._Uint8Array) {
    this._error("No Uint8Array support");
  }
  if (!this._DataView) {
    this._error("No DataView support");
  }
  if (!this._ArrayBuffer) {
    this._error("No ArrayBuffer support");
  }
  this._isSafari =
    Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") >
    0;
  this._loadingState = 0;
  this._dead = false;
  this._context = options.canvas.getContext("2d");
  this._files = {};
  this._frameCount = this.op.metadata.frames.length;
  this._debugLog("Frame count: " + this._frameCount);
  this._frame = 0;
  this._loadFrame = 0;
  this._frameImages = [];
  this._paused = false;
  this._loadTimer = null;
  this._startLoad();
  if (this.op.autoStart) {
    this.play();
  } else {
    this._paused = true;
  }
}

ZipImagePlayer.prototype = {
  _trailerBytes: 30000,
  _failed: false,
  _mkerr: function (msg) {
    const _this = this;
    return function () {
      _this._error(msg);
    };
  },
  _error: function (msg) {
    this._failed = true;
    throw Error("ZipImagePlayer error: " + msg);
  },
  _debugLog: function (msg) {
    if (this.op.debug) {
      console.log(msg);
    }
  },
  _load: function (offset, length, callback) {
    const _this = this;
    // Unfortunately JQuery doesn't support ArrayBuffer XHR
    const xhr = new XMLHttpRequest();
    xhr.addEventListener(
      "load",
      function (ev) {
        if (_this._dead) {
          return;
        }
        _this._debugLog(
          "Load: " + offset + " " + length + " status=" + xhr.status
        );
        if (xhr.status == 200) {
          _this._debugLog("Range disabled or unsupported, complete load");
          offset = 0;
          length = xhr.response.byteLength;
          _this._len = length;
          _this._buf = xhr.response;
          _this._bytes = new _this._Uint8Array(_this._buf);
        } else {
          if (xhr.status != 206) {
            _this._error("Unexpected HTTP status " + xhr.status);
          }
          if (xhr.response.byteLength != length) {
            _this._error(
              "Unexpected length " +
                xhr.response.byteLength +
                " (expected " +
                length +
                ")"
            );
          }
          _this._bytes.set(new _this._Uint8Array(xhr.response), offset);
        }
        if (callback) {
          callback.apply(_this, [offset, length]);
        }
      },
      false
    );
    xhr.addEventListener("error", this._mkerr("Fetch failed"), false);
    xhr.open("GET", this.op.source);
    xhr.responseType = "arraybuffer";
    if (offset != null && length != null) {
      const end = offset + length;
      xhr.setRequestHeader("Range", "bytes=" + offset + "-" + (end - 1));
      if (this._isSafari) {
        // Range request caching is broken in Safari
        // https://bugs.webkit.org/show_bug.cgi?id=82672
        xhr.setRequestHeader("Cache-control", "no-cache");
        xhr.setRequestHeader("If-None-Match", Math.random().toString());
      }
    }
    // this._debugLog("Load: " + offset + " " + length);
    xhr.send();
  },
  _startLoad: function () {
    const _this = this;
    if (!this.op.source) {
      // Unpacked mode (individiual frame URLs) - just load the frames.
      this._loadNextFrame();
      return;
    }
    $.ajax({
      url: this.op.source,
      type: "HEAD",
    })
      .done(function (data, status, xhr) {
        if (_this._dead) {
          return;
        }
        _this._pHead = 0;
        _this._pNextHead = 0;
        _this._pFetch = 0;
        const len = parseInt(String(xhr.getResponseHeader("Content-Length")));
        if (!len) {
          _this._debugLog("HEAD request failed: invalid file length.");
          _this._debugLog("Falling back to full file mode.");
          _this._load(null, null, function (off, len) {
            _this._pTail = 0;
            _this._pHead = len;
            _this._findCentralDirectory();
          });
          return;
        }
        _this._debugLog("Len: " + len);
        _this._len = len;
        _this._buf = new _this._ArrayBuffer(len);
        _this._bytes = new _this._Uint8Array(_this._buf);
        let off = len - _this._trailerBytes;
        if (off < 0) {
          off = 0;
        }
        _this._pTail = len;
        _this._load(off, len - off, function (off, len) {
          _this._pTail = off;
          _this._findCentralDirectory();
        });
      })
      .fail(this._mkerr("Length fetch failed"));
  },
  _findCentralDirectory: function () {
    // No support for ZIP file comment
    const dv = new this._DataView(this._buf, this._len - 22, 22);
    if (dv.getUint32(0, true) != 0x06054b50) {
      this._error("End of Central Directory signature not found");
    }
    const cd_count = dv.getUint16(10, true);
    const cd_size = dv.getUint32(12, true);
    const cd_off = dv.getUint32(16, true);
    if (cd_off < this._pTail) {
      this._load(cd_off, this._pTail - cd_off, function () {
        this._pTail = cd_off;
        this._readCentralDirectory(cd_off, cd_size, cd_count);
      });
    } else {
      this._readCentralDirectory(cd_off, cd_size, cd_count);
    }
  },
  _readCentralDirectory: function (offset, size, count) {
    const dv = new this._DataView(this._buf, offset, size);
    let p = 0;
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) != 0x02014b50) {
        this._error("Invalid Central Directory signature");
      }
      const compMethod = dv.getUint16(p + 10, true);
      const uncompSize = dv.getUint32(p + 24, true);
      const nameLen = dv.getUint16(p + 28, true);
      const extraLen = dv.getUint16(p + 30, true);
      const cmtLen = dv.getUint16(p + 32, true);
      const off = dv.getUint32(p + 42, true);
      if (compMethod != 0) {
        this._error("Unsupported compression method");
      }
      p += 46;
      const nameView = new this._Uint8Array(this._buf, offset + p, nameLen);
      let name = "";
      for (let j = 0; j < nameLen; j++) {
        name += String.fromCharCode(nameView[j]);
      }
      p += nameLen + extraLen + cmtLen;
      //this._debugLog("File: " + name + " (" + uncompSize + " bytes @ " + off + ")");
      this._files[name] = { off: off, len: uncompSize };
    }
    // Two outstanding fetches at any given time.
    // Note: the implementation does not support more than two.
    if (this._pHead >= this._pTail) {
      this._pHead = this._len;
      $(this).triggerHandler("loadProgress", [this._pHead / this._len]);
      this._loadNextFrame();
    } else {
      this._loadNextChunk();
      this._loadNextChunk();
    }
  },
  _loadNextChunk: function () {
    if (this._pFetch >= this._pTail) {
      return;
    }
    const off = this._pFetch;
    let len = this.op.chunkSize;
    if (this._pFetch + len > this._pTail) {
      len = this._pTail - this._pFetch;
    }
    this._pFetch += len;
    this._load(off, len, function () {
      if (off == this._pHead) {
        if (this._pNextHead) {
          this._pHead = this._pNextHead;
          this._pNextHead = 0;
        } else {
          this._pHead = off + len;
        }
        if (this._pHead >= this._pTail) {
          this._pHead = this._len;
        }
        // this._debugLog("New pHead: " + this._pHead);
        $(this).triggerHandler("loadProgress", [this._pHead / this._len]);
        if (!this._loadTimer) {
          this._loadNextFrame();
        }
      } else {
        this._pNextHead = off + len;
      }
      this._loadNextChunk();
    });
  },
  _fileDataStart: function (offset) {
    const dv = new DataView(this._buf, offset, 30);
    const nameLen = dv.getUint16(26, true);
    const extraLen = dv.getUint16(28, true);
    return offset + 30 + nameLen + extraLen;
  },
  _isFileAvailable: function (name) {
    const info = this._files[name];
    if (!info) {
      this._error("File " + name + " not found in ZIP");
    }
    if (this._pHead < info.off + 30) {
      return false;
    }
    return this._pHead >= this._fileDataStart(info.off) + info.len;
  },
  _loadNextFrame: function () {
    if (this._dead) {
      return;
    }
    const frame = this._loadFrame;
    if (frame >= this._frameCount) {
      return;
    }
    const meta = this.op.metadata.frames[frame];
    if (!this.op.source) {
      // Unpacked mode (individiual frame URLs)
      this._loadFrame += 1;
      this._loadImage(frame, meta.file, false);
      return;
    }
    if (!this._isFileAvailable(meta.file)) {
      return;
    }
    this._loadFrame += 1;
    const off = this._fileDataStart(this._files[meta.file].off);
    const end = off + this._files[meta.file].len;
    let url;
    const mime_type = this.op.metadata.mime_type || "image/png";
    if (this._URL) {
      let slice;
      if (!this._buf.slice) {
        slice = new this._ArrayBuffer(this._files[meta.file].len);
        const view = new this._Uint8Array(slice);
        view.set(this._bytes.subarray(off, end));
      } else {
        slice = this._buf.slice(off, end);
      }
      let blob;
      try {
        blob = new this._Blob([slice], { type: mime_type });
      } catch (err) {
        this._debugLog(
          "Blob constructor failed. Trying BlobBuilder..." +
            " (" +
            err.message +
            ")"
        );
        const bb = new this._BlobBuilder();
        bb.append(slice);
        blob = bb.getBlob();
      }
      // _this._debugLog("Loading " + meta.file + " to frame " + frame);
      url = this._URL.createObjectURL(blob);
      this._loadImage(frame, url, true);
    } else {
      url =
        "data:" +
        mime_type +
        ";base64," +
        base64ArrayBuffer(this._buf, off, end - off);
      this._loadImage(frame, url, false);
    }
  },
  _loadImage: function (frame, url, isBlob) {
    const _this = this;
    const image = new Image();
    const meta = this.op.metadata.frames[frame];
    image.addEventListener("load", function () {
      _this._debugLog("Loaded " + meta.file + " to frame " + frame);
      if (isBlob) {
        _this._URL.revokeObjectURL(url);
      }
      if (_this._dead) {
        return;
      }
      _this._frameImages[frame] = image;
      $(_this).triggerHandler("frameLoaded", frame);
      if (_this._loadingState == 0) {
        _this._displayFrame.apply(_this);
      }
      if (frame >= _this._frameCount - 1) {
        _this._setLoadingState(2);
        _this._buf = null;
        _this._bytes = null;
      } else {
        if (
          !_this._maxLoadAhead ||
          frame - _this._frame < _this._maxLoadAhead
        ) {
          _this._loadNextFrame();
        } else if (!_this._loadTimer) {
          _this._loadTimer = setTimeout(function () {
            _this._loadTimer = null;
            _this._loadNextFrame();
          }, 200);
        }
      }
    });
    image.src = url;
  },
  _setLoadingState: function (state) {
    if (this._loadingState != state) {
      this._loadingState = state;
      $(this).triggerHandler("loadingStateChanged", [state]);
    }
  },
  _displayFrame: function () {
    if (this._dead) {
      return;
    }
    const _this = this;
    const meta = this.op.metadata.frames[this._frame];
    this._debugLog("Displaying frame: " + this._frame + " " + meta.file);
    const image = this._frameImages[this._frame];
    if (!image) {
      this._debugLog("Image not available!");
      this._setLoadingState(0);
      return;
    }
    if (this._loadingState != 2) {
      this._setLoadingState(1);
    }
    if (this.op.autosize) {
      if (
        this._context.canvas.width != image.width ||
        this._context.canvas.height != image.height
      ) {
        // make the canvas autosize itself according to the images drawn on it
        // should set it once, since we don't have variable sized frames
        this._context.canvas.width = image.width;
        this._context.canvas.height = image.height;
      }
    }
    this._context.clearRect(0, 0, this.op.canvas.width, this.op.canvas.height);
    this._context.drawImage(image, 0, 0);
    $(this).triggerHandler("frame", this._frame);
    if (!this._paused) {
      this._timer = setTimeout(function () {
        _this._timer = null;
        _this._nextFrame.apply(_this);
      }, meta.delay);
    }
  },
  _nextFrame: function (frame) {
    if (this._frame >= this._frameCount - 1) {
      if (this.op.loop) {
        this._frame = 0;
      } else {
        this.pause();
        return;
      }
    } else {
      this._frame += 1;
    }
    this._displayFrame();
  },
  play: function () {
    if (this._dead) {
      return;
    }
    if (this._paused) {
      $(this).triggerHandler("play", [this._frame]);
      this._paused = false;
      this._displayFrame();
    }
  },
  pause: function () {
    if (this._dead) {
      return;
    }
    if (!this._paused) {
      if (this._timer) {
        clearTimeout(this._timer);
      }
      this._paused = true;
      $(this).triggerHandler("pause", [this._frame]);
    }
  },
  rewind: function () {
    if (this._dead) {
      return;
    }
    this._frame = 0;
    if (this._timer) {
      clearTimeout(this._timer);
    }
    this._displayFrame();
  },
  stop: function () {
    this._debugLog("Stopped!");
    this._dead = true;
    if (this._timer) {
      clearTimeout(this._timer);
    }
    if (this._loadTimer) {
      clearTimeout(this._loadTimer);
    }
    this._frameImages = null;
    this._buf = null;
    this._bytes = null;
    $(this).triggerHandler("stop");
  },
  getCurrentFrame: function () {
    return this._frame;
  },
  getLoadedFrames: function () {
    return this._frameImages.length;
  },
  getFrameCount: function () {
    return this._frameCount;
  },
  hasError: function () {
    return this._failed;
  },
};

// Required for iOS <6, where Blob URLs are not available. This is slow...
// Source: https://gist.github.com/jonleighton/958841
function base64ArrayBuffer(arrayBuffer, off, byteLength) {
  let base64 = "";
  const encodings =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(arrayBuffer);
  const byteRemainder = byteLength % 3;
  const mainLength = off + byteLength - byteRemainder;
  let a, b, c, d;
  let chunk;
  // Main loop deals with bytes in chunks of 3
  for (let i = off; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }

  return base64;
}
//#endregion

export default loadIllustPreview;
