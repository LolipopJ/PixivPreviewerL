import { IllustSortOrder } from "../enums";
import type { GlobalSettings } from "../types";

/** 版本号，发生改变时将会弹窗 */
export const g_version = process.env.VERSION ?? "0.0.0";

/** 默认设置 */
export const g_defaultSettings: GlobalSettings = {
  enablePreview: true,
  enableAnimePreview: true,
  previewDelay: 300,
  linkBlank: true,
  previewHoldMs: 300,
  previewLoadingOverlayDelayMs: 120,
  previewDownloadNoticeMs: 3000,

  enableLocalTags: true,
  localTagPopoverShowDelayMs: 200,
  localTagPopoverHideDelayMs: 180,

  previewPreloadCount: 5,
  previewCacheMaxEntries: 100,
  previewDetailsMaxStaleMs: 1000 * 60 * 60 * 24,
  illustrationMutableCacheTtlMs: 1000 * 60 * 60 * 6,
  illustrationStaticCacheTtlMs: 1000 * 60 * 60 * 24 * 30,
  illustrationCacheMaxEntries: 5000,
  newIllustrationNoCacheMs: 1000 * 60 * 60,
  illustPagesCacheTtlMs: 1000 * 60 * 60 * 24 * 7,
  illustPagesCacheMaxEntries: 1500,
  userIllustrationsCacheTtlMs: 1000 * 60 * 60 * 3,
  ugoiraCacheTtlMs: 1000 * 60 * 60 * 24 * 7,
  ugoiraCacheMaxEntries: 20,
  ugoiraCacheMaxBytes: 64 * 1024 * 1024,
  localTagMetadataCacheTtlMs: 1000 * 60 * 60 * 24 * 30,
  tagTranslationCacheTtlMs: 1000 * 60 * 60 * 24 * 7,
  tagTranslationCacheMaxEntries: 2000,

  completedDownloadsMaxEntries: 200,
  retryableDownloadsMaxEntries: 200,
  downloadProgressPersistMs: 1000,
  downloadHeartbeatMs: 15000,
  downloadOwnerTimeoutMs: 180000,

  requestRetryIntervalMs: 10000,
  requestMaxAttempts: null,
  tagRequestTimeoutMs: 10000,
  ugoiraChunkBytes: 300000,
  ugoiraTrailerBytes: 30000,

  databaseOpenTimeoutMs: 10000,
  domProbeIntervalMs: 300,
  domProbeMaxAttempts: 10,
  toolbarProbeIntervalMs: 200,
  toolbarProbeMaxAttempts: 25,
  localTagRenderDebounceMs: 100,
  localTagPersistDelayMs: 500,
  cacheCleanupIdleTimeoutMs: 3000,

  pageCount: 2,
  favFilter: 500,
  orderType: IllustSortOrder.BY_BOOKMARK_COUNT,
  aiFilter: false,
  aiAssistedFilter: false,
  hideFavorite: true,
  hideByTag: false,
  hideByTagList: "",

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

/** 各模块注入的 `<style>` 节点 ID，用于避免重复注入 */
export const PREVIEW_STYLE_ID = "pp-preview-styles";
export const LOCAL_TAGS_STYLE_ID = "pp-local-tags-styles";
export const DOWNLOADS_STYLE_ID = "pp-downloads-styles";
export const SETTINGS_STYLE_ID = "pp-settings-styles";
export const UPGRADE_STYLE_ID = "pp-upgrade-styles";

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
