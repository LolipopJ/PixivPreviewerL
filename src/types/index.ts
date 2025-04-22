import { AiType, IllustType, Lang } from "../enums";

export interface GlobalSettings {
  lang: Lang;

  enablePreview: 0 | 1;
  enableAnimePreview: 0 | 1;
  previewDelay: number;

  pageCount: number;
  favFilter: number;
  aiFilter: 0 | 1;
  hideFavorite: 0 | 1;
  hideFollowed: 0 | 1;
  hideByTag: 0 | 1;
  hideByTagList: string;

  linkBlank: 0 | 1;
  pageByKey: 0 | 1;

  version: string;
}

export interface Illustration {
  /** AI 生成类型 */
  aiType: AiType;
  /** 收藏信息 */
  bookmarkData: { id: string; private: boolean } | null;
  /** 作品发布时间 */
  createDate: string;
  /** 作品 ID */
  id: string;
  /** 作品类型 */
  illustType: IllustType;
  /** 作品页数 */
  pageCount: number;
  /** 作者头像链接 */
  profileImageUrl: string;
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
}
