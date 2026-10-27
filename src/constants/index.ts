import { IllustSortOrder } from "../enums";
import type { GlobalSettings } from "../types";

/** 版本号，发生改变时将会弹窗 */
export const g_version = process.env.VERSION ?? "0.0.0";

/** 默认设置 */
export const g_defaultSettings: GlobalSettings = {
  enablePreview: true,
  enableAnimePreview: true,
  previewDelay: 300,

  enableLocalTags: true,

  pageCount: 2,
  favFilter: 500,
  orderType: IllustSortOrder.BY_BOOKMARK_COUNT,
  aiFilter: false,
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
/** 预览缓存最大条目数 */
export const PREVIEW_CACHE_MAX_SIZE = 100;
/** 预览图片解码缓存最大条目数，至少覆盖一次预加载窗口 */
export const PREVIEW_IMAGE_CACHE_MAX_SIZE = PREVIEW_PRELOAD_NUM * 2;
/** 预览时允许使用的详情缓存可变字段（收藏数等）最大缓存时长 */
export const PREVIEW_DETAILS_MAX_STALE_TIME = 1000 * 60 * 60 * 24; // 24 小时

/** 作品详情缓存中可变字段（收藏数、收藏状态等）的有效期 */
export const ILLUSTRATION_DETAILS_CACHE_TIME = 1000 * 60 * 60 * 6; // 6 小时
/** 作品详情缓存中静态字段（标题、标签、页数等）的有效期 */
export const ILLUSTRATION_STATIC_CACHE_TIME = 1000 * 60 * 60 * 24 * 30; // 30 天
/** 作品详情缓存最多保留的条目数 */
export const ILLUSTRATION_DETAILS_CACHE_MAX_ENTRIES = 5000;
/** 作品分页信息缓存最多保留的条目数 */
export const ILLUST_PAGES_CACHE_MAX_ENTRIES = 1500;
/** 发布未超过该时长的作品不缓存详情，避免发布初期的信息被固化 */
export const NEW_ILLUSTRATION_NOT_CACHE_TIME = 1000 * 60 * 60; // 1 小时
/** 作品分页信息缓存有效期 */
export const ILLUST_PAGES_CACHE_TIME = 1000 * 60 * 60 * 24 * 7; // 7 天
/** 标签翻译缓存有效期 */
export const TAG_TRANSLATION_CACHE_TIME = 1000 * 60 * 60 * 24 * 7; // 7 天
/** 用户作品列表（Session Storage）缓存有效期 */
export const USER_ILLUSTRATIONS_CACHE_TIME = 1000 * 60 * 60 * 3; // 3 小时

/** 动图帧缓存最多保存的作品数 */
export const UGOIRA_FRAME_CACHE_MAX_ENTRIES = 20;
/** 动图帧缓存允许占用的最大字节数 */
export const UGOIRA_FRAME_CACHE_MAX_BYTES = 64 * 1024 * 1024;
/** 动图帧缓存有效期 */
export const UGOIRA_FRAME_CACHE_TIME = 1000 * 60 * 60 * 24 * 7; // 7 天

/** 本地标签详情缓存有效期 */
export const LOCAL_TAG_METADATA_CACHE_TIME = 1000 * 60 * 60 * 24 * 30; // 30 天
/** 本地标签状态延迟落盘时间 */
export const LOCAL_TAG_STATE_PERSIST_DELAY = 500;

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
/** 隐藏已收藏作品按钮 */
export const HIDE_FAVORITES_BUTTON_ID = "pp-hide-favorites";

/** R18 作品原图下载目录 */
export const R18_DOWNLOAD_DIRECTORY = "r18";
/** R18G 作品原图下载目录 */
export const R18G_DOWNLOAD_DIRECTORY = "r18-g";

/** R18 标签列表，全小写 */
export const R18_TAGS = ["r-18", "r18"];
/** R18G 标签列表，全小写 */
export const R18G_TAGS = ["r-18g", "r18g"];
/** AI 辅助标签列表，全小写 */
export const AI_ASSISTED_TAGS = [
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
  "ai繪圖",
];
/** 动图标签列表，全小写 */
export const UGOIRA_TAGS = ["うごイラ", "ugoira", "动图", "動圖"];
