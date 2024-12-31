// ==UserScript==
// @name                PixivPreviewerL
// @namespace           https://github.com/LolipopJ/PixivPreviewer
// @version             0.1.0-2024/12/31
// @description         Original project: https://github.com/Ocrosoft/PixivPreviewer.
// @author              Ocrosoft, LolipopJ
// @match               *://www.pixiv.net/*
// @grant               unsafeWindow
// @grant               GM.xmlHttpRequest
// @grant               GM_xmlhttpRequest
// @license             GPL-3.0
// @icon                https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=32&url=https://www.pixiv.net
// @icon64              https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=https://www.pixiv.net
// @require             https://raw.githubusercontent.com/Tampermonkey/utils/refs/heads/main/requires/gh_2215_make_GM_xhr_more_parallel_again.js
// ==/UserScript==

// src/constants/index.ts
var g_version = "0.1.0";
var g_getUgoiraUrl = "/ajax/illust/#id#/ugoira_meta";
var g_getNovelUrl = "/ajax/search/novels/#key#?word=#key#&p=#page#";
var g_loadingImage = "https://pp-1252089172.cos.ap-chengdu.myqcloud.com/loading.gif";
var g_maxXhr = 64;
var g_defaultSettings = {
  lang: -1,
  enablePreview: 1,
  enableAnimePreview: 1,
  enableSort: 1,
  enableAnimeDownload: 1,
  original: 0,
  previewDelay: 500,
  previewByKey: 0,
  previewKey: 17,
  previewFullScreen: 0,
  pageCount: 3,
  favFilter: 0,
  aiFilter: 0,
  hideFavorite: 0,
  hideFollowed: 0,
  hideByTag: 0,
  hideByTagList: "",
  linkBlank: 1,
  pageByKey: 0,
  fullSizeThumb: 0,
  enableNovelSort: 1,
  novelPageCount: 3,
  novelFavFilter: 0,
  novelHideFavorite: 0,
  novelHideFollowed: 0,
  logLevel: 1,
  version: g_version
};
var PREVIEW_WRAPPER_MIN_SIZE = 48;
var PREVIEW_WRAPPER_BORDER_WIDTH = 2;
var PREVIEW_WRAPPER_BORDER_RADIUS = 8;
var PREVIEW_WRAPPER_DISTANCE_TO_MOUSE = 20;
var PREVIEW_PRELOAD_NUM = 5;

// src/enums/index.ts
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["None"] = 0] = "None";
  LogLevel2[LogLevel2["Error"] = 1] = "Error";
  LogLevel2[LogLevel2["Warning"] = 2] = "Warning";
  LogLevel2[LogLevel2["Info"] = 3] = "Info";
  LogLevel2[LogLevel2["Elements"] = 4] = "Elements";
  return LogLevel2;
})(LogLevel || {});

// src/utils/logger.ts
var ILog = class {
  prefix = "Pixiv Preview: ";
  LogLevel = {
    Verbose: 0,
    Info: 1,
    Warning: 2,
    Error: 3
  };
  level = this.LogLevel.Warning;
  v(value) {
    if (this.level <= this.LogLevel.Verbose) {
      console.log(this.prefix + value);
    }
  }
  i(info) {
    if (this.level <= this.LogLevel.Info) {
      console.info(this.prefix + info);
    }
  }
  w(warning) {
    if (this.level <= this.LogLevel.Warning) {
      console.warn(this.prefix + warning);
    }
  }
  e(error) {
    if (this.level <= this.LogLevel.Error) {
      console.error(this.prefix + error);
    }
  }
  d(data) {
    if (this.level <= this.LogLevel.Verbose) {
      console.log(String(data));
    }
  }
  setLogLevel(logLevel) {
    this.level = logLevel;
  }
};
var iLog = new ILog();
function DoLog(level, msgOrElement) {
  if (level <= 1 /* Error */) {
    let prefix = "%c";
    let param = "";
    if (level == 1 /* Error */) {
      prefix += "[Error]";
      param = "color:#ff0000";
    } else if (level == 2 /* Warning */) {
      prefix += "[Warning]";
      param = "color:#ffa500";
    } else if (level == 3 /* Info */) {
      prefix += "[Info]";
      param = "color:#000000";
    } else if (level == 4 /* Elements */) {
      prefix += "Elements";
      param = "color:#000000";
    }
    if (level != 4 /* Elements */) {
      console.log(prefix + msgOrElement, param);
    } else {
      console.log(msgOrElement);
    }
  }
}

// src/services/xml-http-request.ts
var xmlHttpRequest = (
  // @ts-expect-error: auto injected by Tampermonkey
  window.GM_xmlhttpRequest ?? window.GM.xmlHttpRequest
);
var request = (options) => {
  const { headers, ...restOptions } = options;
  xmlHttpRequest({
    ...restOptions,
    headers: {
      referer: "https://www.pixiv.net/",
      ...headers
    }
  });
};
var xml_http_request_default = request;

// src/services/download.ts
var downloadFile = (url, filename, options = {}) => {
  const { onload, onerror, ...restOptions } = options;
  xml_http_request_default({
    ...restOptions,
    url,
    method: "GET",
    responseType: "blob",
    onload: async (resp) => {
      onload?.(resp);
      const blob = new Blob([resp.response], { type: resp.responseType });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    },
    onerror: (resp) => {
      onerror?.(resp);
      iLog.e(`Download ${filename} from ${url} failed: ${resp.responseText}`);
    }
  });
};

// src/services/preview.ts
var downloadIllust = ({
  url,
  filename,
  options = {}
}) => {
  downloadFile(url, filename, {
    ...options,
    onerror: (resp) => {
      options.onerror?.(resp);
      window.open(url, "__blank");
    }
  });
};
var getIllustPagesRequestUrl = (id) => {
  return `/ajax/illust/${id}/pages`;
};
var getUgoiraMetadataRequestUrl = (id) => {
  return `/ajax/illust/${id}/ugoira_meta`;
};

// src/utils/debounce.ts
function debounce(func, delay = 100) {
  let timeoutId = null;
  return function(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
var debounce_default = debounce;

// src/utils/mouse-monitor.ts
var MouseMonitor = class {
  /** 鼠标相对网页的位置 */
  mousePos = [0, 0];
  /** 鼠标相对视窗的绝对位置 */
  mouseAbsPos = [0, 0];
  constructor() {
    document.addEventListener("mousemove", (mouseMoveEvent) => {
      this.mousePos = [mouseMoveEvent.pageX, mouseMoveEvent.pageY];
      this.mouseAbsPos = [mouseMoveEvent.clientX, mouseMoveEvent.clientY];
    });
  }
};
var mouseMonitor = new MouseMonitor();
var mouse_monitor_default = mouseMonitor;

// src/utils/ugoira-player.ts
function ZipImagePlayer(options) {
  this.op = options;
  this._URL = window.URL || window.webkitURL || window.MozURL || window.MSURL;
  this._Blob = window.Blob || window.WebKitBlob || window.MozBlob || window.MSBlob;
  this._BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
  this._Uint8Array = window.Uint8Array || window.WebKitUint8Array || window.MozUint8Array || window.MSUint8Array;
  this._DataView = window.DataView || window.WebKitDataView || window.MozDataView || window.MSDataView;
  this._ArrayBuffer = window.ArrayBuffer || window.WebKitArrayBuffer || window.MozArrayBuffer || window.MSArrayBuffer;
  this._maxLoadAhead = 0;
  if (!this._URL) {
    this._debugLog("No URL support! Will use slower data: URLs.");
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
  this._isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") > 0;
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
  _trailerBytes: 3e4,
  _failed: false,
  _mkerr: function(msg) {
    const _this = this;
    return function() {
      _this._error(msg);
    };
  },
  _error: function(msg) {
    this._failed = true;
    throw Error("ZipImagePlayer error: " + msg);
  },
  _debugLog: function(msg) {
    if (this.op.debug) {
      console.log(msg);
    }
  },
  _load: function(offset, length, callback) {
    const _this = this;
    const xhr = new XMLHttpRequest();
    xhr.addEventListener(
      "load",
      function() {
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
              "Unexpected length " + xhr.response.byteLength + " (expected " + length + ")"
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
        xhr.setRequestHeader("Cache-control", "no-cache");
        xhr.setRequestHeader("If-None-Match", Math.random().toString());
      }
    }
    xhr.send();
  },
  _startLoad: function() {
    const _this = this;
    if (!this.op.source) {
      this._loadNextFrame();
      return;
    }
    $.ajax({
      url: this.op.source,
      type: "HEAD"
    }).done(function(data, status, xhr) {
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
        _this._load(null, null, function(off2, len2) {
          _this._pTail = 0;
          _this._pHead = len2;
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
      _this._load(off, len - off, function(off2) {
        _this._pTail = off2;
        _this._findCentralDirectory();
      });
    }).fail(this._mkerr("Length fetch failed"));
  },
  _findCentralDirectory: function() {
    const dv = new this._DataView(this._buf, this._len - 22, 22);
    if (dv.getUint32(0, true) != 101010256) {
      this._error("End of Central Directory signature not found");
    }
    const cd_count = dv.getUint16(10, true);
    const cd_size = dv.getUint32(12, true);
    const cd_off = dv.getUint32(16, true);
    if (cd_off < this._pTail) {
      this._load(cd_off, this._pTail - cd_off, function() {
        this._pTail = cd_off;
        this._readCentralDirectory(cd_off, cd_size, cd_count);
      });
    } else {
      this._readCentralDirectory(cd_off, cd_size, cd_count);
    }
  },
  _readCentralDirectory: function(offset, size, count) {
    const dv = new this._DataView(this._buf, offset, size);
    let p = 0;
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) != 33639248) {
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
      this._files[name] = { off, len: uncompSize };
    }
    if (this._pHead >= this._pTail) {
      this._pHead = this._len;
      $(this).triggerHandler("loadProgress", [this._pHead / this._len]);
      this._loadNextFrame();
    } else {
      this._loadNextChunk();
      this._loadNextChunk();
    }
  },
  _loadNextChunk: function() {
    if (this._pFetch >= this._pTail) {
      return;
    }
    const off = this._pFetch;
    let len = this.op.chunkSize;
    if (this._pFetch + len > this._pTail) {
      len = this._pTail - this._pFetch;
    }
    this._pFetch += len;
    this._load(off, len, function() {
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
  _fileDataStart: function(offset) {
    const dv = new DataView(this._buf, offset, 30);
    const nameLen = dv.getUint16(26, true);
    const extraLen = dv.getUint16(28, true);
    return offset + 30 + nameLen + extraLen;
  },
  _isFileAvailable: function(name) {
    const info = this._files[name];
    if (!info) {
      this._error("File " + name + " not found in ZIP");
    }
    if (this._pHead < info.off + 30) {
      return false;
    }
    return this._pHead >= this._fileDataStart(info.off) + info.len;
  },
  _loadNextFrame: function() {
    if (this._dead) {
      return;
    }
    const frame = this._loadFrame;
    if (frame >= this._frameCount) {
      return;
    }
    const meta = this.op.metadata.frames[frame];
    if (!this.op.source) {
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
          "Blob constructor failed. Trying BlobBuilder... (" + err.message + ")"
        );
        const bb = new this._BlobBuilder();
        bb.append(slice);
        blob = bb.getBlob();
      }
      url = this._URL.createObjectURL(blob);
      this._loadImage(frame, url, true);
    } else {
      url = "data:" + mime_type + ";base64," + base64ArrayBuffer(this._buf, off, end - off);
      this._loadImage(frame, url, false);
    }
  },
  _loadImage: function(frame, url, isBlob) {
    const _this = this;
    const image = new Image();
    const meta = this.op.metadata.frames[frame];
    image.addEventListener("load", function() {
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
        if (!_this._maxLoadAhead || frame - _this._frame < _this._maxLoadAhead) {
          _this._loadNextFrame();
        } else if (!_this._loadTimer) {
          _this._loadTimer = setTimeout(function() {
            _this._loadTimer = null;
            _this._loadNextFrame();
          }, 200);
        }
      }
    });
    image.src = url;
  },
  _setLoadingState: function(state) {
    if (this._loadingState != state) {
      this._loadingState = state;
      $(this).triggerHandler("loadingStateChanged", [state]);
    }
  },
  _displayFrame: function() {
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
      if (this._context.canvas.width != image.width || this._context.canvas.height != image.height) {
        this._context.canvas.width = image.width;
        this._context.canvas.height = image.height;
      }
    }
    this._context.clearRect(0, 0, this.op.canvas.width, this.op.canvas.height);
    this._context.drawImage(image, 0, 0);
    $(this).triggerHandler("frame", this._frame);
    if (!this._paused) {
      this._timer = setTimeout(function() {
        _this._timer = null;
        _this._nextFrame.apply(_this);
      }, meta.delay);
    }
  },
  _nextFrame: function() {
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
  play: function() {
    if (this._dead) {
      return;
    }
    if (this._paused) {
      $(this).triggerHandler("play", [this._frame]);
      this._paused = false;
      this._displayFrame();
    }
  },
  pause: function() {
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
  rewind: function() {
    if (this._dead) {
      return;
    }
    this._frame = 0;
    if (this._timer) {
      clearTimeout(this._timer);
    }
    this._displayFrame();
  },
  stop: function() {
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
  getCurrentFrame: function() {
    return this._frame;
  },
  getLoadedFrames: function() {
    return this._frameImages.length;
  },
  getFrameCount: function() {
    return this._frameCount;
  },
  hasError: function() {
    return this._failed;
  }
};
function base64ArrayBuffer(arrayBuffer, off, byteLength) {
  let base64 = "";
  const encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(arrayBuffer);
  const byteRemainder = byteLength % 3;
  const mainLength = off + byteLength - byteRemainder;
  let a, b, c, d;
  let chunk;
  for (let i = off; i < mainLength; i = i + 3) {
    chunk = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
    a = (chunk & 16515072) >> 18;
    b = (chunk & 258048) >> 12;
    c = (chunk & 4032) >> 6;
    d = chunk & 63;
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];
    a = (chunk & 252) >> 2;
    b = (chunk & 3) << 4;
    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder == 2) {
    chunk = bytes[mainLength] << 8 | bytes[mainLength + 1];
    a = (chunk & 64512) >> 10;
    b = (chunk & 1008) >> 4;
    c = (chunk & 15) << 2;
    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }
  return base64;
}
var ugoira_player_default = ZipImagePlayer;

// src/features/preview.ts
var isInitialized = false;
var loadIllustPreview = (options) => {
  if (isInitialized) return;
  const { previewDelay, enableAnimePreview } = options;
  const mouseHoverDebounceWait = previewDelay / 5;
  const mouseHoverPreviewWait = previewDelay - mouseHoverDebounceWait;
  class PreviewedIllust {
    /** 当前正在预览的作品元素 */
    illustElement;
    /** 预览作品是否初始化 */
    initialized = false;
    /** 图片的链接 */
    regularUrls;
    /** 图片的原图链接 */
    originalUrls;
    /** 当前预览图片的页数 */
    currentPage;
    /** 当前预览图片的总页数 */
    pageCount;
    /** 预览图片或动图容器 */
    previewWrapperElement;
    /** 预览容器顶部栏 */
    previewWrapperHeader;
    /** 当前预览的是第几张图片标记 */
    pageCountElement;
    pageCountText;
    /** 下载原图按钮 */
    downloadOriginalElement;
    /** 预览图片或动图加载状态 */
    previewLoadingElement;
    /** 当前预览的图片或动图 */
    previewImageElement;
    /** 当前预览图片的实际尺寸 */
    #currentIllustSize;
    /** 保存的鼠标位置 */
    #prevMousePos;
    /** 当前预览的动图播放器 */
    #currentUgoiraPlayer;
    /** 关闭预览组件，重置初始值 */
    reset() {
      this.illustElement = $();
      this.initialized = false;
      this.regularUrls = [];
      this.originalUrls = [];
      this.currentPage = 1;
      this.pageCount = 1;
      this.previewWrapperElement?.remove();
      this.previewWrapperElement = $(document.createElement("div")).attr({ id: "pp-wrapper" }).css({
        position: "fixed",
        "z-index": "999999",
        border: `${PREVIEW_WRAPPER_BORDER_WIDTH}px solid rgb(0, 150, 250)`,
        "border-radius": `${PREVIEW_WRAPPER_BORDER_RADIUS}px`,
        background: "rgba(31, 31, 31, 0.8)",
        "backdrop-filter": "blur(4px)",
        "text-align": "center"
      }).hide().appendTo($("body"));
      this.previewWrapperHeader = $(document.createElement("div")).attr({
        id: "pp-wrapper__header"
      }).css({
        position: "absolute",
        top: "0px",
        left: "0px",
        right: "0px",
        padding: "5px",
        display: "flex",
        gap: "5px",
        "align-items": "center",
        "justify-content": "flex-end"
      }).appendTo(this.previewWrapperElement);
      this.pageCountText = $(document.createElement("span")).attr({ id: "pp-page-count__text" }).css({ "margin-left": "4px" }).text("1/1");
      this.pageCountElement = $(document.createElement("div")).attr({ id: "pp-page-count" }).css({
        display: "flex",
        "align-items": "center",
        height: "20px",
        "border-radius": "10px",
        color: "white",
        background: "rgba(0, 0, 0, 0.32)",
        "font-size": "10px",
        "line-height": "12px",
        "font-weight": "bold",
        flex: "0 0 auto",
        padding: "3px 6px"
      }).append(
        $(
          '<svg viewBox="0 0 9 10" size="9"><path d="M 8 3 C 8.55228 3 9 3.44772 9 4 L 9 9 C 9 9.55228 8.55228 10 8 10 L 3 10 C 2.44772 10 2 9.55228 2 9 L 6 9 C 7.10457 9 8 8.10457 8 7 L 8 3 Z M 1 1 L 6 1 C 6.55228 1 7 1.44772 7 2 L 7 7 C 7 7.55228 6.55228 8 6 8 L 1 8 C 0.447715 8 0 7.55228 0 7 L 0 2 C 0 1.44772 0.447715 1 1 1 Z"></path></svg>'
        ).css({
          "list-style": "none",
          "pointer-events": "none",
          color: "rgb(245, 245, 245)",
          "font-weight": "bold",
          stroke: "none",
          fill: "currentcolor",
          width: "9px",
          "line-height": 0,
          "font-size": "0px",
          "vertical-align": "middle"
        })
      ).append(this.pageCountText).hide().prependTo(this.previewWrapperHeader);
      this.downloadOriginalElement = $(document.createElement("a")).attr({ id: "pp-download-original" }).css({
        height: "20px",
        "border-radius": "10px",
        color: "white",
        background: "rgba(0, 0, 0, 0.32)",
        "font-size": "10px",
        "line-height": "20px",
        "font-weight": "bold",
        padding: "3px 6px",
        cursor: "pointer"
      }).text("DOWNLOAD").hide().prependTo(this.previewWrapperHeader);
      this.previewLoadingElement = $(
        new Image(PREVIEW_WRAPPER_MIN_SIZE, PREVIEW_WRAPPER_MIN_SIZE)
      ).attr({
        id: "pp-loading",
        src: g_loadingImage
      }).css({
        "border-radius": "50%"
      }).appendTo(this.previewWrapperElement);
      this.previewImageElement = $(new Image()).attr({ id: "pp-image" }).css({
        "border-radius": `${PREVIEW_WRAPPER_BORDER_RADIUS}px`
      }).hide().appendTo(this.previewWrapperElement);
      this.#prevMousePos = [0, 0];
      this.#currentIllustSize = [
        PREVIEW_WRAPPER_MIN_SIZE,
        PREVIEW_WRAPPER_MIN_SIZE
      ];
      this.#currentUgoiraPlayer?.stop();
      this.unbindPreviewImageEvents();
      this.unbindUgoiraPreviewEvents();
    }
    constructor() {
      this.reset();
    }
    //#region 预览图片功能
    /** 初始化预览容器，显示第一张图片 */
    setImage({
      illustElement,
      regularUrls,
      originalUrls
    }) {
      this.reset();
      this.initPreviewWrapper();
      this.illustElement = illustElement;
      this.regularUrls = regularUrls;
      this.originalUrls = originalUrls;
      this.currentPage = 1;
      this.pageCount = regularUrls.length;
      this.preloadImages(0, PREVIEW_PRELOAD_NUM);
      this.bindPreviewImageEvents();
      this.updatePreviewImage(0);
    }
    bindPreviewImageEvents() {
      this.previewImageElement.on("load", this.onImageLoad);
      this.previewImageElement.on("click", this.onPreviewImageMouseClick);
      this.previewImageElement.on("wheel", this.onPreviewImageMouseWheel);
      this.downloadOriginalElement.on("click", this.onDownloadImage);
      $(document).on("mousemove", this.onMouseMove);
    }
    unbindPreviewImageEvents() {
      this.previewImageElement.off();
      this.downloadOriginalElement.off();
      $(document).off("mousemove", this.onMouseMove);
    }
    /** 显示 pageIndex 指向的图片 */
    updatePreviewImage(pageIndex) {
      const currentImageUrl = this.regularUrls[pageIndex];
      this.previewImageElement.attr("src", currentImageUrl);
      this.pageCountText.text(`${pageIndex + 1}/${this.pageCount}`);
    }
    onImageLoad = () => {
      this.initialized = true;
      this.previewLoadingElement.hide();
      this.previewImageElement.show();
      this.downloadOriginalElement.show();
      if (this.pageCount > 1) {
        this.pageCountElement.show();
      }
      this.previewImageElement.css({
        width: "",
        height: ""
      });
      this.#currentIllustSize = [
        this.previewImageElement.width(),
        this.previewImageElement.height()
      ];
      this.adjustPreviewWrapper({
        baseOnMousePos: false
      });
    };
    nextPage() {
      if (this.currentPage < this.pageCount) {
        this.currentPage += 1;
      } else {
        this.currentPage = 1;
      }
      this.updatePreviewImage(this.currentPage - 1);
      this.preloadImages(
        this.currentPage - 1,
        this.currentPage - 1 + PREVIEW_PRELOAD_NUM
      );
    }
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage -= 1;
      } else {
        this.currentPage = this.pageCount;
      }
      this.updatePreviewImage(this.currentPage - 1);
    }
    preloadImages(from, to) {
      this.regularUrls.slice(from, to).map((url) => {
        const preloadImage = new Image();
        preloadImage.src = url;
      });
    }
    onPreviewImageMouseClick = () => {
      this.nextPage();
    };
    onPreviewImageMouseWheel = (mouseWheelEvent) => {
      mouseWheelEvent.preventDefault();
      if (mouseWheelEvent.originalEvent.deltaY > 0) {
        this.nextPage();
      } else {
        this.prevPage();
      }
    };
    onDownloadImage = (onClickEvent) => {
      onClickEvent.preventDefault();
      const currentImageOriginalUrl = this.originalUrls[this.currentPage - 1];
      const currentImageFilename = currentImageOriginalUrl.split("/").pop() || "illust.jpg";
      downloadIllust({
        url: currentImageOriginalUrl,
        filename: currentImageFilename
      });
    };
    //#endregion
    //#region 预览动图功能
    setUgoira({
      illustElement,
      src,
      // originalSrc,
      mime_type,
      frames
    }) {
      this.reset();
      this.initPreviewWrapper();
      this.illustElement = illustElement;
      illustElement.siblings("svg").css({ "pointer-events": "none" });
      this.#currentUgoiraPlayer = createPlayer({
        source: src,
        metadata: {
          mime_type,
          frames
        }
      });
      this.bindUgoiraPreviewEvents();
    }
    bindUgoiraPreviewEvents() {
      $(this.#currentUgoiraPlayer).on("frameLoaded", this.onUgoiraFrameLoaded);
      $(document).on("mousemove", this.onMouseMove);
    }
    unbindUgoiraPreviewEvents() {
      $(this.#currentUgoiraPlayer).off();
      $(document).off("mousemove", this.onMouseMove);
    }
    onUgoiraFrameLoaded = (ev, frame) => {
      if (frame !== 0) {
        return;
      }
      this.initialized = true;
      this.previewLoadingElement.hide();
      const canvas = $(this.#currentUgoiraPlayer.canvas);
      this.previewImageElement.after(canvas);
      this.previewImageElement.remove();
      this.previewImageElement = canvas;
      const ugoiraOriginWidth = ev.currentTarget._frameImages[0].width;
      const ugoiraOriginHeight = ev.currentTarget._frameImages[0].height;
      this.#currentIllustSize = [ugoiraOriginWidth, ugoiraOriginHeight];
      this.previewImageElement.attr({
        width: ugoiraOriginWidth,
        height: ugoiraOriginHeight
      });
      this.adjustPreviewWrapper({
        baseOnMousePos: false
      });
    };
    //#endregion
    /** 初始化显示预览容器 */
    initPreviewWrapper() {
      this.previewWrapperElement.show();
      this.previewLoadingElement.show();
      this.adjustPreviewWrapper({
        baseOnMousePos: true
      });
    }
    onMouseMove = (mouseMoveEvent) => {
      if (mouseMoveEvent.ctrlKey) {
        return;
      }
      const currentElement = $(mouseMoveEvent.target);
      if (currentElement.is(this.illustElement)) {
        this.adjustPreviewWrapper({
          baseOnMousePos: true
        });
      } else {
        this.reset();
      }
    };
    /**
     * 调整预览容器的位置与大小
     * @param `baseOnMousePos` 是否根据当前鼠标所在位置调整
     * @param `illustSize` 作品的实际大小
     */
    adjustPreviewWrapper({
      baseOnMousePos = true
    } = {}) {
      const [mousePosX, mousePosY] = baseOnMousePos ? mouse_monitor_default.mouseAbsPos : this.#prevMousePos;
      this.#prevMousePos = [mousePosX, mousePosY];
      const [illustWidth, illustHeight] = this.#currentIllustSize;
      const screenWidth = document.documentElement.clientWidth;
      const screenHeight = document.documentElement.clientHeight;
      const isShowLeft = mousePosX > screenWidth / 2;
      const isShowTop = mousePosY > screenHeight / 2;
      const illustRatio = illustWidth / illustHeight;
      const screenRestWidth = isShowLeft ? mousePosX - PREVIEW_WRAPPER_DISTANCE_TO_MOUSE : screenWidth - mousePosX - PREVIEW_WRAPPER_DISTANCE_TO_MOUSE;
      const screenRestRatio = screenRestWidth / screenHeight;
      const isFitToFullHeight = screenRestRatio > illustRatio;
      let fitToScreenScale = 1;
      if (this.initialized) {
        if (isFitToFullHeight) {
          fitToScreenScale = Number((screenHeight / illustHeight).toFixed(3));
        } else {
          fitToScreenScale = Number((screenRestWidth / illustWidth).toFixed(3));
        }
      }
      const previewImageFitWidth = Math.floor(illustWidth * fitToScreenScale);
      const previewImageFitHeight = Math.floor(illustHeight * fitToScreenScale);
      const previewWrapperElementPos = {
        left: "",
        right: "",
        top: "",
        bottom: ""
      };
      if (isShowLeft) {
        previewWrapperElementPos.right = `${screenWidth - mousePosX + PREVIEW_WRAPPER_DISTANCE_TO_MOUSE}px`;
      } else {
        previewWrapperElementPos.left = `${mousePosX + PREVIEW_WRAPPER_DISTANCE_TO_MOUSE}px`;
      }
      if (this.initialized) {
        if (isFitToFullHeight) {
          previewWrapperElementPos.top = "0px";
        } else {
          const screenRestHeight = isShowTop ? mousePosY : screenHeight - mousePosY;
          if (previewImageFitHeight > screenRestHeight) {
            if (isShowTop) {
              previewWrapperElementPos.top = "0px";
            } else {
              previewWrapperElementPos.bottom = "0px";
            }
          } else {
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
        height: `${previewImageFitHeight}px`
      });
    }
  }
  inactiveUnexpectedDoms();
  const previewIllust = previewIllustWithCache();
  const debouncedOnMouseOverIllust = debounce_default(
    onMouseOverIllust,
    mouseHoverDebounceWait
  );
  $(document).mouseover(debouncedOnMouseOverIllust);
  function onMouseOverIllust(mouseOverEvent) {
    if (mouseOverEvent.ctrlKey) {
      return;
    }
    const target = $(mouseOverEvent.target);
    if (!(target.is("IMG") || target.is("A"))) {
      return;
    }
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
    let currentHoveredIllustId = "";
    const getIllustPagesCache = {};
    const getUgoiraMetadataCache = {};
    return (target) => {
      const illustMetadata = getIllustMetadata(target);
      if (!illustMetadata) {
        return;
      }
      const { illustId, illustType } = illustMetadata;
      currentHoveredIllustId = illustId;
      if (illustType === 2 /* UGOIRA */ && !enableAnimePreview) {
        iLog.i("Anime preview disabled.");
        return;
      }
      if ([0 /* ILLUST */, 1 /* MANGA */].includes(illustType)) {
        if (getIllustPagesCache[illustId]) {
          previewedIllust.setImage({
            illustElement: target,
            ...getIllustPagesCache[illustId]
          });
          return;
        }
        $.ajax(getIllustPagesRequestUrl(illustId), {
          method: "GET",
          success: (data) => {
            if (data.error) {
              iLog.e(
                `Get an error while requesting illust url: ${data.message}`
              );
              return;
            }
            const urls = data.body.map((item) => item.urls);
            const regularUrls = urls.map((url) => url.regular);
            const originalUrls = urls.map((url) => url.original);
            getIllustPagesCache[illustId] = {
              regularUrls,
              originalUrls
            };
            if (currentHoveredIllustId !== illustId) return;
            previewedIllust.setImage({
              illustElement: target,
              regularUrls,
              originalUrls
            });
          },
          error: (err) => {
            iLog.e(`Get an error while requesting illust url: ${err}`);
          }
        });
      } else if (illustType === 2 /* UGOIRA */) {
        if (getUgoiraMetadataCache[illustId]) {
          previewedIllust.setUgoira({
            illustElement: target,
            ...getUgoiraMetadataCache[illustId]
          });
          return;
        }
        $.ajax(getUgoiraMetadataRequestUrl(illustId), {
          method: "GET",
          success: (data) => {
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
              frames
            });
          },
          error: (err) => {
            iLog.e(`Get an error while requesting ugoira metadata: ${err}`);
          }
        });
      } else {
        iLog.e("Unknown illust type.");
        return;
      }
    };
  }
  function getIllustMetadata(target) {
    let imgLink = target;
    while (!imgLink.is("A")) {
      imgLink = imgLink.parent();
      if (!imgLink.length) {
        iLog.i("\u672A\u80FD\u627E\u5230\u5F53\u524D\u4F5C\u54C1\u7684\u94FE\u63A5\u5143\u7D20");
        return null;
      }
    }
    const illustHref = imgLink.attr("href");
    const illustHrefMatch = illustHref?.match(/\/artworks\/(\d+)/);
    if (!illustHrefMatch) {
      iLog.w("\u5F53\u524D\u94FE\u63A5\u975E\u4F5C\u54C1\u94FE\u63A5\uFF0C\u6216\u5F53\u524D\u4F5C\u54C1\u4E0D\u652F\u6301\u9884\u89C8\uFF0C\u8DF3\u8FC7");
      return null;
    }
    const illustId = illustHrefMatch[1];
    const ugoiraSvg = imgLink.children("div:first").find("svg:first");
    const illustType = ugoiraSvg.length || imgLink.hasClass("ugoku-illust") ? 2 /* UGOIRA */ : (
      // 合并漫画类型 IllustType.MANGA 为 IllustType.ILLUST 统一处理
      0 /* ILLUST */
    );
    return {
      /** 作品 ID */
      illustId,
      /** 作品类型 */
      illustType
    };
  }
  function createPlayer(options2) {
    const canvas = document.createElement("canvas");
    const p = new ugoira_player_default({
      canvas,
      chunkSize: 3e5,
      loop: true,
      autoStart: true,
      debug: false,
      ...options2
    });
    p.canvas = canvas;
    return p;
  }
  function inactiveUnexpectedDoms() {
    const styleRules = $("<style>").prop("type", "text/css");
    styleRules.append(`
._layout-thumbnail .sc-hnotl9-0.gDHFA-d {
  pointer-events: none;
}`);
    styleRules.appendTo("head");
  }
  isInitialized = true;
};

