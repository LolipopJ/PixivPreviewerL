import { AiType, IllustSortOrder, IllustType, Lang } from "../enums";

export interface GlobalSettings {
  lang: Lang;

  enablePreview: 0 | 1;
  enableAnimePreview: 0 | 1;
  previewDelay: number;

  pageCount: number;
  favFilter: number;
  orderType: IllustSortOrder;
  aiFilter: 0 | 1;
  hideFavorite: 0 | 1;
  hideByTag: 0 | 1;
  hideByTagList: string;

  linkBlank: 0 | 1;
  pageByKey: 0 | 1;

  version: string;
}

export interface Illustration {
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

export interface IllustrationDetails extends Illustration {
  /** 作品收藏数 */
  bookmark_user_total: number;
}
