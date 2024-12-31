import { GlobalSettings } from "../types";

/** 版本号，发生改变时将会弹窗 */
export const g_version = process.env.VERSION ?? "1.0.0";
/** 图片详情页的链接，使用时替换 #id# */
export const g_artworkUrl = "/artworks/#id#";
/** 获取图片链接的链接 */
export const g_getArtworkUrl = "/ajax/illust/#id#/pages";
/** 获取动图下载链接的链接 */
export const g_getUgoiraUrl = "/ajax/illust/#id#/ugoira_meta";
/** 获取小说列表的链接 */
export const g_getNovelUrl = "/ajax/search/novels/#key#?word=#key#&p=#page#";
/** 加载中占位图片 */
export const g_loadingImage =
  "https://pp-1252089172.cos.ap-chengdu.myqcloud.com/loading.gif";
/** 排序时同时请求收藏量的 Request 数量，没必要太多，并不会加快速度 */
export const g_maxXhr = 64;
/** 默认设置，仅用于首次脚本初始化 */
export const g_defaultSettings: GlobalSettings = {
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
  version: g_version,
};
/** 作品预览容器的背景图片链接 */
export const PREVIEW_WRAPPER_BACKGROUND_IMAGE_URL =
  "https://pp-1252089172.cos.ap-chengdu.myqcloud.com/transparent.png";
/** 作品预览容器的最小尺寸 */
export const PREVIEW_WRAPPER_MIN_SIZE = 48;
/** 作品预览容器的边框宽度 */
export const PREVIEW_WRAPPER_BORDER_WIDTH = 2;
/** 作品预览容器的边框弧度 */
export const PREVIEW_WRAPPER_BORDER_RADIUS = 8;
/** 作品预览容器到鼠标距离 */
export const PREVIEW_WRAPPER_DISTANCE_TO_MOUSE = 20;
/** 预览容器预加载图片数量。仅适用于插画类型作品 */
export const PREVIEW_PRELOAD_NUM = 5;
