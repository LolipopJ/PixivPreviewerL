import { iLog } from "../utils/logger";
import request from "./request";

export const downloadFile = (
  url: string,
  filename: string,
  options: Omit<Tampermonkey.Request, "url" | "method" | "responseType"> = {}
) => {
  const { onload, onerror, ...restOptions } = options;
  request({
    ...restOptions,
    url,
    method: "GET",
    responseType: "blob",
    onload: (resp) => {
      // @ts-expect-error: unhandled
      onload?.(resp);

      const blob = new Blob([resp.response], {
        // @ts-expect-error: specified in request options
        type: resp.responseType,
      });
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
      // @ts-expect-error: unhandled
      onerror?.(resp);

      iLog.e(`Download ${filename} from ${url} failed: ${resp.responseText}`);
    },
  });
};
