import { AiType, IllustSortOrder, IllustType } from "../enums";

export interface GlobalSettings {
  /** 是否启用插画（漫画）作品预览功能 */
  enablePreview: boolean;
  /** 是否启用动图作品预览功能 */
  enableAnimePreview: boolean;
  /** 打开预览窗口悬浮时间 */
  previewDelay: number;

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

  version: string;
}

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
