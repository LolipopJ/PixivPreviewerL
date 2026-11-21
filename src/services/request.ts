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

export type RequestControls = {
  signal?: AbortSignal;
  /** HTTP 429 时记录当前重试次数，首次请求为 0。 */
  onRateLimit?: (retryTimes: number) => void;
};

const requestAttempt = <TContext>(
  options: Tampermonkey.Request<TContext>,
  signal?: AbortSignal
) => {
  signal?.throwIfAborted();
  const pending = request(options);
  if (!signal) return pending;

  let abort: () => void;
  const response = new Promise<Tampermonkey.Response<TContext>>(
    (resolve, reject) => {
      abort = () => {
        // 当前 GM 请求包装器调用 abort 后不一定会结束 Promise。
        reject(signal.reason);
        pending.abort();
      };
      signal.addEventListener("abort", abort, { once: true });
      void pending.then(resolve, reject);
    }
  );
  return response.finally(() => signal.removeEventListener("abort", abort));
};

export const requestWithRetry = async <TContext = unknown>(
  options: Tampermonkey.Request<TContext> &
    RequestControls & {
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
  const {
    retryDelay,
    maxRetryTimes,
    onRetry,
    onRateLimit,
    signal,
    ...restOptions
  } = options;
  const maxAttempts =
    maxRetryTimes === undefined
      ? (getSettings().requestMaxAttempts ?? Infinity)
      : (maxRetryTimes ?? Infinity);

  let response: Tampermonkey.Response<TContext> | undefined;
  let attempts = 0;
  while (attempts < maxAttempts) {
    response = await requestAttempt(restOptions, signal);
    signal?.throwIfAborted();

    if (response.status === 200) {
      const responseData = response.response as PixivStandardResponse<unknown>;
      if (!responseData.error) {
        return response;
      }
    }

    attempts += 1;
    const willRetry = attempts < maxAttempts;
    if (response.status === 429 && onRateLimit) {
      onRateLimit(willRetry ? attempts : attempts - 1);
    } else if (willRetry) {
      onRetry?.(response, attempts);
    }
    if (willRetry) {
      await pause(retryDelay ?? getSettings().requestRetryIntervalMs, signal);
    }
  }
  throw Object.assign(
    new Error(
      `Request for ${restOptions.url} failed (HTTP ${response?.status}): ${response?.responseText}`
    ),
    { status: response?.status }
  );
};

export default request;
