import {
  CACHE_TABLE_KEYS,
  clearCacheTables,
  countCacheTable,
  getUgoiraFrameCacheStats,
  ILLUST_PAGES_CACHE_TABLE_KEY,
  ILLUSTRATION_DETAILS_CACHE_TABLE_KEY,
  pruneIllustrationCaches,
  pruneUgoiraFrameCache,
  UGOIRA_FRAMES_CACHE_TABLE_KEY,
} from "../databases";
import { iLog } from "../utils/logger";
import { clearLocalTagCaches, LOCAL_TAG_TRANSLATIONS_KEY } from "../utils/tags";
import { clearUserIllustrationsCache } from "./illustration";

export interface CacheUsage {
  /** 作品详情缓存条目数 */
  illustrationDetails: number;
  /** 作品分页缓存条目数 */
  illustPages: number;
  /** 动图帧缓存条目数 */
  ugoiraFrames: number;
  /** 动图帧缓存占用的字节数 */
  ugoiraBytes: number;
  /** 标签翻译缓存条目数 */
  tagTranslations: number;
}

let hasPruned = false;

/** 启动后清理一次过期缓存；失败不影响功能，仅记录日志并允许后续重试 */
export const pruneCachesOnStartup = async () => {
  if (hasPruned) return;
  try {
    await Promise.all([pruneIllustrationCaches(), pruneUgoiraFrameCache()]);
    hasPruned = true;
  } catch (error) {
    // 保留未清理状态，下次初始化（例如数据库正忙的情况过去后）可以重试
    iLog.w("Failed to prune caches on startup:", error);
  }
};

const countTagTranslations = () => {
  const state = GM_getValue<{ translations?: Record<string, unknown> }>(
    LOCAL_TAG_TRANSLATIONS_KEY,
    { translations: {} }
  );
  return Object.keys(state?.translations ?? {}).length;
};

export const getCacheUsage = async (): Promise<CacheUsage> => {
  const [counts, ugoira] = await Promise.all([
    countCacheTable(CACHE_TABLE_KEYS),
    getUgoiraFrameCacheStats(),
  ]);

  return {
    illustrationDetails: counts[ILLUSTRATION_DETAILS_CACHE_TABLE_KEY] ?? 0,
    illustPages: counts[ILLUST_PAGES_CACHE_TABLE_KEY] ?? 0,
    ugoiraFrames: counts[UGOIRA_FRAMES_CACHE_TABLE_KEY] ?? 0,
    ugoiraBytes: ugoira.bytes,
    tagTranslations: countTagTranslations(),
  };
};

/** 清空全部本地缓存（IndexedDB、会话存储、标签翻译） */
export const clearAllLocalCaches = async (): Promise<boolean> => {
  clearUserIllustrationsCache();
  clearLocalTagCaches();

  const cleared = await clearCacheTables(CACHE_TABLE_KEYS);
  if (!cleared) iLog.w("Failed to clear some IndexedDB caches.");
  return cleared;
};

export const formatCacheBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
