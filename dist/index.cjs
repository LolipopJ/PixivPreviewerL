// ==UserScript==
// @name                Pixiv Previewer L
// @namespace           https://github.com/LolipopJ/PixivPreviewer
// @version             1.6.0-20261020
// @description         Original project: https://github.com/Ocrosoft/PixivPreviewer.
// @author              Ocrosoft, LolipopJ
// @license             GPL-3.0
// @supportURL          https://github.com/LolipopJ/PixivPreviewer
// @match               *://www.pixiv.net/*
// @grant               GM_getValue
// @grant               GM_setValue
// @grant               GM_addValueChangeListener
// @grant               window.onurlchange
// @grant               GM_registerMenuCommand
// @grant               GM_unregisterMenuCommand
// @grant               GM.xmlHttpRequest
// @grant               unsafeWindow
// @icon                https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=32&url=https://www.pixiv.net
// @icon64              https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=https://www.pixiv.net
// @require             https://update.greasyfork.org/scripts/515994/1478507/gh_2215_make_GM_xhr_more_parallel_again.js
// @require             https://code.jquery.com/jquery-4.0.0.min.js
// @require             https://code.jquery.com/jquery-migrate-4.0.2.min.js
// @run-at              document-start
// ==/UserScript==
//#region src/constants/index.ts
/** 版本号，发生改变时将会弹窗 */
const g_version = "1.6.0";
/** 默认设置 */
const g_defaultSettings = {
	enablePreview: true,
	enableAnimePreview: true,
	previewDelay: 300,
	enableLocalTags: true,
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
/** R18 标签列表，全小写 */
const R18_TAGS = ["r-18", "r18"];
/** R18G 标签列表，全小写 */
const R18G_TAGS = ["r-18g", "r18g"];
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
	"ai加笔",
	"ai绘图",
	"ai繪圖"
];
/** 动图标签列表，全小写 */
const UGOIRA_TAGS = [
	"うごイラ",
	"ugoira",
	"动图",
	"動圖"
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
const ILLUSTRATION_DETAILS_CACHE_TIME = 216e5;
/** 新作品发布初期不添加缓存 */
const NEW_ILLUSTRATION_NOT_CACHE_TIME = 36e5;
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
//#region src/icons/settings.svg
var settings_default = "<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n  aria-hidden=\"true\"\n  focusable=\"false\"\n>\n  <path\n    d=\"m9.2 4.6.8-2.6h4l.8 2.6 2.1 1.2 2.6-.6 2 3.5-1.8 2v2.5l1.8 2-2 3.5-2.6-.6-2.1 1.2L14 22h-4l-.8-2.6-2.1-1.2-2.6.6-2-3.5 1.8-2v-2.5l-1.8-2 2-3.5 2.6.6Z\"\n  />\n  <circle cx=\"12\" cy=\"12\" r=\"3\" />\n</svg>";

//#endregion
//#region src/icons/trash.svg
var trash_default = "<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n  aria-hidden=\"true\"\n  focusable=\"false\"\n>\n  <path d=\"M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7\" />\n</svg>";

//#endregion
//#region src/utils/tags.ts
const LOCAL_TAGS_KEY = "PIXIV_PREVIEWER_L_LOCAL_TAGS";
const LOCAL_TAG_METADATA_CACHE_TIME = 2592e6;
const getLocalTagState = () => GM_getValue(LOCAL_TAGS_KEY, {
	tags: [],
	autoSort: false
});
const getLocalTag = (tag) => getLocalTagState().tags.find((item) => item.tag === tag);
const hasLocalTag = (tag) => getLocalTagState().tags.some((item) => item.tag === tag);
const recordLocalTagTotal = (tag, total) => {
	if (!Number.isFinite(total) || total < 0) return;
	const state = getLocalTagState();
	const item = state.tags.find((item) => item.tag === tag);
	if (!item || item.lastTotal === total) return;
	item.lastTotal = total;
	GM_setValue(LOCAL_TAGS_KEY, state);
};
const getCachedLocalTagDetails = (tag) => {
	const state = getLocalTagState();
	const item = state.tags.find((item) => item.tag === tag);
	if (!item?.metadata) return;
	const age = Date.now() - item.metadata.cachedAt;
	if (age >= 0 && age < LOCAL_TAG_METADATA_CACHE_TIME) return item.metadata.details;
	delete item.metadata;
	GM_setValue(LOCAL_TAGS_KEY, state);
};
const cacheLocalTagDetails = (tag, details) => {
	const state = getLocalTagState();
	const item = state.tags.find((item) => item.tag === tag);
	if (!item) return;
	item.metadata = {
		details,
		cachedAt: Date.now()
	};
	GM_setValue(LOCAL_TAGS_KEY, state);
};
const getSortedLocalTags = () => {
	const { tags, autoSort } = getLocalTagState();
	return autoSort ? tags.slice().sort((a, b) => b.visits - a.visits) : tags;
};
const addLocalTag = (tag, label) => {
	const state = getLocalTagState();
	if (state.tags.some((item) => item.tag === tag)) return;
	state.tags.push({
		tag,
		label: label.trim(),
		visits: 0
	});
	GM_setValue(LOCAL_TAGS_KEY, state);
};
const removeLocalTag = (tag) => {
	const state = getLocalTagState();
	state.tags = state.tags.filter((item) => item.tag !== tag);
	GM_setValue(LOCAL_TAGS_KEY, state);
};
const renameLocalTag = (tag, label) => {
	const state = getLocalTagState();
	const item = state.tags.find((item) => item.tag === tag);
	if (!item) return;
	item.label = label.trim();
	GM_setValue(LOCAL_TAGS_KEY, state);
};
const moveLocalTag = (tag, target) => {
	const state = getLocalTagState();
	if (state.autoSort) return;
	const index = state.tags.findIndex((item) => item.tag === tag);
	if (index < 0 || !Number.isInteger(target) || target < 0 || target >= state.tags.length || index === target) return;
	const [item] = state.tags.splice(index, 1);
	state.tags.splice(target, 0, item);
	GM_setValue(LOCAL_TAGS_KEY, state);
};
const setLocalTagAutoSort = (autoSort) => {
	GM_setValue(LOCAL_TAGS_KEY, {
		...getLocalTagState(),
		autoSort
	});
};
const recordLocalTagVisit = (tag) => {
	const state = getLocalTagState();
	const item = state.tags.find((item) => item.tag === tag);
	if (!item) return;
	item.visits++;
	GM_setValue(LOCAL_TAGS_KEY, state);
};
const getTagFromPath = (pathname) => {
	const match = pathname.match(/^\/(?:en\/)?tags\/([^/]+)/);
	if (!match) return null;
	try {
		return decodeURIComponent(match[1]);
	} catch {
		return null;
	}
};

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
/**
* 将 Pixiv 原图链接中形如 `123456-abcdef_p0.png` 的文件名规范化为 `123456_p0.png`
* （部分作品原图链接文件名中会插入一段哈希值，与 Pixiv 网页端展示的文件名不一致）
*/
const sanitizeIllustFilename = (filename) => {
	return filename.replace(/^(\d+)-[0-9a-zA-Z]+(_.*)$/, "$1$2");
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
//#region src/services/tags.ts
const pendingDetails = /* @__PURE__ */ new Map();
const pendingTotals = /* @__PURE__ */ new Map();
/** 从标签搜索响应中提取插画漫画作品总数 */
const getIllustMangaTotal = (body) => {
	const searchBody = body;
	const illustMangaTotal = searchBody?.illustManga?.total;
	if (typeof illustMangaTotal === "number") return illustMangaTotal;
	if (!searchBody?.illust && !searchBody?.manga) return void 0;
	const illustTotal = searchBody.illust?.total ?? 0;
	const mangaTotal = searchBody.manga?.total ?? 0;
	if (typeof illustTotal === "number" && typeof mangaTotal === "number") return illustTotal + mangaTotal;
};
/** 如果标签在本地列表中，记录其插画漫画作品总数 */
const recordTagTotal = (tag, body) => {
	if (!hasLocalTag(tag)) return;
	const total = getIllustMangaTotal(body);
	if (total !== void 0) recordLocalTagTotal(tag, total);
};
const requestTagTopBody = async (tag) => {
	const response = await request({
		method: "GET",
		url: `/ajax/search/top/${encodeURIComponent(tag)}?lang=zh`,
		timeout: 1e4
	});
	const data = response.response;
	if (response.status !== 200 || data.error || !data.body) throw new Error(data.message || "标签信息加载失败");
	recordTagTotal(tag, data.body);
	return data.body;
};
/** 获取标签的中文翻译，未找到翻译或翻译与标签相同时返回空字符串 */
const getTagTranslation = async (tag) => {
	const translation = (await requestTagTopBody(tag)).tagTranslation?.[tag]?.zh?.trim() ?? "";
	return translation === tag ? "" : translation;
};
/** 获取标签当前的插画漫画作品总数，同时记录为上次访问总数 */
const getTagCurrentTotal = (tag) => {
	const pending = pendingTotals.get(tag);
	if (pending) return pending;
	const loading = requestTagTopBody(tag).then(getIllustMangaTotal).finally(() => pendingTotals.delete(tag));
	pendingTotals.set(tag, loading);
	return loading;
};
const getTagDetails = (tag) => {
	const pending = pendingDetails.get(tag);
	if (pending) return pending;
	const cached = getCachedLocalTagDetails(tag);
	if (cached) return Promise.resolve(cached);
	const requestDetails = request({
		method: "GET",
		url: `/ajax/tag/info?tag=${encodeURIComponent(tag)}&lang=zh`,
		timeout: 1e4
	}).then((response) => {
		const data = response.response;
		if (response.status !== 200 || data.error || !data.body) throw new Error(data.message || "标签详情加载失败");
		cacheLocalTagDetails(tag, data.body);
		return data.body;
	}).finally(() => {
		pendingDetails.delete(tag);
	});
	pendingDetails.set(tag, requestDetails);
	return requestDetails;
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
//#region src/utils/tag-colors.ts
const backgrounds = Object.values({
	red: [
		"#e7000b",
		"#c10007",
		"#9f0712"
	],
	orange: [
		"#f54a00",
		"#ca3500",
		"#9f2d00"
	],
	amber: [
		"#e17100",
		"#bb4d00",
		"#973c00"
	],
	yellow: [
		"#d08700",
		"#a65f00",
		"#894b00"
	],
	lime: [
		"#5ea500",
		"#497d00",
		"#3c6300"
	],
	green: [
		"#00a63e",
		"#008236",
		"#016630"
	],
	emerald: [
		"#009966",
		"#007a55",
		"#006045"
	],
	teal: [
		"#009689",
		"#00786f",
		"#005f5a"
	],
	cyan: [
		"#0092b8",
		"#007595",
		"#005f78"
	],
	sky: [
		"#0084d1",
		"#0069a8",
		"#00598a"
	],
	blue: [
		"#155dfc",
		"#1447e6",
		"#193cb8"
	],
	indigo: [
		"#4f39f6",
		"#432dd7",
		"#372aac"
	],
	violet: [
		"#7f22fe",
		"#7008e7",
		"#5d0ec0"
	],
	purple: [
		"#9810fa",
		"#8200db",
		"#6e11b0"
	],
	fuchsia: [
		"#c800de",
		"#a800b7",
		"#8a0194"
	],
	pink: [
		"#e60076",
		"#c6005c",
		"#a3004c"
	],
	rose: [
		"#ec003f",
		"#c70036",
		"#a50036"
	],
	slate: [
		"#45556c",
		"#314158",
		"#1d293d"
	],
	gray: [
		"#4a5565",
		"#364153",
		"#1e2939"
	],
	zinc: [
		"#52525c",
		"#3f3f47",
		"#27272a"
	],
	neutral: [
		"#525252",
		"#404040",
		"#262626"
	],
	stone: [
		"#57534d",
		"#44403b",
		"#292524"
	],
	mauve: [
		"#594c5b",
		"#463947",
		"#2a212c"
	],
	olive: [
		"#5b5b4b",
		"#474739",
		"#2b2b22"
	],
	mist: [
		"#4b585b",
		"#394447",
		"#22292b"
	],
	taupe: [
		"#5b4f4b",
		"#473c39",
		"#2b2422"
	]
}).flat();
const getLocalTagColor = (tag) => {
	const characters = Array.from(tag);
	const first = characters[0]?.codePointAt(0) ?? 0;
	const last = characters.at(-1)?.codePointAt(0) ?? 0;
	return backgrounds[(first * 31 + last) % backgrounds.length];
};

//#endregion
//#region src/features/local-tags.ts
const TAG_LINK_SELECTOR = "a[href*=\"/tags/\"]:not(nav > a, .gtm-new-work-tag-event-click, .gtm-new-work-translate-tag-event-click, .gtm-new-work-tag-thumbnail-event-click, [data-ga4-label=\"tab_link\"], [data-ga4-label=\"suggest_chip\"], [data-ga4-label=\"delete_button\"], [data-ga4-label=\"submit_button\"])";
const POPOVER_ID = "pp-local-tag-popover";
const MANAGER_ID = "pp-local-tags-manager";
const STRIP_CLASS = "pp-local-tags";
const createButton = (label, onClick) => {
	return $("<button>").attr("type", "button").text(label).css("height", "100%").on("click", onClick);
};
const createIconButton = (label, icon, onClick) => createButton(label, onClick).addClass("pp-tag-icon").attr({
	title: label,
	"aria-label": label
}).html(icon).css("height", "32px");
const createTagLink = ({ tag, label }) => {
	const background = getLocalTagColor(tag);
	const link = $("<a>").attr({
		href: `/tags/${encodeURIComponent(tag)}`,
		title: tag
	}).css({
		backgroundColor: background,
		color: "#fff"
	}).append($("<span>").text(label || tag));
	if (label) link.append($("<small>").text(tag));
	return link;
};
const getTagFromSearchUrl = (url) => {
	try {
		const parsed = new URL(url, location.href);
		if (parsed.origin !== location.origin) return null;
		const match = parsed.pathname.match(/^\/ajax\/search\/top\/([^/]+)\/?$/);
		if (!match) return null;
		return decodeURIComponent(match[1]);
	} catch {
		return null;
	}
};
const recordTagSearchTotal = (tag, data) => {
	const response = data;
	if (!response || response.error) return;
	recordTagTotal(tag, response.body);
};
/** 拦截页面自身的标签 top 搜索请求，记录访问标签页时的作品总数 */
const interceptTagSearchRequests = () => {
	try {
		const pageFetch = unsafeWindow.fetch.bind(unsafeWindow);
		unsafeWindow.fetch = function(input, init) {
			const url = typeof input === "string" ? input : "url" in input ? input.url : input.href;
			const response = pageFetch(input, init);
			const tag = getTagFromSearchUrl(url);
			if (tag) response.then((result) => {
				if (!result.ok) return void 0;
				return result.clone().json();
			}).then((data) => {
				if (data) recordTagSearchTotal(tag, data);
			}).catch(() => {});
			return response;
		};
	} catch (error) {
		iLog.w("Failed to intercept fetch requests for local tags:", error);
	}
	try {
		const XHR = unsafeWindow.XMLHttpRequest;
		const requestUrls = /* @__PURE__ */ new WeakMap();
		const originalOpen = XHR.prototype.open;
		const originalSend = XHR.prototype.send;
		XHR.prototype.open = function(method, url, async, username, password) {
			requestUrls.set(this, String(url));
			if (async === void 0) return originalOpen.call(this, method, url);
			return originalOpen.call(this, method, url, async, username, password);
		};
		XHR.prototype.send = function(body) {
			const tag = getTagFromSearchUrl(requestUrls.get(this) ?? "");
			if (tag) this.addEventListener("load", () => {
				if (this.status < 200 || this.status >= 300) return;
				try {
					recordTagSearchTotal(tag, this.responseType === "json" ? this.response : JSON.parse(this.responseText));
				} catch {}
			});
			return originalSend.call(this, body);
		};
	} catch (error) {
		iLog.w("Failed to intercept XHR requests for local tags:", error);
	}
};
const getTagLink = (target) => {
	if (!(target instanceof Element)) return null;
	const link = $(target).closest(TAG_LINK_SELECTOR).get(0);
	if (!link) return null;
	const url = new URL($(link).prop("href"));
	if (url.origin !== location.origin) return null;
	return getTagFromPath(url.pathname) ? link : null;
};
const loadLocalTags = () => {
	if ($(`#${POPOVER_ID}`).length) return;
	$("<style>").text(`
    #${POPOVER_ID}, #${MANAGER_ID}, .${STRIP_CLASS} {
      --pp-tag-bg: #fff; --pp-tag-fg: #333; --pp-tag-muted: #666;
      --pp-tag-border: #ddd; --pp-tag-chip: #f0f6fa;
      --pp-tag-danger: #dc2626; --pp-tag-danger-hover: #b91c1c;
      color: var(--pp-tag-fg); font: 14px/1.5 sans-serif;
      box-sizing: border-box;
    }
    #${POPOVER_ID} *, #${MANAGER_ID} *, .${STRIP_CLASS} * { box-sizing: border-box; }
    #${POPOVER_ID} {
      position: fixed; z-index: 100000; width: min(340px, calc(100vw - 24px));
      max-height: calc(100vh - 24px); overflow: auto; padding: 0;
      background: var(--pp-tag-bg); border: 1px solid var(--pp-tag-border);
      border-radius: 12px; box-shadow: 0 8px 32px #0003;
    }
    #${POPOVER_ID}[hidden] { display: none; }
    #${POPOVER_ID} .pp-tag-preview {
      display: block; height: 200px; overflow: hidden;
      border-radius: 11px 11px 0 0; background: var(--pp-tag-chip);
    }
    #${POPOVER_ID} .pp-tag-preview:focus-visible { outline-offset: -2px; }
    #${POPOVER_ID} img { display: block; width: 100%; height: 100%; object-fit: cover; }
    #${POPOVER_ID} img[hidden] { display: none; }
    #${POPOVER_ID} .pp-tag-content { padding: 16px; }
    #${POPOVER_ID} h2, #${MANAGER_ID} h2 { font-size: 18px; margin: 0 0 12px; overflow-wrap: anywhere; }
    #${POPOVER_ID} p { margin: 12px 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    #${POPOVER_ID} .pp-tag-stats { color: var(--pp-tag-muted); font-size: 13px; }
    #${POPOVER_ID} .pp-tag-stats[hidden] { display: none; }
    #${POPOVER_ID} button, #${MANAGER_ID} button, .${STRIP_CLASS} button,
    .${STRIP_CLASS} a {
      border: 1px solid var(--pp-tag-border); border-radius: 6px;
      padding: 6px 10px; color: var(--pp-tag-fg); background: var(--pp-tag-chip);
      cursor: pointer; font: inherit; text-decoration: none; white-space: nowrap;
    }
    #${POPOVER_ID} button:hover, #${MANAGER_ID} button:hover,
    .${STRIP_CLASS} button:hover, .${STRIP_CLASS} a:hover { border-color: #0096fa; }
    #${MANAGER_ID} button.pp-tag-danger {
      color: #fff; background: var(--pp-tag-danger); border-color: var(--pp-tag-danger);
    }
    #${MANAGER_ID} button.pp-tag-danger:hover {
      background: var(--pp-tag-danger-hover); border-color: var(--pp-tag-danger-hover);
    }
    #${MANAGER_ID} button.pp-tag-icon, .${STRIP_CLASS} button.pp-tag-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; flex-shrink: 0; padding: 6px;
    }
    #${MANAGER_ID} .pp-tag-icon svg, .${STRIP_CLASS} .pp-tag-icon svg {
      width: 18px; height: 18px;
    }
    #${POPOVER_ID} :focus-visible, #${MANAGER_ID} :focus-visible,
    .${STRIP_CLASS} :focus-visible { outline: 2px solid #0096fa; outline-offset: 2px; }
    #${MANAGER_ID} {
      width: min(720px, calc(100vw - 32px)); max-height: calc(100vh - 48px);
      padding: 24px; border: 1px solid var(--pp-tag-border); border-radius: 12px;
      background: var(--pp-tag-bg); overflow: auto;
    }
    #${MANAGER_ID}::backdrop { background: #0006; }
    #${MANAGER_ID} header { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
    #${MANAGER_ID} label { display: flex; align-items: center; gap: 8px; }
    #${MANAGER_ID} ul { list-style: none; padding: 0; margin: 16px 0 0; }
    #${MANAGER_ID} li { padding: 12px 0; border-top: 1px solid var(--pp-tag-border); }
    #${MANAGER_ID} li.pp-tag-dragging { opacity: .4; }
    #${MANAGER_ID} .pp-tag-heading { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    #${MANAGER_ID} .pp-tag-metadata { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    #${MANAGER_ID} a { color: inherit; text-decoration: none; }
    #${MANAGER_ID} a:hover { text-decoration: underline; }
    #${MANAGER_ID} .pp-tag-drag {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 28px; height: 28px; padding: 0; cursor: grab;
    }
    #${MANAGER_ID} .pp-tag-drag:active { cursor: grabbing; }
    #${MANAGER_ID} .pp-tag-drag::before {
      content: ""; width: 2px; height: 2px; margin: -10px 5px 0 0;
      background: currentColor; border-radius: 50%;
      box-shadow: 5px 0, 0 5px, 5px 5px, 0 10px, 5px 10px;
    }
    #${MANAGER_ID} form { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    #${MANAGER_ID} input[type=text] {
      flex: 1; min-width: 120px; padding: 7px 10px; border: 1px solid var(--pp-tag-border);
      border-radius: 6px; color: var(--pp-tag-fg); background: var(--pp-tag-bg); font: inherit;
    }
    #${MANAGER_ID} small { color: var(--pp-tag-muted); margin-bottom: 8px; overflow-wrap: anywhere; }
    #${MANAGER_ID} button:disabled { opacity: .4; cursor: default; }
    .${STRIP_CLASS} { display: inline-flex; align-items: center; gap: 8px; margin-right: 8px; flex-shrink: 0; }
    .${STRIP_CLASS} [data-tag-links] { display: inline-flex; gap: 8px; }
    .${STRIP_CLASS} a { display: inline-flex; flex-direction: column; justify-content: center; line-height: 1.35; }
    .${STRIP_CLASS} a span { font-size: 14px; font-weight: bold; }
    .${STRIP_CLASS} a small { font-size: 10px; color: inherit; }
    @media (prefers-color-scheme: dark) {
      #${POPOVER_ID}, #${MANAGER_ID}, .${STRIP_CLASS} {
        --pp-tag-bg: #222; --pp-tag-fg: #eee; --pp-tag-muted: #aaa;
        --pp-tag-border: #555; --pp-tag-chip: #303c45;
      }
    }
  `).appendTo("head");
	const popover = $("<div>").attr({
		id: POPOVER_ID,
		role: "dialog",
		"aria-label": "标签详情"
	}).prop("hidden", true);
	const preview = $("<a>").attr({
		class: "pp-tag-preview",
		target: "_blank",
		rel: "noopener noreferrer",
		"aria-label": "在新窗口打开预览作品"
	});
	const thumbnail = $("<img>").appendTo(preview);
	const content = $("<div>").addClass("pp-tag-content");
	const title = $("<h2>");
	const abstract = $("<p>").attr("aria-live", "polite");
	const stats = $("<p>").addClass("pp-tag-stats").attr("aria-live", "polite").prop("hidden", true);
	thumbnail.on("error", () => {
		thumbnail.prop("hidden", true);
		preview.removeAttr("href");
	});
	let activeLink = null;
	let activeTag = null;
	let addingTag = null;
	let showTimer;
	let hideTimer;
	let scrollParents = $();
	const addTagFromApi = (tag, button) => {
		if (addingTag) return;
		addingTag = tag;
		button?.prop("disabled", true);
		button?.text("正在添加…");
		updateAction();
		getTagTranslation(tag).then((label) => {
			addLocalTag(tag, label);
			refresh();
		}).finally(() => {
			addingTag = null;
			button?.prop("disabled", false);
			updateAction();
		}).catch((error) => {
			if (button !== action || activeTag === tag) button?.text("添加失败，点击重试");
			iLog.w("Failed to add local tag:", error);
		});
	};
	const action = createButton("添加到本地标签", () => {
		if (activeTag) addTagFromApi(activeTag, action);
	});
	content.append(title, abstract, stats, action);
	popover.append(preview, content);
	popover.appendTo("body");
	const manager = $("<dialog>").attr({
		id: MANAGER_ID,
		closedby: "any",
		"aria-labelledby": "pp-local-tags-heading"
	}).appendTo("body");
	const hidePopover = () => {
		clearTimeout(showTimer);
		clearTimeout(hideTimer);
		popover.prop("hidden", true);
		scrollParents.off("scroll.ppLocalTags");
		scrollParents = $();
		activeLink = null;
		activeTag = null;
	};
	const updateAction = () => {
		const pending = !!activeTag && addingTag === activeTag;
		action.prop("hidden", !activeTag || hasLocalTag(activeTag)).prop("disabled", pending).text(pending ? "正在添加…" : "添加到本地标签");
	};
	const positionPopover = () => {
		if (!activeLink || popover.prop("hidden")) return;
		const link = $(activeLink);
		const offset = link.offset();
		const viewport = $(window);
		const linkTop = offset.top - viewport.scrollTop();
		const linkBottom = linkTop + link.outerHeight();
		const width = popover.outerWidth();
		const height = popover.outerHeight();
		const left = Math.max(12, Math.min(offset.left - viewport.scrollLeft(), viewport.width() - width - 12));
		const top = linkBottom + height + 8 <= viewport.height() - 12 ? linkBottom + 8 : Math.max(12, linkTop - height - 8);
		popover.css({
			left,
			top
		});
	};
	const updateStats = async (tag, link) => {
		if (!hasLocalTag(tag)) return;
		const lastTotal = getLocalTag(tag)?.lastTotal;
		stats.text(`插画漫画作品总数：${lastTotal ?? "-"} 件`);
		stats.prop("hidden", false);
		try {
			const total = await getTagCurrentTotal(tag);
			if (total === void 0 || activeLink !== link || activeTag !== tag) return;
			if (lastTotal === void 0) stats.text(`插画漫画作品总数：${total} 件`);
			else {
				const added = total - lastTotal;
				stats.text(added >= 0 ? `插画漫画作品总数：${total} 件（新增 ${added} 件）` : `插画漫画作品总数：${total} 件（减少 ${-added} 件）`);
			}
			positionPopover();
		} catch {}
	};
	const showPopover = async (link) => {
		const tag = getTagFromPath(new URL($(link).prop("href")).pathname);
		if (!tag || !$.contains($("html").get(0), link) || manager.prop("open")) return;
		activeLink = link;
		activeTag = tag;
		title.text(tag);
		abstract.text("正在加载标签详情…");
		stats.prop("hidden", true).text("");
		thumbnail.prop("hidden", true).removeAttr("src");
		preview.removeAttr("href");
		popover.prop("hidden", false);
		scrollParents.off("scroll.ppLocalTags");
		scrollParents = $(link).parents();
		scrollParents.on("scroll.ppLocalTags", hidePopover);
		updateAction();
		positionPopover();
		updateStats(tag, link);
		try {
			const details = await getTagDetails(tag);
			if (activeLink !== link || activeTag !== tag) return;
			title.text(details.tag || tag);
			abstract.text(details.abstract || "暂无标签简介");
			if (details.thumbnail) {
				const artworkId = details.thumbnail.match(/\/(\d+)(?:-[\da-zA-Z]+)?_p\d+/)?.[1];
				if (artworkId) preview.attr("href", `https://www.pixiv.net/artworks/${artworkId}`);
				thumbnail.attr({
					alt: `${details.tag || tag}的缩略图`,
					src: details.thumbnail
				}).prop("hidden", false);
			}
		} catch {
			if (activeLink !== link || activeTag !== tag) return;
			abstract.text("标签详情加载失败，请稍后重新悬浮重试。");
		}
		positionPopover();
	};
	const renderManager = () => {
		const focusKey = manager.find(":focus").attr("data-focus-key");
		const drafts = new Map(manager.find("input[type=\"text\"]").toArray().filter((input) => $(input).val() !== $(input).prop("defaultValue")).map((input) => [$(input).attr("data-focus-key"), $(input).val()]));
		manager.empty();
		const header = $("<header>");
		const heading = $("<h2>").attr("id", "pp-local-tags-heading").text("本地标签管理");
		header.append(heading, createButton("关闭", () => manager.get(0).close()));
		const sortLabel = $("<label>");
		const autoSort = $("<input>").attr({
			type: "checkbox",
			"data-focus-key": "auto-sort"
		}).prop("checked", getLocalTagState().autoSort);
		autoSort.on("change", () => {
			setLocalTagAutoSort(autoSort.prop("checked"));
			refresh();
		});
		sortLabel.append(autoSort, "自动排序（访问次数越多越靠前）");
		manager.append(header, sortLabel);
		const tags = getSortedLocalTags();
		if (!tags.length) manager.append($("<p>").text("暂无本地标签。悬浮任意标签，点击“添加到本地标签”。"));
		const list = $("<ul>");
		let draggedRow = null;
		list.on("drop", (event) => {
			if (!draggedRow) return;
			event.preventDefault();
			moveLocalTag(draggedRow.attr("data-tag"), list.children().index(draggedRow));
			draggedRow = null;
			refresh();
		});
		tags.forEach((item, index) => {
			const row = $("<li>").attr("data-tag", item.tag);
			const metadata = $("<div>").addClass("pp-tag-metadata").append($("<a>").attr({
				href: `/tags/${encodeURIComponent(item.tag)}`,
				target: "_blank",
				rel: "noopener noreferrer"
			}).text(item.tag), $("<small>").text(` · 访问 ${item.visits} 次`));
			const rowHeading = $("<div>").addClass("pp-tag-heading");
			if (!autoSort.prop("checked")) {
				const handle = $("<button>").attr({
					type: "button",
					draggable: "true",
					title: "拖拽排序",
					"aria-label": `排序 ${item.label || item.tag}`,
					"data-focus-key": `sort:${item.tag}`
				}).addClass("pp-tag-drag").on("dragstart", (event) => {
					draggedRow = row;
					const transfer = event.originalEvent.dataTransfer;
					transfer.effectAllowed = "move";
					transfer.setData("text/plain", item.tag);
					transfer.setDragImage(row.get(0), 0, 0);
					row.addClass("pp-tag-dragging");
				}).on("dragend", () => {
					if (!draggedRow) return;
					draggedRow = null;
					refresh();
				}).on("keydown", (event) => {
					if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
					event.preventDefault();
					moveLocalTag(item.tag, index + (event.key === "ArrowUp" ? -1 : 1));
					refresh();
				});
				rowHeading.append(handle);
				row.on("dragover", (event) => {
					if (!draggedRow) return;
					event.preventDefault();
					event.originalEvent.dataTransfer.dropEffect = "move";
					if (draggedRow.is(row)) return;
					const { top, height } = row.get(0).getBoundingClientRect();
					if (event.originalEvent.clientY < top + height / 2) row.before(draggedRow);
					else row.after(draggedRow);
				});
			}
			rowHeading.append(metadata);
			const form = $("<form>");
			const input = $("<input>").attr({
				type: "text",
				placeholder: "填一个好记的备注名吧",
				"aria-label": `${item.tag}的显示名称`,
				"data-focus-key": `label:${item.tag}`
			}).prop("defaultValue", item.label).val(drafts.get(`label:${item.tag}`) ?? item.label);
			const save = $("<button>").attr({
				type: "submit",
				"data-focus-key": `save:${item.tag}`
			}).text("保存备注名");
			form.on("submit", (event) => {
				event.preventDefault();
				const label = input.val().trim();
				renameLocalTag(item.tag, label);
				input.val(label).prop("defaultValue", label);
				refresh();
			});
			const up = createButton("上移", () => {
				moveLocalTag(item.tag, index - 1);
				refresh();
			});
			const down = createButton("下移", () => {
				moveLocalTag(item.tag, index + 1);
				refresh();
			});
			up.attr({
				"data-focus-key": `up:${item.tag}`,
				"aria-label": `上移 ${item.label || item.tag}`
			}).prop({
				hidden: autoSort.prop("checked"),
				disabled: index === 0
			});
			down.attr({
				"data-focus-key": `down:${item.tag}`,
				"aria-label": `下移 ${item.label || item.tag}`
			}).prop({
				hidden: autoSort.prop("checked"),
				disabled: index === tags.length - 1
			});
			const remove = createIconButton(`删除 ${item.label || item.tag}`, trash_default, () => {
				removeLocalTag(item.tag);
				refresh();
			}).addClass("pp-tag-danger");
			form.append(input, save, up, down, remove);
			row.append(rowHeading, form);
			list.append(row);
		});
		manager.append(list);
		if (focusKey) manager.find("[data-focus-key]").filter((_, element) => $(element).attr("data-focus-key") === focusKey).trigger("focus");
	};
	const openManager = () => {
		hidePopover();
		if (!manager.prop("open")) manager.empty();
		renderManager();
		if (!manager.prop("open")) manager.get(0).showModal();
	};
	const renderStrip = (strip) => {
		strip.empty();
		const tag = getTagFromPath(location.pathname);
		if (tag) {
			if (hasLocalTag(tag)) strip.append(createButton("本地标签管理", openManager));
			else {
				const addButton = createButton("添加到本地标签", () => addTagFromApi(tag, addButton));
				strip.append(addButton);
			}
			return;
		}
		const tags = getSortedLocalTags();
		strip.append(tags.length >= 10 ? createIconButton("本地标签管理", settings_default, openManager) : createButton("本地标签管理", openManager));
		const links = $("<span>").attr("data-tag-links", "");
		links.append(...tags.map(createTagLink));
		strip.append(links);
	};
	function refresh() {
		$(`.${STRIP_CLASS}`).each((_, strip) => renderStrip($(strip)));
		updateAction();
		positionPopover();
		if (manager.prop("open")) renderManager();
	}
	const mountStrip = (parent, before) => {
		if (parent.children(`.${STRIP_CLASS}`).length) return;
		const strip = $(parent.is("ul") ? "<li>" : "<span>").addClass(STRIP_CLASS);
		renderStrip(strip);
		before.before(strip);
	};
	const mountEntries = () => {
		const pathname = location.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
		if (getTagFromPath(pathname)) {
			const edit = $("button").filter((_, button) => /(?:编辑|添加(?:进|到))(喜欢|喜爱)的标签/.test($(button).text())).first();
			if (edit.length) mountStrip(edit.parent(), edit);
		} else if (/^\/(?:illustration\/?|manga\/?|cate_r18\.php)?$/.test(pathname)) {
			const firstTag = $(TAG_LINK_SELECTOR).filter((_, link) => !$(link).closest(`.${STRIP_CLASS}, header`).length && !!getTagLink(link)).first();
			if (!firstTag.length) return;
			let first = firstTag;
			let parent = firstTag.parent();
			while (parent.length && !parent.is("body")) {
				if (parent.find("a[href*=\"/artworks/\"]").length) return;
				if (parent.find(TAG_LINK_SELECTOR).length > 1 || parent.is("nav, ul, [role=tablist]") || ["flex", "inline-flex"].includes(parent.css("display"))) {
					mountStrip(parent, first);
					return;
				}
				first = parent;
				parent = parent.parent();
			}
		}
	};
	const enter = (event) => {
		const target = event.target;
		if ($(target).closest(popover).length) {
			clearTimeout(hideTimer);
			return;
		}
		const link = getTagLink(target);
		if (!link || $(link).closest(manager).length) return;
		clearTimeout(hideTimer);
		if (link === activeLink) return;
		clearTimeout(showTimer);
		showTimer = setTimeout(() => void showPopover(link), 200);
	};
	const leave = (event) => {
		const link = getTagLink(event.target);
		const target = event.target;
		if (!link && !$(target).closest(popover).length) return;
		const related = event.relatedTarget;
		if (related instanceof Node && ($(related).closest(popover).length || link && $(related).closest(link).length)) return;
		clearTimeout(showTimer);
		clearTimeout(hideTimer);
		hideTimer = setTimeout(hidePopover, 180);
	};
	$(document).on("mouseover", enter).on("focusin", enter).on("mouseout", leave).on("focusout", leave).on("keydown", (event) => {
		if (event.key === "Escape") hidePopover();
	}).on("scroll", hidePopover);
	$(window).on("resize", positionPopover);
	let previousTag = null;
	const visitPage = () => {
		const tag = getTagFromPath(location.pathname);
		if (tag && tag !== previousTag) {
			recordLocalTagVisit(tag);
			refresh();
		}
		previousTag = tag;
	};
	$(window).on("urlchange", () => {
		hidePopover();
		if (manager.prop("open")) manager.get(0).close();
		$(`.${STRIP_CLASS}`).remove();
		visitPage();
		mountEntries();
	});
	GM_addValueChangeListener(LOCAL_TAGS_KEY, (_key, _oldValue, _newValue, remote) => {
		if (remote) refresh();
	});
	new MutationObserver(debounce(() => {
		if (activeLink && !$.contains($("html").get(0), activeLink)) hidePopover();
		mountEntries();
	}, 100)).observe($("body").get(0), {
		childList: true,
		subtree: true
	});
	visitPage();
	mountEntries();
};

//#endregion
//#region src/icons/download.svg
var download_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg t=\"1742281193586\"\n     class=\"icon\"\n     viewBox=\"0 0 1024 1024\"\n     version=\"1.1\"\n     xmlns=\"http://www.w3.org/2000/svg\"\n     p-id=\"24408\"\n     width=\"10\"\n     height=\"10\">\n    <path d=\"M1024 896v128H0v-320h128v192h768v-192h128v192zM576 554.688L810.688 320 896 405.312l-384 384-384-384L213.312 320 448 554.688V0h128v554.688z\"\n          fill=\"#ffffff\"\n          p-id=\"24409\" />\n</svg>";

//#endregion
//#region src/icons/loading.svg
var loading_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg t=\"1742282291278\"\n     class=\"icon\"\n     viewBox=\"0 0 1024 1024\"\n     version=\"1.1\"\n     xmlns=\"http://www.w3.org/2000/svg\"\n     p-id=\"38665\"\n     width=\"48\"\n     height=\"48\">\n    <path d=\"M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 0 0-94.3-139.9 437.71 437.71 0 0 0-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3 0.1 19.9-16 36-35.9 36z\"\n          p-id=\"38666\"\n          fill=\"#1296db\" />\n</svg>";

//#endregion
//#region src/icons/page.svg
var page_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg viewBox=\"0 0 10 10\"\n     width=\"10\"\n     height=\"10\">\n    <path d=\"M 8 3 C 8.55228 3 9 3.44772 9 4 L 9 9 C 9 9.55228 8.55228 10 8 10 L 3 10 C 2.44772 10 2 9.55228 2 9 L 6 9 C 7.10457 9 8 8.10457 8 7 L 8 3 Z M 1 1 L 6 1 C 6.55228 1 7 1.44772 7 2 L 7 7 C 7 7.55228 6.55228 8 6 8 L 1 8 C 0.447715 8 0 7.55228 0 7 L 0 2 C 0 1.44772 0.447715 1 1 1 Z\"\n          fill=\"#ffffff\" />\n</svg>";

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
//#region src/utils/event.ts
const stopEventPropagation = (event) => {
	event.stopPropagation();
};

//#endregion
//#region src/utils/illustration.ts
const checkUsingTags = (tags, targetTags) => {
	for (const tag of tags) if (targetTags.includes(tag.toLowerCase())) return true;
	return false;
};
const checkIsR18 = (tags) => {
	return checkUsingTags(tags, R18_TAGS);
};
const checkIsR18G = (tags) => {
	return checkUsingTags(tags, R18G_TAGS);
};
const checkIsUgoira = (illustType) => {
	return illustType === 2;
};
const checkIsUgoiraUsingTags = (tags) => {
	return checkUsingTags(tags, UGOIRA_TAGS);
};
const checkIsAiGenerated = (aiType) => {
	return aiType === 2;
};
const checkIsAiAssisted = (tags) => {
	return checkUsingTags(tags, AI_ASSISTED_TAGS);
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
		if (this._frame >= this._frameCount - 1) {
			if (this.op.loop) this._frame = 0;
			else {
				this.pause();
				return;
			}
		} else this._frame += 1;
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
const ONE_HANDED_MODE_HOLD_MS = 500;
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
		const previewPage = Math.max(1, Number(illustHrefMatch[3] ?? 1));
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
	const previewedIllust = new PreviewedIllust();
	const previewIllust = (() => {
		let currentHoveredIllustId = "";
		let getIllustPagesRequest = null;
		const getIllustPagesCache = createLRUCache(100);
		const getUgoiraMetadataCache = createLRUCache(100);
		/** 获取动图元数据并展示动图预览（命中缓存时直接展示） */
		const previewAsUgoira = ({ target, illustId, illustDetailsPromise }) => {
			const ugoiraMetadataCached = getUgoiraMetadataCache.get(illustId);
			if (ugoiraMetadataCached) {
				illustDetailsPromise.then((illustrationDetails) => {
					if (currentHoveredIllustId !== illustId) return;
					previewedIllust.setUgoira({
						illustId,
						illustElement: target,
						illustrationDetails,
						...ugoiraMetadataCached
					});
				});
				return;
			}
			getIllustPagesRequest = $.ajax(getUgoiraMetadataRequestUrl(illustId), {
				method: "GET",
				success: async (data) => {
					if (data.error) {
						iLog.e(`An error occurred while requesting metadata of ugoira ${illustId}: ${data.message}`);
						return;
					}
					getUgoiraMetadataCache.set(illustId, data.body);
					if (currentHoveredIllustId !== illustId) return;
					const illustrationDetails = await illustDetailsPromise;
					if (currentHoveredIllustId !== illustId) return;
					const { src, originalSrc, mime_type, frames } = data.body;
					previewedIllust.setUgoira({
						illustId,
						illustElement: target,
						src,
						originalSrc,
						mime_type,
						frames,
						illustrationDetails
					});
				},
				error: (jqXHR, textStatus) => {
					if (textStatus === "abort") return;
					iLog.e(`An error occurred while requesting metadata of ugoira ${illustId}: ${jqXHR.responseText}`);
				}
			});
		};
		/** 获取图片分页信息并展示插画预览；若作品详情标签显示实际为动图，则切换为动图预览 */
		const previewAsIllust = async ({ target, illustId, previewPage, regularUrls, originalUrls, illustDetailsPromise }) => {
			const illustrationDetails = await illustDetailsPromise;
			if (currentHoveredIllustId !== illustId) return;
			if (enableAnimePreview && illustrationDetails && checkIsUgoiraUsingTags(illustrationDetails.tags)) {
				previewAsUgoira({
					target,
					illustId,
					illustDetailsPromise: Promise.resolve(illustrationDetails)
				});
				return;
			}
			previewedIllust.setImage({
				illustId,
				illustElement: target,
				previewPage,
				regularUrls,
				originalUrls,
				illustrationDetails
			});
		};
		return ({ target, illustId, previewPage = 1, illustType }) => {
			getIllustPagesRequest?.abort();
			currentHoveredIllustId = illustId;
			if (illustType === 2 && !enableAnimePreview) {
				iLog.i("动图预览已禁用，跳过");
				return;
			}
			const illustDetailsPromise = getIllustrationDetailsWithCache(illustId).catch((error) => {
				iLog.e(`An error occurred while fetching illustration details of ${illustId}: ${error}`);
				return null;
			});
			if ([0, 1].includes(illustType)) {
				const illustPagesCached = getIllustPagesCache.get(illustId);
				if (illustPagesCached) {
					previewAsIllust({
						target,
						illustId,
						previewPage,
						illustDetailsPromise,
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
						previewAsIllust({
							target,
							illustId,
							previewPage,
							regularUrls,
							originalUrls,
							illustDetailsPromise
						});
					},
					error: (jqXHR, textStatus) => {
						if (textStatus === "abort") return;
						iLog.e(`An error occurred while requesting preview urls of illust ${illustId}: ${jqXHR.responseText || textStatus}`);
					}
				});
			} else if (illustType === 2) previewAsUgoira({
				target,
				illustId,
				illustDetailsPromise
			});
			else {
				iLog.e("Unknown illust type.");
				return;
			}
		};
	})();
	const onMouseOverIllust = (target) => {
		if (previewedIllust.oneHandedMode) return;
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
			if (previewedIllust.oneHandedMode) return;
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
			if (previewedIllust.oneHandedMode || mouseMoveEvent.ctrlKey || mouseMoveEvent.metaKey) return;
			if (mouseMoveEvent.target === prevTarget) return;
			prevTarget = mouseMoveEvent.target;
			const currentTarget = $(mouseMoveEvent.target);
			debouncedOnMouseOverIllust(currentTarget);
		};
	})();
	$(document).on("mousemove", onMouseMoveDocument);
	(function inactiveUnexpectedDoms() {
		const styleRules = $("<style>").prop("type", "text/css");
		styleRules.append(`
@keyframes pp-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
    }
    @keyframes pp-one-handed-progress {
      to { stroke-dashoffset: 0; }
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
/** 预览容器顶部工具栏中可交互徽章（页码 / 下载按钮）的通用样式 */
const INTERACTIVE_BADGE_CSS = {
	...DETAIL_BADGE_CSS,
	cursor: "pointer"
};
var PreviewedIllust = class {
	oneHandedMode = false;
	#longPressTimeout = null;
	#longPressProgress = $();
	#suppressLongPressClick = false;
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
	/** 当前页面中各多图作品上次预览的页码，重置预览组件时保留 */
	#previewPages = /* @__PURE__ */ new Map();
	/** 下载按钮重置定时器 */
	#downloadResetTimeout = null;
	/** 保存的鼠标位置 */
	#prevMousePos = [0, 0];
	/** 当前预览图片的实际尺寸 */
	#currentIllustSize = [0, 0];
	/** 当前预览的动图播放器 */
	#currentUgoiraPlayer = null;
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
		this.pageCountElement = $(document.createElement("div")).css(INTERACTIVE_BADGE_CSS).append(page_default).append(this.pageCountText).hide().appendTo(this.previewWrapperHeader);
		this.downloadOriginalElement = $(document.createElement("a")).css(INTERACTIVE_BADGE_CSS).append(`${download_default}<span>原图</span>`).appendTo(this.previewWrapperHeader);
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
	/** 初始化预览容器，优先恢复当前页面中记忆的预览页码 */
	setImage({ illustId, illustElement, previewPage = 1, regularUrls, originalUrls, illustrationDetails }) {
		this.reset();
		this.initPreviewWrapper();
		this.illustId = illustId;
		this.illustDetails = illustrationDetails;
		this.illustElement = illustElement;
		this.regularUrls = regularUrls;
		this.originalUrls = originalUrls;
		this.pageCount = regularUrls.length;
		const initialPage = this.#previewPages.get(illustId) ?? previewPage;
		this.currentPage = initialPage >= 1 && initialPage <= this.pageCount ? initialPage : 1;
		this.preloadImages();
		this.bindPreviewImageEvents();
		this.updatePreviewImage();
		this.renderIllustrationDetails(illustrationDetails);
	}
	bindPreviewImageEvents() {
		this.previewImageElement.on("load", this.onImageLoad);
		this.previewImageElement.on("click", this.onPreviewImageMouseClick);
		this.downloadOriginalElement.on("click", this.onDownloadImage);
		$(document).on("wheel", this.onPreviewImageMouseWheel);
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
	updatePreviewImage(page = this.currentPage) {
		const currentImageUrl = this.regularUrls[page - 1];
		this.previewImageElement.attr("src", currentImageUrl);
		this.pageCountText.text(`${page}/${this.pageCount}`);
		if (this.pageCount > 1) this.#previewPages.set(this.illustId, page);
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
		if (this.oneHandedMode || mouseWheelEvent.ctrlKey || mouseWheelEvent.metaKey) {
			mouseWheelEvent.preventDefault();
			if (mouseWheelEvent.originalEvent.deltaY > 0) this.nextPage();
			else this.prevPage();
		}
	};
	onPreviewImageKeyDown = (keyDownEvent) => {
		if (this.oneHandedMode || keyDownEvent.ctrlKey || keyDownEvent.metaKey) {
			keyDownEvent.preventDefault();
			switch (keyDownEvent.key) {
				case "ArrowUp":
				case "ArrowRight":
					this.nextPage();
					break;
				case "ArrowDown":
				case "ArrowLeft": this.prevPage();
			}
		}
	};
	onDownloadImage = (onClickEvent) => {
		onClickEvent.preventDefault();
		const downloadPage = this.currentPage;
		const currentImageOriginalUrl = this.originalUrls[downloadPage - 1];
		const currentImageFilename = sanitizeIllustFilename(currentImageOriginalUrl.split("/").pop() || "illust.jpg");
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
	setUgoira({ illustId, illustElement, src, mime_type, frames, illustrationDetails }) {
		this.reset();
		this.initPreviewWrapper();
		this.illustId = illustId;
		this.illustDetails = illustrationDetails;
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
		this.renderIllustrationDetails(illustrationDetails);
	}
	createUgoiraPlayer(options) {
		const canvas = document.createElement("canvas");
		return new ZipImagePlayer({
			canvas,
			chunkSize: 3e5,
			loop: true,
			autoStart: true,
			debug: false,
			...options
		});
	}
	bindUgoiraPreviewEvents() {
		this.#currentUgoiraPlayer?.on("frameLoaded", this.onUgoiraFrameLoaded);
		this.bindPreviewMouseEvents();
	}
	unbindUgoiraPreviewEvents() {
		this.#currentUgoiraPlayer?.off("frameLoaded");
		this.unbindPreviewMouseEvents();
	}
	onUgoiraFrameLoaded = (frame) => {
		if (frame !== 0 || !this.#currentUgoiraPlayer) return;
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
			height: ugoiraOriginHeight
		});
		this.adjustPreviewWrapper({ baseOnMousePos: false });
	};
	/** 展示作品详情信息（标签、收藏数等） */
	renderIllustrationDetails(illustrationDetails) {
		if (illustrationDetails && illustrationDetails.id === this.illustId) {
			this.illustMeta.empty();
			const { aiType, bookmarkId, bookmarkUserTotal, tags } = illustrationDetails;
			const isR18 = checkIsR18(tags);
			const isR18G = checkIsR18G(tags);
			const isUgoira = checkIsUgoiraUsingTags(tags);
			const isAi = checkIsAiGenerated(aiType);
			const isAiAssisted = checkIsAiAssisted(tags);
			const illustrationDetailsElements = [];
			if (isR18 || isR18G) illustrationDetailsElements.push($(document.createElement("div")).css({
				...DETAIL_BADGE_CSS,
				background: "rgb(255, 64, 96)"
			}).text(isR18G ? "R-18G" : "R-18"));
			if (isUgoira) {
				this.downloadOriginalElement.hide();
				illustrationDetailsElements.push($(document.createElement("div")).css({
					...DETAIL_BADGE_CSS,
					background: "rgb(14, 116, 144)"
				}).text("动图"));
			}
			if (isAi) illustrationDetailsElements.push($(document.createElement("div")).css({
				...DETAIL_BADGE_CSS,
				background: "rgb(162, 28, 175)"
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
		}
	}
	/** 初始化显示预览容器 */
	initPreviewWrapper() {
		this.previewWrapperElement.show();
		this.previewLoadingElement.show();
		this.adjustPreviewWrapper({ baseOnMousePos: true });
	}
	bindPreviewMouseEvents() {
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
	onMouseDown = (event) => {
		if (event.button !== 0) return;
		this.#suppressLongPressClick = false;
		if (this.oneHandedMode || !this.illustElement.is(event.target)) return;
		this.cancelLongPress();
		this.#longPressProgress = $(`<svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="12" fill="none"
          stroke="rgba(0, 0, 0, 0.35)" stroke-width="4" />
        <circle cx="16" cy="16" r="12" fill="none"
          stroke="rgb(0, 150, 250)" stroke-width="4" stroke-linecap="round"
          pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"
          transform="rotate(-90 16 16)"
          style="animation: pp-one-handed-progress ${ONE_HANDED_MODE_HOLD_MS}ms linear forwards" />
      </svg>`).css({
			position: "fixed",
			left: `${event.clientX - 16}px`,
			top: `${event.clientY - 16}px`,
			width: "32px",
			height: "32px",
			"z-index": "1000000",
			"pointer-events": "none"
		}).appendTo(document.body);
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
	onDocumentClick = (event) => {
		if (!event.isTrusted) return;
		if (this.#suppressLongPressClick) {
			this.#suppressLongPressClick = false;
			event.preventDefault();
			event.stopImmediatePropagation();
			return;
		}
		if (this.oneHandedMode && !this.previewWrapperElement[0]?.contains(event.target)) this.reset();
	};
	/** 阻止页面缩放事件 */
	preventPageZoom = (mouseWheelEvent) => {
		if (this.oneHandedMode || mouseWheelEvent.ctrlKey || mouseWheelEvent.metaKey) mouseWheelEvent.preventDefault();
	};
	/**
	* 根据鼠标移动调整预览容器位置与显隐
	* @param mouseMoveEvent
	*/
	onMouseMove = (mouseMoveEvent) => {
		if (this.#longPressTimeout !== null) this.#longPressProgress.css({
			left: `${mouseMoveEvent.clientX - 16}px`,
			top: `${mouseMoveEvent.clientY - 16}px`
		});
		if (this.oneHandedMode || mouseMoveEvent.ctrlKey || mouseMoveEvent.metaKey) {
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
var heart_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg viewBox=\"0 0 32 32\"\n     width=\"32\"\n     height=\"32\">\n    <path d=\"&#xA;M21,5.5 C24.8659932,5.5 28,8.63400675 28,12.5 C28,18.2694439 24.2975093,23.1517313 17.2206059,27.1100183&#xA;C16.4622493,27.5342993 15.5379984,27.5343235 14.779626,27.110148 C7.70250208,23.1517462 4,18.2694529 4,12.5&#xA;C4,8.63400691 7.13400681,5.5 11,5.5 C12.829814,5.5 14.6210123,6.4144028 16,7.8282366&#xA;C17.3789877,6.4144028 19.170186,5.5 21,5.5 Z\" />\n    <path d=\"M16,11.3317089 C15.0857201,9.28334665 13.0491506,7.5 11,7.5&#xA;C8.23857625,7.5 6,9.73857647 6,12.5 C6,17.4386065 9.2519779,21.7268174 15.7559337,25.3646328&#xA;C15.9076021,25.4494645 16.092439,25.4494644 16.2441073,25.3646326 C22.7480325,21.7268037 26,17.4385986 26,12.5&#xA;C26,9.73857625 23.7614237,7.5 21,7.5 C18.9508494,7.5 16.9142799,9.28334665 16,11.3317089 Z\"\n          style=\"fill: #fafafa;\" />\n</svg>";

//#endregion
//#region src/icons/heart-filled.svg
var heart_filled_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg viewBox=\"0 0 32 32\"\n     width=\"32\"\n     height=\"32\">\n    <path d=\"&#xA;M21,5.5 C24.8659932,5.5 28,8.63400675 28,12.5 C28,18.2694439 24.2975093,23.1517313 17.2206059,27.1100183&#xA;C16.4622493,27.5342993 15.5379984,27.5343235 14.779626,27.110148 C7.70250208,23.1517462 4,18.2694529 4,12.5&#xA;C4,8.63400691 7.13400681,5.5 11,5.5 C12.829814,5.5 14.6210123,6.4144028 16,7.8282366&#xA;C17.3789877,6.4144028 19.170186,5.5 21,5.5 Z\" />\n    <path d=\"M16,11.3317089 C15.0857201,9.28334665 13.0491506,7.5 11,7.5&#xA;C8.23857625,7.5 6,9.73857647 6,12.5 C6,17.4386065 9.2519779,21.7268174 15.7559337,25.3646328&#xA;C15.9076021,25.4494645 16.092439,25.4494644 16.2441073,25.3646326 C22.7480325,21.7268037 26,17.4385986 26,12.5&#xA;C26,9.73857625 23.7614237,7.5 21,7.5 C18.9508494,7.5 16.9142799,9.28334665 16,11.3317089 Z\"\n          style=\"fill: #dc2626;\" />\n</svg>";

//#endregion
//#region src/icons/play.svg
var play_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg viewBox=\"0 0 24 24\"\n     style=\"width: 48px; height: 48px; stroke: none; line-height: 0; font-size: 0px; vertical-align: middle;\">\n    <circle cx=\"12\"\n            cy=\"12\"\n            r=\"10\"\n            style=\"fill: rgba(0, 0, 0, 0.32);\" />\n    <path d=\"M9,8.74841664 L9,15.2515834 C9,15.8038681 9.44771525,16.2515834 10,16.2515834&#xA;C10.1782928,16.2515834 10.3533435,16.2039156 10.5070201,16.1135176 L16.0347118,12.8619342&#xA;C16.510745,12.5819147 16.6696454,11.969013 16.3896259,11.4929799&#xA;C16.3034179,11.3464262 16.1812655,11.2242738 16.0347118,11.1380658 L10.5070201,7.88648243&#xA;C10.030987,7.60646294 9.41808527,7.76536339 9.13806578,8.24139652&#xA;C9.04766776,8.39507316 9,8.57012386 9,8.74841664 Z\"\n          style=\"fill: rgb(245, 245, 245);\" />\n</svg>";

//#endregion
//#region src/utils/promise.ts
const execLimitConcurrentPromises = async (promises, limit = 48) => {
	const results = [];
	let index = 0;
	const executeNext = async () => {
		if (index >= promises.length) return Promise.resolve();
		const currentIndex = index++;
		const result = await promises[currentIndex]();
		results[currentIndex] = result;
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
						const userId = searchParams.get("user_id") || "";
						const userIllustrations = await getUserIllustrationsWithCache(userId, { onRequesting: () => this.setProgress(`Getting illustrations of current user...`) });
						const fromIndex = (page - 1) * USER_TYPE_ARTWORKS_PER_PAGE;
						const toIndex = page * USER_TYPE_ARTWORKS_PER_PAGE;
						switch (type) {
							case 7:
								userIllustrations.artworks.slice(fromIndex, toIndex).forEach((id) => searchParams.append("ids[]", id));
								break;
							case 8:
								userIllustrations.illusts.slice(fromIndex, toIndex).forEach((id) => searchParams.append("ids[]", id));
								break;
							case 9: userIllustrations.manga.slice(fromIndex, toIndex).forEach((id) => searchParams.append("ids[]", id));
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
          ${isR18G ? "<div style=\"padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(255, 64, 96); font-weight: bold; line-height: 16px; user-select: none;\">R-18G</div>" : isR18 ? "<div style=\"padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(255, 64, 96); font-weight: bold; line-height: 16px; user-select: none;\">R-18</div>" : ""}
          ${isAi ? "<div style=\"padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(162, 28, 175); font-weight: bold; line-height: 16px; user-select: none;\">AI 生成</div>" : isAiAssisted ? "<div style=\"padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(109, 40, 217); font-weight: bold; line-height: 16px; user-select: none;\">AI 辅助</div>" : ""}
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
	const savedSettings = GM_getValue(SETTINGS_KEY) ?? {};
	const settings = {
		...g_defaultSettings,
		...savedSettings
	};
	if (Object.keys(g_defaultSettings).some((key) => !Object.hasOwn(savedSettings, key))) GM_setValue(SETTINGS_KEY, settings);
	return settings;
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
	}), GM_registerMenuCommand(`🏷️ 本地标签管理 ${settings.enableLocalTags ? "✅" : "❌"}`, () => {
		toggleSettingBooleanValue("enableLocalTags");
		location.reload();
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
		if (g_settings.enableLocalTags) loadLocalTags();
		iLog.i("Start to initialize Pixiv Previewer with global settings:", g_settings);
		if (g_settings.version !== "1.6.0") ShowUpgradeMessage();
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
if (getSettings().enableLocalTags) interceptTagSearchRequests();
window.addEventListener("DOMContentLoaded", () => {
	setTimeout(initializePixivPreviewer, 1e3);
});

//#endregion