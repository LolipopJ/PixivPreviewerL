import { iLog } from "./logger";

export const downloadFile = (
  url: string,
  filename: string,
  options: Partial<Request> = {}
) => {
  fetch(url, options)
    .then((response) => response.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch((error) => {
      iLog.e(`Download ${filename} from ${url} failed: ${error}`);
      window.open(url, "__blank");
    });
};

/** 基于 pixiv.cat 反代下载图片 */
export const downloadIllust = ({
  filename,
  pageCount,
}: {
  filename: string;
  pageCount: number;
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
  downloadFile(
    `https://pixiv.cat/${illustId}${pageCount > 1 ? `-${page + 1}` : ""}.${extension}`,
    filename
  );
};
