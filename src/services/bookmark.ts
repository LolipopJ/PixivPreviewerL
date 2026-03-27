import type { RequestResponse } from "../types";
import request from "./request";

export const addBookmark = (
  illustId: string,
  options?: Tampermonkey.Request
) => {
  return request<
    RequestResponse<{ last_bookmark_id: string; stacc_status_id?: string }>
  >({
    ...options,
    url: `/ajax/illusts/bookmarks/add`,
    method: "POST",
    context: undefined,
    data: {
      comment: "",
      illust_id: illustId,
      restrict: 0,
      tags: [],
    },
  });
};

export const deleteBookmark = (
  bookmarkId: string,
  options?: Tampermonkey.Request
) => {
  return request({
    ...options,
    url: `/ajax/illusts/bookmarks/delete`,
    method: "POST",
    data: {
      bookmark_id: bookmarkId,
    },
  });
};
