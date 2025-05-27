import { IllustSortOrder } from "../enums";
import { GlobalSettings } from "../types";

/** 版本号，发生改变时将会弹窗 */
export const g_version = process.env.VERSION;

/** 默认设置 */
export const g_defaultSettings: GlobalSettings = {
  enablePreview: true,
  enableAnimePreview: true,
  previewDelay: 500,

  pageCount: 2,
  favFilter: 500,
  orderType: IllustSortOrder.BY_BOOKMARK_COUNT,
  aiFilter: true,
  aiAssistedFilter: false,
  hideFavorite: true,
  hideByTag: false,
  hideByTagList: "",

  linkBlank: true,

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

/** 工具栏 ID */
export const TOOLBAR_ID = "pp-toolbar";
/** 排序按钮 ID */
export const SORT_BUTTON_ID = "pp-sort";
/** 排序事件名称 */
export const SORT_EVENT_NAME = "PIXIV_PREVIEWER_RUN_SORT";
/** 下一页按钮 ID */
export const SORT_NEXT_PAGE_BUTTON_ID = "pp-sort-next-page";
/** 下一页事件名称 */
export const SORT_NEXT_PAGE_EVENT_NAME = "PIXIV_PREVIEWER_JUMP_TO_NEXT_PAGE";