// src/i18n/index.ts
var Texts = {};
Texts[0 /* zh_CN */] = {
  // 安装或更新后弹出的提示
  install_title: "\u6B22\u8FCE\u4F7F\u7528 PixivPreviewerL v",
  install_body: '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><p style="text-indent: 2em;">\u6B22\u8FCE\u53CD\u9988\u95EE\u9898\u548C\u63D0\u51FA\u5EFA\u8BAE\uFF01><a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback" target="_blank">\u53CD\u9988\u9875\u9762</a><</p><br><p style="text-indent: 2em;">\u5982\u679C\u60A8\u662F\u7B2C\u4E00\u6B21\u4F7F\u7528\uFF0C\u63A8\u8350\u5230<a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer" target="_blank"> \u8BE6\u60C5\u9875 </a>\u67E5\u770B\u811A\u672C\u4ECB\u7ECD\u3002</p></div>',
  upgrade_body: "",
  // 设置项
  setting_language: "\u8BED\u8A00",
  setting_preview: "\u9884\u89C8",
  setting_animePreview: "\u52A8\u56FE\u9884\u89C8",
  setting_sort: "\u6392\u5E8F\uFF08\u4EC5\u641C\u7D22\u9875\u751F\u6548\uFF09",
  setting_anime: "\u52A8\u56FE\u4E0B\u8F7D\uFF08\u52A8\u56FE\u9884\u89C8\u53CA\u8BE6\u60C5\u9875\u751F\u6548\uFF09",
  setting_origin: "\u9884\u89C8\u65F6\u4F18\u5148\u663E\u793A\u539F\u56FE\uFF08\u6162\uFF09",
  setting_previewDelay: "\u5EF6\u8FDF\u663E\u793A\u9884\u89C8\u56FE\uFF08\u6BEB\u79D2\uFF09",
  setting_previewByKey: "\u4F7F\u7528\u6309\u952E\u63A7\u5236\u9884\u89C8\u56FE\u5C55\u793A\uFF08Ctrl\uFF09",
  setting_previewByKeyHelp: "\u5F00\u542F\u540E\u9F20\u6807\u79FB\u52A8\u5230\u56FE\u7247\u4E0A\u4E0D\u518D\u5C55\u793A\u9884\u89C8\u56FE\uFF0C\u6309\u4E0BCtrl\u952E\u624D\u5C55\u793A\uFF0C\u540C\u65F6\u201C\u5EF6\u8FDF\u663E\u793A\u9884\u89C8\u201D\u8BBE\u7F6E\u9879\u4E0D\u751F\u6548\u3002",
  setting_maxPage: "\u6BCF\u6B21\u6392\u5E8F\u65F6\u7EDF\u8BA1\u7684\u6700\u5927\u9875\u6570",
  setting_hideWork: "\u9690\u85CF\u6536\u85CF\u6570\u5C11\u4E8E\u8BBE\u5B9A\u503C\u7684\u4F5C\u54C1",
  setting_hideAiWork: "\u9690\u85CF AI \u751F\u6210\u4F5C\u54C1",
  setting_hideFav: "\u6392\u5E8F\u65F6\u9690\u85CF\u5DF2\u6536\u85CF\u7684\u4F5C\u54C1",
  setting_hideFollowed: "\u6392\u5E8F\u65F6\u9690\u85CF\u5DF2\u5173\u6CE8\u753B\u5E08\u4F5C\u54C1",
  setting_hideByTag: "\u6392\u5E8F\u65F6\u9690\u85CF\u6307\u5B9A\u6807\u7B7E\u7684\u4F5C\u54C1",
  setting_hideByTagPlaceholder: "\u8F93\u5165\u6807\u7B7E\u540D\uFF0C\u591A\u4E2A\u6807\u7B7E\u7528','\u5206\u9694",
  setting_clearFollowingCache: "\u6E05\u9664\u7F13\u5B58",
  setting_clearFollowingCacheHelp: "\u5173\u6CE8\u753B\u5E08\u4FE1\u606F\u4F1A\u5728\u672C\u5730\u4FDD\u5B58\u4E00\u5929\uFF0C\u5982\u679C\u5E0C\u671B\u7ACB\u5373\u66F4\u65B0\uFF0C\u8BF7\u70B9\u51FB\u6E05\u9664\u7F13\u5B58",
  setting_followingCacheCleared: "\u5DF2\u6E05\u9664\u7F13\u5B58\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u3002",
  setting_blank: "\u4F7F\u7528\u65B0\u6807\u7B7E\u9875\u6253\u5F00\u4F5C\u54C1\u8BE6\u60C5\u9875",
  setting_turnPage: "\u4F7F\u7528\u952E\u76D8\u2190\u2192\u8FDB\u884C\u7FFB\u9875\uFF08\u6392\u5E8F\u540E\u7684\u641C\u7D22\u9875\uFF09",
  setting_save: "\u4FDD\u5B58\u8BBE\u7F6E",
  setting_reset: "\u91CD\u7F6E\u811A\u672C",
  setting_resetHint: "\u8FD9\u4F1A\u5220\u9664\u6240\u6709\u8BBE\u7F6E\uFF0C\u76F8\u5F53\u4E8E\u91CD\u65B0\u5B89\u88C5\u811A\u672C\uFF0C\u786E\u5B9A\u8981\u91CD\u7F6E\u5417\uFF1F",
  setting_novelSort: "\u5C0F\u8BF4\u6392\u5E8F",
  setting_novelMaxPage: "\u5C0F\u8BF4\u6392\u5E8F\u65F6\u7EDF\u8BA1\u7684\u6700\u5927\u9875\u6570",
  setting_novelHideWork: "\u9690\u85CF\u6536\u85CF\u6570\u5C11\u4E8E\u8BBE\u5B9A\u503C\u7684\u4F5C\u54C1",
  setting_novelHideFav: "\u6392\u5E8F\u65F6\u9690\u85CF\u5DF2\u6536\u85CF\u7684\u4F5C\u54C1",
  // 搜索时过滤值太高
  sort_noWork: "\u6CA1\u6709\u53EF\u4EE5\u663E\u793A\u7684\u4F5C\u54C1\uFF08\u9690\u85CF\u4E86 %1 \u4E2A\u4F5C\u54C1\uFF09",
  sort_getWorks: "\u6B63\u5728\u83B7\u53D6\u7B2C %1/%2 \u9875\u4F5C\u54C1",
  sort_getBookmarkCount: "\u83B7\u53D6\u6536\u85CF\u6570\uFF1A%1/%2",
  sort_getPublicFollowing: "\u83B7\u53D6\u516C\u5F00\u5173\u6CE8\u753B\u5E08",
  sort_getPrivateFollowing: "\u83B7\u53D6\u79C1\u6709\u5173\u6CE8\u753B\u5E08",
  sort_filtering: "\u8FC7\u6EE4%1\u6536\u85CF\u91CF\u4F4E\u4E8E%2\u7684\u4F5C\u54C1",
  sort_filteringHideFavorite: "\u5DF2\u6536\u85CF\u548C",
  sort_fullSizeThumb: "\u5168\u5C3A\u5BF8\u7F29\u7565\u56FE\uFF08\u641C\u7D22\u9875\u3001\u7528\u6237\u9875\uFF09",
  // 小说排序
  nsort_getWorks: "\u6B63\u5728\u83B7\u53D6\u7B2C 1%/2% \u9875\u4F5C\u54C1",
  nsort_sorting: "\u6B63\u5728\u6309\u6536\u85CF\u91CF\u6392\u5E8F",
  nsort_hideFav: "\u6392\u5E8F\u65F6\u9690\u85CF\u5DF2\u6536\u85CF\u7684\u4F5C\u54C1",
  nsort_hideFollowed: "\u6392\u5E8F\u65F6\u9690\u85CF\u5DF2\u5173\u6CE8\u4F5C\u8005\u4F5C\u54C1",
  text_sort: "\u6392\u5E8F"
};
Texts[1 /* en_US */] = {
  install_title: "Welcome to PixivPreviewerL v",
  install_body: '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><p style="text-indent: 2em;">Feedback questions and suggestions are welcome! ><a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback" target="_blank">Feedback Page</a><</p><br><p style="text-indent: 2em;">If you are using it for the first time, it is recommended to go to the<a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer" target="_blank"> Details Page </a>to see the script introduction.</p></div>',
  upgrade_body: "",
  setting_language: "Language",
  setting_preview: "Preview",
  setting_animePreview: "Animation preview",
  setting_sort: "Sorting (Search page)",
  setting_anime: "Animation download (Preview and Artwork page)",
  setting_origin: "Display original image when preview (slow)",
  setting_previewDelay: "Delay of display preview image(Million seconds)",
  setting_previewByKey: "Use keys to control the preview image display (Ctrl)",
  setting_previewByKeyHelp: 'After enabling it, move the mouse to the picture and no longer display the preview image. Press the Ctrl key to display it, and the "Delayed Display Preview" setting item does not take effect.',
  setting_maxPage: "Maximum number of pages counted per sort",
  setting_hideWork: "Hide works with bookmark count less than set value",
  setting_hideAiWork: "Hide AI works",
  setting_hideFav: "Hide favorites when sorting",
  setting_hideFollowed: "Hide artworks of followed artists when sorting",
  setting_hideByTag: "Hide artworks by tag",
  setting_hideByTagPlaceholder: "Input tag name, multiple tags separated by ','",
  setting_clearFollowingCache: "Cache",
  setting_clearFollowingCacheHelp: "The folloing artists info. will be saved locally for one day, if you want to update immediately, please click this to clear cache",
  setting_followingCacheCleared: "Success, please refresh the page.",
  setting_blank: "Open works' details page in new tab",
  setting_turnPage: "Use \u2190 \u2192 to turn pages (Search page)",
  setting_save: "Save",
  setting_reset: "Reset",
  setting_resetHint: "This will delete all settings and set it to default. Are you sure?",
  setting_novelSort: "Sorting (Novel)",
  setting_novelMaxPage: "Maximum number of pages counted for novel sorting",
  setting_novelHideWork: "Hide works with bookmark count less than set value",
  setting_novelHideFav: "Hide favorites when sorting",
  sort_noWork: "No works to display (%1 works hideen)",
  sort_getWorks: "Getting artworks of page: %1 of %2",
  sort_getBookmarkCount: "Getting bookmark count of artworks\uFF1A%1 of %2",
  sort_getPublicFollowing: "Getting public following list",
  sort_getPrivateFollowing: "Getting private following list",
  sort_filtering: "Filtering%1works with bookmark count less than %2",
  sort_filteringHideFavorite: " favorited works and ",
  sort_fullSizeThumb: "Display not cropped images.(Search page and User page only.)",
  nsort_getWorks: "Getting novels of page: 1% of 2%",
  nsort_sorting: "Sorting by bookmark cound",
  nsort_hideFav: "Hide favorites when sorting",
  nsort_hideFollowed: "Hide artworks of followed authors when sorting",
  text_sort: "sort"
};
Texts[2 /* ru_RU */] = {
  install_title: "\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C \u0432 PixivPreviewerL v",
  install_body: '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><p style="text-indent: 2em;">\u0412\u043E\u043F\u0440\u043E\u0441\u044B \u0438 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043F\u0440\u0438\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044E\u0442\u0441\u044F! ><a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback" target="_blank">\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043E\u0431\u0440\u0430\u0442\u043D\u043E\u0439 \u0441\u0432\u044F\u0437\u0438</a><</p><br><p style="text-indent: 2em;">\u0415\u0441\u043B\u0438 \u0432\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0435 \u044D\u0442\u043E \u0432\u043F\u0435\u0440\u0432\u044B\u0435, \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F \u043F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A<a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer" target="_blank"> \u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0435\u0439 </a>, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0432\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u0432 \u0441\u043A\u0440\u0438\u043F\u0442.</p></div>',
  upgrade_body: Texts[1 /* en_US */].upgrade_body,
  setting_language: "\u042F\u0437\u044B\u043A",
  setting_preview: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440",
  setting_animePreview: Texts[1 /* en_US */].setting_animePreview,
  setting_sort: "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430 (\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043F\u043E\u0438\u0441\u043A\u0430)",
  setting_anime: "\u0410\u043D\u0438\u043C\u0430\u0446\u0438\u044F \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F (\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0438 Artwork)",
  setting_origin: "\u041F\u0440\u0438 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0435, \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u0441 \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u043C \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E\u043C (\u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E)",
  setting_previewDelay: "\u0417\u0430\u0434\u0435\u0440\u0436\u043A\u0430 \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F (\u041C\u0438\u043B\u043B\u0438\u043E\u043D \u0441\u0435\u043A\u0443\u043D\u0434)",
  setting_previewByKey: Texts[1 /* en_US */].setting_previewByKey,
  setting_previewByKeyHelp: Texts[1 /* en_US */].setting_previewByKeyHelp,
  setting_maxPage: "\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0441\u0442\u0440\u0430\u043D\u0438\u0446, \u043F\u043E\u0434\u0441\u0447\u0438\u0442\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0443",
  setting_hideWork: "\u0421\u043A\u0440\u044B\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u044B \u0441 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E\u043C \u0437\u0430\u043A\u043B\u0430\u0434\u043E\u043A \u043C\u0435\u043D\u044C\u0448\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u043E\u0433\u043E \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F",
  setting_hideAiWork: Texts[1 /* en_US */].setting_hideAiWork,
  setting_hideFav: "\u041F\u0440\u0438 \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0435, \u0441\u043A\u0440\u044B\u0442\u044C \u0438\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435",
  setting_hideFollowed: "\u041F\u0440\u0438 \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0435, \u0441\u043A\u0440\u044B\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u044B \u0445\u0443\u0434\u043E\u0436\u043D\u0438\u043A\u043E\u0432 \u043D\u0430 \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u044B",
  setting_hideByTag: Texts[1 /* en_US */].setting_hideByTag,
  setting_hideByTagPlaceholder: Texts[1 /* en_US */].setting_hideByTagPlaceholder,
  setting_clearFollowingCache: "\u041A\u044D\u0448",
  setting_clearFollowingCacheHelp: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u0445\u0443\u0434\u043E\u0436\u043D\u0438\u043A\u0430\u0445 \u0431\u0443\u0434\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0430 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 \u043E\u0434\u043D\u043E\u0433\u043E \u0434\u043D\u044F, \u0435\u0441\u043B\u0438 \u0432\u044B \u0445\u043E\u0442\u0438\u0442\u0435 \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0435\u0451 \u043D\u0435\u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E, \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u043D\u0430 \u044D\u0442\u0443 \u043A\u043D\u043E\u043F\u043A\u0443, \u0447\u0442\u043E\u0431\u044B \u043E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043A\u044D\u0448",
  setting_followingCacheCleared: "\u0413\u043E\u0442\u043E\u0432\u043E, \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443.",
  setting_blank: "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u0441 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435\u043C \u0440\u0430\u0431\u043E\u0442\u044B \u043D\u0430 \u043D\u043E\u0432\u043E\u0439 \u0432\u043A\u043B\u0430\u0434\u043A\u0435",
  setting_turnPage: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u2190 \u2192 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u043B\u0438\u0441\u0442\u044B\u0432\u0430\u043D\u0438\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446 (\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043F\u043E\u0438\u0441\u043A\u0430)",
  setting_save: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
  setting_reset: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C",
  setting_resetHint: "\u042D\u0442\u043E \u0443\u0434\u0430\u043B\u0438\u0442 \u0432\u0441\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442 \u0438\u0445 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E. \u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C?",
  setting_novelSort: Texts[1 /* en_US */].setting_novelSort,
  setting_novelMaxPage: Texts[1 /* en_US */].setting_novelMaxPage,
  setting_novelHideWork: "\u0421\u043A\u0440\u044B\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u044B \u0441 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E\u043C \u0437\u0430\u043A\u043B\u0430\u0434\u043E\u043A \u043C\u0435\u043D\u044C\u0448\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u043E\u0433\u043E \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F",
  setting_novelHideFav: "\u041F\u0440\u0438 \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0435, \u0441\u043A\u0440\u044B\u0442\u044C \u0438\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435",
  sort_noWork: "\u041D\u0435\u0442 \u0440\u0430\u0431\u043E\u0442 \u0434\u043B\u044F \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F (%1 works hidden)",
  sort_getWorks: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u0438\u043B\u043B\u044E\u0441\u0442\u0440\u0430\u0446\u0438\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B: %1 \u0438\u0437 %2",
  sort_getBookmarkCount: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u0430 \u0437\u0430\u043A\u043B\u0430\u0434\u043E\u043A artworks\uFF1A%1 \u0438\u0437 %2",
  sort_getPublicFollowing: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u043F\u0443\u0431\u043B\u0438\u0447\u043D\u043E\u0433\u043E \u0441\u043F\u0438\u0441\u043A\u0430 \u043F\u043E\u0434\u043F\u0438\u0441\u043E\u043A",
  sort_getPrivateFollowing: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u043F\u0440\u0438\u0432\u0430\u0442\u043D\u043E\u0433\u043E \u0441\u043F\u0438\u0441\u043A\u0430 \u043F\u043E\u0434\u043F\u0438\u0441\u043E\u043A",
  sort_filtering: "\u0424\u0438\u043B\u044C\u0442\u0440\u0430\u0446\u0438\u044F %1 \u0440\u0430\u0431\u043E\u0442 \u0441 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E\u043C \u0437\u0430\u043A\u043B\u0430\u0434\u043E\u043A \u043C\u0435\u043D\u044C\u0448\u0435 \u0447\u0435\u043C %2",
  sort_filteringHideFavorite: " \u0438\u0437\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u0440\u0430\u0431\u043E\u0442\u044B \u0438 ",
  sort_fullSizeThumb: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043D\u0435\u043E\u0442\u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 (\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043F\u043E\u0438\u0441\u043A\u0430 \u0438 Artwork)",
  nsort_getWorks: Texts[1 /* en_US */].nsort_getWorks,
  nsort_sorting: Texts[1 /* en_US */].nsort_sorting,
  nsort_hideFav: Texts[1 /* en_US */].nsort_hideFav,
  nsort_hideFollowed: Texts[1 /* en_US */].nsort_hideFollowed,
  text_sort: Texts[1 /* en_US */].text_sort
};
Texts[3 /* ja_JP */] = {
  install_title: "Welcome to PixivPreviewerL v",
  install_body: '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><p style="text-indent: 2em;"\u3054\u610F\u898B\u3084\u63D0\u6848\u306F\u5927\u6B53\u8FCE\u3067\u3059! ><a style="color: green;" href="https://greasyfork.org/ja/scripts/30766-pixiv-previewer/feedback" target="_blank">\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u30DA\u30FC\u30B8</a><</p><br><p style="text-indent: 2em;">\u521D\u3081\u3066\u4F7F\u3046\u5834\u5408\u306F\u3001<a style="color: green;" href="https://greasyfork.org/ja/scripts/30766-pixiv-previewer" target="_blank"> \u8A73\u7D30\u30DA\u30FC\u30B8 </a>\u3067\u30B9\u30AF\u30EA\u30D7\u30C8\u306E\u7D39\u4ECB\u3092\u898B\u308B\u3053\u3068\u3092\u304A\u52E7\u3081\u3057\u307E\u3059\u3002</p></div>',
  upgrade_body: "",
  setting_language: "\u8A00\u8A9E",
  setting_preview: "\u30D7\u30EC\u30D3\u30E5\u30FC\u6A5F\u80FD",
  setting_animePreview: "\u3046\u3054\u30A4\u30E9\u30D7\u30EC\u30D3\u30E5\u30FC",
  setting_sort: "\u30BD\u30FC\u30C8",
  setting_anime: "\u3046\u3054\u30A4\u30E9\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
  setting_origin: "\u6700\u5927\u30B5\u30A4\u30BA\u306E\u753B\u50CF\u3092\u8868\u793A\u3059\u308B(\u9045\u304F\u306A\u308B\u53EF\u80FD\u6027\u304C\u3042\u308B)",
  setting_previewDelay: "\u30AB\u30FC\u30BD\u30EB\u3092\u91CD\u306D\u3066\u304B\u3089\u30D7\u30EC\u30D3\u30E5\u30FC\u3059\u308B\u307E\u3067\u306E\u9045\u5EF6(\u30DF\u30EA\u79D2)",
  setting_previewByKey: "\u30AD\u30FC\u3067\u30D7\u30EC\u30D3\u30E5\u30FC\u753B\u50CF\u306E\u8868\u793A\u3092\u5236\u5FA1\u3059\u308B (Ctrl)",
  setting_previewByKeyHelp: '\u3053\u308C\u3092\u6709\u52B9\u306B\u3059\u308B\u3068\u3001\u753B\u50CF\u306B\u30DE\u30A6\u30B9\u3092\u79FB\u52D5\u3057\u3066\u3082\u30D7\u30EC\u30D3\u30E5\u30FC\u753B\u50CF\u304C\u8868\u793A\u3055\u308C\u306A\u304F\u306A\u308A\u307E\u3059\u3002Ctrl\u30AD\u30FC\u3092\u62BC\u3059\u3068\u8868\u793A\u3055\u308C\u3001 "\u9045\u5EF6\u8868\u793A\u30D7\u30EC\u30D3\u30E5\u30FC" \u306E\u8A2D\u5B9A\u9805\u76EE\u306F\u7121\u52B9\u306B\u306A\u308A\u307E\u3059\u3002',
  setting_maxPage: "\u30BD\u30FC\u30C8\u3059\u308B\u3068\u304D\u306B\u53D6\u5F97\u3059\u308B\u6700\u5927\u30DA\u30FC\u30B8\u6570",
  setting_hideWork: "\u4E00\u5B9A\u4EE5\u4E0B\u306E\u30D6\u30AF\u30DE\u30FC\u30AF\u6570\u306E\u4F5C\u54C1\u3092\u975E\u8868\u793A\u306B\u3059\u308B",
  setting_hideAiWork: "AI\u306E\u4F5C\u54C1\u3092\u975E\u8868\u793A\u306B\u3059\u308B",
  setting_hideFav: "\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u6570\u3092\u30BD\u30FC\u30C8\u6642\u306B\u975E\u8868\u793A\u306B\u3059\u308B",
  setting_hideFollowed: "\u30BD\u30FC\u30C8\u6642\u306B\u30D5\u30A9\u30ED\u30FC\u3057\u3066\u3044\u308B\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u306E\u4F5C\u54C1\u3092\u975E\u8868\u793A",
  setting_hideByTag: Texts[1 /* en_US */].setting_hideByTag,
  setting_hideByTagPlaceholder: Texts[1 /* en_US */].setting_hideByTagPlaceholder,
  setting_clearFollowingCache: "\u30AD\u30E3\u30C3\u30B7\u30E5",
  setting_clearFollowingCacheHelp: "\u30D5\u30A9\u30ED\u30FC\u3057\u3066\u3044\u308B\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u306E\u60C5\u5831\u304C\u30ED\u30FC\u30AB\u30EB\u306B1\u65E5\u4FDD\u5B58\u3055\u308C\u307E\u3059\u3002\u3059\u3050\u306B\u66F4\u65B0\u3057\u305F\u3044\u5834\u5408\u306F\u3001\u3053\u306E\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u30AF\u30EA\u30A2\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  setting_followingCacheCleared: "\u6210\u529F\u3057\u307E\u3057\u305F\u3002\u30DA\u30FC\u30B8\u3092\u66F4\u65B0\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  setting_blank: "\u4F5C\u54C1\u306E\u8A73\u7D30\u30DA\u30FC\u30B8\u3092\u65B0\u3057\u3044\u30BF\u30D6\u3067\u958B\u304F",
  setting_turnPage: "\u2190 \u2192 \u3092\u4F7F\u7528\u3057\u3066\u30DA\u30FC\u30B8\u3092\u3081\u304F\u308B\uFF08\u691C\u7D22\u30DA\u30FC\u30B8\uFF09",
  setting_save: "Save",
  setting_reset: "Reset",
  setting_resetHint: "\u3053\u308C\u306B\u3088\u308A\u3001\u3059\u3079\u3066\u306E\u8A2D\u5B9A\u304C\u524A\u9664\u3055\u308C\u3001\u30C7\u30D5\u30A9\u30EB\u30C8\u306B\u8A2D\u5B9A\u3055\u308C\u307E\u3059\u3002\u3088\u308D\u3057\u3044\u3067\u3059\u304B\uFF1F",
  setting_novelSort: "\u30BD\u30FC\u30C8\uFF08\u5C0F\u8AAC\uFF09",
  setting_novelMaxPage: "\u5C0F\u8AAC\u306E\u30BD\u30FC\u30C8\u306E\u30DA\u30FC\u30B8\u6570\u306E\u6700\u5927\u5024",
  setting_novelHideWork: "\u8A2D\u5B9A\u5024\u672A\u6E80\u306E\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u6570\u306E\u4F5C\u54C1\u3092\u975E\u8868\u793A",
  setting_novelHideFav: "\u30BD\u30FC\u30C8\u6642\u306B\u304A\u6C17\u306B\u5165\u308A\u3092\u975E\u8868\u793A",
  sort_noWork: "\u8868\u793A\u3059\u308B\u4F5C\u54C1\u304C\u3042\u308A\u307E\u305B\u3093\uFF08%1 \u4F5C\u54C1\u304C\u975E\u8868\u793A\uFF09",
  sort_getWorks: "\u30DA\u30FC\u30B8\u306E\u4F5C\u54C1\u3092\u53D6\u5F97\u4E2D\uFF1A%1 / %2",
  sort_getBookmarkCount: "\u4F5C\u54C1\u306E\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u6570\u3092\u53D6\u5F97\u4E2D\uFF1A%1 / %2",
  sort_getPublicFollowing: "\u516C\u958B\u30D5\u30A9\u30ED\u30FC\u4E00\u89A7\u3092\u53D6\u5F97\u4E2D",
  sort_getPrivateFollowing: "\u975E\u516C\u958B\u30D5\u30A9\u30ED\u30FC\u4E00\u89A7\u3092\u53D6\u5F97\u4E2D",
  sort_filtering: "\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u6570\u304C%2\u672A\u6E80\u306E\u4F5C\u54C1%1\u4EF6\u3092\u30D5\u30A3\u30EB\u30BF\u30EA\u30F3\u30B0",
  sort_filteringHideFavorite: " \u304A\u6C17\u306B\u5165\u308A\u767B\u9332\u6E08\u307F\u306E\u4F5C\u54C1\u304A\u3088\u3073  ",
  sort_fullSizeThumb: "\u30C8\u30EA\u30DF\u30F3\u30B0\u3055\u308C\u3066\u3044\u306A\u3044\u753B\u50CF\u3092\u8868\u793A\uFF08\u691C\u7D22\u30DA\u30FC\u30B8\u304A\u3088\u3073\u30E6\u30FC\u30B6\u30FC\u30DA\u30FC\u30B8\u306E\u307F\uFF09\u3002",
  nsort_getWorks: "\u5C0F\u8AAC\u306E\u30DA\u30FC\u30B8\u3092\u53D6\u5F97\u4E2D\uFF1A1% / 2%",
  nsort_sorting: "\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u6570\u3067\u4E26\u3079\u66FF\u3048",
  nsort_hideFav: "\u30BD\u30FC\u30C8\u6642\u306B\u304A\u6C17\u306B\u5165\u308A\u3092\u975E\u8868\u793A",
  nsort_hideFollowed: "\u30BD\u30FC\u30C8\u6642\u306B\u30D5\u30A9\u30ED\u30FC\u6E08\u307F\u4F5C\u8005\u306E\u4F5C\u54C1\u3092\u975E\u8868\u793A",
  text_sort: "\u30BD\u30FC\u30C8"
};
var i18n_default = Texts;

