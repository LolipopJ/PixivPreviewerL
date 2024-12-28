export enum Lang {
  auto = -1,
  zh_CN = 0,
  en_US = 1,
  ru_RU = 2,
  ja_JP = 3,
}

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
  Search = 0,
  // 关注的新作品
  BookMarkNew = 1,
  // 发现
  Discovery = 2,
  // 用户主页
  Member = 3,
  // 首页
  Home = 4,
  // 排行榜
  Ranking = 5,
  // 大家的新作品
  NewIllust = 6,
  // R18
  R18 = 7,
  // 自己的收藏页
  BookMark = 8,
  // 动态
  Stacc = 9,
  // 作品详情页（处理动图预览及下载）
  Artwork = 10,
  // 小说页
  NovelSearch = 11,
  // 搜索顶部 tab
  SearchTop = 12,
  // 总数
  PageTypeCount = 13,
}
