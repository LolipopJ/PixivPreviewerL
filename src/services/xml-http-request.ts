// https://wiki.greasespot.net/GM.xmlHttpRequest

import type { IncomingHttpHeaders } from "http";

export interface RequestOptions<T = XMLHttpRequest["response"]> {
  binary?: boolean;
  context?: object;
  data?: string;
  headers?: IncomingHttpHeaders;
  method: "GET" | "POST";
  overrideMimeType?: string;
  password?: string;
  responseType?: string;
  synchronous?: boolean;
  timeout?: number;
  upload?: object;
  url: string;
  user?: string;
  onabort?: (response: RequestResponse<T>) => void;
  onerror?: (response: RequestResponse<T>) => void;
  onload?: (response: RequestResponse<T>) => void;
  onprogress?: (response: RequestResponse<T>) => void;
  onreadystatechange?: (response: RequestResponse<T>) => void;
  ontimeout?: (response: RequestResponse<T>) => void;
}

export interface RequestResponse<T = XMLHttpRequest["response"]>
  extends XMLHttpRequest {
  response: T;
  context: RequestOptions["context"];
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

export interface PixivStandardResponse<data> {
  error: boolean;
  message?: string;
  body: data;
}

const xmlHttpRequest: <T = XMLHttpRequest["response"]>(
  request: RequestOptions<T>
) => void =
  // @ts-expect-error: auto injected by Tampermonkey
  window.GM_xmlhttpRequest ?? window.GM.xmlHttpRequest;

export const request = <T = XMLHttpRequest["response"]>(
  options: RequestOptions<T>
) => {
  const { headers, ...restOptions } = options;
  xmlHttpRequest<T>({
    ...restOptions,
    headers: {
      referer: "https://www.pixiv.net/",
      ...headers,
    },
  });
};

export default request;
