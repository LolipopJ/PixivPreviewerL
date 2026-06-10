// ==UserScript==
// @name                Pixiv Previewer L
// @namespace           https://github.com/LolipopJ/PixivPreviewer
// @version             1.4.5-20260610
// @description         Original project: https://github.com/Ocrosoft/PixivPreviewer.
// @author              Ocrosoft, LolipopJ
// @license             GPL-3.0
// @supportURL          https://github.com/LolipopJ/PixivPreviewer
// @match               *://www.pixiv.net/*
// @grant               GM_getValue
// @grant               GM_setValue
// @grant               GM_registerMenuCommand
// @grant               GM_unregisterMenuCommand
// @grant               GM.xmlHttpRequest
// @icon                https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=32&url=https://www.pixiv.net
// @icon64              https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=https://www.pixiv.net
// @require             https://update.greasyfork.org/scripts/515994/1478507/gh_2215_make_GM_xhr_more_parallel_again.js
// @require             https://code.jquery.com/jquery-4.0.0.min.js
// @require             https://code.jquery.com/jquery-migrate-4.0.2.min.js
// @run-at              document-end
// ==/UserScript==

//#region src/constants/index.ts
/** 版本号，发生改变时将会弹窗 */
const g_version = "1.4.5";
/** 默认设置 */
const g_defaultSettings = {
	enablePreview: true,
	enableAnimePreview: true,
	previewDelay: 300,
	pageCount: 2,
	favFilter: 500,
	orderType: 0,
	aiFilter: false,
	aiAssistedFilter: false,
	hideFavorite: true,
	hideByTag: false,
	hideByTagList: "",
	linkBlank: true,
	version: g_version
};
/** 加载中占位图片 */
const g_loadingImage = "https://pp-1252089172.cos.ap-chengdu.myqcloud.com/loading.gif";
/** 工具栏 ID */
const TOOLBAR_ID = "pp-toolbar";
/** 排序按钮 ID */
const SORT_BUTTON_ID = "pp-sort";
/** 排序事件名称 */
const SORT_EVENT_NAME = "PIXIV_PREVIEWER_RUN_SORT";
/** 下一页按钮 ID */
const SORT_NEXT_PAGE_BUTTON_ID = "pp-sort-next-page";
/** 下一页事件名称 */
const SORT_NEXT_PAGE_EVENT_NAME = "PIXIV_PREVIEWER_JUMP_TO_NEXT_PAGE";
/** 隐藏已收藏作品按钮 */
const HIDE_FAVORITES_BUTTON_ID = "pp-hide-favorites";
/** AI 辅助标签列表，全小写 */
const AI_ASSISTED_TAGS = [
	"aiイラスト",
	"ai-generated",
	"ai-assisted",
	"ai-shoujo",
	"ai生成",
	"ai輔助",
	"ai辅助",
	"ai加筆",
	"ai加笔"
];

//#endregion
//#region src/utils/logger.ts
var ILog = class {
	prefix = "%c Pixiv Preview";
	v(...values) {
		console.log(this.prefix + " [VERBOSE] ", "color:#333 ;background-color: #fff", ...values);
	}
	i(...infos) {
		console.info(this.prefix + " [INFO] ", "color:#333 ;background-color: #fff;", ...infos);
	}
	w(...warnings) {
		console.warn(this.prefix + " [WARNING] ", "color:#111 ;background-color:#ffa500;", ...warnings);
	}
	e(...errors) {
		console.error(this.prefix + " [ERROR] ", "color:#111 ;background-color:#ff0000;", ...errors);
	}
	d(...data) {
		console.log(this.prefix + " [DATA] ", "color:#333 ;background-color: #fff;", ...data);
	}
};
const iLog = new ILog();
function DoLog(level = 3, ...msgOrElement) {
	switch (level) {
		case 1:
			iLog.e(...msgOrElement);
			break;
		case 2:
			iLog.w(...msgOrElement);
			break;
		case 3:
			iLog.i(...msgOrElement);
			break;
		case 4:
		case 0:
		default: iLog.v(...msgOrElement);
	}
}

//#endregion
//#region src/databases/index.ts
const INDEX_DB_NAME = "PIXIV_PREVIEWER_L";
const INDEX_DB_VERSION = 1;
const ILLUSTRATION_DETAILS_CACHE_TABLE_KEY = "illustrationDetailsCache";
/** 缓存过期时间 */
const ILLUSTRATION_DETAILS_CACHE_TIME = 1e3 * 60 * 60 * 6;
/** 新作品发布初期不添加缓存 */
const NEW_ILLUSTRATION_NOT_CACHE_TIME = 1e3 * 60 * 60 * 1;
const request$1 = indexedDB.open(INDEX_DB_NAME, INDEX_DB_VERSION);
let db;
request$1.onupgradeneeded = (event) => {
	event.target.result.createObjectStore(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, { keyPath: "id" });
};
request$1.onsuccess = (event) => {
	db = event.target.result;
	console.log("Open IndexedDB successfully:", db);
	deleteExpiredIllustrationDetails();
};
request$1.onerror = (event) => {
	iLog.e(`An error occurred while requesting IndexedDB`, event);
};
const cacheIllustrationDetails = (illustrations, now = /* @__PURE__ */ new Date()) => {
	return new Promise(() => {
		const cachedIllustrationDetailsObjectStore = db.transaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, "readwrite").objectStore(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY);
		illustrations.forEach((illustration) => {
			const uploadTimestamp = illustration.uploadTimestamp * 1e3;
			if (now.getTime() - uploadTimestamp > NEW_ILLUSTRATION_NOT_CACHE_TIME) {
				const illustrationDetails = {
					...illustration,
					cacheDate: now
				};
				const addCachedIllustrationDetailsRequest = cachedIllustrationDetailsObjectStore.put(illustrationDetails);
				addCachedIllustrationDetailsRequest.onerror = (event) => {
					iLog.e(`An error occurred while caching illustration details`, event);
				};
			}
		});
	});
};
const getCachedIllustrationDetails = (id, now = /* @__PURE__ */ new Date()) => {
	return new Promise((resolve) => {
		const cachedIllustrationDetailsObjectStore = db.transaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, "readwrite").objectStore(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY);
		const getCachedIllustrationDetailsRequest = cachedIllustrationDetailsObjectStore.get(id);
		getCachedIllustrationDetailsRequest.onsuccess = (event) => {
			const illustrationDetails = event.target.result;
			if (illustrationDetails) {
				const { cacheDate } = illustrationDetails;
				if (now.getTime() - cacheDate.getTime() <= ILLUSTRATION_DETAILS_CACHE_TIME) resolve(illustrationDetails);
				else cachedIllustrationDetailsObjectStore.delete(id).onerror = (event) => {
					iLog.e(`An error occurred while deleting outdated illustration details`, event);
				};
			}
			resolve(null);
		};
		getCachedIllustrationDetailsRequest.onerror = (event) => {
			iLog.e(`An error occurred while getting cached illustration details`, event);
			resolve(null);
		};
	});
};
const deleteCachedIllustrationDetails = (ids) => {
	return new Promise((resolve) => {
		const cachedIllustrationDetailsObjectStore = db.transaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, "readwrite").objectStore(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY);
		for (const id of ids) {
			const deleteCachedIllustrationDetailsRequest = cachedIllustrationDetailsObjectStore.delete(id);
			deleteCachedIllustrationDetailsRequest.onsuccess = () => {
				resolve();
			};
			deleteCachedIllustrationDetailsRequest.onerror = (event) => {
				iLog.w(`An error occurred while deleting cached details of illustration ${id}`, event);
				resolve();
			};
		}
	});
};
/** 移除过期的缓存 */
function deleteExpiredIllustrationDetails() {
	return new Promise((resolve) => {
		const now = (/* @__PURE__ */ new Date()).getTime();
		const cachedIllustrationDetailsObjectStore = db.transaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, "readwrite").objectStore(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY);
		const getAllRequest = cachedIllustrationDetailsObjectStore.getAll();
		getAllRequest.onsuccess = (event) => {
			event.target.result.forEach((entry) => {
				if (now - entry.cacheDate.getTime() > ILLUSTRATION_DETAILS_CACHE_TIME) cachedIllustrationDetailsObjectStore.delete(entry.id);
			});
			resolve();
		};
	});
}

//#endregion
//#region src/features/hide-favorites.ts
let isHidden = false;
const hideFavorites = () => {
	$("svg").filter(function() {
		return $(this).css("color") === "rgb(255, 64, 96)";
	}).each(function() {
		const listItem = $(this).closest("li, div.col-span-2");
		listItem.hide();
		listItem.attr("data-pp-fav-hidden", "true");
	});
	isHidden = true;
};

//#endregion
//#region src/icons/download.svg
var download_default = "<svg t=\"1742281193586\" class=\"icon\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"\n  p-id=\"24408\" width=\"10\" height=\"10\">\n  <path\n    d=\"M1024 896v128H0v-320h128v192h768v-192h128v192zM576 554.688L810.688 320 896 405.312l-384 384-384-384L213.312 320 448 554.688V0h128v554.688z\"\n    fill=\"#ffffff\" p-id=\"24409\"></path>\n</svg>";

//#endregion
//#region src/icons/loading.svg
var loading_default = "<svg t=\"1742282291278\" class=\"icon\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"\n  p-id=\"38665\" width=\"48\" height=\"48\">\n  <path\n    d=\"M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 0 0-94.3-139.9 437.71 437.71 0 0 0-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3 0.1 19.9-16 36-35.9 36z\"\n    p-id=\"38666\" fill=\"#1296db\"></path>\n</svg>";

//#endregion
//#region src/icons/page.svg
var page_default = "<svg viewBox=\"0 0 10 10\" width=\"10\" height=\"10\">\n  <path\n    d=\"M 8 3 C 8.55228 3 9 3.44772 9 4 L 9 9 C 9 9.55228 8.55228 10 8 10 L 3 10 C 2.44772 10 2 9.55228 2 9 L 6 9 C 7.10457 9 8 8.10457 8 7 L 8 3 Z M 1 1 L 6 1 C 6.55228 1 7 1.44772 7 2 L 7 7 C 7 7.55228 6.55228 8 6 8 L 1 8 C 0.447715 8 0 7.55228 0 7 L 0 2 C 0 1.44772 0.447715 1 1 1 Z\"\n    fill=\"#ffffff\"></path>\n</svg>";

//#endregion
//#region src/utils/utils.ts
const pause = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
const convertObjectKeysFromSnakeToCamel = (obj) => {
	function snakeToCamel(snake) {
		return snake.replace(/_([a-z])/g, (result) => result[1].toUpperCase());
	}
	const newResponse = {};
	for (const key in obj) newResponse[snakeToCamel(key)] = obj[key];
	return newResponse;
};
const createLRUCache = (maxSize) => {
	const map = /* @__PURE__ */ new Map();
	return {
		get(key) {
			if (!map.has(key)) return void 0;
			const val = map.get(key);
			map.delete(key);
			map.set(key, val);
			return val;
		},
		set(key, val) {
			if (map.has(key)) map.delete(key);
			else if (map.size >= maxSize) map.delete(map.keys().next().value);
			map.set(key, val);
		}
	};
};

