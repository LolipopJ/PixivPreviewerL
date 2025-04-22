// https://wiki.greasespot.net/GM.xmlHttpRequest

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
    ...restOptions,
    headers: {
      referer: "https://www.pixiv.net/",
      ...headers,
    },
  });
};

export default request;
