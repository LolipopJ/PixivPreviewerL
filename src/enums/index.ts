export enum LogLevel {
  None = 0,
  Error = 1,
  Warning = 2,
  Info = 3,
  Elements = 4,
}

export enum IllustType {
  /** 插画 */
  ILLUST = 0,
  /** 漫画 */
  MANGA = 1,
  /** 动图 */
  UGOIRA = 2,
}

export enum IllustCategory {
  /** 所有作品 */
  ILLUST_AND_MANGA = "illustManga",
  /** 插画作品 */
  ILLUST = "illust",
  /** 漫画作品 */
  MANGA = "manga",
}

export enum AiType {
  /** 非 AI 生成 */
  NONE_AI = 1,
  /** AI 生成 */
  AI = 2,
}

// 页面相关的一些预定义，包括处理页面元素等
export enum PageType {
  // 搜索（不包含小说搜索）
  Search,
  // 关注的新作品
  BookMarkNew,
  // 发现
  Discovery,
  // 用户主页
  Member,
  // 首页
  Home,
  // 排行榜
  Ranking,
  // 大家的新作品
  NewIllust,
  // R18
  R18,
  // 自己的收藏页
  BookMark,
  // 动态
  Stacc,
  // 作品详情页（处理动图预览及下载）
  Artwork,
  // 小说页
  NovelSearch,
  // 搜索顶部 tab
  SearchTop,
}

/** 插画（漫画）作品排序类型 */
export enum IllustSortType {
  /** @link https://www.pixiv.net/tags/%E5%A4%A9%E7%AB%A5%E3%82%A2%E3%83%AA%E3%82%B9/artworks */
  TAG_ARTWORK,
  /** @link https://www.pixiv.net/tags/%E5%A4%A9%E7%AB%A5%E3%82%A2%E3%83%AA%E3%82%B9/illustrations */
  TAG_ILLUST,
  /** @link https://www.pixiv.net/tags/%E5%A4%A9%E7%AB%A5%E3%82%A2%E3%83%AA%E3%82%B9/manga */
  TAG_MANGA,
  /** @link https://www.pixiv.net/bookmark_new_illust.php */
  BOOKMARK_NEW,
  /** @link https://www.pixiv.net/bookmark_new_illust_r18.php */
  BOOKMARK_NEW_R18,
  /** @link https://www.pixiv.net/users/333556/artworks */
  USER_ARTWORK,
  /** @link https://www.pixiv.net/users/333556/illustrations */
  USER_ILLUST,
  /** @link https://www.pixiv.net/users/49906039/manga */
  USER_MANGA,
  /** @link https://www.pixiv.net/users/17435436/bookmarks/artworks */
  USER_BOOKMARK_NEW,
  /** @link https://www.pixiv.net/discovery */
  DISCOVERY,
  /** @link https://www.pixiv.net/new_illust.php */
  NEW,
  /** @link https://www.pixiv.net/new_illust_r18.php */
  NEW_R18,
}

/** 作品排序顺序 */
export enum IllustSortOrder {
  /** 按收藏数 */
  BY_BOOKMARK_COUNT,
  /** 按发布日期 */
  BY_DATE,
}