//#endregion
//#region src/services/request.ts
const xmlHttpRequest = window.GM.xmlHttpRequest;
const request = (options) => {
	const { headers, ...restOptions } = options;
	return xmlHttpRequest({
		responseType: "json",
		...restOptions,
		headers: {
			referer: "https://www.pixiv.net/",
			...headers
		}
	});
};
const requestWithRetry = async (options) => {
	const { retryDelay = 1e4, maxRetryTimes = Infinity, onRetry, ...restOptions } = options;
	let response;
	let retryTimes = 0;
	while (retryTimes < maxRetryTimes) {
		response = await request(restOptions);
		if (response.status === 200) {
			if (!response.response.error) return response;
		}
		retryTimes += 1;
		onRetry?.(response, retryTimes);
		await pause(retryDelay);
	}
	throw new Error(`Request for ${restOptions.url} failed: ${response?.responseText}`);
};

//#endregion
//#region src/services/download.ts
const downloadFile = (url, filename, options = {}) => {
	const { onload, onerror, ...restOptions } = options;
	request({
		...restOptions,
		url,
		method: "GET",
		responseType: "blob",
		onload: function(resp) {
			onload?.call(this, resp);
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
		onerror: function(resp) {
			onerror?.call(this, resp);
			iLog.e(`Download ${filename} from ${url} failed: ${resp.responseText}`);
		}
	});
};

//#endregion
//#region src/services/illustration.ts
/** 从 IndexedDB 或接口获取指定作品的详细信息 */
const getIllustrationDetailsWithCache = async (id, retry = false) => {
	let illustDetails = await getCachedIllustrationDetails(id);
	if (illustDetails) iLog.d(`Use cached details of illustration ${id}`, illustDetails);
	else {
		const requestUrl = `/touch/ajax/illust/details?illust_id=${id}`;
		const getIllustDetailsRes = retry ? await requestWithRetry({
			url: requestUrl,
			onRetry: (response, retryTimes) => {
				iLog.w(`Get illustration details via api \`${requestUrl}\` failed:`, response, `${retryTimes} times retrying...`);
			}
		}) : await request({ url: requestUrl });
		if (getIllustDetailsRes.status === 200) {
			illustDetails = convertObjectKeysFromSnakeToCamel(getIllustDetailsRes.response.body.illust_details);
			cacheIllustrationDetails([illustDetails]);
		} else illustDetails = null;
	}
	return illustDetails;
};
/** 获取用户发布的所有作品，按照发布时间倒叙 */
const getUserIllustrations = async (userId) => {
	const responseData = (await request({ url: `/ajax/user/${userId}/profile/all?sensitiveFilterMode=userSetting&lang=zh` })).response.body;
	const illusts = Object.keys(responseData.illusts).reverse();
	const manga = Object.keys(responseData.manga).reverse();
	return {
		illusts,
		manga,
		artworks: [...illusts, ...manga].sort((a, b) => Number(b) - Number(a))
	};
};
/** 从 Session Storage 或接口获取指定用户的作品列表 */
const getUserIllustrationsWithCache = async (userId, { onRequesting } = {}) => {
	let userIllustrations;
	const userIllustrationsCacheKey = `PIXIV_PREVIEWER_CACHED_ARTWORKS_OF_USER_${userId}`;
	try {
		const userIllustrationsCacheString = sessionStorage.getItem(userIllustrationsCacheKey);
		if (!userIllustrationsCacheString) throw new Error("Illustrations cache not existed.");
		userIllustrations = JSON.parse(userIllustrationsCacheString);
	} catch (error) {
		iLog.i(`Get illustrations of current user from session storage failed, re-getting...`, error);
		onRequesting?.();
		userIllustrations = await getUserIllustrations(userId);
		sessionStorage.setItem(userIllustrationsCacheKey, JSON.stringify(userIllustrations));
	}
	return userIllustrations;
};

//#endregion
//#region src/services/preview.ts
/** 下载作品 */
const downloadIllust = ({ url, filename, options = {} }) => {
	downloadFile(url, filename, {
		...options,
		onerror: function(resp) {
			options.onerror?.call(this, resp);
			window.open(url, "__blank");
		}
	});
};
/** 获取图片分页信息和访问链接 */
const getIllustPagesRequestUrl = (id) => {
	return `/ajax/illust/${id}/pages`;
};
/** 获取动图下载链接的链接 */
const getUgoiraMetadataRequestUrl = (id) => {
	return `/ajax/illust/${id}/ugoira_meta`;
};

//#endregion
//#region src/utils/debounce.ts
function debounce(func, delay = 100) {
	let timeout = null;
	return function(...args) {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			func(...args);
		}, delay);
	};
}

//#endregion
//#region src/utils/event.ts
const stopEventPropagation = (event) => {
	event.stopPropagation();
};

//#endregion
//#region src/utils/illustration.ts
const checkIsR18 = (tags) => {
	const R18_TAGS = ["r-18", "r18"];
	for (const tag of tags) if (R18_TAGS.includes(tag.toLowerCase())) return true;
	return false;
};
const checkIsUgoira = (illustType) => {
	return illustType === 2;
};
const checkIsAiGenerated = (aiType) => {
	return aiType === 2;
};
const checkIsAiAssisted = (tags) => {
	for (const tag of tags) if (AI_ASSISTED_TAGS.includes(tag.toLowerCase())) return true;
	return false;
};
const checkIsUgoiraUsingTags = (tags) => {
	return tags.includes("うごイラ");
};

//#endregion
//#region src/utils/mouse-monitor.ts
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
const mouseMonitor = new MouseMonitor();

