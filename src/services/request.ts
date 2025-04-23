// https://wiki.greasespot.net/GM.xmlHttpRequest

import { pause } from "../utils/utils";

export interface PixivStandardResponse<data> {
  error: boolean;
  message?: string;
  body: data;
}

const xmlHttpRequest = window.GM.xmlHttpRequest;

export const request = <TContext = unknown>(
  options: Tampermonkey.Request<TContext>
) => {
  const { headers, ...restOptions } = options;
  return xmlHttpRequest<TContext>({
    responseType: "json",
    ...restOptions,
    headers: {
      referer: "https://www.pixiv.net/",
      ...headers,
    },
  });
};

export const requestWithRetry = async <TContext = unknown>(
  options: Tampermonkey.Request<TContext> & {
    /** 重试间隔时间（ms） */
    retryDelay?: number;
    /** 最大重试次数 */
    maxRetryTimes?: number;
    /** 重试回调 */
    onRetry?: (
      response: Tampermonkey.Response<TContext>,
      retryTimes: number
    ) => void;
  }
) => {
  const {
    retryDelay = 5000,
    maxRetryTimes = Infinity,
    onRetry,
    ...restOptions
  } = options;

  let response: Tampermonkey.Response<TContext>;
  let retryTimes = 0;
  while (retryTimes < maxRetryTimes) {
    response = await request<TContext>(restOptions);

    if (response.status === 200) {
      const responseData = response.response as PixivStandardResponse<unknown>;
      if (!responseData.error) {
        return response;
      }
    }

    retryTimes += 1;
    onRetry?.(response, retryTimes);
    await pause(retryDelay);
  }
  throw new Error(
    `Request for ${restOptions.url} failed: ${response.responseText}`
  );
};

export default request;
