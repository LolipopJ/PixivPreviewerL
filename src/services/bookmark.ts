import Texts from "../i18n";
import type { RequestResponse } from "../types";
import request from "./request";

const postBookmark = async <T>(
  action: "add" | "delete",
  data: string | URLSearchParams
) => {
  const rawPageData = document.getElementById("__NEXT_DATA__")?.textContent;
  const pageData = rawPageData
    ? (JSON.parse(rawPageData) as {
        props?: {
          pageProps?: {
            isLoggedIn?: boolean;
            serverSerializedPreloadedState?: string;
            gaUserData?: { userId?: string | number };
          };
        };
      })
    : undefined;
  const props = pageData?.props?.pageProps;
  if (!props?.isLoggedIn || !props.serverSerializedPreloadedState) {
    throw new Error(Texts.sort_bookmarkSignIn);
  }

  // 仅对 Pixiv 原生收藏请求使用页面已有的防跨站请求伪造令牌。
  const state = JSON.parse(props.serverSerializedPreloadedState) as {
    api?: { token?: string };
  };
  const token = state.api?.token;
  if (!token) throw new Error(Texts.sort_bookmarkSignIn);

  const response = await request({
    url: `/ajax/illusts/bookmarks/${action}`,
    method: "POST",
    headers: {
      "Content-Type":
        typeof data === "string"
          ? "application/json"
          : "application/x-www-form-urlencoded;charset=UTF-8",
      "x-csrf-token": token,
      ...(props.gaUserData?.userId
        ? { "x-user-id": String(props.gaUserData.userId) }
        : {}),
    },
    data: data.toString(),
  });
  const result = response.response as RequestResponse<T> | null;
  if (response.status !== 200 || !result || result.error) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }
  return result.body;
};

export const addBookmark = async (illustId: string) => {
  const result = await postBookmark<{ last_bookmark_id?: string | number }>(
    "add",
    JSON.stringify({ illust_id: illustId, restrict: 0, comment: "", tags: [] })
  );
  if (!result?.last_bookmark_id)
    throw new Error(Texts.sort_bookmarkUnconfirmed);
  return String(result.last_bookmark_id);
};

export const deleteBookmark = async (bookmarkId: string) => {
  await postBookmark(
    "delete",
    new URLSearchParams({ bookmark_id: bookmarkId })
  );
};