//#endregion
//#region src/utils/ugoira-player.ts
var ZipImagePlayer = class {
	canvas;
	op;
	_URL;
	_maxLoadAhead;
	_isSafari;
	_loadingState;
	_dead;
	_context;
	_files;
	_frameCount;
	_frame;
	_loadFrame;
	_frameImages;
	_paused;
	_loadTimer;
	_timer;
	_failed;
	_len;
	_buf;
	_bytes;
	_pHead;
	_pNextHead;
	_pFetch;
	_pTail;
	_trailerBytes = 3e4;
	_listeners = {};
	on(event, handler) {
		this._listeners[event] = handler;
	}
	off(event) {
		delete this._listeners[event];
	}
	_emit(event, ...args) {
		const handler = this._listeners[event];
		if (handler) handler(...args);
	}
	constructor(options) {
		this.canvas = options.canvas;
		this.op = options;
		const w = window;
		this._URL = window.URL || w.webkitURL;
		this._maxLoadAhead = 0;
		if (!this._URL) {
			this._debugLog("No URL support! Will use slower data: URLs.");
			this._maxLoadAhead = 10;
		}
		if (!window.Blob) this._error("No Blob support");
		if (!window.Uint8Array) this._error("No Uint8Array support");
		if (!window.DataView) this._error("No DataView support");
		if (!window.ArrayBuffer) this._error("No ArrayBuffer support");
		this._isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") > 0;
		this._loadingState = 0;
		this._dead = false;
		const context = options.canvas.getContext("2d");
		if (!context) this._error("Failed to get 2D context");
		this._context = context;
		this._files = {};
		this._frameCount = this.op.metadata.frames.length;
		this._debugLog("Frame count: " + this._frameCount);
		this._frame = 0;
		this._loadFrame = 0;
		this._frameImages = [];
		this._paused = false;
		this._loadTimer = null;
		this._timer = null;
		this._failed = false;
		this._len = 0;
		this._buf = null;
		this._bytes = null;
		this._pHead = 0;
		this._pNextHead = 0;
		this._pFetch = 0;
		this._pTail = 0;
		this._startLoad();
		if (this.op.autoStart) this.play();
		else this._paused = true;
	}
	_mkerr(msg) {
		return () => {
			this._error(msg);
		};
	}
	_error(msg) {
		this._failed = true;
		throw Error("ZipImagePlayer error: " + msg);
	}
	_debugLog(msg) {
		if (this.op.debug) console.log(msg);
	}
	_load(offset, length, callback) {
		const xhr = new XMLHttpRequest();
		xhr.addEventListener("load", () => {
			if (this._dead) return;
			this._debugLog("Load: " + offset + " " + length + " status=" + xhr.status);
			if (xhr.status == 200) {
				this._debugLog("Range disabled or unsupported, complete load");
				offset = 0;
				length = xhr.response.byteLength;
				this._len = length;
				this._buf = xhr.response;
				this._bytes = new Uint8Array(this._buf);
			} else {
				if (xhr.status != 206) this._error("Unexpected HTTP status " + xhr.status);
				if (xhr.response.byteLength != length) this._error("Unexpected length " + xhr.response.byteLength + " (expected " + length + ")");
				this._bytes.set(new Uint8Array(xhr.response), offset);
			}
			if (callback) callback(offset, length);
		}, false);
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
	}
	_startLoad() {
		if (!this.op.source) {
			this._loadNextFrame();
			return;
		}
		$.ajax({
			url: this.op.source,
			type: "HEAD"
		}).done((_data, _status, xhr) => {
			if (this._dead) return;
			this._pHead = 0;
			this._pNextHead = 0;
			this._pFetch = 0;
			const len = parseInt(String(xhr.getResponseHeader("Content-Length")));
			if (!len) {
				this._debugLog("HEAD request failed: invalid file length.");
				this._debugLog("Falling back to full file mode.");
				this._load(null, null, (_off, fullLen) => {
					this._pTail = 0;
					this._pHead = fullLen;
					this._findCentralDirectory();
				});
				return;
			}
			this._debugLog("Len: " + len);
			this._len = len;
			this._buf = new ArrayBuffer(len);
			this._bytes = new Uint8Array(this._buf);
			let off = len - this._trailerBytes;
			if (off < 0) off = 0;
			this._pTail = len;
			this._load(off, len - off, (loadedOff) => {
				this._pTail = loadedOff;
				this._findCentralDirectory();
			});
		}).fail(this._mkerr("Length fetch failed"));
	}
	_findCentralDirectory() {
		const dv = new DataView(this._buf, this._len - 22, 22);
		if (dv.getUint32(0, true) != 101010256) this._error("End of Central Directory signature not found");
		const cd_count = dv.getUint16(10, true);
		const cd_size = dv.getUint32(12, true);
		const cd_off = dv.getUint32(16, true);
		if (cd_off < this._pTail) this._load(cd_off, this._pTail - cd_off, () => {
			this._pTail = cd_off;
			this._readCentralDirectory(cd_off, cd_size, cd_count);
		});
		else this._readCentralDirectory(cd_off, cd_size, cd_count);
	}
	_readCentralDirectory(offset, size, count) {
		const dv = new DataView(this._buf, offset, size);
		let p = 0;
		for (let i = 0; i < count; i++) {
			if (dv.getUint32(p, true) != 33639248) this._error("Invalid Central Directory signature");
			const compMethod = dv.getUint16(p + 10, true);
			const uncompSize = dv.getUint32(p + 24, true);
			const nameLen = dv.getUint16(p + 28, true);
			const extraLen = dv.getUint16(p + 30, true);
			const cmtLen = dv.getUint16(p + 32, true);
			const off = dv.getUint32(p + 42, true);
			if (compMethod != 0) this._error("Unsupported compression method");
			p += 46;
			const nameView = new Uint8Array(this._buf, offset + p, nameLen);
			let name = "";
			for (let j = 0; j < nameLen; j++) name += String.fromCharCode(nameView[j]);
			p += nameLen + extraLen + cmtLen;
			this._files[name] = {
				off,
				len: uncompSize
			};
		}
		if (this._pHead >= this._pTail) {
			this._pHead = this._len;
			$(this).triggerHandler("loadProgress", [this._pHead / this._len]);
			this._loadNextFrame();
		} else {
			this._loadNextChunk();
			this._loadNextChunk();
		}
	}
	_loadNextChunk() {
		if (this._pFetch >= this._pTail) return;
		const off = this._pFetch;
		let len = this.op.chunkSize;
		if (this._pFetch + len > this._pTail) len = this._pTail - this._pFetch;
		this._pFetch += len;
		this._load(off, len, (loadedOff, loadedLen) => {
			if (loadedOff == this._pHead) {
				if (this._pNextHead) {
					this._pHead = this._pNextHead;
					this._pNextHead = 0;
				} else this._pHead = loadedOff + loadedLen;
				if (this._pHead >= this._pTail) this._pHead = this._len;
				$(this).triggerHandler("loadProgress", [this._pHead / this._len]);
				if (!this._loadTimer) this._loadNextFrame();
			} else this._pNextHead = loadedOff + loadedLen;
			this._loadNextChunk();
		});
	}
	_fileDataStart(offset) {
		const dv = new DataView(this._buf, offset, 30);
		const nameLen = dv.getUint16(26, true);
		const extraLen = dv.getUint16(28, true);
		return offset + 30 + nameLen + extraLen;
	}
	_isFileAvailable(name) {
		const info = this._files[name];
		if (!info) this._error("File " + name + " not found in ZIP");
		if (this._pHead < info.off + 30) return false;
		return this._pHead >= this._fileDataStart(info.off) + info.len;
	}
	_loadNextFrame() {
		if (this._dead) return;
		const frame = this._loadFrame;
		if (frame >= this._frameCount) return;
		const meta = this.op.metadata.frames[frame];
		if (!this.op.source) {
			this._loadFrame += 1;
			this._loadImage(frame, meta.file, false);
			return;
		}
		if (!this._isFileAvailable(meta.file)) return;
		this._loadFrame += 1;
		const off = this._fileDataStart(this._files[meta.file].off);
		const end = off + this._files[meta.file].len;
		let url;
		const mime_type = this.op.metadata.mime_type ?? "image/png";
		if (this._URL) {
			let slice;
			if (!this._buf.slice) {
				slice = new ArrayBuffer(this._files[meta.file].len);
				new Uint8Array(slice).set(this._bytes.subarray(off, end));
			} else slice = this._buf.slice(off, end);
			const blob = new Blob([slice], { type: mime_type });
			url = this._URL.createObjectURL(blob);
			this._loadImage(frame, url, true);
		} else {
			url = "data:" + mime_type + ";base64," + base64ArrayBuffer(this._buf, off, end - off);
			this._loadImage(frame, url, false);
		}
	}
	_loadImage(frame, url, isBlob) {
		const image = new Image();
		const meta = this.op.metadata.frames[frame];
		image.addEventListener("load", () => {
			this._debugLog("Loaded " + meta.file + " to frame " + frame);
			if (isBlob) this._URL.revokeObjectURL(url);
			if (this._dead) return;
			this._frameImages[frame] = image;
			this._emit("frameLoaded", frame);
			if (this._loadingState == 0) this._displayFrame();
			if (frame >= this._frameCount - 1) {
				this._setLoadingState(2);
				this._buf = null;
				this._bytes = null;
			} else if (!this._maxLoadAhead || frame - this._frame < this._maxLoadAhead) this._loadNextFrame();
			else if (!this._loadTimer) this._loadTimer = setTimeout(() => {
				this._loadTimer = null;
				this._loadNextFrame();
			}, 200);
		});
		image.src = url;
	}
	_setLoadingState(state) {
		if (this._loadingState != state) {
			this._loadingState = state;
			$(this).triggerHandler("loadingStateChanged", [state]);
		}
	}
	_displayFrame() {
		if (this._dead) return;
		const meta = this.op.metadata.frames[this._frame];
		this._debugLog("Displaying frame: " + this._frame + " " + meta.file);
		const image = this._frameImages[this._frame];
		if (!image) {
			this._debugLog("Image not available!");
			this._setLoadingState(0);
			return;
		}
		if (this._loadingState != 2) this._setLoadingState(1);
		if (this.op.autosize) {
			if (this._context.canvas.width != image.width || this._context.canvas.height != image.height) {
				this._context.canvas.width = image.width;
				this._context.canvas.height = image.height;
			}
		}
		this._context.clearRect(0, 0, this.op.canvas.width, this.op.canvas.height);
		this._context.drawImage(image, 0, 0);
		$(this).triggerHandler("frame", this._frame);
		if (!this._paused) this._timer = setTimeout(() => {
			this._timer = null;
			this._nextFrame();
		}, meta.delay);
	}
	_nextFrame() {
		if (this._frame >= this._frameCount - 1) if (this.op.loop) this._frame = 0;
		else {
			this.pause();
			return;
		}
		else this._frame += 1;
		this._displayFrame();
	}
	play() {
		if (this._dead) return;
		if (this._paused) {
			$(this).triggerHandler("play", [this._frame]);
			this._paused = false;
			this._displayFrame();
		}
	}
	pause() {
		if (this._dead) return;
		if (!this._paused) {
			if (this._timer) clearTimeout(this._timer);
			this._paused = true;
			$(this).triggerHandler("pause", [this._frame]);
		}
	}
	rewind() {
		if (this._dead) return;
		this._frame = 0;
		if (this._timer) clearTimeout(this._timer);
		this._displayFrame();
	}
	stop() {
		this._debugLog("Stopped!");
		this._dead = true;
		if (this._timer) clearTimeout(this._timer);
		if (this._loadTimer) clearTimeout(this._loadTimer);
		this._frameImages = [];
		this._buf = null;
		this._bytes = null;
		$(this).triggerHandler("stop");
	}
	getCurrentFrame() {
		return this._frame;
	}
	getLoadedFrameImages() {
		return this._frameImages;
	}
	getLoadedFrames() {
		return this._frameImages.length;
	}
	getFrameCount() {
		return this._frameCount;
	}
	hasError() {
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

//#endregion
//#region src/features/preview.ts
let isInitialized$1 = false;
const loadIllustPreview = (options) => {
	if (isInitialized$1) return;
	const { previewDelay, enableAnimePreview, linkBlank } = options;
	const mouseHoverDebounceWait = previewDelay / 5;
	const mouseHoverPreviewWait = previewDelay - mouseHoverDebounceWait;
	/**
	* 获取作品的元数据信息
	* @param target 查找的 JQuery 对象
	* @returns 作品的元数据
	*/
	const getIllustMetadata = (target) => {
		const imgLink = target.closest("a");
		if (!imgLink.length) return null;
		const illustHrefMatch = imgLink.attr("href")?.match(/\/artworks\/(\d+)(#(\d+))?/);
		if (!illustHrefMatch) return null;
		const illustId = illustHrefMatch[1];
		const previewPage = Number(illustHrefMatch[3] ?? 1);
		const ugoiraSvg = imgLink.children("div:first").find("svg:first");
		const playIcon = imgLink.children("div:first").find("pixiv-icon[name=\"24/Play\"]");
		return {
			/** 作品 ID */
			illustId,
			/** 作品页码 */
			previewPage,
			/** 作品类型 */
			illustType: ugoiraSvg.length || playIcon.length || imgLink.hasClass("ugoku-illust") ? 2 : 0,
			/** 作品链接 DOM */
			illustLinkDom: imgLink
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
		const getIllustPagesCache = createLRUCache(100);
		const getUgoiraMetadataCache = createLRUCache(100);
		return ({ target, illustId, previewPage = 1, illustType }) => {
			getIllustPagesRequest.abort();
			currentHoveredIllustId = illustId;
			if (illustType === 2 && !enableAnimePreview) {
				iLog.i("动图预览已禁用，跳过");
				return;
			}
			if ([0, 1].includes(illustType)) {
				const illustPagesCached = getIllustPagesCache.get(illustId);
				if (illustPagesCached) {
					previewedIllust.setImage({
						illustId,
						illustElement: target,
						previewPage,
						...illustPagesCached
					});
					return;
				}
				getIllustPagesRequest = $.ajax(getIllustPagesRequestUrl(illustId), {
					method: "GET",
					success: (data) => {
						if (data.error) {
							iLog.e(`An error occurred while requesting preview urls of illust ${illustId}: ${data.message}`);
							return;
						}
						const urls = data.body.map((item) => item.urls);
						const regularUrls = urls.map((url) => url.regular);
						const originalUrls = urls.map((url) => url.original);
						getIllustPagesCache.set(illustId, {
							regularUrls,
							originalUrls
						});
						if (currentHoveredIllustId !== illustId) return;
						previewedIllust.setImage({
							illustId,
							illustElement: target,
							previewPage,
							regularUrls,
							originalUrls
						});
					},
					error: (err) => {
						iLog.e(`An error occurred while requesting preview urls of illust ${illustId}: ${err}`);
					}
				});
			} else if (illustType === 2) {
				const ugoiraMetadataCached = getUgoiraMetadataCache.get(illustId);
				if (ugoiraMetadataCached) {
					previewedIllust.setUgoira({
						illustId,
						illustElement: target,
						...ugoiraMetadataCached
					});
					return;
				}
				getIllustPagesRequest = $.ajax(getUgoiraMetadataRequestUrl(illustId), {
					method: "GET",
					success: (data) => {
						if (data.error) {
							iLog.e(`An error occurred while requesting metadata of ugoira ${illustId}: ${data.message}`);
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
							frames
						});
					},
					error: (err) => {
						iLog.e(`An error occurred while requesting metadata of ugoira ${illustId}: ${err.responseText}`);
					}
				});
			} else {
				iLog.e("Unknown illust type.");
				return;
			}
		};
	})();
	const onMouseOverIllust = (target) => {
		const { illustId, previewPage, illustType, illustLinkDom } = getIllustMetadata(target) || {};
		if (illustId === void 0 || illustType === void 0) return;
		if (linkBlank && illustLinkDom) {
			illustLinkDom.attr({
				target: "_blank",
				rel: "external"
			});
			illustLinkDom.off("click", stopEventPropagation);
			illustLinkDom.on("click", stopEventPropagation);
		}
		const previewIllustTimeout = setTimeout(() => {
			previewIllust({
				target,
				illustId,
				previewPage,
				illustType
			});
		}, mouseHoverPreviewWait);
		const onMouseMove = (mouseMoveEvent) => {
			if (mouseMoveEvent.ctrlKey || mouseMoveEvent.metaKey) {
				clearTimeout(previewIllustTimeout);
				target.off("mousemove", onMouseMove);
			}
		};
		target.on("mousemove", onMouseMove);
		const onMouseOut = () => {
			clearTimeout(previewIllustTimeout);
			target.off("mouseout", onMouseOut);
		};
		target.on("mouseout", onMouseOut);
	};
	const onMouseMoveDocument = (() => {
		const debouncedOnMouseOverIllust = debounce(onMouseOverIllust, mouseHoverDebounceWait);
		let prevTarget = null;
		return (mouseMoveEvent) => {
			if (mouseMoveEvent.ctrlKey || mouseMoveEvent.metaKey) return;
			if (mouseMoveEvent.target === prevTarget) return;
			prevTarget = mouseMoveEvent.target;
			debouncedOnMouseOverIllust($(mouseMoveEvent.target));
		};
	})();
	$(document).on("mousemove", onMouseMoveDocument);
	(function inactiveUnexpectedDoms() {
		const styleRules = $("<style>").prop("type", "text/css");
		styleRules.append(`
@keyframes pp-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`);
		styleRules.append(`
._layout-thumbnail img + div {
  pointer-events: none;
}`);
		styleRules.append(`
pixiv-icon[name="24/Play"] {
  pointer-events: none;
}`);
		styleRules.appendTo("head");
	})();
	isInitialized$1 = true;
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
	gap: "4px"
};
var PreviewedIllust = class {
	/** 当前正在预览的作品的 ID */
	illustId = "";
	/** 当前正在预览的作品的详细信息 */
	illustDetails = null;
	/** 当前正在预览的作品 DOM 元素 */
	illustElement = $();
	/** 当前预览的作品是否加载完毕 */
	illustLoaded = false;
	/** 图片的链接 */
	regularUrls = [];
	/** 图片的原图链接 */
	originalUrls = [];
	/** 当前预览图片的页数 */
	currentPage = 1;
	/** 当前预览图片的总页数 */
	pageCount = 1;
	/** 预览图片或动图容器 DOM */
	previewWrapperElement = $();
	/** 预览容器顶部栏 DOM */
	previewWrapperHeader = $();
	/** 当前预览作品的元数据 */
	illustMeta = $();
	/** 当前预览的是第几张图片标记 DOM */
	pageCountElement = $();
	pageCountText = $();
	/** 下载原图按钮 DOM */
	downloadOriginalElement = $();
	/** 预览图片或动图加载状态 DOM */
	previewLoadingElement = $();
	/** 当前预览的图片或动图 DOM */
	previewImageElement = $();
	/** 预加载图片的列表 */
	#images = [];
	/** 下载按钮重置定时器 */
	#downloadResetTimeout = null;
	/** 保存的鼠标位置 */
	#prevMousePos = [0, 0];
	/** 当前预览图片的实际尺寸 */
	#currentIllustSize = [0, 0];
	/** 当前预览的动图播放器 */
	#currentUgoiraPlayer;
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
		this.previewWrapperElement?.remove();
		this.previewWrapperElement = $(document.createElement("div")).attr({ id: "pp-wrapper" }).css({
			position: "fixed",
			"z-index": "999999",
			border: `${2}px solid rgb(0, 150, 250)`,
			"border-radius": `${8}px`,
			background: "rgba(31, 31, 31, 0.8)",
			"backdrop-filter": "blur(4px)",
			"text-align": "center",
			"pointer-events": "none"
		}).hide().appendTo($("body"));
		this.previewWrapperHeader = $(document.createElement("div")).css({
			position: "absolute",
			top: "0px",
			left: "0px",
			right: "0px",
			padding: "5px",
			display: "flex",
			gap: "5px",
			"align-items": "center"
		}).hide().appendTo(this.previewWrapperElement);
		this.illustMeta = $(document.createElement("div")).css({
			display: "flex",
			gap: "5px",
			"align-items": "center",
			"margin-right": "auto"
		}).appendTo(this.previewWrapperHeader);
		this.pageCountText = $(document.createElement("span")).text("1/1");
		this.pageCountElement = $(document.createElement("div")).css({
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
			gap: "4px"
		}).append(page_default).append(this.pageCountText).hide().appendTo(this.previewWrapperHeader);
		this.downloadOriginalElement = $(document.createElement("a")).css({
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
			gap: "4px"
		}).append(`${download_default}<span>原图</span>`).appendTo(this.previewWrapperHeader);
		this.previewLoadingElement = $(loading_default).css({
			padding: "12px",
			animation: "pp-spin 1s linear infinite"
		}).appendTo(this.previewWrapperElement);
		this.previewImageElement = $(new Image()).css({ "border-radius": `${8}px` }).hide().appendTo(this.previewWrapperElement);
		this.#images.forEach((image) => {
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
		this.unbindPreviewImageEvents();
		this.unbindUgoiraPreviewEvents();
	}
	/** 初始化预览容器，默认显示第一张图片 */
	setImage({ illustId, illustElement, previewPage = 1, regularUrls, originalUrls }) {
		this.reset();
		this.initPreviewWrapper();
		this.illustId = illustId;
		this.illustElement = illustElement;
		this.regularUrls = regularUrls;
		this.originalUrls = originalUrls;
		this.currentPage = previewPage;
		this.pageCount = regularUrls.length;
		this.preloadImages();
		this.bindPreviewImageEvents();
		this.updatePreviewImage();
		this.showIllustrationDetails();
	}
	bindPreviewImageEvents() {
		this.previewImageElement.on("load", this.onImageLoad);
		this.previewImageElement.on("click", this.onPreviewImageMouseClick);
		this.downloadOriginalElement.on("click", this.onDownloadImage);
		$(document).on("wheel", this.onPreviewImageMouseWheel);
		$(document).on("keydown", this.onPreviewImageKeyDown);
		$(document).on("mousemove", this.onMouseMove);
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
	updatePreviewImage(page = this.currentPage) {
		const currentImageUrl = this.regularUrls[page - 1];
		this.previewImageElement.attr("src", currentImageUrl);
		this.pageCountText.text(`${page}/${this.pageCount}`);
	}
	onImageLoad = () => {
		this.illustLoaded = true;
		this.previewLoadingElement.hide();
		this.previewImageElement.show();
		this.previewWrapperHeader.show();
		if (this.pageCount > 1) this.pageCountElement.show();
		this.previewImageElement.css({
			width: "",
			height: ""
		});
		this.#currentIllustSize = [this.previewImageElement.width() ?? 0, this.previewImageElement.height() ?? 0];
		this.adjustPreviewWrapper({ baseOnMousePos: false });
	};
	nextPage() {
		if (this.currentPage < this.pageCount) this.currentPage += 1;
		else this.currentPage = 1;
		this.resetDownloadButton();
		this.updatePreviewImage();
		this.preloadImages();
	}
	prevPage() {
		if (this.currentPage > 1) this.currentPage -= 1;
		else this.currentPage = this.pageCount;
		this.resetDownloadButton();
		this.updatePreviewImage();
	}
	resetDownloadButton() {
		if (this.#downloadResetTimeout !== null) {
			clearTimeout(this.#downloadResetTimeout);
			this.#downloadResetTimeout = null;
		}
		this.downloadOriginalElement.find("span").text("原图");
		this.downloadOriginalElement.css({
			pointerEvents: "",
			backgroundImage: "",
			backgroundSize: "",
			backgroundRepeat: ""
		});
	}
	preloadImages(from = this.currentPage - 1, to = this.currentPage - 1 + 5) {
		if (!this.#images.length) this.#images = new Array(this.regularUrls.length);
		for (let i = from; i < to && i < this.regularUrls.length; i += 1) {
			const preloadImage = new Image();
			preloadImage.src = this.regularUrls[i];
			this.#images[i] = preloadImage;
		}
	}
	onPreviewImageMouseClick = () => {
		this.nextPage();
	};
	onPreviewImageMouseWheel = (mouseWheelEvent) => {
		if (mouseWheelEvent.ctrlKey || mouseWheelEvent.metaKey) {
			mouseWheelEvent.preventDefault();
			if (mouseWheelEvent.originalEvent.deltaY > 0) this.nextPage();
			else this.prevPage();
		}
	};
	onPreviewImageKeyDown = (keyDownEvent) => {
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
	onDownloadImage = (onClickEvent) => {
		onClickEvent.preventDefault();
		const downloadPage = this.currentPage;
		const currentImageOriginalUrl = this.originalUrls[downloadPage - 1];
		const currentImageFilename = currentImageOriginalUrl.split("/").pop() || "illust.jpg";
		const textSpan = this.downloadOriginalElement.find("span");
		const originalText = textSpan.text();
		this.downloadOriginalElement.css({
			pointerEvents: "none",
			backgroundImage: "linear-gradient(to right, rgba(0,150,250,0.28), rgba(0,150,250,0.28))",
			backgroundSize: "0% 100%",
			backgroundRepeat: "no-repeat"
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
						if (total && total > 0) percent = Math.min(100, Math.round(loaded / total * 100));
						this.downloadOriginalElement.css({ backgroundSize: `${percent}% 100%` });
					} catch (e) {
						console.error(`An error occurred in download progress callback: ${e}`);
					}
				},
				onload: () => {
					if (this.currentPage !== downloadPage) return;
					textSpan.text("已下载");
					this.downloadOriginalElement.css({
						backgroundImage: "",
						backgroundSize: "",
						pointerEvents: ""
					});
					this.#downloadResetTimeout = setTimeout(() => {
						textSpan.text(originalText);
						this.#downloadResetTimeout = null;
					}, 3e3);
				}
			}
		});
	};
	setUgoira({ illustId, illustElement, src, mime_type, frames }) {
		this.reset();
		this.initPreviewWrapper();
		this.illustId = illustId;
		this.illustElement = illustElement;
		illustElement.siblings("svg").css({ "pointer-events": "none" });
		this.#currentUgoiraPlayer = this.createUgoiraPlayer({
			source: src,
			metadata: {
				mime_type,
				frames
			}
		});
		this.bindUgoiraPreviewEvents();
		this.showIllustrationDetails();
	}
	createUgoiraPlayer(options) {
		return new ZipImagePlayer({
			canvas: document.createElement("canvas"),
			chunkSize: 3e5,
			loop: true,
			autoStart: true,
			debug: false,
			...options
		});
	}
	bindUgoiraPreviewEvents() {
		this.#currentUgoiraPlayer?.on("frameLoaded", this.onUgoiraFrameLoaded);
		$(document).on("mousemove", this.onMouseMove);
	}
	unbindUgoiraPreviewEvents() {
		this.#currentUgoiraPlayer?.off("frameLoaded");
		$(document).off("mousemove", this.onMouseMove);
	}
	onUgoiraFrameLoaded = (frame) => {
		if (frame !== 0) return;
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
			height: ugoiraOriginHeight
		});
		this.adjustPreviewWrapper({ baseOnMousePos: false });
	};
	async showIllustrationDetails() {
		const illustrationDetails = await getIllustrationDetailsWithCache(this.illustId);
		if (illustrationDetails && illustrationDetails.id === this.illustId) {
			this.illustMeta.empty();
			const { aiType, bookmarkId, bookmarkUserTotal, tags } = illustrationDetails;
			const isR18 = checkIsR18(tags);
			const isAi = checkIsAiGenerated(aiType);
			const isAiAssisted = checkIsAiAssisted(tags);
			const illustrationDetailsElements = [];
			if (isR18) illustrationDetailsElements.push($(document.createElement("div")).css({
				...DETAIL_BADGE_CSS,
				background: "rgb(255, 64, 96)"
			}).text("R-18"));
			if (isAi) illustrationDetailsElements.push($(document.createElement("div")).css({
				...DETAIL_BADGE_CSS,
				background: "rgb(29, 78, 216)"
			}).text("AI 生成"));
			else if (isAiAssisted) illustrationDetailsElements.push($(document.createElement("div")).css({
				...DETAIL_BADGE_CSS,
				background: "rgb(109, 40, 217)"
			}).text("AI 辅助"));
			illustrationDetailsElements.push($(document.createElement("div")).css({
				...DETAIL_BADGE_CSS,
				background: bookmarkUserTotal > 5e4 ? "rgb(159, 18, 57)" : bookmarkUserTotal > 1e4 ? "rgb(220, 38, 38)" : bookmarkUserTotal > 5e3 ? "rgb(29, 78, 216)" : bookmarkUserTotal > 1e3 ? "rgb(21, 128, 61)" : "rgb(71, 85, 105)"
			}).text(`${bookmarkId ? "❤️" : "❤"} ${bookmarkUserTotal}`));
			this.illustMeta.append(illustrationDetailsElements);
			if (checkIsUgoiraUsingTags(tags)) this.downloadOriginalElement.hide();
		}
	}
	/** 初始化显示预览容器 */
	initPreviewWrapper() {
		this.previewWrapperElement.show();
		this.previewLoadingElement.show();
		this.adjustPreviewWrapper({ baseOnMousePos: true });
	}
	/** 阻止页面缩放事件 */
	preventPageZoom = (mouseWheelEvent) => {
		if (mouseWheelEvent.ctrlKey || mouseWheelEvent.metaKey) mouseWheelEvent.preventDefault();
	};
	/**
	* 根据鼠标移动调整预览容器位置与显隐
	* @param mouseMoveEvent
	*/
	onMouseMove = (mouseMoveEvent) => {
		if (mouseMoveEvent.ctrlKey || mouseMoveEvent.metaKey) {
			this.previewWrapperElement.css({ "pointer-events": "auto" });
			return;
		}
		this.previewWrapperElement.css({ "pointer-events": "none" });
		if ($(mouseMoveEvent.target).is(this.illustElement)) this.adjustPreviewWrapper({ baseOnMousePos: true });
		else this.reset();
	};
	/**
	* 调整预览容器的位置与大小
	* @param `baseOnMousePos` 是否根据当前鼠标所在位置调整
	* @param `illustSize` 作品的实际大小
	*/
	adjustPreviewWrapper({ baseOnMousePos = true } = {}) {
		const [mousePosX, mousePosY] = baseOnMousePos ? mouseMonitor.mouseAbsPos : this.#prevMousePos;
		this.#prevMousePos = [mousePosX, mousePosY];
		const [illustWidth, illustHeight] = this.#currentIllustSize;
		const screenWidth = document.documentElement.clientWidth;
		const screenHeight = document.documentElement.clientHeight;
		const DIST = 20;
		if (!illustWidth || !illustHeight) {
			const defaultPos = {
				left: `${mousePosX + DIST}px`,
				top: `${mousePosY}px`
			};
			this.previewWrapperElement.css(defaultPos);
			this.previewImageElement.css({
				width: "",
				height: ""
			});
			return;
		}
		const candidates = [
			{
				side: "left",
				availW: Math.max(0, mousePosX - DIST),
				availH: screenHeight
			},
			{
				side: "right",
				availW: Math.max(0, screenWidth - mousePosX - DIST),
				availH: screenHeight
			},
			{
				side: "top",
				availW: screenWidth,
				availH: Math.max(0, mousePosY - DIST)
			},
			{
				side: "bottom",
				availW: screenWidth,
				availH: Math.max(0, screenHeight - mousePosY - DIST)
			}
		];
		let best = null;
		for (const c of candidates) {
			let scale = 1;
			if (this.illustLoaded) {
				const sx = c.availW / illustWidth;
				const sy = c.availH / illustHeight;
				scale = Number(Math.min(sx, sy).toFixed(3));
			}
			const fitW = Math.max(0, Math.floor(illustWidth * scale));
			const fitH = Math.max(0, Math.floor(illustHeight * scale));
			const area = fitW * fitH;
			if (!best || area > best.area) best = {
				side: c.side,
				fitW,
				fitH,
				area
			};
		}
		const previewImageFitWidth = best?.fitW ?? 0;
		const previewImageFitHeight = best?.fitH ?? 0;
		const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
		const side = best?.side ?? "bottom";
		const isHorizontal = side === "left" || side === "right";
		const anchorX = isHorizontal ? side === "right" ? mousePosX + DIST : mousePosX - DIST - previewImageFitWidth : Math.floor(mousePosX - previewImageFitWidth / 2);
		const anchorY = isHorizontal ? Math.floor(mousePosY - previewImageFitHeight / 2) : side === "bottom" ? mousePosY + DIST : mousePosY - DIST - previewImageFitHeight;
		const left = clamp(anchorX, 0, Math.max(0, screenWidth - previewImageFitWidth));
		const top = clamp(anchorY, 0, Math.max(0, screenHeight - previewImageFitHeight));
		this.previewWrapperElement.css({
			left: `${left}px`,
			top: `${top}px`,
			right: "",
			bottom: ""
		});
		this.previewImageElement.css({
			width: `${previewImageFitWidth}px`,
			height: `${previewImageFitHeight}px`
		});
	}
};

