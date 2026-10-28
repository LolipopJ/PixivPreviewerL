import {
  CACHE_TABLE_KEYS,
  clearCacheTables,
  countCacheTable,
  getDatabase,
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

/** 页面解析期间不抢占主线程，空闲时再执行重型清理 */
const whenIdle = (task: () => void) => {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(task, { timeout: 3000 });
  } else {
    setTimeout(task, 1000);
  }
};

/**
 * 提前建立 IndexedDB 连接。
 * 连接需在首次读写缓存时才建立，提前打开可让悬浮预览直接命中缓存，
 * 不必等页面渲染完成后才开始握手。
 */
export const warmUpCacheDatabase = () => {
  void getDatabase();
};

/**
 * 启动后清理一次过期缓存。
 * 清理过程中的失败都在数据库层降级为日志，不会抛出；
 * 本流程在页面生命周期内只执行一次。
 */
export const pruneCachesOnStartup = async () => {
  if (hasPruned) return;
  hasPruned = true;
  await new Promise<void>((resolve) => whenIdle(resolve));
  try {
    await Promise.all([pruneIllustrationCaches(), pruneUgoiraFrameCache()]);
  } catch (error) {
    // 各清理函数内部已把失败降级为日志，此处仅防御未来改动抛出的异常
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
