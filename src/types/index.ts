import { Lang, LogLevel } from "../enums";

export interface GlobalSettings {
  lang: Lang;
  enablePreview: 0 | 1;
  enableAnimePreview: 0 | 1;
  enableSort: 0 | 1;
  enableAnimeDownload: 0 | 1;
  original: 0 | 1;
  previewDelay: number;
  previewByKey: 0 | 1;
  previewKey: 17;
  previewFullScreen: 0 | 1;
  pageCount: number;
  favFilter: number;
  aiFilter: 0 | 1;
  hideFavorite: 0 | 1;
  hideFollowed: 0 | 1;
  hideByTag: 0 | 1;
  hideByTagList: string;
  linkBlank: 0 | 1;
  pageByKey: 0 | 1;
  fullSizeThumb: 0 | 1;
  enableNovelSort: 0 | 1;
  novelPageCount: number;
  novelFavFilter: number;
  novelHideFavorite: 0 | 1;
  novelHideFollowed: 0 | 1;
  logLevel: LogLevel;
  version: string;
}

export interface StandardResponse<data> {
  error: boolean;
  message: string;
  body: data;
}

export type GetIllustPagesResponse = StandardResponse<
  {
    urls: {
      thumb_mini: string;
      small: string;
      regular: string;
      original: string;
    };
    width: number;
    height: number;
  }[]
>;

export type GetUgoiraMetaResponse = StandardResponse<{
  src: string;
  originalSrc: string;
  mime_type: string;
  frames: { file: string; delay: number }[];
}>;