//#endregion
//#region src/i18n/index.ts
const Texts = {
	install_title: "欢迎使用 Pixiv Previewer (LolipopJ Edition) v",
	upgrade_body: `<div>
  <p style="line-height: 1.6;">
    本脚本基于
    <a
      style="color: skyblue"
      href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer"
      target="_blank"
      >Pixiv Previewer</a
    >
    二次开发，旨在满足开发者自己需要的能力。如果您有不错的想法或建议，请前往原脚本的
    <a
      style="color: skyblue"
      href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback"
      target="_blank"
      >Greasy Fork 反馈页面</a
    >或开启一个新的
    <a
      style="color: skyblue"
      href="https://github.com/Ocrosoft/PixivPreviewer/issues"
      target="_blank"
      >Github 议题</a
    >！
  </p>
</div>
`,
	setting_language: "语言",
	setting_preview: "预览",
	setting_animePreview: "动图预览",
	setting_sort: "搜索页自动排序",
	setting_anime: "动图下载（动图预览及详情页生效）",
	setting_origin: "预览时优先显示原图（慢）",
	setting_previewDelay: "延迟显示预览图（毫秒）",
	setting_previewByKey: "使用按键控制预览图展示（Ctrl）",
	setting_previewByKeyHelp: "开启后鼠标移动到图片上不再展示预览图，按下Ctrl键才展示，同时“延迟显示预览”设置项不生效。",
	setting_maxPage: "每次排序时统计的最大页数",
	setting_hideWork: "隐藏收藏数少于设定值的作品",
	setting_sortOrderByBookmark: "按照收藏数排序作品",
	setting_hideAiWork: "排序时隐藏 AI 生成作品",
	setting_hideAiAssistedWork: "排序时隐藏 AI 辅助作品",
	setting_hideFav: "排序时隐藏已收藏的作品",
	setting_hideFollowed: "排序时隐藏已关注画师作品",
	setting_hideByTag: "排序时隐藏指定标签的作品",
	setting_hideByTagPlaceholder: "输入标签名，多个标签用','分隔",
	setting_clearFollowingCache: "清除缓存",
	setting_clearFollowingCacheHelp: "关注画师信息会在本地保存一天，如果希望立即更新，请点击清除缓存",
	setting_followingCacheCleared: "已清除缓存，请刷新页面。",
	setting_blank: "使用新标签页打开作品详情页",
	setting_turnPage: "使用键盘←→进行翻页（排序后的搜索页）",
	setting_save: "保存设置",
	setting_reset: "重置脚本",
	setting_resetHint: "这会删除所有设置，相当于重新安装脚本，确定要重置吗？",
	setting_novelSort: "小说排序",
	setting_novelMaxPage: "小说排序时统计的最大页数",
	setting_novelHideWork: "隐藏收藏数少于设定值的作品",
	setting_novelHideFav: "排序时隐藏已收藏的作品",
	sort_noWork: "没有可以显示的作品（隐藏了 %1 个作品）",
	sort_getWorks: "正在获取第 %1/%2 页作品",
	sort_getBookmarkCount: "获取收藏数：%1/%2",
	sort_getPublicFollowing: "获取公开关注画师",
	sort_getPrivateFollowing: "获取私有关注画师",
	sort_filtering: "过滤%1收藏量低于%2的作品",
	sort_filteringHideFavorite: "已收藏和",
	sort_fullSizeThumb: "全尺寸缩略图（搜索页、用户页）",
	label_sort: "排序",
	label_sorting: "排序中",
	label_nextPage: "下一页",
	label_hideFav: "过滤收藏"
};

