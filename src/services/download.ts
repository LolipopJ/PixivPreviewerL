import { iLog } from "../utils/logger";
import request, { RequestOptions } from "./xml-http-request";

export const downloadFile = (
  url: string,
  filename: string,
  options: Omit<RequestOptions, "url" | "method" | "responseType"> = {}
) => {
  const { onload, onerror, ...restOptions } = options;
  request({
    ...restOptions,
    url,
    method: "GET",
    responseType: "blob",
    onload: async (resp) => {
      onload?.(resp);

      const blob = new Blob([resp.response], { type: resp.responseType });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    },
    onerror: (resp) => {
      onerror?.(resp);

      iLog.e(`Download ${filename} from ${url} failed: ${resp.responseText}`);
    },
  });
};