// src/utils/jquery.ts
var JQUERY_VERSION = "2.2.4";
var checkJQuery = function() {
  const jqueryCdns = [
    `http://code.jquery.com/jquery-${JQUERY_VERSION}.min.js`,
    `https://ajax.aspnetcdn.com/ajax/jquery/jquery-${JQUERY_VERSION}.min.js`,
    `https://ajax.googleapis.com/ajax/libs/jquery/${JQUERY_VERSION}/jquery.min.js`,
    `https://cdn.staticfile.org/jquery/${JQUERY_VERSION}/jquery.min.js`,
    `https://apps.bdimg.com/libs/jquery/${JQUERY_VERSION}/jquery.min.js`
  ];
  function isJQueryValid() {
    try {
      const wd = unsafeWindow;
      if (wd.jQuery && !wd.$) {
        wd.$ = wd.jQuery;
      }
      $();
      return true;
    } catch (exception) {
      iLog.i(`JQuery is not available: ${exception}`);
      return false;
    }
  }
  function insertJQuery(url) {
    const script = document.createElement("script");
    script.src = url;
    document.head.appendChild(script);
    return script;
  }
  function converProtocolIfNeeded(url) {
    const isHttps = location.href.indexOf("https://") != -1;
    const urlIsHttps = url.indexOf("https://") != -1;
    if (isHttps && !urlIsHttps) {
      return url.replace("http://", "https://");
    } else if (!isHttps && urlIsHttps) {
      return url.replace("https://", "http://");
    }
    return url;
  }
  function waitAndCheckJQuery(cdnIndex, resolve) {
    if (cdnIndex >= jqueryCdns.length) {
      iLog.e("\u65E0\u6CD5\u52A0\u8F7D jQuery\uFF0C\u6B63\u5728\u9000\u51FA\u3002");
      resolve(false);
      return;
    }
    const url = converProtocolIfNeeded(jqueryCdns[cdnIndex]);
    iLog.i("\u5C1D\u8BD5\u7B2C " + (cdnIndex + 1) + " \u4E2A jQuery CDN\uFF1A" + url + "\u3002");
    const script = insertJQuery(url);
    setTimeout(function() {
      if (isJQueryValid()) {
        iLog.i("\u5DF2\u52A0\u8F7D jQuery\u3002");
        resolve(true);
      } else {
        iLog.w("\u65E0\u6CD5\u8BBF\u95EE\u3002");
        script.remove();
        waitAndCheckJQuery(cdnIndex + 1, resolve);
      }
    }, 100);
  }
  return new Promise(function(resolve) {
    if (isJQueryValid()) {
      iLog.i("\u5DF2\u52A0\u8F7D jQuery\u3002");
      resolve(true);
    } else {
      iLog.i("\u672A\u53D1\u73B0 jQuery\uFF0C\u5C1D\u8BD5\u52A0\u8F7D\u3002");
      waitAndCheckJQuery(0, resolve);
    }
  });
};

