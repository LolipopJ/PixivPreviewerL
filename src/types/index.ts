import { AiType, IllustSortOrder, IllustType } from "../enums";

export type LanguageOption = "auto" | "zh-CN" | "en" | "ja" | "ko";

export interface GlobalSettings {
  /** 界面显示语言 */
  language: LanguageOption;
  /** 是否启用插画（漫画）作品预览功能 */
  enablePreview: boolean;
  /** 是否启用动图作品预览功能 */
  enableAnimePreview: boolean;
  /** 打开预览窗口悬浮时间 */
  previewDelay: number;

  /** 是否启用本地标签管理功能 */
  enableLocalTags: boolean;

  /** 排序作品的页数 */
  pageCount: number;
  /** 过滤指定收藏数以下的作品 */
  favFilter: number;
  /** 排序方式 */
  orderType: IllustSortOrder;
  /** 是否过滤 AI 生成作品 */
  aiFilter: boolean;
  /** 是否过滤 AI 辅助（加笔）作品 */
  aiAssistedFilter: boolean;
  /** 是否过滤已收藏作品 */
  hideFavorite: boolean;
  /** 是否按标签过滤作品 */
  hideByTag: boolean;
  /** 过滤作品的标签 */
  hideByTagList: string;

  /** 是否在新标签页打开作品 */
  linkBlank: boolean;
  /** 长按进入固定预览的时间（毫秒） */
  previewHoldMs: number;
  /** 翻页后显示加载遮罩的延迟时间（毫秒） */
  previewLoadingOverlayDelayMs: number;
  /** 原图下载成功后“已下载”提示保留时长（毫秒） */
  previewDownloadNoticeMs: number;
  /** 本地标签浮层显示延迟（毫秒） */
  localTagPopoverShowDelayMs: number;
  /** 本地标签浮层关闭延迟（毫秒） */
  localTagPopoverHideDelayMs: number;

  /** 预览预加载窗口数量（含当前页） */
  previewPreloadCount: number;
  /** 预览内部两类缓存各自的容量 */
  previewCacheMaxEntries: number;
  /** 预览详情可变字段额外陈旧容忍时间（毫秒） */
  previewDetailsMaxStaleMs: number;
  /** 作品详情可变信息缓存有效期（毫秒） */
  illustrationMutableCacheTtlMs: number;
  /** 作品详情静态信息缓存有效期（毫秒） */
  illustrationStaticCacheTtlMs: number;
  /** 作品详情缓存最大条目数 */
  illustrationCacheMaxEntries: number;
  /** 新作品免缓存窗口（毫秒） */
  newIllustrationNoCacheMs: number;
  /** 作品分页缓存有效期（毫秒） */
  illustPagesCacheTtlMs: number;
  /** 作品分页缓存最大条目数 */
  illustPagesCacheMaxEntries: number;
  /** 用户作品列表缓存有效期（毫秒） */
  userIllustrationsCacheTtlMs: number;
  /** 动图帧缓存有效期（毫秒） */
  ugoiraCacheTtlMs: number;
  /** 动图帧缓存最多保存的作品数 */
  ugoiraCacheMaxEntries: number;
  /** 动图帧缓存最大字节数 */
  ugoiraCacheMaxBytes: number;
  /** 本地标签详情缓存有效期（毫秒） */
  localTagMetadataCacheTtlMs: number;
  /** 标签翻译缓存有效期（毫秒） */
  tagTranslationCacheTtlMs: number;
  /** 标签翻译缓存最大条目数 */
  tagTranslationCacheMaxEntries: number;

  /** 已完成下载记录最多保留的条数 */
  completedDownloadsMaxEntries: number;
  /** 可重试（失败或中断）下载记录最多保留的条数 */
  retryableDownloadsMaxEntries: number;
  /** 下载进度持久化最小间隔（毫秒） */
  downloadProgressPersistMs: number;
  /** 下载状态存活心跳间隔（毫秒） */
  downloadHeartbeatMs: number;
  /** 下载标签页失联判定超时时间（毫秒） */
  downloadOwnerTimeoutMs: number;

  /** 请求失败重试间隔（毫秒） */
  requestRetryIntervalMs: number;
  /** 请求最大尝试次数（含首次），null 表示不限 */
  requestMaxAttempts: number | null;
  /** 标签接口请求超时（毫秒） */
  tagRequestTimeoutMs: number;
  /** 动图下载分块大小（字节） */
  ugoiraChunkBytes: number;
  /** 动图尾部探测大小（字节） */
  ugoiraTrailerBytes: number;

  /** 数据库打开超时（毫秒） */
  databaseOpenTimeoutMs: number;
  /** 通用 DOM 探测间隔（毫秒） */
  domProbeIntervalMs: number;
  /** 通用 DOM 探测最大次数 */
  domProbeMaxAttempts: number;
  /** 工具栏探测间隔（毫秒） */
  toolbarProbeIntervalMs: number;
  /** 工具栏探测最大次数 */
  toolbarProbeMaxAttempts: number;
  /** 本地标签界面更新防抖（毫秒） */
  localTagRenderDebounceMs: number;
  /** 本地标签延迟保存时间（毫秒） */
  localTagPersistDelayMs: number;
  /** 空闲缓存清理最长等待（毫秒） */
  cacheCleanupIdleTimeoutMs: number;

  version: string;
}

/** 面向用户的可配置字段，明确排除内部版本元数据 `version` */
export type UserSettings = Omit<GlobalSettings, "version">;
export type UserSettingKey = keyof UserSettings;

export type RequestResponse<T> = {
  body: T;
  error: boolean;
  message: string;
};

export interface IllustrationListItem {
  /** AI 生成类型 */
  aiType: AiType;
  alt: string;
  /** 收藏作品日期 */
  bookmarkData: { id: string; private: boolean } | null;
  /** 作品发布时间 */
  createDate: string;
  description: string;
  height: number;
  /** 作品 ID */
  id: string;
  /** 作品类型 */
  illustType: IllustType;
  isBookmarkable: boolean;
  isMasked: boolean;
  isUnlisted: boolean;
  /** 作品页数 */
  pageCount: number;
  /** 作者头像链接 */
  profileImageUrl: string;
  restrict: number;
  sl: number;
  /** 标签列表。包含 `R-18` 时为 r18 作品 */
  tags: string[];
  /** 作品标题 */
  title: string;
  /** 作品更新时间 */
  updateDate: string;
  /** 缩略图链接 */
  url: string;
  /** 作者 ID */
  userId: string;
  /** 作者用户名 */
  userName: string;
  visibilityScope: number;
  width: number;
  xRestrict: number;
}

export interface IllustrationDetails {
  aiType: AiType;
  alt: string;
  /** 当前用户的收藏作品 ID，不为空时表示已收藏作品 */
  bookmarkId?: string;
  /** 作品收藏数 */
  bookmarkUserTotal: number;
  comment: string;
  commentHtml: string;
  height: string;
  id: string;
  pageCount: string;
  restrict: string;
  /** 作品重上传时间戳（秒） */
  reuploadTimestamp?: number;
  shareText: string;
  sl: number;
  tags: string[];
  title: string;
  type: IllustType;
  ugoiraMeta?: {
    frames: { delay: number; file: string }[];
    mime_type: string;
    src: string;
  };
  /** 作品上传时间戳（秒） */
  uploadTimestamp: number;
  url: string;
  userId: string;
  width: string;
  xRestrict: string;
}
