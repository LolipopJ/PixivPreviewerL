import { iLog } from "../utils/logger";
import { downloadFile } from "./download";
import { PixivStandardResponse } from "./xml-http-request";

/** 下载作品 */
export const downloadIllust = ({
  url,
  filename,
  options = {},
}: {
  url: string;
  filename: string;
  options?: Parameters<typeof downloadFile>[2];
}) => {
  downloadFile(url, filename, {
    ...options,
    onerror: (resp) => {
      options.onerror?.(resp);

      window.open(url, "__blank");
    },
  });
};

/** 基于 pixiv.cat 反代下载作品 */
export const downloadIllustWithProxy = ({
  filename,
  pageCount,
  options = {},
}: {
  filename: string;
  pageCount: number;
  options?: Parameters<typeof downloadFile>[2];
}) => {
  const match = filename.match(/(\d+)_p(\d+).(.+)/);
  if (!match) {
    iLog.e(
      `Filename ${filename} is not a valid Pixiv illust name. Example: \`125558092_p0.jpg\``
    );
    return;
  }
  const illustId = match[1];
  const page = Number(match[2]);
  const extension = match[3];
  const proxyUrl = `https://pixiv.cat/${illustId}${pageCount > 1 ? `-${page + 1}` : ""}.${extension}`;
  downloadFile(proxyUrl, filename, {
    ...options,
    onerror: (resp) => {
      options.onerror?.(resp);

      window.open(proxyUrl, "__blank");
    },
  });
};

export type GetIllustPagesResponseData = {
  urls: {
    thumb_mini: string;
    small: string;
    regular: string;
    original: string;
  };
  width: number;
  height: number;
}[];

export type GetIllustPagesResponse =
  PixivStandardResponse<GetIllustPagesResponseData>;

/** 获取图片链接的链接 */
export const getIllustPagesRequestUrl = (id: string) => {
  return `/ajax/illust/${id}/pages`;
};

export type GetUgoiraMetaResponseData = {
  src: string;
  originalSrc: string;
  mime_type: string;
  frames: { file: string; delay: number }[];
};

export type GetUgoiraMetaResponse =
  PixivStandardResponse<GetUgoiraMetaResponseData>;

/** 获取动图下载链接的链接 */
export const getUgoiraMetadataRequestUrl = (id: string) => {
  return `/ajax/illust/${id}/ugoira_meta`;
};

/** 获取小说列表的链接 */
export const getSearchNovelRequestUrl = (key: string, page: number) => {
  return `/ajax/search/novels/${key}?word=${key}&p=${page}`;
};
