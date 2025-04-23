import { IllustSortOrder } from "../enums";
import { GlobalSettings } from "../types";

/** 版本号，发生改变时将会弹窗 */
export const g_version = process.env.VERSION;

/** 默认设置 */
export const g_defaultSettings: GlobalSettings = {
  enablePreview: 1,
  enableAnimePreview: 1,
  previewDelay: 500,

  pageCount: 3,
  favFilter: 500,
  orderType: IllustSortOrder.BY_BOOKMARK_COUNT,
  aiFilter: 1,
  aiAssistedFilter: 0,
  hideFavorite: 1,
  hideByTag: 0,
  hideByTagList: "",

  linkBlank: 1,

  version: g_version,
};

/** 加载中占位图片 */
export const g_loadingImage =
  "https://pp-1252089172.cos.ap-chengdu.myqcloud.com/loading.gif";

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