//#endregion
//#region src/icons/heart.svg
var heart_default = "<svg viewBox=\"0 0 32 32\" width=\"32\" height=\"32\">\n  <path d=\"\nM21,5.5 C24.8659932,5.5 28,8.63400675 28,12.5 C28,18.2694439 24.2975093,23.1517313 17.2206059,27.1100183\nC16.4622493,27.5342993 15.5379984,27.5343235 14.779626,27.110148 C7.70250208,23.1517462 4,18.2694529 4,12.5\nC4,8.63400691 7.13400681,5.5 11,5.5 C12.829814,5.5 14.6210123,6.4144028 16,7.8282366\nC17.3789877,6.4144028 19.170186,5.5 21,5.5 Z\"></path>\n  <path d=\"M16,11.3317089 C15.0857201,9.28334665 13.0491506,7.5 11,7.5\nC8.23857625,7.5 6,9.73857647 6,12.5 C6,17.4386065 9.2519779,21.7268174 15.7559337,25.3646328\nC15.9076021,25.4494645 16.092439,25.4494644 16.2441073,25.3646326 C22.7480325,21.7268037 26,17.4385986 26,12.5\nC26,9.73857625 23.7614237,7.5 21,7.5 C18.9508494,7.5 16.9142799,9.28334665 16,11.3317089 Z\" style=\"fill: #fafafa;\">\n  </path>\n</svg>";

