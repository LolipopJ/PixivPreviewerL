// https://wiki.greasespot.net/GM.xmlHttpRequest

import { getSettings } from "../utils/setting";
import { pause } from "../utils/utils";

export interface PixivStandardResponse<data> {
  error: boolean;
  message?: string;
  body: data;
}

export const request = <TContext = unknown>(
  options: Tampermonkey.Request<TContext>
) => {
  const { headers, ...restOptions } = options;
  return window.GM.xmlHttpRequest<TContext>({
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
    /** 最大尝试次数（包含首次，null 表示不限） */
    maxRetryTimes?: number | null;
    /** 重试回调 */
    onRetry?: (
      response: Tampermonkey.Response<TContext>,
      retryTimes: number
    ) => void;
  }
) => {
  const { retryDelay, maxRetryTimes, onRetry, ...restOptions } = options;
  const maxAttempts =
    maxRetryTimes === undefined
      ? (getSettings().requestMaxAttempts ?? Infinity)
      : (maxRetryTimes ?? Infinity);

  let response: Tampermonkey.Response<TContext> | undefined;
  let attempts = 0;
  while (attempts < maxAttempts) {
    response = await request<TContext>(restOptions);

    if (response.status === 200) {
      const responseData = response.response as PixivStandardResponse<unknown>;
      if (!responseData.error) {
        return response;
      }
    }

    attempts += 1;
    if (attempts >= maxAttempts) {
      break;
    }
    onRetry?.(response, attempts);
    await pause(retryDelay ?? getSettings().requestRetryIntervalMs);
  }
  throw new Error(
    `Request for ${restOptions.url} failed: ${response?.responseText}`
  );
};

export default request;