// src/index.ts
var g_language = 0 /* zh_CN */;
var g_csrfToken = "";
var g_pageType = -1;
var initialUrl = location.href;
var g_settings;
var g_sortComplete = true;
var Pages = {};
function findToolbarCommon() {
  const rootToolbar = $("#root").find("ul:last").get(0);
  if (rootToolbar) return rootToolbar;
  const nextToolbar = $("#__next").find("ul:last").get(0);
  return nextToolbar;
}
function findToolbarOld() {
  return $("._toolmenu").get(0);
}
function convertThumbUrlToSmall(thumbUrl) {
  const replace1 = "c/540x540_70/img-master";
  const replace2 = "_master";
  return thumbUrl.replace(/c\/.*\/custom-thumb/, replace1).replace("_custom", replace2).replace(/c\/.*\/img-master/, replace1).replace("_square", replace2);
}
function processElementListCommon(lis) {
  $.each(lis, function(i, e) {
    const li = $(e);
    const ctlAttrs = {
      illustId: "",
      illustType: 0,
      pageCount: 1
    };
    const imageLink = li.find("a:first");
    const animationSvg = imageLink.children("div:first").find("svg:first");
    const pageCountSpan = imageLink.children("div:last").find("span:last");
    if (imageLink == null) {
      DoLog(2 /* Warning */, "Can not found img or imageLink, skip this.");
      return;
    }
    const link = imageLink.attr("href");
    if (link == null) {
      DoLog(2 /* Warning */, "Invalid href, skip this.");
      return;
    }
    const linkMatched = link.match(/artworks\/(\d+)/);
    if (linkMatched) {
      ctlAttrs.illustId = linkMatched[1];
    } else {
      DoLog(1 /* Error */, "Get illustId failed, skip this list item!");
      return;
    }
    if (animationSvg.length > 0) {
      ctlAttrs.illustType = 2;
    }
    if (pageCountSpan.length > 0) {
      ctlAttrs.pageCount = parseInt(pageCountSpan.text());
    }
    let control = li.children("div:first");
    if (control.children().length == 0) {
      if (li.children("div").length > 1) {
        control = $(li.children("div").get(1));
      }
    } else {
      control = control.children("div:first");
    }
    control.attr({
      illustId: ctlAttrs.illustId,
      illustType: ctlAttrs.illustType,
      pageCount: ctlAttrs.pageCount
    });
    control.addClass("pp-control");
  });
}
function replaceThumbCommon(elements) {
  $.each(elements, (i, e) => {
    e = $(e);
    const img = e.find("img");
    if (img.length == 0) {
      iLog.w("No img in the control element.");
      return true;
    }
    const src = img.attr("src");
    const fullSizeSrc = convertThumbUrlToSmall(src);
    if (src != fullSizeSrc) {
      img.attr("src", fullSizeSrc).css("object-fit", "contain");
    }
  });
}
function findLiByImgTag() {
  const lis = [];
  $.each($("img"), (i, e) => {
    let el = $(e);
    const p = el.parent().parent().parent();
    if (p.attr("data-gtm-value") != "" && p.attr("href") && p.attr("href").indexOf("/artwork") != -1) {
      for (let i2 = 0; i2 < 10; ++i2) {
        el = el.parent();
        if (el.length == 0) {
          break;
        }
        if (el.get(0).tagName == "LI" || el.parent().get(0).tagName == "UL") {
          lis.push(el);
          break;
        }
      }
    }
  });
  return lis;
}
Pages[0 /* Search */] = {
  PageTypeString: "SearchPage",
  CheckUrl: function(url) {
    return /^https?:\/\/www.pixiv.net\/tags\/.*\/(artworks|illustrations|manga)/.test(
      url
    ) || /^https?:\/\/www.pixiv.net\/en\/tags\/.*\/(artworks|illustrations|manga)/.test(
      url
    );
  },
  ProcessPageElements: function() {
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const sections = $("section");
    DoLog(3 /* Info */, "Page has " + sections.length + " <section>.");
    DoLog(4 /* Elements */, sections);
    let premiumSectionIndex = -1;
    let resultSectionIndex = 0;
    if (sections.length == 0) {
      iLog.e("No suitable <section>!");
      return returnMap;
    }
    $.each(sections, (i, e) => {
      if ($(e).find("aside").length > 0) {
        premiumSectionIndex = i;
      } else {
        resultSectionIndex = i;
      }
    });
    iLog.v("premium: " + premiumSectionIndex);
    iLog.v("result: " + resultSectionIndex);
    const ul = $(sections[resultSectionIndex]).find("ul");
    let lis = ul.find("li").toArray();
    if (premiumSectionIndex != -1) {
      const lis2 = $(sections[premiumSectionIndex]).find("ul").find("li");
      lis = lis.concat(lis2.toArray());
    }
    if (premiumSectionIndex != -1) {
      const aside = $(sections[premiumSectionIndex]).find("aside");
      $.each(aside.children(), (i, e) => {
        if (e.tagName.toLowerCase() != "ul") {
          e.remove();
        } else {
          $(e).css("-webkit-mask", "0");
        }
      });
      aside.next().remove();
    }
    processElementListCommon(lis);
    returnMap.controlElements = $(".pp-control");
    this.private.pageSelector = ul.next().get(0);
    if (this.private.pageSelector == null) {
      this.private.pageSelector = ul.parent().next().get(0);
    }
    returnMap.loadingComplete = true;
    this.private.imageListConrainer = ul.get(0);
    DoLog(3 /* Info */, "Process page elements complete.");
    DoLog(4 /* Elements */, returnMap);
    this.private.returnMap = returnMap;
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarCommon();
  },
  // 搜索页有 lazyload，不开排序的情况下，最后几张图片可能会无法预览。这里把它当做自动加载处理
  HasAutoLoad: true,
  GetImageListContainer: function() {
    return this.private.imageListConrainer;
  },
  GetFirstImageElement: function() {
    return $(this.private.imageListConrainer).find("li").get(0);
  },
  GetPageSelector: function() {
    return this.private.pageSelector;
  },
  private: {
    imageListContainer: null,
    pageSelector: null,
    returnMap: null
  }
};
Pages[1 /* BookMarkNew */] = {
  PageTypeString: "BookMarkNewPage",
  CheckUrl: function(url) {
    return /^https:\/\/www.pixiv.net\/bookmark_new_illust.php.*/.test(url) || /^https:\/\/www.pixiv.net\/bookmark_new_illust_r18.php.*/.test(url);
  },
  ProcessPageElements: function() {
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const sections = $("section");
    DoLog(3 /* Info */, "Page has " + sections.length + " <section>.");
    DoLog(4 /* Elements */, sections);
    const lis = sections.find("ul").find("li");
    processElementListCommon(lis);
    returnMap.controlElements = $(".pp-control");
    returnMap.loadingComplete = true;
    DoLog(3 /* Info */, "Process page elements complete.");
    DoLog(4 /* Elements */, returnMap);
    this.private.returnMap = returnMap;
    if (g_settings.fullSizeThumb) {
      if (!this.private.returnMap.loadingComplete) {
        return;
      }
      replaceThumbCommon(this.private.returnMap.controlElements);
    }
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarCommon();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null
  }
};
Pages[2 /* Discovery */] = {
  PageTypeString: "DiscoveryPage",
  CheckUrl: function(url) {
    return /^https?:\/\/www.pixiv.net\/discovery.*/.test(url);
  },
  ProcessPageElements: function() {
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const containerDiv = $(".gtm-illust-recommend-zone");
    if (containerDiv.length > 0) {
      DoLog(3 /* Info */, "Found container div.");
      DoLog(4 /* Elements */, containerDiv);
    } else {
      DoLog(1 /* Error */, "Can not found container div.");
      return returnMap;
    }
    const lis = containerDiv.find("ul").children("li");
    processElementListCommon(lis);
    returnMap.controlElements = $(".pp-control");
    returnMap.loadingComplete = true;
    DoLog(3 /* Info */, "Process page elements complete.");
    DoLog(4 /* Elements */, returnMap);
    this.private.returnMap = returnMap;
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarCommon();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null
  }
};
Pages[3 /* Member */] = {
  PageTypeString: "MemberPage/MemberIllustPage/MemberBookMark",
  CheckUrl: function(url) {
    return /^https?:\/\/www.pixiv.net\/(en\/)?users\/\d+/.test(url);
  },
  ProcessPageElements: function() {
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const lis = findLiByImgTag();
    DoLog(4 /* Elements */, lis);
    const sections = $("section");
    DoLog(3 /* Info */, "Page has " + sections.length + " <section>.");
    DoLog(4 /* Elements */, sections);
    processElementListCommon(lis);
    returnMap.controlElements = $(".pp-control");
    returnMap.loadingComplete = true;
    DoLog(3 /* Info */, "Process page elements complete.");
    DoLog(4 /* Elements */, returnMap);
    this.private.returnMap = returnMap;
    if (g_settings.fullSizeThumb) {
      if (!this.private.returnMap.loadingComplete) {
        return;
      }
      replaceThumbCommon(this.private.returnMap.controlElements);
    }
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarCommon();
  },
  // 跟搜索页一样的情况
  HasAutoLoad: true,
  private: {
    returnMap: null
  }
};
Pages[4 /* Home */] = {
  PageTypeString: "HomePage",
  CheckUrl: function(url) {
    return /https?:\/\/www.pixiv.net\/?$/.test(url) || /https?:\/\/www.pixiv.net\/en\/?$/.test(url) || /https?:\/\/www.pixiv.net\/cate_r18\.php$/.test(url) || /https?:\/\/www.pixiv.net\/en\/cate_r18\.php$/.test(url);
  },
  ProcessPageElements: function() {
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const lis = findLiByImgTag();
    processElementListCommon(lis);
    returnMap.controlElements = $(".pp-control");
    returnMap.loadingComplete = true;
    DoLog(3 /* Info */, "Process page elements complete.");
    DoLog(4 /* Elements */, returnMap);
    this.private.returnMap = returnMap;
    if (g_settings.fullSizeThumb) {
      if (!this.private.returnMap.loadingComplete) {
        return;
      }
      replaceThumbCommon(this.private.returnMap.controlElements);
    }
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarCommon();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null
  }
};
Pages[5 /* Ranking */] = {
  PageTypeString: "RankingPage",
  CheckUrl: function(url) {
    return /^https?:\/\/www.pixiv.net\/ranking.php.*/.test(url);
  },
  ProcessPageElements: function() {
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const works = $("._work");
    DoLog(3 /* Info */, "Found .work, length: " + works.length);
    DoLog(4 /* Elements */, works);
    works.each(function(i, e) {
      const _this = $(e);
      const ctlAttrs = {
        illustId: 0,
        illustType: 0,
        pageCount: 1
      };
      const href = _this.attr("href");
      if (href == null || href === "") {
        DoLog("Can not found illust id, skip this.");
        return;
      }
      const matched = href.match(/artworks\/(\d+)/);
      if (matched) {
        ctlAttrs.illustId = matched[1];
      } else {
        DoLog("Can not found illust id, skip this.");
        return;
      }
      if (_this.hasClass("multiple")) {
        ctlAttrs.pageCount = _this.find(".page-count").find("span").text();
      }
      if (_this.hasClass("ugoku-illust")) {
        ctlAttrs.illustType = 2;
      }
      _this.attr({
        illustId: ctlAttrs.illustId,
        illustType: ctlAttrs.illustType,
        pageCount: ctlAttrs.pageCount
      });
      returnMap.controlElements.push(e);
    });
    returnMap.loadingComplete = true;
    DoLog(3 /* Info */, "Process page elements complete.");
    DoLog(4 /* Elements */, returnMap);
    this.private.returnMap = returnMap;
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarOld();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null
  }
};
Pages[6 /* NewIllust */] = {
  PageTypeString: "NewIllustPage",
  CheckUrl: function(url) {
    return /^https?:\/\/www.pixiv.net\/new_illust.php.*/.test(url);
  },
  ProcessPageElements: function() {
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const lis = findLiByImgTag();
    processElementListCommon(lis);
    returnMap.controlElements = $(".pp-control");
    returnMap.loadingComplete = true;
    DoLog(3 /* Info */, "Process page elements complete.");
    DoLog(4 /* Elements */, returnMap);
    this.private.returnMap = returnMap;
    if (g_settings.fullSizeThumb) {
      if (!this.private.returnMap.loadingComplete) {
        return;
      }
      replaceThumbCommon(this.private.returnMap.controlElements);
    }
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarCommon();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null
  }
};
Pages[7 /* R18 */] = {
  PageTypeString: "R18Page",
  CheckUrl: function(url) {
    return /^https?:\/\/www.pixiv.net\/cate_r18.php.*/.test(url);
  },
  ProcessPageElements: function() {
  },
  GetToolBar: function() {
  },
  HasAutoLoad: false
};
Pages[8 /* BookMark */] = {
  PageTypeString: "BookMarkPage",
  CheckUrl: function(url) {
    return /^https:\/\/www.pixiv.net\/bookmark.php\/?$/.test(url);
  },
  ProcessPageElements: function() {
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const images = $(".image-item");
    DoLog(3 /* Info */, "Found images, length: " + images.length);
    DoLog(4 /* Elements */, images);
    images.each(function(i, e) {
      const _this = $(e);
      const work = _this.find("._work");
      if (work.length === 0) {
        DoLog(2 /* Warning */, "Can not found ._work, skip this.");
        return;
      }
      const ctlAttrs = {
        illustId: 0,
        illustType: 0,
        pageCount: 1
      };
      const href = work.attr("href");
      if (href == null || href === "") {
        DoLog(2 /* Warning */, "Can not found illust id, skip this.");
        return;
      }
      const matched = href.match(/artworks\/(\d+)/);
      if (matched) {
        ctlAttrs.illustId = matched[1];
      } else {
        DoLog(2 /* Warning */, "Can not found illust id, skip this.");
        return;
      }
      if (work.hasClass("multiple")) {
        ctlAttrs.pageCount = _this.find(".page-count").find("span").text();
      }
      if (work.hasClass("ugoku-illust")) {
        ctlAttrs.illustType = 2;
      }
      const control = _this.children("a:first");
      control.attr({
        illustId: ctlAttrs.illustId,
        illustType: ctlAttrs.illustType,
        pageCount: ctlAttrs.pageCount
      });
      returnMap.controlElements.push(control.get(0));
    });
    returnMap.loadingComplete = true;
    DoLog(3 /* Info */, "Process page elements complete.");
    DoLog(4 /* Elements */, returnMap);
    this.private.returnMap = returnMap;
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarOld();
  },
  HasAutoLoad: false,
  private: {
    returnMap: null
  }
};
Pages[9 /* Stacc */] = {
  PageTypeString: "StaccPage",
  CheckUrl: function(url) {
    return /^https:\/\/www.pixiv.net\/stacc.*/.test(url);
  },
  ProcessPageElements: function() {
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const works = $("._work");
    DoLog(3 /* Info */, "Found .work, length: " + works.length);
    DoLog(4 /* Elements */, works);
    works.each(function(i, e) {
      const _this = $(e);
      const ctlAttrs = {
        illustId: 0,
        illustType: 0,
        pageCount: 1
      };
      const href = _this.attr("href");
      if (href == null || href === "") {
        DoLog("Can not found illust id, skip this.");
        return;
      }
      const matched = href.match(/illust_id=(\d+)/);
      if (matched) {
        ctlAttrs.illustId = matched[1];
      } else {
        DoLog("Can not found illust id, skip this.");
        return;
      }
      if (_this.hasClass("multiple")) {
        ctlAttrs.pageCount = _this.find(".page-count").find("span").text();
      }
      if (_this.hasClass("ugoku-illust")) {
        ctlAttrs.illustType = 2;
      }
      _this.attr({
        illustId: ctlAttrs.illustId,
        illustType: ctlAttrs.illustType,
        pageCount: ctlAttrs.pageCount
      });
      returnMap.controlElements.push(e);
    });
    returnMap.loadingComplete = true;
    DoLog(3 /* Info */, "Process page elements complete.");
    DoLog(4 /* Elements */, returnMap);
    this.private.returnMap = returnMap;
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarOld();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null
  }
};
Pages[10 /* Artwork */] = {
  PageTypeString: "ArtworkPage",
  CheckUrl: function(url) {
    return /^https:\/\/www.pixiv.net\/artworks\/.*/.test(url) || /^https:\/\/www.pixiv.net\/en\/artworks\/.*/.test(url);
  },
  ProcessPageElements: function() {
    const canvas = $("main").find("figure").find("canvas");
    if ($("main").find("figure").find("canvas").length > 0) {
      this.private.needProcess = true;
      canvas.addClass("pp-canvas");
    }
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const lis = findLiByImgTag();
    processElementListCommon(lis);
    returnMap.controlElements = $(".pp-control");
    returnMap.loadingComplete = true;
    DoLog(3 /* Info */, "Process page elements complete.");
    DoLog(4 /* Elements */, returnMap);
    this.private.returnMap = returnMap;
    if (g_settings.fullSizeThumb) {
      if (!this.private.returnMap.loadingComplete) {
        return;
      }
      replaceThumbCommon(this.private.returnMap.controlElements);
    }
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarCommon();
  },
  HasAutoLoad: true,
  Work: function() {
    function AddDownloadButton(button, offsetToOffsetTop) {
      if (!g_settings.enableAnimeDownload) {
        return;
      }
      const cloneButton = button.clone().css({
        bottom: "50px",
        padding: 0,
        width: "48px",
        height: "48px",
        opacity: "0.4",
        cursor: "pointer"
      });
      cloneButton.get(0).innerHTML = '<svg viewBox="0 0 120 120" style="width: 40px; height: 40px; stroke-width: 10; stroke-linecap: round; stroke-linejoin: round; border-radius: 24px; background-color: black; stroke: limegreen; fill: none;" class="_3Fo0Hjg"><polyline points="60,30 60,90"></polyline><polyline points="30,60 60,90 90,60"></polyline></svg></button>';
      function MoveButton() {
        function getOffset(e) {
          if (e.offsetParent) {
            const offset = getOffset(e.offsetParent);
            return {
              offsetTop: e.offsetTop + offset.offsetTop,
              offsetLeft: e.offsetLeft + offset.offsetLeft
            };
          } else {
            return {
              offsetTop: e.offsetTop,
              offsetLeft: e.offsetLeft
            };
          }
        }
      }
      MoveButton();
      $(window).on("resize", MoveButton);
      button.after(cloneButton);
      cloneButton.mouseover(function() {
        $(this).css("opacity", "0.2");
      }).mouseleave(function() {
        $(this).css("opacity", "0.4");
      }).click(function() {
        let illustId = "";
        const matched = location.href.match(/artworks\/(\d+)/);
        if (matched) {
          illustId = matched[1];
          DoLog(3 /* Info */, "IllustId=" + illustId);
        } else {
          DoLog(1 /* Error */, "Can not found illust id!");
          return;
        }
        $.ajax(g_getUgoiraUrl.replace("#id#", illustId), {
          method: "GET",
          success: function(json) {
            DoLog(4 /* Elements */, json);
            if (json.error == true) {
              DoLog(
                1 /* Error */,
                "Server response an error: " + json.message
              );
              return;
            }
            const newWindow = window.open("_blank");
            newWindow.location = json.body.originalSrc;
          },
          error: function() {
            DoLog(1 /* Error */, "Request zip file failed!");
          }
        });
      });
    }
    if (this.private.needProcess) {
      const canvas = $(".pp-canvas");
      const div = $('div[role="presentation"]:last');
      const button = div.find("button");
      const headerRealHeight = parseInt($("header").css("height")) + parseInt($("header").css("padding-top")) + parseInt($("header").css("padding-bottom")) + parseInt($("header").css("margin-top")) + parseInt($("header").css("margin-bottom")) + parseInt($("header").css("border-bottom-width")) + parseInt($("header").css("border-top-width"));
      AddDownloadButton(button, headerRealHeight);
    }
  },
  private: {
    needProcess: false,
    returnMap: null
  }
};
Pages[11 /* NovelSearch */] = {
  PageTypeString: "NovelSearchPage",
  CheckUrl: function(url) {
    return /^https:\/\/www.pixiv.net\/tags\/.*\/novels/.test(url) || /^https:\/\/www.pixiv.net\/en\/tags\/.*\/novels/.test(url);
  },
  ProcessPageElements: function() {
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const ul = $("section:first").find("ul:first");
    if (ul.length > 0) {
      returnMap.loadingComplete = true;
    }
    this.private.returnMap = returnMap;
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarCommon();
  },
  GetPageSelector: function() {
    return $("section:first").find("nav:first");
  },
  HasAutoLoad: false,
  private: {
    returnMap: null
  }
};
Pages[12 /* SearchTop */] = {
  PageTypeString: "SearchTopPage",
  CheckUrl: function(url) {
    return /^https?:\/\/www.pixiv.net(\/en)?\/tags\/[^/*]/.test(url);
  },
  ProcessPageElements: function() {
    const returnMap = {
      loadingComplete: false,
      controlElements: []
    };
    const sections = $("section");
    DoLog(3 /* Info */, "Page has " + sections.length + " <section>.");
    DoLog(4 /* Elements */, sections);
    let premiumSectionIndex = -1;
    let resultSectionIndex = 0;
    if (sections.length == 0) {
      iLog.e("No suitable <section>!");
      return returnMap;
    }
    if (sections.length > 1) {
      premiumSectionIndex = 0;
      resultSectionIndex = 1;
    }
    iLog.v("premium: " + premiumSectionIndex);
    iLog.v("result: " + resultSectionIndex);
    const ul = $(sections[resultSectionIndex]).find("ul");
    let lis = ul.find("li").toArray();
    if (premiumSectionIndex != -1) {
      const lis2 = $(sections[premiumSectionIndex]).find("ul").find("li");
      lis = lis.concat(lis2.toArray());
    }
    if (premiumSectionIndex != -1) {
      const aside = $(sections[premiumSectionIndex]).find("aside");
      $.each(aside.children(), (i, e) => {
        if (e.tagName.toLowerCase() != "ul") {
          e.remove();
        } else {
          $(e).css("-webkit-mask", "0");
        }
      });
      aside.next().remove();
    }
    processElementListCommon(lis);
    returnMap.controlElements = $(".pp-control");
    this.private.pageSelector = ul.next().get(0);
    if (this.private.pageSelector == null) {
      this.private.pageSelector = ul.parent().next().get(0);
    }
    returnMap.loadingComplete = true;
    this.private.imageListConrainer = ul.get(0);
    DoLog(3 /* Info */, "Process page elements complete.");
    DoLog(4 /* Elements */, returnMap);
    this.private.returnMap = returnMap;
    return returnMap;
  },
  GetProcessedPageElements: function() {
    if (this.private.returnMap == null) {
      return this.ProcessPageElements();
    }
    return this.private.returnMap;
  },
  GetToolBar: function() {
    return findToolbarCommon();
  },
  // 搜索页有 lazyload，不开排序的情况下，最后几张图片可能会无法预览。这里把它当做自动加载处理
  HasAutoLoad: false,
  GetImageListContainer: function() {
    return this.private.imageListConrainer;
  },
  GetFirstImageElement: function() {
    return $(this.private.imageListConrainer).find("li").get(0);
  },
  GetPageSelector: function() {
    return this.private.pageSelector;
  },
  private: {
    imageListContainer: null,
    pageSelector: null,
    returnMap: null
  }
};
var imageElementTemplate = null;
function PixivSK(callback) {
  if (g_settings.pageCount < 1 || g_settings.favFilter < 0) {
    g_settings.pageCount = 1;
    g_settings.favFilter = 0;
  }
  let currentGettingPageCount = 0;
  let currentUrl = "https://www.pixiv.net/ajax/search/";
  let currentPage = 0;
  let works = [];
  let worksCount = 0;
  if (g_pageType != 0 /* Search */) {
    return;
  }
  const getWorks = function(onloadCallback) {
    $("#progress").text(
      i18n_default[g_language].sort_getWorks.replace("%1", currentGettingPageCount + 1).replace("%2", g_settings.pageCount)
    );
    let url = currentUrl.replace(/p=\d+/, "p=" + currentPage);
    if (location.href.indexOf("?") != -1) {
      let param = location.href.split("?")[1];
      param = param.replace(/^p=\d+/, "");
      param = param.replace(/&p=\d+/, "");
      url += "&" + param;
    }
    if (url.indexOf("order=") == -1) {
      url += "&order=date_d";
    }
    if (url.indexOf("mode=") == -1) {
      url += "&mode=all";
    }
    if (url.indexOf("s_mode=") == -1) {
      url += "&s_mode=s_tag_full";
    }
    DoLog(3 /* Info */, "getWorks url: " + url);
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.onload = function(event) {
      onloadCallback(req);
    };
    req.onerror = function(event) {
      DoLog(1 /* Error */, "Request search page error!");
    };
    req.send(null);
  };
  function getFollowingOfType(user_id, type, offset) {
    return new Promise(function(resolve, reject) {
      if (offset == null) {
        offset = 0;
      }
      const limit = 100;
      const following_show = [];
      $.ajax(
        "https://www.pixiv.net/ajax/user/" + user_id + "/following?offset=" + offset + "&limit=" + limit + "&rest=" + type,
        {
          async: true,
          success: function(data) {
            if (data == null || data.error) {
              DoLog(1 /* Error */, "Following response contains an error.");
              resolve([]);
              return;
            }
            if (data.body.users.length == 0) {
              resolve([]);
              return;
            }
            $.each(data.body.users, function(i, user) {
              following_show.push(user.userId);
            });
            getFollowingOfType(user_id, type, offset + limit).then(
              function(members) {
                resolve(following_show.concat(members));
                return;
              }
            );
          },
          error: function() {
            DoLog(1 /* Error */, "Request following failed.");
            resolve([]);
          }
        }
      );
    });
  }
  function getFollowingOfCurrentUser() {
    return new Promise(function(resolve, reject) {
      let user_id = "";
      try {
        user_id = dataLayer[0].user_id;
      } catch (ex) {
        DoLog(1 /* Error */, "Get user id failed.");
        resolve([]);
        return;
      }
      $("#progress").text(i18n_default[g_language].sort_getPublicFollowing);
      const following = GetLocalStorage("followingOfUid-" + user_id) || GetCookie("followingOfUid-" + user_id);
      if (following != null && following != "null") {
        resolve(following);
        return;
      }
      getFollowingOfType(user_id, "show").then(function(members) {
        $("#progress").text(i18n_default[g_language].sort_getPrivateFollowing);
        getFollowingOfType(user_id, "hide").then(function(members2) {
          const following2 = members.concat(members2);
          SetLocalStorage("followingOfUid-" + user_id, following2);
          resolve(following2);
        });
      });
    });
  }
  const filterByUser = function() {
    return new Promise(function(resolve, reject) {
      if (!g_settings.hideFollowed) {
        resolve();
      }
      getFollowingOfCurrentUser().then(function(members) {
        const tempWorks = [];
        let hideWorkCount = 0;
        $(works).each(function(i, work) {
          let found = false;
          for (let i2 = 0; i2 < members.length; i2++) {
            if (members[i2] == work.userId) {
              found = true;
              break;
            }
          }
          if (!found) {
            tempWorks.push(work);
          } else {
            hideWorkCount++;
          }
        });
        works = tempWorks;
        DoLog(3 /* Info */, hideWorkCount + " works were hide.");
        DoLog(4 /* Elements */, works);
        resolve();
      });
    });
  };
  const filterAndSort = function() {
    return new Promise(function(resolve, reject) {
      DoLog(3 /* Info */, "Start sort.");
      DoLog(4 /* Elements */, works);
      let text = i18n_default[g_language].sort_filtering.replace(
        "%2",
        g_settings.favFilter
      );
      text = text.replace(
        "%1",
        g_settings.hideFavorite ? i18n_default[g_language].sort_filteringHideFavorite : ""
      );
      $("#progress").text(text);
      const tmp = [];
      const tagsToHide = new Set(
        g_settings.hideByTagList.replace("\uFF0C", ",").split(",")
      );
      $(works).each(function(i, work) {
        const bookmarkCount = work.bookmarkCount ? work.bookmarkCount : 0;
        if (bookmarkCount < g_settings.favFilter) return true;
        if (g_settings.hideFavorite && work.bookmarkData) return true;
        if (g_settings.aiFilter == 1 && work.aiType == 2) return true;
        if (g_settings.hideByTag && work.tags.some((tag) => tagsToHide.has(tag)))
          return true;
        tmp.push(work);
      });
      works = tmp;
      filterByUser().then(function() {
        works.sort(function(a, b) {
          let favA = a.bookmarkCount;
          let favB = b.bookmarkCount;
          if (!favA) {
            favA = 0;
          }
          if (!favB) {
            favB = 0;
          }
          if (favA > favB) {
            return -1;
          }
          if (favA < favB) {
            return 1;
          }
          return 0;
        });
        DoLog(3 /* Info */, "Sort complete.");
        DoLog(4 /* Elements */, works);
        resolve();
      });
    });
  };
  if (currentPage === 0) {
    let url = location.href;
    if (url.indexOf("&p=") == -1 && url.indexOf("?p=") == -1) {
      DoLog(2 /* Warning */, "Can not found page in url.");
      if (url.indexOf("?") == -1) {
        url += "?p=1";
        DoLog(3 /* Info */, 'Add "?p=1": ' + url);
      } else {
        url += "&p=1";
        DoLog(3 /* Info */, 'Add "&p=1": ' + url);
      }
    }
    const wordMatch = url.match(/\/tags\/([^/]*)\//);
    let searchWord = "";
    if (wordMatch) {
      DoLog(3 /* Info */, "Search key word: " + searchWord);
      searchWord = wordMatch[1];
    } else {
      DoLog(1 /* Error */, "Can not found search key word!");
      return;
    }
    const page = url.match(/p=(\d*)/)[1];
    currentPage = parseInt(page);
    DoLog(3 /* Info */, "Current page: " + currentPage);
    const type = url.match(/tags\/.*\/(.*)[?$]/)[1];
    currentUrl += type + "/";
    currentUrl += searchWord + "?word=" + searchWord + "&p=" + currentPage;
    DoLog(3 /* Info */, "Current url: " + currentUrl);
  } else {
    DoLog(1 /* Error */, "???");
  }
  const imageContainer = Pages[0 /* Search */].GetImageListContainer();
  $(imageContainer).hide().before(
    '<div id="loading" style="width:100%;text-align:center;"><img src="' + g_loadingImage + '" /><p id="progress" style="text-align: center;font-size: large;font-weight: bold;padding-top: 10px;">0%</p></div>'
  );
  if (true) {
    const pageSelectorDiv = Pages[0 /* Search */].GetPageSelector();
    if (pageSelectorDiv == null) {
      DoLog(1 /* Error */, "Can not found page selector!");
      return;
    }
    if ($(pageSelectorDiv).find("a").length > 2) {
      const pageButton = $(pageSelectorDiv).find("a").get(1);
      const newPageButtons = [];
      const pageButtonString = "Previewer";
      for (let i = 0; i < 9; i++) {
        const newPageButton = pageButton.cloneNode(true);
        $(newPageButton).find("span").text(pageButtonString[i]);
        newPageButtons.push(newPageButton);
      }
      $(pageSelectorDiv).find("button").remove();
      while ($(pageSelectorDiv).find("a").length > 2) {
        $(pageSelectorDiv).find("a:first").next().remove();
      }
      for (let i = 0; i < 9; i++) {
        $(pageSelectorDiv).find("a:last").before(newPageButtons[i]);
      }
      $(pageSelectorDiv).find("a").attr("href", "javascript:;");
      let pageUrl = location.href;
      if (pageUrl.indexOf("&p=") == -1 && pageUrl.indexOf("?p=") == -1) {
        if (pageUrl.indexOf("?") == -1) {
          pageUrl += "?p=1";
        } else {
          pageUrl += "&p=1";
        }
      }
      const prevPageUrl = pageUrl.replace(
        /p=\d+/,
        "p=" + (currentPage - g_settings.pageCount > 1 ? currentPage - g_settings.pageCount : 1)
      );
      const nextPageUrl = pageUrl.replace(
        /p=\d+/,
        "p=" + (currentPage + g_settings.pageCount)
      );
      DoLog(3 /* Info */, "Previous page url: " + prevPageUrl);
      DoLog(3 /* Info */, "Next page url: " + nextPageUrl);
      const prevButton = $(pageSelectorDiv).find("a:first");
      prevButton.before(prevButton.clone());
      prevButton.remove();
      const nextButton = $(pageSelectorDiv).find("a:last");
      nextButton.before(nextButton.clone());
      nextButton.remove();
      $(pageSelectorDiv).find("a:first").attr("href", prevPageUrl).addClass("pp-prevPage");
      $(pageSelectorDiv).find("a:last").attr("href", nextPageUrl).addClass("pp-nextPage");
    }
    const onloadCallback = function(req) {
      let no_artworks_found = false;
      try {
        const json = JSON.parse(req.responseText);
        if (json.hasOwnProperty("error")) {
          if (json.error === false) {
            let data;
            if (json.body.illustManga) {
              data = json.body.illustManga.data;
            } else if (json.body.manga) {
              data = json.body.manga.data;
            } else if (json.body.illust) {
              data = json.body.illust.data;
            }
            if (data.length > 0) {
              works = works.concat(data);
            } else {
              no_artworks_found = true;
            }
          } else {
            DoLog(1 /* Error */, "ajax error!");
            return;
          }
        } else {
          DoLog(1 /* Error */, 'Key "error" not found!');
          return;
        }
      } catch (e) {
        DoLog(1 /* Error */, "A invalid json string!");
        DoLog(3 /* Info */, req.responseText);
      }
      currentPage++;
      currentGettingPageCount++;
      if (no_artworks_found) {
        iLog.w(
          2 /* Warning */,
          "No artworks found, ignore " + (g_settings.pageCount - currentGettingPageCount) + " pages."
        );
        currentPage += g_settings.pageCount - currentGettingPageCount;
        currentGettingPageCount = g_settings.pageCount;
      }
      if (currentGettingPageCount == g_settings.pageCount) {
        DoLog(3 /* Info */, "Load complete, start to load bookmark count.");
        DoLog(4 /* Elements */, works);
        const tempWorks = [];
        const workIdsSet = /* @__PURE__ */ new Set();
        for (let i = 0; i < works.length; i++) {
          if (works[i].id && !workIdsSet.has(works[i].id)) {
            tempWorks.push(works[i]);
            workIdsSet.add(works[i].id);
          } else {
            iLog.w("ignore work: " + works[i].id);
          }
        }
        works = tempWorks;
        worksCount = works.length;
        DoLog(3 /* Info */, "Clear ad container complete.");
        DoLog(4 /* Elements */, works);
        GetBookmarkCount(0);
      } else {
        getWorks(onloadCallback);
      }
    };
    getWorks(onloadCallback);
  }
  const xhrs = [];
  let currentRequestGroupMinimumIndex = 0;
  function FillXhrsArray() {
    xhrs.length = 0;
    const onloadFunc = function(event) {
      let json = null;
      try {
        json = JSON.parse(event.responseText);
      } catch (e) {
        DoLog(1 /* Error */, "Parse json failed!");
        DoLog(LogLevel.Element, e);
        return;
      }
      if (json) {
        let illustId = "";
        const illustIdMatched = event.finalUrl.match(/illust_id=(\d+)/);
        if (illustIdMatched) {
          illustId = illustIdMatched[1];
        } else {
          DoLog(
            1 /* Error */,
            "Can not get illust id from url: " + event.finalUrl
          );
          return;
        }
        let indexOfThisRequest = -1;
        for (let j = 0; j < g_maxXhr; j++) {
          if (xhrs[j].illustId == illustId) {
            indexOfThisRequest = j;
            break;
          }
        }
        if (indexOfThisRequest == -1) {
          DoLog(1 /* Error */, "This url not match any request!");
          return;
        }
        xhrs[indexOfThisRequest].complete = true;
        if (!json.error) {
          const bookmarkCount = json.body.illust_details.bookmark_user_total;
          works[currentRequestGroupMinimumIndex + indexOfThisRequest].bookmarkCount = parseInt(bookmarkCount);
          DoLog(
            3 /* Info */,
            "IllustId: " + illustId + ", bookmarkCount: " + bookmarkCount
          );
        } else {
          DoLog(1 /* Error */, "Some error occured: " + json.message);
        }
        let completeCount = 0;
        let completeReally = 0;
        for (let j = 0; j < g_maxXhr; j++) {
          if (xhrs[j].complete) {
            completeCount++;
            if (xhrs[j].illustId != "") {
              completeReally++;
            }
          }
        }
        $("#loading").find("#progress").text(
          i18n_default[g_language].sort_getBookmarkCount.replace("%1", currentRequestGroupMinimumIndex + completeReally).replace("%2", works.length)
        );
        if (completeCount == g_maxXhr) {
          currentRequestGroupMinimumIndex += g_maxXhr;
          GetBookmarkCount(currentRequestGroupMinimumIndex);
        }
      }
    };
    const onerrorFunc = function(event) {
      let illustId = "";
      const illustIdMatched = event.finalUrl.match(/illust_id=(\d+)/);
      if (illustIdMatched) {
        illustId = illustIdMatched[1];
      } else {
        DoLog(
          1 /* Error */,
          "Can not get illust id from url: " + event.finalUrl
        );
        return;
      }
      DoLog(
        1 /* Error */,
        "Send request failed, set this illust(" + illustId + ")'s bookmark count to 0!"
      );
      let indexOfThisRequest = -1;
      for (let j = 0; j < g_maxXhr; j++) {
        if (xhrs[j].illustId == illustId) {
          indexOfThisRequest = j;
          break;
        }
      }
      if (indexOfThisRequest == -1) {
        DoLog("This url not match any request!");
        return;
      }
      works[currentRequestGroupMinimumIndex + indexOfThisRequest].bookmarkCount = 0;
      xhrs[indexOfThisRequest].complete = true;
      let completeCount = 0;
      let completeReally = 0;
      for (let j = 0; j < g_maxXhr; j++) {
        if (xhrs[j].complete) {
          completeCount++;
          if (xhrs[j].illustId != "") {
            completeReally++;
          }
        }
      }
      $("#loading").find("#progress").text(
        i18n_default[g_language].sort_getBookmarkCount.replace("%1", currentRequestGroupMinimumIndex + completeReally).replace("%2", works.length)
      );
      if (completeCount == g_maxXhr) {
        currentRequestGroupMinimumIndex += g_maxXhr;
        GetBookmarkCount(currentRequestGroupMinimumIndex + g_maxXhr);
      }
    };
    for (let i = 0; i < g_maxXhr; i++) {
      xhrs.push({
        illustId: "",
        complete: false,
        onabort: onerrorFunc,
        onerror: onerrorFunc,
        onload: onloadFunc,
        ontimeout: onerrorFunc
      });
    }
  }
  const GetBookmarkCount = function(index) {
    if (index >= works.length) {
      clearAndUpdateWorks();
      return;
    }
    if (xhrs.length === 0) {
      FillXhrsArray();
    }
    for (let i = 0; i < g_maxXhr; i++) {
      if (index + i >= works.length) {
        xhrs[i].complete = true;
        xhrs[i].illustId = "";
        continue;
      }
      const illustId = works[index + i].id;
      const url = "https://www.pixiv.net/touch/ajax/illust/details?illust_id=" + illustId;
      xhrs[i].illustId = illustId;
      xhrs[i].complete = false;
      request({
        method: "GET",
        url,
        synchronous: true,
        onabort: xhrs[i].onerror,
        onerror: xhrs[i].onerror,
        onload: xhrs[i].onload,
        ontimeout: xhrs[i].onerror
      });
    }
  };
  const clearAndUpdateWorks = function() {
    filterAndSort().then(function() {
      const container = Pages[0 /* Search */].GetImageListContainer();
      const firstImageElement = Pages[0 /* Search */].GetFirstImageElement();
      $(firstImageElement).find("[data-mouseover]").removeAttr("data-mouseover");
      if (imageElementTemplate == null) {
        imageElementTemplate = firstImageElement.cloneNode(true);
        const control = $(imageElementTemplate).find(".pp-control");
        if (control == null) {
          iLog.w("Cannot found some elements!");
          return;
        }
        const imageLink = control.find("a:first");
        const img = imageLink.find("img:first");
        const imageDiv = img.parent();
        const imageLinkDiv = imageLink.parent();
        const titleLinkParent = control.next();
        if (img == null || imageDiv == null || imageLink == null || imageLinkDiv == null || titleLinkParent == null) {
          DoLog(1 /* Error */, "Can not found some elements!");
        }
        let titleLink = $("<a></a>");
        if (titleLinkParent.children().length == 0) {
          titleLinkParent.append(titleLink);
        } else {
          titleLink = titleLinkParent.children("a:first");
        }
        const authorDiv = titleLinkParent.next();
        const authorLinkProfileImage = authorDiv.find("a:first");
        const authorLink = authorDiv.find("a:last");
        const authorName = authorLink;
        const authorImage = $(authorDiv.find("img").get(0));
        const bookmarkDiv = imageLink.next();
        const bookmarkSvg = bookmarkDiv.find("svg");
        const additionTagDiv = imageLink.children("div:last");
        const bookmarkCountDiv = additionTagDiv.clone();
        bookmarkCountDiv.css({ top: "auto", bottom: "0px", width: "65%" });
        additionTagDiv.parent().append(bookmarkCountDiv);
        img.addClass("ppImg");
        imageLink.addClass("ppImageLink");
        titleLink.addClass("ppTitleLink");
        authorLinkProfileImage.addClass("ppAuthorLinkProfileImage");
        authorLink.addClass("ppAuthorLink");
        authorName.addClass("ppAuthorName");
        authorImage.addClass("ppAuthorImage");
        bookmarkSvg.attr("class", bookmarkSvg.attr("class") + " ppBookmarkSvg");
        additionTagDiv.addClass("ppAdditionTag");
        bookmarkCountDiv.addClass("ppBookmarkCount");
        img.attr("src", "");
        const animationTag = img.next();
        if (animationTag.length != 0 && animationTag.get(0).tagName == "SVG") {
          animationTag.remove();
        }
        additionTagDiv.empty();
        bookmarkCountDiv.empty();
        bookmarkSvg.find("path:first").css("fill", "rgb(31, 31, 31)");
        bookmarkSvg.find("path:last").css("fill", "rgb(255, 255, 255)");
        imageDiv.find("svg").remove();
        if (g_settings.linkBlank) {
          imageLink.attr("target", "_blank");
          titleLink.attr("target", "_blank");
          authorLinkProfileImage.attr("target", "_blank");
          authorLink.attr("target", "_blank");
        }
      }
      $(container).empty();
      for (let i = 0; i < works.length; i++) {
        const li = $(imageElementTemplate.cloneNode(true));
        let regularUrl = works[i].url;
        if (g_settings.fullSizeThumb) {
          regularUrl = convertThumbUrlToSmall(works[i].url);
        }
        li.find(".ppImg").attr("src", regularUrl).css("object-fit", "contain");
        li.find(".ppImageLink").attr("href", "/artworks/" + works[i].id);
        li.find(".ppTitleLink").attr("href", "/artworks/" + works[i].id).text(works[i].title);
        li.find(".ppAuthorLink, .ppAuthorLinkProfileImage").attr("href", "/member.php?id=" + works[i].userId).attr({
          userId: works[i].userId,
          profileImageUrl: works[i].profileImageUrl,
          userName: works[i].userName
        });
        li.find(".ppAuthorName").text(works[i].userName);
        li.find(".ppAuthorImage").parent().attr("titile", works[i].userName);
        li.find(".ppAuthorImage").attr("src", works[i].profileImageUrl);
        li.find(".ppBookmarkSvg").attr("illustId", works[i].id);
        if (works[i].bookmarkData) {
          li.find(".ppBookmarkSvg").find("path").css("fill", "rgb(255, 64, 96)");
          li.find(".ppBookmarkSvg").attr(
            "bookmarkId",
            works[i].bookmarkData.id
          );
        }
        if (works[i].xRestrict !== 0) {
          const R18HTML = '<div style="margin-top: 2px; margin-left: 2px;"><div style="color: rgb(255, 255, 255);font-weight: bold;font-size: 10px;line-height: 1;padding: 3px 6px;border-radius: 3px;background: rgb(255, 64, 96);">R-18</div></div>';
          li.find(".ppAdditionTag").append(R18HTML);
        }
        if (works[i].pageCount > 1) {
          const pageCountHTML = '<div style="display: flex;-webkit-box-align: center;align-items: center;box-sizing: border-box;margin-left: auto;height: 20px;color: rgb(255, 255, 255);font-size: 10px;line-height: 12px;font-weight: bold;flex: 0 0 auto;padding: 4px 6px;background: rgba(0, 0, 0, 0.32);border-radius: 10px;"><svg viewBox="0 0 9 10" width="9" height="10" style="stroke: none;line-height: 0;font-size: 0px;fill: currentcolor;"><path d="M8,3 C8.55228475,3 9,3.44771525 9,4 L9,9 C9,9.55228475 8.55228475,10 8,10 L3,10 C2.44771525,10 2,9.55228475 2,9 L6,9 C7.1045695,9 8,8.1045695 8,7 L8,3 Z M1,1 L6,1 C6.55228475,1 7,1.44771525 7,2 L7,7 C7,7.55228475 6.55228475,8 6,8 L1,8 C0.44771525,8 0,7.55228475 0,7 L0,2 C0,1.44771525 0.44771525,1 1,1 Z"></path></svg><span style="margin-left: 2px;">' + works[i].pageCount + "</span></div>";
          li.find(".ppAdditionTag").append(pageCountHTML);
        }
        const bookmarkCountHTML = '<div style="margin-bottom: 6px; margin-left: 2px;"><div style="color: rgb(7, 95, 166);font-weight: bold;font-size: 13px;line-height: 1;padding: 3px 6px;border-radius: 3px;background: rgb(204, 236, 255);">' + works[i].bookmarkCount + " likes</div></div>";
        li.find(".ppBookmarkCount").append(bookmarkCountHTML);
        if (works[i].illustType == 2) {
          const animationHTML = '<svg viewBox="0 0 24 24" style="width: 48px; height: 48px;stroke: none;fill: rgb(255, 255, 255);line-height: 0;font-size: 0px;vertical-align: middle;position:absolute;"><circle cx="12" cy="12" r="10" style="fill: rgb(0, 0, 0);fill-opacity: 0.4;"></circle><path d="M9,8.74841664 L9,15.2515834 C9,15.8038681 9.44771525,16.2515834 10,16.2515834 C10.1782928,16.2515834 10.3533435,16.2039156 10.5070201,16.1135176 L16.0347118,12.8619342 C16.510745,12.5819147 16.6696454,11.969013 16.3896259,11.4929799 C16.3034179,11.3464262 16.1812655,11.2242738 16.0347118,11.1380658 L10.5070201,7.88648243 C10.030987,7.60646294 9.41808527,7.76536339 9.13806578,8.24139652 C9.04766776,8.39507316 9,8.57012386 9,8.74841664 Z"></path></svg>';
          li.find(".ppImg").after(animationHTML);
        }
        $(container).append(li);
      }
      $(".ppBookmarkSvg").parent().on("click", function(ev) {
        if (g_csrfToken == "") {
          DoLog(1 /* Error */, "No g_csrfToken, failed to add bookmark!");
          alert("\u83B7\u53D6 Token \u5931\u8D25\uFF0C\u65E0\u6CD5\u6DFB\u52A0\uFF0C\u8BF7\u5230\u8BE6\u60C5\u9875\u64CD\u4F5C\u3002");
          return;
        }
        let restrict = 0;
        if (ev.ctrlKey) {
          restrict = 1;
        }
        const _this = $(this).children("svg:first");
        const illustId = _this.attr("illustId");
        const bookmarkId = _this.attr("bookmarkId");
        if (bookmarkId == null || bookmarkId == "") {
          DoLog(3 /* Info */, "Add bookmark, illustId: " + illustId);
          $.ajax("/ajax/illusts/bookmarks/add", {
            method: "POST",
            contentType: "application/json;charset=utf-8",
            headers: { "x-csrf-token": g_csrfToken },
            data: '{"illust_id":"' + illustId + '","restrict":' + restrict + ',"comment":"","tags":[]}',
            success: function(data) {
              DoLog(3 /* Info */, "addBookmark result: ");
              DoLog(4 /* Elements */, data);
              if (data.error) {
                DoLog(
                  1 /* Error */,
                  "Server returned an error: " + data.message
                );
                return;
              }
              const bookmarkId2 = data.body.last_bookmark_id;
              DoLog(
                3 /* Info */,
                "Add bookmark success, bookmarkId is " + bookmarkId2
              );
              _this.attr("bookmarkId", bookmarkId2);
              _this.find("path").css("fill", "rgb(255, 64, 96)");
            }
          });
        } else {
          DoLog(3 /* Info */, "Delete bookmark, bookmarkId: " + bookmarkId);
          $.ajax("/rpc/index.php", {
            method: "POST",
            headers: { "x-csrf-token": g_csrfToken },
            data: { mode: "delete_illust_bookmark", bookmark_id: bookmarkId },
            success: function(data) {
              DoLog(3 /* Info */, "delete bookmark result: ");
              DoLog(4 /* Elements */, data);
              if (data.error) {
                DoLog(
                  1 /* Error */,
                  "Server returned an error: " + data.message
                );
                return;
              }
              DoLog(3 /* Info */, "Delete bookmark success.");
              _this.attr("bookmarkId", "");
              _this.find("path:first").css("fill", "rgb(31, 31, 31)");
              _this.find("path:last").css("fill", "rgb(255, 255, 255)");
            }
          });
        }
        _this.parent().focus();
      });
      $(".ppAuthorLink").on("mouseenter", function(e) {
        const _this = $(this);
        function getOffset(e2) {
          if (e2.offsetParent) {
            const offset2 = getOffset(e2.offsetParent);
            return {
              offsetTop: e2.offsetTop + offset2.offsetTop,
              offsetLeft: e2.offsetLeft + offset2.offsetLeft
            };
          } else {
            return {
              offsetTop: e2.offsetTop,
              offsetLeft: e2.offsetLeft
            };
          }
        }
        let isFollowed = false;
        $.ajax(
          "https://www.pixiv.net/ajax/user/" + _this.attr("userId") + "?full=1",
          {
            method: "GET",
            async: false,
            success: function(data) {
              if (data.error == false && data.body.isFollowed) {
                isFollowed = true;
              }
            }
          }
        );
        $(".pp-authorDiv").remove();
        const pres = $(
          '<div class="pp-authorDiv"><div class="ppa-main" style="position: absolute; top: 0px; left: 0px; border-width: 1px; border-style: solid; z-index: 1; border-color: rgba(0, 0, 0, 0.08); border-radius: 8px;"><div class=""style="    width: 336px;    background-color: rgb(255, 255, 255);    padding-top: 24px;    flex-flow: column;"><div class=""style=" display: flex; align-items: center; flex-flow: column;"><a class="ppa-authorLink"><div role="img"size="64"class=""style=" display: inline-block; width: 64px; height: 64px; border-radius: 50%; overflow: hidden;"><img class="ppa-authorImage" width="64"height="64"style="object-fit: cover; object-position: center top;"></div></a><a class="ppa-authorLink"><div class="ppa-authorName" style=" line-height: 24px; font-size: 16px; font-weight: bold; margin: 4px 0px 0px;"></div></a><div class=""style=" margin: 12px 0px 24px;"><button type="button"class="ppa-follow"style=" padding: 9px 25px; line-height: 1; border: none; border-radius: 16px; font-weight: 700; background-color: #0096fa; color: #fff; cursor: pointer;"><span style="margin-right: 4px;"><svg viewBox="0 0 8 8"width="10"height="10"class=""style=" stroke: rgb(255, 255, 255); stroke-linecap: round; stroke-width: 2;"><line x1="1"y1="4"x2="7"y2="4"></line><line x1="4"y1="1"x2="4"y2="7"></line></svg></span>\u5173\u6CE8</button></div></div></div></div></div>'
        );
        $("body").append(pres);
        const offset = getOffset(this);
        pres.find(".ppa-main").css({
          top: offset.offsetTop - 196 + "px",
          left: offset.offsetLeft - 113 + "px"
        });
        pres.find(".ppa-authorLink").attr("href", "/member.php?id=" + _this.attr("userId"));
        pres.find(".ppa-authorImage").attr("src", _this.attr("profileImageUrl"));
        pres.find(".ppa-authorName").text(_this.attr("userName"));
        if (isFollowed) {
          pres.find(".ppa-follow").get(0).outerHTML = '<button type="button" class="ppa-follow followed" data-click-action="click" data-click-label="follow" style="padding: 9px 25px;line-height: 1;border: none;border-radius: 16px;font-size: 14px;font-weight: 700;cursor: pointer;">\u5173\u6CE8\u4E2D</button>';
        }
        pres.find(".ppa-follow").attr("userId", _this.attr("userId"));
        pres.on("mouseleave", function(e2) {
          $(this).remove();
        }).on("mouseenter", function() {
          $(this).addClass("mouseenter");
        });
        pres.find(".ppa-follow").on("click", function() {
          const userId = $(this).attr("userId");
          if ($(this).hasClass("followed")) {
            $.ajax("https://www.pixiv.net/rpc_group_setting.php", {
              method: "POST",
              headers: { "x-csrf-token": g_csrfToken },
              data: "mode=del&type=bookuser&id=" + userId,
              success: function(data) {
                DoLog(3 /* Info */, "delete bookmark result: ");
                DoLog(4 /* Elements */, data);
                if (data.type == "bookuser") {
                  $(".ppa-follow").get(0).outerHTML = '<button type="button"class="ppa-follow"style=" padding: 9px 25px; line-height: 1; border: none; border-radius: 16px; font-weight: 700; background-color: #0096fa; color: #fff; cursor: pointer;"><span style="margin-right: 4px;"><svg viewBox="0 0 8 8"width="10"height="10"class=""style=" stroke: rgb(255, 255, 255); stroke-linecap: round; stroke-width: 2;"><line x1="1"y1="4"x2="7"y2="4"></line><line x1="4"y1="1"x2="4"y2="7"></line></svg></span>\u5173\u6CE8</button>';
                } else {
                  DoLog(1 /* Error */, "Delete follow failed!");
                }
              }
            });
          } else {
            $.ajax("https://www.pixiv.net/bookmark_add.php", {
              method: "POST",
              headers: { "x-csrf-token": g_csrfToken },
              data: "mode=add&type=user&user_id=" + userId + "&tag=&restrict=0&format=json",
              success: function(data) {
                DoLog(3 /* Info */, "addBookmark result: ");
                DoLog(4 /* Elements */, data);
                if (data.length === 0) {
                  $(".ppa-follow").get(0).outerHTML = '<button type="button" class="ppa-follow followed" data-click-action="click" data-click-label="follow" style="padding: 9px 25px;line-height: 1;border: none;border-radius: 16px;font-size: 14px;font-weight: 700;cursor: pointer;">\u5173\u6CE8\u4E2D</button>';
                } else {
                  DoLog(1 /* Error */, "Follow failed!");
                }
              }
            });
          }
        });
      }).on("mouseleave", function(e) {
        setTimeout(function() {
          if (!$(".pp-authorDiv").hasClass("mouseenter")) {
            $(".pp-authorDiv").remove();
          }
        }, 200);
      });
      if (works.length === 0) {
        $(container).show().get(0).outerHTML = '<div class=""style="display: flex;align-items: center;justify-content: center; height: 408px;flex-flow: column;"><div class=""style="margin-bottom: 12px;color: rgba(0, 0, 0, 0.16);"><svg viewBox="0 0 16 16"size="72"style="fill: currentcolor;height: 72px;vertical-align: middle;"><path d="M8.25739 9.1716C7.46696 9.69512 6.51908 10 5.5 10C2.73858 10 0.5 7.76142 0.5 5C0.5 2.23858 2.73858 0 5.5 0C8.26142 0 10.5 2.23858 10.5 5C10.5 6.01908 10.1951 6.96696 9.67161 7.75739L11.7071 9.79288C12.0976 10.1834 12.0976 10.8166 11.7071 11.2071C11.3166 11.5976 10.6834 11.5976 10.2929 11.2071L8.25739 9.1716ZM8.5 5C8.5 6.65685 7.15685 8 5.5 8C3.84315 8 2.5 6.65685 2.5 5C2.5 3.34315 3.84315 2 5.5 2C7.15685 2 8.5 3.34315 8.5 5Z"transform="translate(2.25 2.25)"fill-rule="evenodd"clip-rule="evenodd"></path></svg></div><span class="sc-LzMCO fLDUzU">' + i18n_default[g_language].sort_noWork.replace("%1", worksCount) + "</span></div>";
      }
      $("#loading").remove();
      $(container).show();
      Pages[0 /* Search */].ProcessPageElements();
      $(document).keydown(function(e) {
        if (g_settings.pageByKey != 1) {
          return;
        }
        if (e.keyCode == 39) {
          const btn = $(".pp-nextPage");
          if (btn.length < 1 || btn.attr("hidden") == "hidden") {
            return;
          }
          location.href = btn.attr("href");
        } else if (e.keyCode == 37) {
          const btn = $(".pp-prevPage");
          if (btn.length < 1 || btn.attr("hidden") == "hidden") {
            return;
          }
          location.href = btn.attr("href");
        }
      });
      if (callback) {
        callback();
      }
    });
  };
}
function PixivNS() {
  function findNovelSection() {
    const ul = $("section:first").find("ul:first");
    if (ul.length == 0) {
      DoLog(1 /* Error */, "Can not found novel list.");
      return null;
    }
    return ul;
  }
  function getSearchParamsWithoutPage() {
    return location.search.substr(1).replace(/&?p=\d+/, "");
  }
  function getNovelTemplate(ul) {
    if (!ul) {
      return null;
    }
    if (ul.length == 0) {
      DoLog(1 /* Error */, "Empty list, can not create template.");
      return null;
    }
    const template = ul.children().eq(0).clone(true);
    const picDiv = template.children().eq(0).children().eq(0);
    picDiv.find("a:first").addClass("pns-link");
    picDiv.find("img:first").addClass("pns-img");
    const detailDiv = template.children().eq(0).children().eq(1).children().eq(0);
    const titleDiv = detailDiv.children().eq(0);
    if (titleDiv.children().length > 1) {
      titleDiv.children().eq(0).addClass("pns-series");
    } else {
      const series = $(
        '<a class="pns-series" href="/novel/series/000000"></a>'
      );
      series.css({
        display: "inline-block",
        "white-space": "nowrap",
        "text-overflow": "ellipsis",
        overflow: "hidden",
        "max-width": "100%",
        "line-height": "22px",
        "font-size": "14px",
        "text-decoration": "none"
      });
      $("head").append(
        "<style>.pns-series:visited{color:rgb(173,173,173)}</style>"
      );
      titleDiv.prepend(series);
    }
    titleDiv.children().eq(1).children().eq(0).addClass("pns-title").addClass("pns-link");
    detailDiv.find(".gtm-novel-searchpage-result-user:first").addClass("pns-author-img");
    detailDiv.find(".gtm-novel-searchpage-result-user:last").addClass("pns-author");
    const tagDiv = detailDiv.children().eq(2).children().eq(0);
    const bookmarkDiv = tagDiv.children().eq(2);
    bookmarkDiv.find("span:first").addClass("pns-text-count");
    if (bookmarkDiv.find("span").length < 2) {
      const textSpan = bookmarkDiv.find(".pns-text-count");
      textSpan.append(
        '<span class="pns-bookmark-count"><span><div class="sc-eoqmwo-1 grSeZG"><span class="sc-14heosd-0 gbNjEj"><svg viewBox="0 0 12 12" size="12" class="sc-14heosd-1 YtZop"><path fill-rule="evenodd" clip-rule="evenodd" d="M9 0.75C10.6569 0.75 12 2.09315 12 3.75C12 7.71703 7.33709 10.7126 6.23256 11.3666C6.08717 11.4526 5.91283 11.4526 5.76744 11.3666C4.6629 10.7126 0 7.71703 0 3.75C0 2.09315 1.34315 0.75 3 0.75C4.1265 0.75 5.33911 1.60202 6 2.66823C6.66089 1.60202 7.8735 0.75 9 0.75Z"></path></svg></span><span class="sc-eoqmwo-2 dfUmJJ">2,441</span></div></span></span>'
      );
      bookmarkDiv.find(".pns-bookmark-count").addClass(textSpan.get(0).className);
    } else {
      bookmarkDiv.find("span:last").addClass("pns-bookmark-count").parent().addClass("pns-bookmark-div");
    }
    tagDiv.children().eq(0).empty().addClass("pns-tag-list");
    const descDiv = tagDiv.children().eq(1);
    descDiv.children().eq(0).addClass("pns-desc");
    const likeDiv = detailDiv.children().eq(2).children().eq(1);
    const svg = likeDiv.find("svg");
    svg.attr("class", svg.attr("class") + " pns-like");
    likeDiv.find("path:first").css("color", "rgb(31, 31, 31)");
    likeDiv.find("path:last").css("fill", "rgb(255, 255, 255)");
    return template;
  }
  function fillTemplate(template, novel) {
    if (template == null || novel == null) {
      return null;
    }
    const link = template.find(".pns-link:first").attr("href").replace(/id=\d+/g, "id=" + novel.id);
    template.find(".pns-link").attr("href", link);
    template.find(".pns-img").attr("src", novel.url);
    if (novel.seriesId) {
      const seriesLink = template.find(".pns-series").attr("href").replace(/\d+$/, novel.seriesId);
      template.find(".pns-series").text(novel.seriesTitle).attr("title", novel.seriesTitle).attr("href", seriesLink);
    } else {
      template.find(".pns-series").hide();
    }
    template.find(".pns-title").text(novel.title).attr("title", novel.title);
    template.find(".pns-title").parent().attr("title", novel.title);
    const authorLink = template.find(".pns-author").attr("href").replace(/\d+$/, novel.userId);
    template.find(".pns-author").text(novel.userName).attr("href", authorLink);
    template.find(".pns-author-img").attr("href", authorLink).find("img").attr("src", novel.profileImageUrl);
    template.find(".pns-text-count").text(novel.textCount + "\u6587\u5B57");
    if (novel.bookmarkCount == 0) {
      template.find(".pns-bookmark-div").hide();
    } else {
      template.find(".pns-bookmark-count").text(novel.bookmarkCount);
    }
    const tagList = template.find(".pns-tag-list");
    let search = getSearchParamsWithoutPage();
    if (search.length > 0) {
      search = "?" + search;
    }
    $.each(novel.tags, function(i, tag) {
      const tagItem = $(
        '<span"><a style="color: rgb(61, 118, 153);" href="/tags/' + encodeURIComponent(tag) + "/novels" + search + '">' + tag + "</a></span>"
      );
      if (tag == "R-18" || tag == "R-18G") {
        tagItem.find("a").css({ color: "rgb(255, 64, 96)", "font-weight": "bold" }).text(tag);
      }
      tagList.append(tagItem);
    });
    template.find(".pns-desc").html(novel.description).attr("title", template.find(".pns-desc").text());
    const like = template.find(".pns-like");
    like.attr("novel-id", novel.id);
    if (novel.bookmarkData) {
      like.attr("bookmark-id", novel.bookmarkData.id);
      like.find("path:first").css("color", "rgb(255, 64, 96)");
      like.find("path:last").css("fill", "rgb(255, 64, 96)");
    }
    like.click(function() {
      if ($(this).attr("disable")) {
        return;
      }
      const bid = $(this).attr("bookmark-id");
      const nid = $(this).attr("novel-id");
      if (bid) {
        deleteBookmark($(this), bid);
      } else {
        addBookmark($(this), nid, 0);
      }
      $(this).blur();
    });
    if (g_settings.linkBlank) {
      template.find("a").attr("target", "_blank");
    }
    return template;
  }
  function getNovelByPage(key, from, to, total) {
    if (total == void 0) {
      total = to - from;
    }
    let url = location.origin + g_getNovelUrl.replace(/#key#/g, key).replace(/#page#/g, from);
    const search = getSearchParamsWithoutPage();
    if (search.length > 0) {
      url += "&" + search;
    }
    updateProgress(
      i18n_default[g_language].nsort_getWorks.replace("1%", total - to + from + 1).replace("2%", total)
    );
    let novelList = [];
    function onLoadFinish(data, resolve) {
      if (data && data.body && data.body.novel && data.body.novel.data) {
        novelList = novelList.concat(data.body.novel.data);
      }
      if (from == to - 1) {
        resolve(novelList);
      } else {
        getNovelByPage(key, from + 1, to, total).then(function(list) {
          if (list && list.length > 0) {
            novelList = novelList.concat(list);
          }
          resolve(novelList);
        });
      }
    }
    return new Promise(function(resolve, reject) {
      $.ajax({
        url,
        success: function(data) {
          onLoadFinish(data, resolve);
        },
        error: function() {
          DoLog(1 /* Error */, "get novel page " + from + " failed!");
          onLoadFinish(null, resolve);
        }
      });
    });
  }
  function sortNovel(list) {
    updateProgress(i18n_default[g_language].nsort_sorting);
    list.sort(function(a, b) {
      let bookmarkA = a.bookmarkCount;
      let bookmarkB = b.bookmarkCount;
      if (!bookmarkA) {
        bookmarkA = 0;
      }
      if (!bookmarkB) {
        bookmarkB = 0;
      }
      if (bookmarkA > bookmarkB) {
        return -1;
      }
      if (bookmarkA < bookmarkB) {
        return 1;
      }
      return 0;
    });
    const filteredList = [];
    $.each(list, function(i, e) {
      let bookmark = e.bookmarkCount;
      if (!bookmark) {
        bookmark = 0;
      }
      if (bookmark < g_settings.novelFavFilter) {
        return true;
      }
      if (g_settings.novelHideFavorite && e.bookmarkData) {
        return true;
      }
      filteredList.push(e);
    });
    return filteredList;
  }
  function rearrangeNovel(list) {
    const ul = findNovelSection();
    if (ul == null) {
      return;
    }
    const template = getNovelTemplate(ul);
    if (template == null) {
      return;
    }
    const newList = [];
    $.each(list, function(i, novel) {
      const e = fillTemplate(template.clone(true), novel);
      if (e != null) {
        newList.push(e);
      }
    });
    ul.empty();
    $.each(newList, function(i, e) {
      $(e).css("display", "block");
      ul.append(e);
    });
    hideLoading();
  }
  function getKeyWord() {
    const match = location.pathname.match(/\/tags\/(.+)\/novels/);
    if (!match) {
      return "";
    }
    return match[1];
  }
  function getCurrentPage() {
    const match = location.search.match(/p=(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
    return 1;
  }
  function showLoading() {
    const ul = findNovelSection();
    if (ul == null) {
      iLog.e("Can not found novel section!");
      return;
    }
    ul.hide().before(
      '<div id="loading" style="width:100%;text-align:center;"><img src="' + g_loadingImage + '" /><p id="progress" style="text-align: center;font-size: large;font-weight: bold;padding-top: 10px;">0%</p></div>'
    );
  }
  function hideLoading() {
    const ul = findNovelSection();
    if (ul == null) {
      iLog.e("Can not found novel section!");
      return;
    }
    $("#loading").remove();
    ul.show();
  }
  function updateProgress(msg) {
    const p = $("#progress");
    p.text(msg);
  }
  function addBookmark(element, novelId, restrict) {
    if (g_csrfToken == "") {
      iLog.e("No g_csrfToken, failed to add bookmark!");
      alert("\u83B7\u53D6 Token \u5931\u8D25\uFF0C\u65E0\u6CD5\u6DFB\u52A0\uFF0C\u8BF7\u5230\u8BE6\u60C5\u9875\u64CD\u4F5C\u3002");
      return;
    }
    element.attr("disable", "disable");
    iLog.i("add bookmark: " + novelId);
    $.ajax("/ajax/novels/bookmarks/add", {
      method: "POST",
      contentType: "application/json;charset=utf-8",
      headers: { "x-csrf-token": g_csrfToken },
      data: '{"novel_id":"' + novelId + '","restrict":' + restrict + ',"comment":"","tags":[]}',
      success: function(data) {
        iLog.i("add novel bookmark result: ");
        iLog.d(data);
        if (data.error) {
          iLog.e("Server returned an error: " + data.message);
          return;
        }
        const bookmarkId = data.body;
        iLog.i("Add novel bookmark success, bookmarkId is " + bookmarkId);
        element.attr("bookmark-id", bookmarkId);
        element.find("path:first").css("color", "rgb(255, 64, 96)");
        element.find("path:last").css("fill", "rgb(255, 64, 96)");
        element.removeAttr("disable");
      },
      error: function() {
        element.removeAttr("disable");
      }
    });
  }
  function deleteBookmark(element, bookmarkId) {
    if (g_csrfToken == "") {
      iLog.e("No g_csrfToken, failed to add bookmark!");
      alert("\u83B7\u53D6 Token \u5931\u8D25\uFF0C\u65E0\u6CD5\u6DFB\u52A0\uFF0C\u8BF7\u5230\u8BE6\u60C5\u9875\u64CD\u4F5C\u3002");
      return;
    }
    element.attr("disable", "disable");
    iLog.i("delete bookmark: " + bookmarkId);
    $.ajax("/ajax/novels/bookmarks/delete", {
      method: "POST",
      headers: { "x-csrf-token": g_csrfToken },
      data: { del: 1, book_id: bookmarkId },
      success: function(data) {
        iLog.i("delete novel bookmark result: ");
        iLog.d(data);
        if (data.error) {
          iLog.e("Server returned an error: " + data.message);
          return;
        }
        iLog.i("delete novel bookmark success");
        element.removeAttr("bookmark-id");
        element.find("path:first").css("color", "rgb(31, 31, 31)");
        element.find("path:last").css("fill", "rgb(255, 255, 255)");
        element.removeAttr("disable");
      },
      error: function() {
        element.removeAttr("disable");
      }
    });
  }
  function changePageSelector() {
    const pager = Pages[11 /* NovelSearch */].GetPageSelector();
    if (pager.length == 0) {
      iLog.e("can not found page selector!");
      return;
    }
    const left = pager.find("a:first").clone().attr("aria-disabled", "false").removeAttr("hidden").addClass("pp-prevPage");
    const right = pager.find("a:last").clone().attr("aria-disabled", "false").removeAttr("hidden").addClass("pp-nextPage");
    const normal = pager.find("a").eq(1).clone().removeAttr("href");
    let href = location.href;
    const match = href.match(/[?&]p=(\d+)/);
    let page = 1;
    if (match) {
      page = parseInt(match[1]);
    } else {
      if (location.search == "") {
        href += "?p=1";
      } else {
        href += "&p=1";
      }
    }
    if (page == 1) {
      left.attr("hidden", "hidden");
    }
    pager.empty();
    const lp = page - g_settings.novelPageCount;
    left.attr(
      "href",
      href.replace("?p=" + page, "?p=" + lp).replace("&p=" + page, "&p=" + lp)
    );
    pager.append(left);
    const s = "Previewer";
    for (let i = 0; i < s.length; ++i) {
      const n = normal.clone().text(s[i]);
      pager.append(n);
    }
    const rp = page + g_settings.novelPageCount;
    right.attr(
      "href",
      href.replace("?p=" + page, "?p=" + rp).replace("&p=" + page, "&p=" + rp)
    );
    pager.append(right);
  }
  function listnerToKeyBoard() {
    $(document).keydown(function(e) {
      if (g_settings.pageByKey != 1) {
        return;
      }
      if (e.keyCode == 39) {
        const btn = $(".pp-nextPage");
        if (btn.length < 1 || btn.attr("hidden") == "hidden") {
          return;
        }
        location.href = btn.attr("href");
      } else if (e.keyCode == 37) {
        const btn = $(".pp-prevPage");
        if (btn.length < 1 || btn.attr("hidden") == "hidden") {
          return;
        }
        location.href = btn.attr("href");
      }
    });
  }
  function main() {
    const keyWord = getKeyWord();
    if (keyWord.length == 0) {
      DoLog(1 /* Error */, "Parse key word error.");
      return;
    }
    const currentPage = getCurrentPage();
    if ($(".gtm-novel-searchpage-gs-toggle-button").attr("data-gtm-label") == "off") {
      showLoading();
      $(".gtm-novel-searchpage-gs-toggle-button").parent().next().text();
      $("#loading").find("#progress").text(
        '\u7531\u4E8E\u542F\u7528\u4E86 "' + $(".gtm-novel-searchpage-gs-toggle-button").parent().next().text() + '"\uFF0C\u65E0\u6CD5\u8FDB\u884C\u6392\u5E8F\u3002'
      );
      setTimeout(() => hideLoading(), 3e3);
      return;
    }
    showLoading();
    changePageSelector();
    listnerToKeyBoard();
    getNovelByPage(
      keyWord,
      currentPage,
      currentPage + g_settings.novelPageCount
    ).then(function(novelList) {
      rearrangeNovel(sortNovel(novelList));
    });
  }
  main();
}
function SetLocalStorage(name, value) {
  localStorage.setItem(name, JSON.stringify(value));
}
function GetLocalStorage(name) {
  const value = localStorage.getItem(name);
  if (!value) return null;
  return value;
}
function GetCookie(name) {
  let arr;
  const reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
  if (arr = document.cookie.match(reg)) {
    return unescape(arr[2]);
  } else {
    return null;
  }
}
function ShowUpgradeMessage() {
  $("#pp-bg").remove();
  const bg = $('<div id="pp-bg"></div>').css({
    width: document.documentElement.clientWidth + "px",
    height: document.documentElement.clientHeight + "px",
    position: "fixed",
    "z-index": 999999,
    "background-color": "rgba(0,0,0,0.8)",
    left: "0px",
    top: "0px"
  });
  $("body").append(bg);
  const body = i18n_default[g_language].upgrade_body;
  bg.get(0).innerHTML = '<img id="pps-close"src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Close.png"style="position: absolute; right: 35px; top: 20px; width: 32px; height: 32px; cursor: pointer;"><div style="position: absolute;width: 40%;left: 30%;top: 25%;font-size: 25px; text-align: center; color: white;">' + i18n_default[g_language].install_title + g_version + '</div><br><div style="position:absolute;left:50%;top:30%;font-size:20px;color:white;transform:translate(-50%,0);height:50%;overflow:auto;">' + body + "</div>";
  $("#pps-close").click(function() {
    $("#pp-bg").remove();
  });
}
function FillNewSetting(st) {
  let changed = false;
  $.each(g_defaultSettings, function(k, v) {
    if (st[k] == void 0) {
      st[k] = g_defaultSettings[k];
      changed = true;
    }
  });
  return {
    st,
    change: changed
  };
}
function GetSettings() {
  let settings;
  const settingsData = GetLocalStorage("PixivPreview") || GetCookie("PixivPreview");
  if (settingsData == null || settingsData == "null") {
    settings = g_defaultSettings;
    SetLocalStorage("PixivPreview", settings);
    ShowUpgradeMessage();
  } else {
    settings = JSON.parse(settingsData);
    const mp = FillNewSetting(settings);
    if (mp.change) {
      settings = mp.st;
      SetLocalStorage("PixivPreview", settings);
    }
    if (settings.version != g_version) {
      ShowUpgradeMessage();
      settings.version = g_version;
      SetLocalStorage("PixivPreview", settings);
    }
  }
  return settings;
}
function ShowSetting() {
  const screenWidth = document.documentElement.clientWidth;
  const screenHeight = document.documentElement.clientHeight;
  $("#pp-bg").remove();
  const bg = $('<div id="pp-bg"></div>').css({
    width: screenWidth + "px",
    height: screenHeight + "px",
    position: "fixed",
    "z-index": 999999,
    "background-color": "rgba(0,0,0,0.8)",
    left: "0px",
    top: "0px"
  });
  $("body").append(bg);
  const settings = GetSettings();
  const settingHTML = '<div style="color: white; font-size: 1em;"><img id="pps-close" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Close.png" style="position: absolute; right: 35px; top: 20px; width: 32px; height: 32px; cursor: pointer;"><div style="position: absolute; height: 60%; left: 50%; top: 10%; overflow-y: auto; transform: translate(-50%, 0%);"><ul id="pps-ul" style="list-style: none; padding: 0; margin: 0;"></ul></div><div style="margin-top: 10px;position: absolute;bottom: 10%;width: 100%;text-align: center;"><button id="pps-save" style="font-size: 25px; border-radius: 12px; height: 48px; min-width: 138px; max-width: 150px; background-color: green; color: white; margin: 0 32px 0 32px; cursor: pointer; border: none;">' + i18n_default[g_language].setting_save + '</button><button id="pps-reset" style="font-size: 25px; border-radius: 12px; height: 48px; min-width: 138px; max-width: 150px; background-color: darkred; color: white; margin: 0 32px 0 32px; cursor: pointer; border: none;">' + i18n_default[g_language].setting_reset + "</button></div></div>";
  bg.get(0).innerHTML = settingHTML;
  const ul = $("#pps-ul");
  function getImageAction(id) {
    return '<img id="' + id + '" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png" style="height: 32px; cursor: pointer; margin-right: 20px; vertical-align: middle;"/>';
  }
  function getInputAction(id) {
    return '<input id="' + id + '" style="font-size: 24px; padding: 0; margin-right: 16px; border-width: 0px; width: 64px; text-align: center;"/>';
  }
  function getSelectAction(id) {
    return '<select id="' + id + '" style="font-size: 20px; margin-right: 10px;"></select>';
  }
  function addItem(action, text) {
    ul.append(
      '<li style="font-size: 25px; padding-bottom: 5px;">' + action + text + "</li>"
    );
  }
  ul.empty();
  addItem(getSelectAction("pps-lang"), i18n_default[g_language].setting_language);
  addItem(
    getImageAction("pps-fullSizeThumb"),
    i18n_default[g_language].sort_fullSizeThumb
  );
  addItem("", "&nbsp");
  addItem(getImageAction("pps-preview"), i18n_default[g_language].setting_preview);
  addItem(
    getImageAction("pps-animePreview"),
    i18n_default[g_language].setting_animePreview
  );
  addItem(getImageAction("pps-anime"), i18n_default[g_language].setting_anime);
  addItem(getImageAction("pps-original"), i18n_default[g_language].setting_origin);
  addItem(
    getInputAction("pps-previewDelay"),
    i18n_default[g_language].setting_previewDelay
  );
  addItem(
    getImageAction("pps-previewByKey"),
    i18n_default[g_language].setting_previewByKey
  );
  $("#pps-previewByKey").attr(
    "title",
    i18n_default[g_language].setting_previewByKeyHelp
  );
  addItem("", "&nbsp");
  addItem(getImageAction("pps-sort"), i18n_default[g_language].setting_sort);
  addItem(getInputAction("pps-maxPage"), i18n_default[g_language].setting_maxPage);
  addItem(getInputAction("pps-hideLess"), i18n_default[g_language].setting_hideWork);
  addItem(getImageAction("pps-hideAi"), i18n_default[g_language].setting_hideAiWork);
  addItem(
    getImageAction("pps-hideBookmarked"),
    i18n_default[g_language].setting_hideFav
  );
  addItem(
    getImageAction("pps-hideFollowed"),
    i18n_default[g_language].setting_hideFollowed + '&nbsp<button id="pps-clearFollowingCache" style="cursor:pointer;background-color:gold;border-radius:12px;border:none;font-size:20px;padding:3px 10px;" title="' + i18n_default[g_language].setting_clearFollowingCacheHelp + '">' + i18n_default[g_language].setting_clearFollowingCache + "</button>"
  );
  addItem(getImageAction("pps-hideByTag"), i18n_default[g_language].setting_hideByTag);
  addItem(
    '<input id="pps-hideByTagList" style="font-size: 18px;padding: 0;border-width: 0px;text-align: center;width: 95%;" placeholder="' + i18n_default[g_language].setting_hideByTagPlaceholder + '">',
    ""
  );
  addItem(getImageAction("pps-newTab"), i18n_default[g_language].setting_blank);
  addItem(getImageAction("pps-pageKey"), i18n_default[g_language].setting_turnPage);
  addItem("", "&nbsp");
  addItem(getImageAction("pps-novelSort"), i18n_default[g_language].setting_novelSort);
  addItem(
    getInputAction("pps-novelMaxPage"),
    i18n_default[g_language].setting_novelMaxPage
  );
  addItem(
    getInputAction("pps-novelHideWork"),
    i18n_default[g_language].setting_novelHideWork
  );
  addItem(
    getImageAction("pps-novelHideBookmarked"),
    i18n_default[g_language].setting_novelHideFav
  );
  const imgOn = "https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png";
  const imgOff = "https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Off.png";
  $("#pps-preview").attr("src", settings.enablePreview ? imgOn : imgOff).addClass(settings.enablePreview ? "on" : "off").css("cursor: pointer");
  $("#pps-animePreview").attr("src", settings.enableAnimePreview ? imgOn : imgOff).addClass(settings.enableAnimePreview ? "on" : "off").css("cursor: pointer");
  $("#pps-sort").attr("src", settings.enableSort ? imgOn : imgOff).addClass(settings.enableSort ? "on" : "off").css("cursor: pointer");
  $("#pps-anime").attr("src", settings.enableAnimeDownload ? imgOn : imgOff).addClass(settings.enableAnimeDownload ? "on" : "off").css("cursor: pointer");
  $("#pps-original").attr("src", settings.original ? imgOn : imgOff).addClass(settings.original ? "on" : "off").css("cursor: pointer");
  $("#pps-previewDelay").val(settings.previewDelay);
  $("#pps-previewByKey").attr("src", settings.previewByKey ? imgOn : imgOff).addClass(settings.original ? "on" : "off").css("cursor: pointer");
  $("#pps-maxPage").val(settings.pageCount);
  $("#pps-hideLess").val(settings.favFilter);
  $("#pps-hideAi").attr("src", settings.aiFilter ? imgOn : imgOff).addClass(settings.aiFilter ? "on" : "off").css("cursor: pointer");
  $("#pps-hideBookmarked").attr("src", settings.hideFavorite ? imgOn : imgOff).addClass(settings.hideFavorite ? "on" : "off").css("cursor: pointer");
  $("#pps-hideFollowed").attr("src", settings.hideFollowed ? imgOn : imgOff).addClass(settings.hideFollowed ? "on" : "off").css("cursor: pointer");
  $("#pps-hideByTag").attr("src", settings.hideByTag ? imgOn : imgOff).addClass(settings.hideFollowed ? "on" : "off").css("cursor: pointer");
  $("#pps-hideByTagList").val(settings.hideByTagList);
  $("#pps-newTab").attr("src", settings.linkBlank ? imgOn : imgOff).addClass(settings.linkBlank ? "on" : "off").css("cursor: pointer");
  $("#pps-pageKey").attr("src", settings.pageByKey ? imgOn : imgOff).addClass(settings.pageByKey ? "on" : "off").css("cursor: pointer");
  $("#pps-fullSizeThumb").attr("src", settings.fullSizeThumb ? imgOn : imgOff).addClass(settings.fullSizeThumb ? "on" : "off").css("cursor: pointer");
  $("#pps-novelSort").attr("src", settings.enableNovelSort ? imgOn : imgOff).addClass(settings.enableNovelSort ? "on" : "off").css("cursor: pointer");
  $("#pps-novelMaxPage").val(settings.novelPageCount);
  $("#pps-novelHideWork").val(settings.novelFavFilter);
  $("#pps-novelHideBookmarked").attr("src", settings.novelHideFavorite ? imgOn : imgOff).addClass(settings.novelHideFavorite ? "on" : "off").css("cursor: pointer");
  $("#pps-lang").append('<option value="-1">Auto</option>').append('<option value="' + 0 /* zh_CN */ + '">\u7B80\u4F53\u4E2D\u6587</option>').append('<option value="' + 1 /* en_US */ + '">English</option>').append('<option value="' + 2 /* ru_RU */ + '">\u0420\u0443\u0441\u0441\u043A\u0438\u0439 \u044F\u0437\u044B\u043A</option>').append('<option value="' + 3 /* ja_JP */ + '">\u65E5\u672C\u8A9E</option>').val(g_settings.lang == void 0 ? -1 /* auto */ : g_settings.lang);
  $("#pps-ul").find("img").click(function() {
    const _this = $(this);
    if (_this.hasClass("on")) {
      _this.attr("src", imgOff).removeClass("on").addClass("off");
    } else {
      _this.attr("src", imgOn).removeClass("off").addClass("on");
    }
  });
  $("#pps-clearFollowingCache").click(function() {
    const user_id = dataLayer[0].user_id;
    SetLocalStorage("followingOfUid-" + user_id, null, -1);
    alert(i18n_default[g_language].setting_followingCacheCleared);
  });
  $("#pps-save").click(function() {
    if ($("#pps-maxPage").val() === "") {
      $("#pps-maxPage").val(g_defaultSettings.pageCount);
    }
    if ($("#pps-hideLess").val() == "") {
      $("#pps-hideLess").val(g_defaultSettings.favFilter);
    }
    const settings2 = {
      lang: $("#pps-lang").val(),
      enablePreview: $("#pps-preview").hasClass("on") ? 1 : 0,
      enableAnimePreview: $("#pps-animePreview").hasClass("on") ? 1 : 0,
      enableSort: $("#pps-sort").hasClass("on") ? 1 : 0,
      enableAnimeDownload: $("#pps-anime").hasClass("on") ? 1 : 0,
      original: $("#pps-original").hasClass("on") ? 1 : 0,
      previewDelay: parseInt($("#pps-previewDelay").val()),
      previewByKey: $("#pps-previewByKey").hasClass("on") ? 1 : 0,
      pageCount: parseInt($("#pps-maxPage").val()),
      favFilter: parseInt($("#pps-hideLess").val()),
      aiFilter: $("#pps-hideAi").hasClass("on") ? 1 : 0,
      hideFavorite: $("#pps-hideBookmarked").hasClass("on") ? 1 : 0,
      hideFollowed: $("#pps-hideFollowed").hasClass("on") ? 1 : 0,
      hideByTag: $("#pps-hideByTag").hasClass("on") ? 1 : 0,
      hideByTagList: $("#pps-hideByTagList").val(),
      linkBlank: $("#pps-newTab").hasClass("on") ? 1 : 0,
      pageByKey: $("#pps-pageKey").hasClass("on") ? 1 : 0,
      fullSizeThumb: $("#pps-fullSizeThumb").hasClass("on") ? 1 : 0,
      enableNovelSort: $("#pps-novelSort").hasClass("on") ? 1 : 0,
      novelPageCount: parseInt($("#pps-novelMaxPage").val()),
      novelFavFilter: parseInt($("#pps-novelHideWork").val()),
      novelHideFavorite: $("#pps-novelHideBookmarked").hasClass("on") ? 1 : 0,
      version: g_version
    };
    SetLocalStorage("PixivPreview", settings2);
    location.reload();
  });
  $("#pps-reset").click(function() {
    const comfirmText = i18n_default[g_language].setting_resetHint;
    if (confirm(comfirmText)) {
      SetLocalStorage("PixivPreview", null);
      location.reload();
    }
  });
  $("#pps-close").click(function() {
    $("#pp-bg").remove();
  });
}
function SetTargetBlank(returnMap) {
  if (g_settings.linkBlank) {
    const target = [];
    $.each(returnMap.controlElements, function(i, e) {
      if (e.tagName == "A") {
        target.push(e);
      }
    });
    $.each($(returnMap.controlElements).find("a"), function(i, e) {
      target.push(e);
    });
    $.each(target, function(i, e) {
      $(e).attr({ target: "_blank", rel: "external" });
      if (g_pageType == 4 /* Home */ || g_pageType == 3 /* Member */ || g_pageType == 10 /* Artwork */ || g_pageType == 1 /* BookMarkNew */) {
        e.addEventListener("click", function(ev) {
          ev.stopPropagation();
        });
      }
    });
  }
}
var loadInterval;
var itv;
function AutoDetectLanguage() {
  g_language = -1 /* auto */;
  if (g_settings && g_settings.lang) {
    g_language = g_settings.lang;
  }
  if (g_language == -1 /* auto */) {
    const lang = $("html").attr("lang");
    if (lang && lang.indexOf("zh") != -1) {
      g_language = 0 /* zh_CN */;
    } else if (lang && lang.indexOf("ja") != -1) {
      g_language = 3 /* ja_JP */;
    } else {
      g_language = 1 /* en_US */;
    }
  }
}
function Load() {
  for (let i = 0; i < 13 /* PageTypeCount */; i++) {
    if (Pages[i].CheckUrl(location.href)) {
      g_pageType = i;
      break;
    }
  }
  if (g_pageType >= 0) {
    DoLog(3 /* Info */, "Current page is " + Pages[g_pageType].PageTypeString);
  } else {
    DoLog(3 /* Info */, "Unsupported page.");
    clearInterval(loadInterval);
    return;
  }
  const toolBar = Pages[g_pageType].GetToolBar();
  if (toolBar) {
    DoLog(4 /* Elements */, toolBar);
    clearInterval(loadInterval);
  } else {
    DoLog(2 /* Warning */, "Get toolbar failed.");
    return;
  }
  window.onresize = function() {
    if ($("#pp-bg").length > 0) {
      const screenWidth = document.documentElement.clientWidth;
      const screenHeight = document.documentElement.clientHeight;
      $("#pp-bg").css({
        width: screenWidth + "px",
        height: screenHeight + "px"
      });
    }
  };
  AutoDetectLanguage();
  g_settings = GetSettings();
  AutoDetectLanguage();
  if ($("#pp-sort").length === 0 && !g_settings?.enableSort) {
    const newListItem = toolBar.firstChild.cloneNode(true);
    newListItem.innerHTML = "";
    const newButton = document.createElement("button");
    newButton.id = "pp-sort";
    newButton.style.cssText = "background-color: rgb(0, 0, 0); margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 0px; border-radius: 24px; width: 48px; height: 48px;";
    newButton.innerHTML = `<span style="color: white;vertical-align: text-top;">${i18n_default[g_language].text_sort}</span>`;
    newListItem.appendChild(newButton);
    toolBar.appendChild(newListItem);
    $(newButton).click(function() {
      this.disabled = true;
      runPixivPreview(true);
      setTimeout(() => {
        this.disabled = false;
      }, 7e3);
    });
  }
  if ($("#pp-settings").length === 0) {
    const newListItem = toolBar.firstChild.cloneNode(true);
    newListItem.innerHTML = "";
    const newButton = document.createElement("button");
    newButton.id = "pp-settings";
    newButton.style.cssText = "background-color: rgb(0, 0, 0); margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 12px; border-radius: 24px; width: 48px; height: 48px;";
    newButton.innerHTML = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve" style="fill: white;"><metadata> Svg Vector Icons : http://www.sfont.cn </metadata><g><path d="M377.5,500c0,67.7,54.8,122.5,122.5,122.5S622.5,567.7,622.5,500S567.7,377.5,500,377.5S377.5,432.3,377.5,500z"></path><path d="M990,546v-94.8L856.2,411c-8.9-35.8-23-69.4-41.6-100.2L879,186L812,119L689,185.2c-30.8-18.5-64.4-32.6-100.2-41.5L545.9,10h-94.8L411,143.8c-35.8,8.9-69.5,23-100.2,41.5L186.1,121l-67,66.9L185.2,311c-18.6,30.8-32.6,64.4-41.5,100.3L10,454v94.8L143.8,589c8.9,35.8,23,69.4,41.6,100.2L121,814l67,67l123-66.2c30.8,18.6,64.5,32.6,100.3,41.5L454,990h94.8L589,856.2c35.8-8.9,69.4-23,100.2-41.6L814,879l67-67l-66.2-123.1c18.6-30.7,32.6-64.4,41.5-100.2L990,546z M500,745c-135.3,0-245-109.7-245-245c0-135.3,109.7-245,245-245s245,109.7,245,245C745,635.3,635.3,745,500,745z"></path></g></svg>';
    newListItem.appendChild(newButton);
    toolBar.appendChild(newListItem);
    $(newButton).click(function() {
      ShowSetting();
    });
  }
  if (g_pageType == 0 /* Search */ || g_pageType == 11 /* NovelSearch */) {
    $.get(location.href, function(data) {
      const matched = data.match(/token":"([a-z0-9]{32})/);
      if (matched.length > 0) {
        g_csrfToken = matched[1];
        DoLog(3 /* Info */, "Got g_csrfToken: " + g_csrfToken);
      } else {
        DoLog(
          1 /* Error */,
          "Can not get g_csrfToken, so you can not add works to bookmark when sorting has enabled."
        );
      }
    });
  }
  itv = setInterval(function() {
    const returnMap = Pages[g_pageType].ProcessPageElements();
    if (!returnMap.loadingComplete) {
      return;
    }
    DoLog(3 /* Info */, "Process page comlete, sorting and prevewing begin.");
    DoLog(4 /* Elements */, returnMap);
    clearInterval(itv);
    SetTargetBlank(returnMap);
    runPixivPreview();
  }, 500);
  function runPixivPreview(eventFromButton = false) {
    try {
      if (g_settings.enablePreview) {
        try {
          loadIllustPreview(g_settings);
        } catch (error) {
          iLog.e(`An error occurred while loading illust preview: ${error}`);
        }
      }
      if (g_pageType == 10 /* Artwork */) {
        Pages[g_pageType].Work();
      } else if (g_pageType == 0 /* Search */) {
        if (g_settings.enableSort || eventFromButton) {
          g_sortComplete = false;
          PixivSK(function() {
            g_sortComplete = true;
          });
        }
      } else if (g_pageType == 11 /* NovelSearch */) {
        if (g_settings.enableNovelSort || eventFromButton) {
          PixivNS();
        }
      }
    } catch (e) {
      DoLog(1 /* Error */, "Unknown error: " + e);
    }
  }
}
var startLoad = () => {
  loadInterval = setInterval(Load, 1e3);
  setInterval(function() {
    if (location.href != initialUrl) {
      if (!g_sortComplete) {
        location.reload();
        return;
      }
      if ($(".pp-main").length > 0) {
        $(".pp-main").remove();
      }
      initialUrl = location.href;
      clearInterval(loadInterval);
      clearInterval(itv);
      g_pageType = -1;
      loadInterval = setInterval(Load, 300);
    }
  }, 1e3);
};
var inChecking = false;
var jqItv = setInterval(function() {
  if (inChecking) {
    return;
  }
  inChecking = true;
  checkJQuery().then(function(isLoad) {
    if (isLoad) {
      clearInterval(jqItv);
      startLoad();
    }
    inChecking = false;
  });
}, 1e3);