//#endregion
//#region src/icons/heart-filled.svg
var heart_filled_default = "<svg viewBox=\"0 0 32 32\" width=\"32\" height=\"32\">\n  <path d=\"\nM21,5.5 C24.8659932,5.5 28,8.63400675 28,12.5 C28,18.2694439 24.2975093,23.1517313 17.2206059,27.1100183\nC16.4622493,27.5342993 15.5379984,27.5343235 14.779626,27.110148 C7.70250208,23.1517462 4,18.2694529 4,12.5\nC4,8.63400691 7.13400681,5.5 11,5.5 C12.829814,5.5 14.6210123,6.4144028 16,7.8282366\nC17.3789877,6.4144028 19.170186,5.5 21,5.5 Z\"></path>\n  <path d=\"M16,11.3317089 C15.0857201,9.28334665 13.0491506,7.5 11,7.5\nC8.23857625,7.5 6,9.73857647 6,12.5 C6,17.4386065 9.2519779,21.7268174 15.7559337,25.3646328\nC15.9076021,25.4494645 16.092439,25.4494644 16.2441073,25.3646326 C22.7480325,21.7268037 26,17.4385986 26,12.5\nC26,9.73857625 23.7614237,7.5 21,7.5 C18.9508494,7.5 16.9142799,9.28334665 16,11.3317089 Z\" style=\"fill: #dc2626;\">\n  </path>\n</svg>";

//#endregion
//#region src/icons/play.svg
var play_default = "<svg viewBox=\"0 0 24 24\"\n  style=\"width: 48px; height: 48px; stroke: none; line-height: 0; font-size: 0px; vertical-align: middle;\">\n  <circle cx=\"12\" cy=\"12\" r=\"10\" style=\"fill: rgba(0, 0, 0, 0.32);\"></circle>\n  <path d=\"M9,8.74841664 L9,15.2515834 C9,15.8038681 9.44771525,16.2515834 10,16.2515834\nC10.1782928,16.2515834 10.3533435,16.2039156 10.5070201,16.1135176 L16.0347118,12.8619342\nC16.510745,12.5819147 16.6696454,11.969013 16.3896259,11.4929799\nC16.3034179,11.3464262 16.1812655,11.2242738 16.0347118,11.1380658 L10.5070201,7.88648243\nC10.030987,7.60646294 9.41808527,7.76536339 9.13806578,8.24139652\nC9.04766776,8.39507316 9,8.57012386 9,8.74841664 Z\" style=\"fill: rgb(245, 245, 245);\"></path>\n</svg>";

//#endregion
//#region src/utils/promise.ts
const execLimitConcurrentPromises = async (promises, limit = 48) => {
	const results = [];
	let index = 0;
	const executeNext = async () => {
		if (index >= promises.length) return Promise.resolve();
		const currentIndex = index++;
		results[currentIndex] = await promises[currentIndex]();
		return await executeNext();
	};
	const initialPromises = Array.from({ length: Math.min(limit, promises.length) }, () => executeNext());
	await Promise.all(initialPromises);
	return results;
};

