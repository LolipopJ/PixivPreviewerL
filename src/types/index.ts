import { Lang } from "../enums";

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
