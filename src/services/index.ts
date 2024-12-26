/** 获取图片链接的链接 */
export const getIllustPagesRequestUrl = (id: string) => {
  return `/ajax/illust/${id}/pages`;
};

/** 获取动图下载链接的链接 */
export const getUgoiraMetadataRequestUrl = (id: string) => {
  return `/ajax/illust/${id}/ugoira_meta`;
};

/** 获取小说列表的链接 */
export const getSearchNovelRequestUrl = (key: string, page: number) => {
  return `/ajax/search/novels/${key}?word=${key}&p=${page}`;
};