//#endregion
//#region src/features/sort.ts
const BOOKMARK_USER_PAGE_ILLUSTRATION_LIST_SELECTOR = "ul.sc-e967f3f1-1.cEOodl";
const USER_TYPE_ARTWORKS_PER_PAGE = 48;
let isInitialized = false;
const loadIllustSort = (options) => {
	if (isInitialized) return;
	const { pageCount: optionPageCount, favFilter: optionFavFilter, orderType = 0, hideFavorite = false, hideByTag = false, hideByTagList: hideByTagListString, aiFilter = false, aiAssistedFilter = false } = options;
	let pageCount = Number(optionPageCount), favFilter = Number(optionFavFilter);
	if (pageCount <= 0) pageCount = g_defaultSettings.pageCount;
	if (favFilter < 0) favFilter = g_defaultSettings.favFilter;
	const hideByTagList = hideByTagListString.split(",").map((tag) => tag.trim().toLowerCase()).filter((tag) => !!tag);
	if (aiAssistedFilter) hideByTagList.push(...AI_ASSISTED_TAGS);
	class IllustSorter {
		type;
		illustrations = [];
		sorting = false;
		nextSortPage;
		listElement = $();
		progressElement = $();
		progressText = $();
		sortButtonElement = $(`#${SORT_BUTTON_ID}`);
		reset({ type }) {
			try {
				this.type = type;
				this.illustrations = [];
				this.sorting = false;
				this.nextSortPage = 1;
				this.listElement = getIllustrationsListDom(type);
				this.progressElement?.remove();
				this.progressElement = $(document.createElement("div")).attr({ id: "pp-sort-progress" }).css({
					width: "100%",
					display: "flex",
					"flex-direction": "column",
					"align-items": "center",
					"justify-content": "center",
					gap: "6px"
				}).append($(new Image(96, 96)).attr({
					id: "sort-progress__loading",
					src: g_loadingImage
				}).css({ "border-radius": "50%" })).prependTo(this.listElement).hide();
				this.progressText = $(document.createElement("div")).attr({ id: "pp-sort-progress__text" }).css({
					"text-align": "center",
					"font-size": "16px",
					"font-weight": "bold",
					color: "initial"
				}).appendTo(this.progressElement);
				this.sortButtonElement.text(Texts.label_sort);
			} catch (error) {
				iLog.e(`An error occurred while resetting sorter:`, error);
				throw new Error(String(error), { cause: error });
			}
		}
		async sort({ type, api, searchParams }) {
			this.sorting = true;
			iLog.i("Start to sort illustrations.");
			this.sortButtonElement.text(Texts.label_sorting);
			try {
				let illustrations = [];
				const startPage = Number(searchParams.get("p") ?? 1);
				this.nextSortPage = startPage + pageCount;
				for (let page = startPage; page < startPage + pageCount; page += 1) {
					searchParams.set("p", String(page));
					if ([
						7,
						8,
						9
					].includes(type)) {
						searchParams.set("is_first_page", page > 1 ? "0" : "1");
						searchParams.delete("ids[]");
						const userIllustrations = await getUserIllustrationsWithCache(searchParams.get("user_id") || "", { onRequesting: () => this.setProgress(`Getting illustrations of current user...`) });
						const fromIndex = (page - 1) * USER_TYPE_ARTWORKS_PER_PAGE;
						const toIndex = page * USER_TYPE_ARTWORKS_PER_PAGE;
						switch (type) {
							case 7:
								userIllustrations.artworks.slice(fromIndex, toIndex).forEach((id) => searchParams.append("ids[]", id));
								break;
							case 8:
								userIllustrations.illusts.slice(fromIndex, toIndex).forEach((id) => searchParams.append("ids[]", id));
								break;
							case 9:
								userIllustrations.manga.slice(fromIndex, toIndex).forEach((id) => searchParams.append("ids[]", id));
								break;
						}
					} else if ([10].includes(type)) searchParams.set("offset", String((page - 1) * USER_TYPE_ARTWORKS_PER_PAGE));
					this.setProgress(`Getting illustration list of page ${page} ...`);
					const requestUrl = `${api}?${searchParams}`;
					const extractedIllustrations = getIllustrationsFromResponse(type, (await requestWithRetry({
						url: requestUrl,
						onRetry: (response, retryTimes) => {
							iLog.w(`Get illustration list through \`${requestUrl}\` failed:`, response, `${retryTimes} times retrying...`);
							this.setProgress(`Retry to get illustration list of page ${page} (${retryTimes} times)...`);
						}
					})).response);
					illustrations = illustrations.concat(extractedIllustrations);
				}
				const getDetailedIllustrationPromises = [];
				for (let i = 0; i < illustrations.length; i += 1) {
					const illustration = illustrations[i];
					const illustrationId = illustration.id;
					const illustrationAuthorId = illustration.userId;
					if (String(illustrationAuthorId) === "0") continue;
					getDetailedIllustrationPromises.push(async () => {
						this.setProgress(`Getting details of ${i + 1}/${illustrations.length} illustration...`);
						const illustrationDetails = await getIllustrationDetailsWithCache(illustrationId, true);
						return {
							...illustration,
							bookmarkUserTotal: illustrationDetails?.bookmarkUserTotal ?? -1
						};
					});
				}
				const detailedIllustrations = await execLimitConcurrentPromises(getDetailedIllustrationPromises);
				iLog.d("Queried detailed illustrations:", detailedIllustrations);
				this.setProgress("Filtering illustrations...");
				const filteredIllustrations = detailedIllustrations.filter((illustration) => {
					if (hideFavorite && illustration.bookmarkData) return false;
					if (aiFilter && illustration.aiType === 2) return false;
					if ((hideByTag || aiAssistedFilter) && hideByTagList.length) {
						for (const tag of illustration.tags) if (hideByTagList.includes(tag.toLowerCase())) return false;
					}
					return illustration.bookmarkUserTotal >= favFilter;
				});
				this.setProgress("Sorting filtered illustrations...");
				const sortedIllustrations = orderType === 0 ? filteredIllustrations.sort((a, b) => b.bookmarkUserTotal - a.bookmarkUserTotal) : filteredIllustrations;
				iLog.d("Filtered and sorted illustrations:", sortedIllustrations);
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
		setProgress(text) {
			this.progressText.text(text);
			this.progressElement.show();
		}
		hideProgress() {
			this.progressText.text("");
			this.progressElement.hide();
		}
		showIllustrations() {
			const fragment = document.createDocumentFragment();
			for (const { aiType, alt, bookmarkData, bookmarkUserTotal, id, illustType, pageCount, profileImageUrl, tags, title, url, userId, userName } of this.illustrations) {
				const isR18 = checkIsR18(tags);
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
				illustrationAnchor.target = "_blank";
				illustrationAnchor.rel = "external";
				illustrationAnchor.style = "display: block; position: relative; width: 184px;";
				const illustrationImageWrapper = document.createElement("div");
				illustrationImageWrapper.style = "position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;";
				const illustrationImage = document.createElement("img");
				illustrationImage.src = url;
				illustrationImage.alt = alt;
				illustrationImage.style = "object-fit: cover; object-position: center center; width: 100%; height: 100%; border-radius: 4px; background-color: rgb(31, 31, 31);";
				const ugoriaSvg = document.createElement("div");
				ugoriaSvg.style = "position: absolute;";
				ugoriaSvg.innerHTML = play_default;
				const illustrationMeta = document.createElement("div");
				illustrationMeta.style = "position: absolute; top: 0px; left: 0px; right: 0px; display: flex; align-items: flex-start; padding: 4px 4px 0; pointer-events: none; font-size: 10px;";
				illustrationMeta.innerHTML = `
          ${isR18 ? "<div style=\"padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(255, 64, 96); font-weight: bold; line-height: 16px; user-select: none;\">R-18</div>" : ""}
          ${isAi ? "<div style=\"padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(29, 78, 216); font-weight: bold; line-height: 16px; user-select: none;\">AI 生成</div>" : isAiAssisted ? "<div style=\"padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(109, 40, 217); font-weight: bold; line-height: 16px; user-select: none;\">AI 辅助</div>" : ""}
          ${pageCount > 1 ? `
                <div style="margin-left: auto;">
                  <div style="display: flex; justify-content: center; align-items: center; height: 20px; min-width: 20px; color: rgb(245, 245, 245); font-weight: bold; padding: 0px 6px; background: rgba(0, 0, 0, 0.32); border-radius: 10px; line-height: 10px;">
                    ${page_default}
                    <span>${pageCount}</span>
                  </div>
                </div>` : ""}
        `;
				const illustrationToolbar = document.createElement("div");
				illustrationToolbar.style = "position: absolute; top: 164px; left: 0px; right: 0px; display: flex; align-items: center; padding: 0 4px 4px; pointer-events: none; font-size: 12px;";
				illustrationToolbar.innerHTML = `
          <div style="padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: ${bookmarkUserTotal > 5e4 ? "rgb(159, 18, 57)" : bookmarkUserTotal > 1e4 ? "rgb(220, 38, 38)" : bookmarkUserTotal > 5e3 ? "rgb(29, 78, 216)" : bookmarkUserTotal > 1e3 ? "rgb(21, 128, 61)" : "rgb(71, 85, 105)"}; font-weight: bold; line-height: 16px; user-select: none;">❤ ${bookmarkUserTotal}</div>
          <div style="margin-left: auto; display: none;">${bookmarkData ? heart_filled_default : heart_default}</div>
        `;
				const illustrationTitle = document.createElement("div");
				illustrationTitle.innerHTML = title;
				illustrationTitle.style = "margin-top: 4px; max-width: 100%; overflow: hidden; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; line-height: 22px; font-size: 14px; font-weight: bold; color: rgb(245, 245, 245); transition: color 0.2s;";
				const illustrationAuthor = document.createElement("a");
				illustrationAuthor.setAttribute("data-gtm-value", userId);
				illustrationAuthor.href = `/users/${userId}`;
				illustrationAuthor.target = "_blank";
				illustrationAuthor.rel = "external";
				illustrationAuthor.style = "display: flex; align-items: center; margin-top: 4px;";
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
			if ([
				5,
				6,
				7,
				8,
				9,
				10
			].includes(this.type)) this.listElement.css({ gap: "24px" });
			this.listElement.children().remove();
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
		const { type, api, searchParams: defaultSearchParams } = getSortOptionsFromUrl(url);
		const mergedSearchParams = new URLSearchParams(defaultSearchParams);
		url.searchParams.forEach((value, key) => {
			mergedSearchParams.set(key, value);
		});
		illustSorter.reset({ type });
		illustSorter.sort({
			type,
			api,
			searchParams: mergedSearchParams
		});
	});
	window.addEventListener(SORT_NEXT_PAGE_EVENT_NAME, () => {
		const { origin, pathname, searchParams } = new URL(location.href);
		let nextPage = Number(searchParams.get("p") ?? 1) + 1;
		if (illustSorter.listElement?.length && illustSorter.nextSortPage) {
			iLog.i("Illustrations in current page are sorted, jump to next available page...");
			nextPage = illustSorter.nextSortPage;
		}
		searchParams.set("p", String(nextPage));
		location.href = `${origin}${pathname}?${searchParams}`;
	});
	isInitialized = true;
};
/** 获取作品节点 li 的父节点 ul */
function getIllustrationsListDom(type) {
	let dom;
	if ([
		0,
		1,
		2,
		3,
		4
	].includes(type)) {
		dom = $("div[data-ga4-label=\"works_content\"]").children("div").last();
		if (!dom.length) dom = $("section").find("ul").last();
	} else if ([
		5,
		6,
		10
	].includes(type)) {
		dom = $(BOOKMARK_USER_PAGE_ILLUSTRATION_LIST_SELECTOR);
		if (!dom.length) dom = $("section").find("ul").last();
	} else if ([
		7,
		8,
		9
	].includes(type)) {
		dom = $(BOOKMARK_USER_PAGE_ILLUSTRATION_LIST_SELECTOR);
		if (!dom.length) dom = $(".__top_side_menu_body").find("ul").last();
	}
	if (!dom || !dom.length) throw new Error(`Illustrations list DOM not found in current page: ${location.href}. Please create a new issue here: https://github.com/LolipopJ/PixivPreviewer/issues`);
	return dom;
}
/** 根据当前路由获取接口参数 */
function getSortOptionsFromUrl(url) {
	const { pathname, searchParams } = url;
	let type;
	let api;
	let defaultSearchParams;
	let match;
	if (match = pathname.match(/\/tags\/(.+)\/(artworks|illustrations|manga)$/)) {
		const tagName = match[1];
		switch (match[2]) {
			case "artworks":
				type = 0;
				api = `/ajax/search/artworks/${tagName}`;
				defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=all&lang=zh`;
				break;
			case "illustrations":
				type = 1;
				api = `/ajax/search/illustrations/${tagName}`;
				defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=illust_and_ugoira&lang=zh`;
				break;
			case "manga":
				type = 2;
				api = `/ajax/search/manga/${tagName}`;
				defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=manga&lang=zh`;
				break;
		}
	} else if (pathname.match(/\/search/)) {
		const tagName = searchParams.get("q");
		switch (searchParams.get("type")) {
			case "illust_ugoira":
				type = 3;
				api = `/ajax/search/illustrations/${tagName}`;
				defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=illust_and_ugoira&lang=zh`;
				break;
			case "manga":
				type = 4;
				api = `/ajax/search/manga/${tagName}`;
				defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=manga&lang=zh`;
				break;
		}
	} else if (match = pathname.match(/\/bookmark_new_illust(_r18)?\.php$/)) {
		const isR18 = !!match[1];
		api = "/ajax/follow_latest/illust";
		if (isR18) {
			type = 5;
			defaultSearchParams = "mode=r18&lang=zh";
		} else {
			type = 6;
			defaultSearchParams = "mode=all&lang=zh";
		}
	} else if (match = pathname.match(/\/users\/(\d+)\/bookmarks\/artworks$/)) {
		const userId = match[1];
		type = 10;
		api = `/ajax/user/${userId}/illusts/bookmarks`;
		defaultSearchParams = `tag=&offset=0&limit=${USER_TYPE_ARTWORKS_PER_PAGE}&rest=show&lang=zh`;
	} else if (match = pathname.match(/\/users\/(\d+)\/(artworks|illustrations|manga)$/)) {
		const userId = match[1];
		const filterType = match[2];
		api = `/ajax/user/${userId}/profile/illusts`;
		switch (filterType) {
			case "artworks":
				type = 7;
				defaultSearchParams = `work_category=illustManga&is_first_page=1&sensitiveFilterMode=userSetting&user_id=${userId}&lang=zh`;
				break;
			case "illustrations":
				type = 8;
				defaultSearchParams = `work_category=illust&is_first_page=1&sensitiveFilterMode=userSetting&user_id=${userId}&lang=zh`;
				break;
			case "manga":
				type = 9;
				defaultSearchParams = `work_category=manga&is_first_page=1&sensitiveFilterMode=userSetting&user_id=${userId}&lang=zh`;
				break;
		}
	}
	if (type === void 0 || api === void 0 || defaultSearchParams === void 0) throw new Error("Current page doesn't support sorting illustrations.");
	return {
		type,
		api,
		searchParams: new URLSearchParams(defaultSearchParams)
	};
}
/** 从响应值里提取作品数据列表 */
function getIllustrationsFromResponse(type, response) {
	if (type === 0) return response.body.illustManga.data ?? [];
	else if (type === 1 || type === 3) return response.body.illust.data ?? [];
	else if (type === 2 || type === 4) return response.body.manga.data ?? [];
	else if ([5, 6].includes(type)) return response.body.thumbnails.illust ?? [];
	else if ([
		7,
		8,
		9,
		10
	].includes(type)) return Object.values(response.body.works);
	return [];
}

//#endregion
//#region src/utils/setting.ts
const SETTINGS_KEY = "PIXIV_PREVIEWER_L_SETTINGS";
const toggleSettingBooleanValue = (key) => {
	const settings = getSettings();
	const newValue = !Boolean(settings[key] ?? g_defaultSettings[key]);
	GM_setValue(SETTINGS_KEY, {
		...settings,
		[key]: newValue
	});
};
const setSettingStringValue = (key, label, { parseValue = (v) => v, onSet }) => {
	const settings = getSettings();
	const currentValue = settings[key] ?? g_defaultSettings[key];
	const newValue = prompt(label, String(currentValue));
	if (newValue !== null) {
		const savedValue = parseValue(newValue);
		GM_setValue(SETTINGS_KEY, {
			...settings,
			[key]: savedValue
		});
		onSet?.(savedValue);
	}
};
const setSettingValue = (key, value) => {
	const settings = getSettings();
	const newValue = value ?? g_defaultSettings[key];
	GM_setValue(SETTINGS_KEY, {
		...settings,
		[key]: newValue
	});
};
const getSettings = () => {
	return GM_getValue(SETTINGS_KEY) ?? g_defaultSettings;
};
const resetSettings = () => {
	GM_setValue(SETTINGS_KEY, g_defaultSettings);
};

//#endregion
//#region src/index.ts
let g_csrfToken = "";
let g_pageType;
let g_settings;
const Pages = {
	[0]: {
		PageTypeString: "SearchPage",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/tags\/.+\/(artworks|illustrations|manga)/.test(url) || /^https?:\/\/www.pixiv.net(\/en)?\/search/.test(url);
		},
		GetToolBar: getToolbar
	},
	[1]: {
		PageTypeString: "BookMarkNewPage",
		CheckUrl: function(url) {
			return /^https:\/\/www.pixiv.net(\/en)?\/bookmark_new_illust(_r18)?.php.*/.test(url);
		},
		GetToolBar: getToolbar
	},
	[2]: {
		PageTypeString: "DiscoveryPage",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/discovery.*/.test(url);
		},
		GetToolBar: getToolbar
	},
	[3]: {
		PageTypeString: "MemberPage/MemberIllustPage/MemberBookMark",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/users\/\d+/.test(url);
		},
		GetToolBar: getToolbar
	},
	[4]: {
		PageTypeString: "HomePage",
		CheckUrl: function(url) {
			return /https?:\/\/www.pixiv.net(\/en)?\/?$/.test(url) || /https?:\/\/www.pixiv.net(\/en)?\/illustration\/?$/.test(url) || /https?:\/\/www.pixiv.net(\/en)?\/manga\/?$/.test(url) || /https?:\/\/www.pixiv.net(\/en)?\/cate_r18\.php$/.test(url);
		},
		GetToolBar: getToolbar
	},
	[5]: {
		PageTypeString: "RankingPage",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/ranking.php.*/.test(url);
		},
		GetToolBar: getToolbar
	},
	[6]: {
		PageTypeString: "NewIllustPage",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/new_illust.php.*/.test(url);
		},
		GetToolBar: getToolbar
	},
	[7]: {
		PageTypeString: "R18Page",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/cate_r18.php.*/.test(url);
		},
		GetToolBar: getToolbar
	},
	[8]: {
		PageTypeString: "StaccPage",
		CheckUrl: function(url) {
			return /^https:\/\/www.pixiv.net(\/en)?\/stacc.*/.test(url);
		},
		GetToolBar: function() {
			return getToolbarOld();
		}
	},
	[9]: {
		PageTypeString: "ArtworkPage",
		CheckUrl: function(url) {
			return /^https:\/\/www.pixiv.net(\/en)?\/artworks\/.*/.test(url);
		},
		GetToolBar: getToolbar
	},
	[10]: {
		PageTypeString: "NovelSearchPage",
		CheckUrl: function(url) {
			return /^https:\/\/www.pixiv.net(\/en)?\/tags\/.*\/novels/.test(url);
		},
		GetToolBar: getToolbar
	},
	[11]: {
		PageTypeString: "SearchTopPage",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/tags\/[^/*]/.test(url);
		},
		GetToolBar: getToolbar
	}
};
function getToolbar() {
	const toolbar = $(`#${TOOLBAR_ID}`);
	if (toolbar.length > 0) return toolbar.get(0);
	$("body").append(`<div id="${TOOLBAR_ID}" style="position: fixed; right: 28px; bottom: 96px;"></div>`);
	return $(`#${TOOLBAR_ID}`).get(0);
}
function getToolbarOld() {
	return $("._toolmenu").get(0);
}
function showSearchLinksForDeletedArtworks() {
	const searchEngines = [
		{
			name: "Google",
			url: "https://www.google.com/search?q="
		},
		{
			name: "Bing",
			url: "https://www.bing.com/search?q="
		},
		{
			name: "Baidu",
			url: "https://www.baidu.com/s?wd="
		}
	];
	document.querySelectorAll("span[to]").forEach((span) => {
		const artworkPath = span.getAttribute("to");
		if (span.textContent.trim() === "-----" && artworkPath !== null && artworkPath.startsWith("/artworks/")) {
			const keyword = `pixiv "${artworkPath.slice(10)}"`;
			const container = document.createElement("span");
			container.className = span.className;
			searchEngines.forEach((engine, i) => {
				const link = document.createElement("a");
				link.href = engine.url + encodeURIComponent(keyword);
				link.textContent = engine.name;
				link.target = "_blank";
				container.appendChild(link);
				if (i < searchEngines.length - 1) container.appendChild(document.createTextNode(" | "));
			});
			if (span.parentNode) span.parentNode.replaceChild(container, span);
		}
	});
}
let menuIds = [];
const registerSettingsMenu = () => {
	const settings = getSettings();
	for (const menuId of menuIds) GM_unregisterMenuCommand(menuId);
	menuIds = [];
	menuIds.push(GM_registerMenuCommand(`🖼️ 插画作品预览 ${settings.enablePreview ? "✅" : "❌"}`, () => {
		toggleSettingBooleanValue("enablePreview");
		registerSettingsMenu();
	}), GM_registerMenuCommand(`🎦 动图作品预览 ${settings.enableAnimePreview ? "✅" : "❌"}`, () => {
		toggleSettingBooleanValue("enableAnimePreview");
		registerSettingsMenu();
	}), GM_registerMenuCommand(`🕗 延迟 ${settings.previewDelay} 毫秒显示预览图`, () => {
		setSettingStringValue("previewDelay", "延迟显示预览图时间（毫秒）", {
			parseValue: (newValue) => Number(newValue) || g_defaultSettings.previewDelay,
			onSet: () => registerSettingsMenu()
		});
	}), GM_registerMenuCommand(`📚️ 每次排序 ${settings.pageCount} 页`, () => {
		setSettingStringValue("pageCount", "每次排序的页数", {
			parseValue: (newValue) => Number(newValue) || g_defaultSettings.pageCount,
			onSet: () => registerSettingsMenu()
		});
	}), GM_registerMenuCommand(`👨‍👩‍👧 排序隐藏收藏数少于 ${settings.favFilter} 的作品`, () => {
		setSettingStringValue("favFilter", "排序隐藏少于设定收藏数的作品", {
			parseValue: (newValue) => Number(newValue) || g_defaultSettings.favFilter,
			onSet: () => registerSettingsMenu()
		});
	}), GM_registerMenuCommand(`🎨 按照 ${settings.orderType === 0 ? "作品收藏数" : "作品发布时间"} 排序作品`, () => {
		setSettingValue("orderType", settings.orderType === 0 ? 1 : 0);
		registerSettingsMenu();
	}), GM_registerMenuCommand(`🤖 排序过滤 AI 生成作品 ${settings.aiFilter ? "✅" : "❌"}`, () => {
		toggleSettingBooleanValue("aiFilter");
		registerSettingsMenu();
	}), GM_registerMenuCommand(`🦾 排序过滤 AI 辅助（加笔）作品 ${settings.aiAssistedFilter ? "✅" : "❌"}`, () => {
		toggleSettingBooleanValue("aiAssistedFilter");
		registerSettingsMenu();
	}), GM_registerMenuCommand(`❤️ 排序过滤已收藏作品 ${settings.hideFavorite ? "✅" : "❌"}`, () => {
		toggleSettingBooleanValue("hideFavorite");
		registerSettingsMenu();
	}), GM_registerMenuCommand(`🔖 排序过滤包含指定标签的作品 ${settings.hideByTag ? "✅" : "❌"}`, () => {
		toggleSettingBooleanValue("hideByTag");
		registerSettingsMenu();
	}), GM_registerMenuCommand(`🔖 排序过滤的标签：${settings.hideByTagList}`, () => {
		setSettingStringValue("hideByTagList", "过滤的标签列表，使用`,`分隔不同标签", { onSet: () => registerSettingsMenu() });
	}), GM_registerMenuCommand(`📑 在新标签页打开作品 ${settings.linkBlank ? "✅" : "❌"}`, () => {
		toggleSettingBooleanValue("linkBlank");
		registerSettingsMenu();
	}), GM_registerMenuCommand(`🔁 重置设置`, () => {
		if (confirm("您确定要重置所有设置到脚本的默认值吗？")) {
			resetSettings();
			location.reload();
		}
	}));
	return settings;
};
const ShowUpgradeMessage = () => {
	$("#pp-bg").remove();
	const bg = $("<div id=\"pp-bg\"></div>").css({
		position: "fixed",
		"z-index": 9999,
		"background-color": "rgba(0, 0, 0, 0.8)",
		inset: "0px"
	});
	$("body").append(bg);
	bg.get(0).innerHTML = "<img id=\"pps-close\" src=\"https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Close.png\"style=\"position: absolute; right: 35px; top: 20px; width: 32px; height: 32px; cursor: pointer;\"><div style=\"position: absolute; width: 40%; left: 30%; top: 25%; font-size: 25px; font-weight: bold; text-align: center; color: white;\">" + Texts.install_title + g_version + "</div><br><div style=\"position: absolute; left: 50%; top: 35%; font-size: 20px; color: white; transform: translate(-50%,0); height: 50%; overflow: auto;\">" + Texts.upgrade_body + "</div>";
	$("#pps-close").on("click", () => {
		setSettingValue("version", g_version);
		$("#pp-bg").remove();
	});
};
const initializePixivPreviewer = () => {
	try {
		g_settings = registerSettingsMenu();
		iLog.i("Start to initialize Pixiv Previewer with global settings:", g_settings);
		if (g_settings.version !== "1.4.5") ShowUpgradeMessage();
		if (g_settings.enablePreview) loadIllustPreview(g_settings);
		$.get(location.href, function(data) {
			const matched = data.match(/token\\":\\"([a-z0-9]{32})/);
			if (matched.length > 0) {
				g_csrfToken = matched[1];
				DoLog(3, "Got g_csrfToken: " + g_csrfToken);
				loadIllustSort({
					...g_settings,
					csrfToken: g_csrfToken
				});
			} else DoLog(1, "Can not get g_csrfToken, sort function is disabled.");
		});
		for (let i = 0; i < Object.keys(Pages).length; i++) if (Pages[i].CheckUrl(location.href)) {
			g_pageType = i;
			break;
		}
		if (g_pageType !== void 0) DoLog(3, "Current page is " + Pages[g_pageType].PageTypeString);
		else {
			DoLog(3, "Unsupported page.");
			return;
		}
		if (g_pageType === 3) showSearchLinksForDeletedArtworks();
		else if (g_pageType === 9) {
			const artworkId = window.location.pathname.match(/\/artworks\/(\d+)/)?.[1];
			if (artworkId) setTimeout(() => {
				deleteCachedIllustrationDetails([artworkId]);
			});
		}
		const toolBar = Pages[g_pageType].GetToolBar();
		if (toolBar) DoLog(4, toolBar);
		else {
			DoLog(2, "Get toolbar failed.");
			return;
		}
		if (!$(`#${"pp-sort"}`).length) {
			const newListItem = document.createElement("div");
			newListItem.title = "Sort artworks";
			newListItem.innerHTML = "";
			const newButton = document.createElement("button");
			newButton.id = SORT_BUTTON_ID;
			newButton.style.cssText = "box-sizing: border-box; background-color: rgba(0,0,0,0.32); color: #fff; margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 0px; border-radius: 24px; width: 48px; height: 48px; font-size: 12px; font-weight: bold;";
			newButton.innerHTML = Texts.label_sort;
			newListItem.appendChild(newButton);
			toolBar.appendChild(newListItem);
			$(newButton).on("click", () => {
				const sortEvent = new Event(SORT_EVENT_NAME);
				window.dispatchEvent(sortEvent);
			});
		}
		if (!$(`#${"pp-sort-next-page"}`).length) {
			const newListItem = document.createElement("div");
			newListItem.title = "Jump to next page";
			newListItem.innerHTML = "";
			const newButton = document.createElement("button");
			newButton.id = SORT_NEXT_PAGE_BUTTON_ID;
			newButton.style.cssText = "box-sizing: border-box; background-color: rgba(0,0,0,0.32); color: #fff; margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 0px; border-radius: 24px; width: 48px; height: 48px; font-size: 12px; font-weight: bold;";
			newButton.innerHTML = Texts.label_nextPage;
			newListItem.appendChild(newButton);
			toolBar.appendChild(newListItem);
			$(newButton).on("click", () => {
				const sortEvent = new Event(SORT_NEXT_PAGE_EVENT_NAME);
				window.dispatchEvent(sortEvent);
			});
		}
		if (!$(`#${"pp-hide-favorites"}`).length) {
			const newListItem = document.createElement("div");
			newListItem.title = "Hide favorite illustrations";
			newListItem.innerHTML = "";
			const newButton = document.createElement("button");
			newButton.id = HIDE_FAVORITES_BUTTON_ID;
			newButton.style.cssText = "box-sizing: border-box; background-color: rgba(0,0,0,0.32); color: #fff; margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 0px; border-radius: 24px; width: 48px; height: 48px; font-size: 12px; font-weight: bold;";
			newButton.innerHTML = Texts.label_hideFav;
			newListItem.appendChild(newButton);
			toolBar.appendChild(newListItem);
			$(newButton).on("click", () => {
				hideFavorites();
			});
		}
	} catch (e) {
		DoLog(1, "An error occurred while initializing:", e);
	}
};
window.addEventListener("DOMContentLoaded", () => {
	setTimeout(initializePixivPreviewer, 1e3);
});

//#endregion