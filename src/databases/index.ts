export {
  CACHE_TABLE_KEYS,
  type CacheTableKey,
  clearCacheTables,
  countCacheTable,
  getDatabase,
  ILLUST_PAGES_CACHE_TABLE_KEY,
  ILLUSTRATION_DETAILS_CACHE_TABLE_KEY,
  UGOIRA_FRAMES_CACHE_TABLE_KEY,
} from "./connection";
export {
  type CachedIllustrationDetails,
  cacheIllustPages,
  cacheIllustrationDetails,
  deleteCachedIllustrationDetails,
  getCachedIllustPages,
  getCachedIllustrationDetails,
  type IllustPagesCache,
  type IllustrationDetailsCache,
  pruneIllustrationCaches,
} from "./illustration-cache";
export {
  cacheUgoiraFrames,
  getCachedUgoiraFrames,
  getUgoiraFrameCacheStats,
  pruneUgoiraFrameCache,
  type UgoiraCachedFrame,
  type UgoiraFramesCache,
} from "./ugoira-cache";
