import { Lang } from "../enums";
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
  lang: Lang.zh_CN,

  enablePreview: 1,
  enableAnimePreview: 1,
  previewDelay: 500,

  pageCount: 3,
  favFilter: 500,
  aiFilter: 1,
  hideFavorite: 1,
  hideByTag: 0,
  hideByTagList: "",

  linkBlank: 1,
  pageByKey: 0,

  version: g_version,
};
/** 作品预览容器的背景图片链接 */
export const PREVIEW_WRAPPER_BACKGROUND_IMAGE_URL =
  "https://pp-1252089172.cos.ap-chengdu.myqcloud.com/transparent.png";
/** 作品预览容器的边框宽度 */
export const PREVIEW_WRAPPER_BORDER_WIDTH = 2;
/** 作品预览容器的边框弧度 */
export const PREVIEW_WRAPPER_BORDER_RADIUS = 8;
/** 作品预览容器到鼠标距离 */
export const PREVIEW_WRAPPER_DISTANCE_TO_MOUSE = 20;
/** 预览容器预加载图片数量。仅适用于插画类型作品 */
export const PREVIEW_PRELOAD_NUM = 5;

/** 排序事件名称 */
export const SORT_EVENT_NAME = "runPixivPreviewerSort";
