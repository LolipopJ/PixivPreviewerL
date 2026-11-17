import type { TagDetails } from "../services/tags";
import { getSettings, subscribeSettings } from "./setting";
import { createReadThroughCache } from "./utils";

export const LOCAL_TAGS_KEY = "PIXIV_PREVIEWER_L_LOCAL_TAGS";
export const LOCAL_TAG_TRANSLATIONS_KEY = "PIXIV_PREVIEWER_L_TAG_TRANSLATIONS";

export interface LocalTag {
  /** 搜索关键字 TAG */
  tag: string;
  /** 显示标签 TAG_LABEL，留空使用原始标签 */
  label: string;
  visits: number;
  /** 上次访问标签页时的插画漫画作品总数 */
  lastTotal?: number;
  metadata?: {
    details: TagDetails;
    cachedAt: number;
  };
}

interface LocalTagState {
  tags: LocalTag[];
  autoSort: boolean;
}

interface TagTranslationEntry {
  /** 空字符串表示该标签没有中文翻译 */
  translation: string;
  cachedAt: number;
}

interface TagTranslationState {
  translations: Record<string, TagTranslationEntry>;
}

const emptyLocalTagState = (): LocalTagState => ({ tags: [], autoSort: false });

/**
 * 本地标签状态在内存中只保留一份，避免 `MutationObserver` 触发的
 * 高频读取反复反序列化全部标签。
 */
const localTagState = createReadThroughCache<LocalTagState>(() =>
  GM_getValue(LOCAL_TAGS_KEY, emptyLocalTagState())
);

const tagTranslationState = createReadThroughCache<TagTranslationState>(() =>
  GM_getValue(LOCAL_TAG_TRANSLATIONS_KEY, { translations: {} })
);

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistSettingsSubscribed = false;

const ensurePersistSettingsListener = () => {
  if (persistSettingsSubscribed) return;
  persistSettingsSubscribed = true;
  subscribeSettings((next, prev) => {
    if (
      next.localTagPersistDelayMs !== prev.localTagPersistDelayMs &&
      persistTimer !== null
    ) {
      if (next.localTagPersistDelayMs === 0) {
        flushLocalTagState();
      } else {
        clearTimeout(persistTimer);
        persistTimer = null;
        schedulePersist();
      }
    }
  });
};

/** 延迟批量落盘，合并同一轮操作中的多次写入 */
const schedulePersist = () => {
  ensurePersistSettingsListener();
  if (persistTimer !== null) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    GM_setValue(
      LOCAL_TAGS_KEY,
      // 写入副本，避免存储引用继续被后续修改
      structuredClone(localTagState.peek())
    );
  }, getSettings().localTagPersistDelayMs);
};

/** 立即落盘 pending 的修改，用于标签页隐藏等场景 */
export const flushLocalTagState = () => {
  if (persistTimer === null) return;
  clearTimeout(persistTimer);
  persistTimer = null;
  GM_setValue(LOCAL_TAGS_KEY, structuredClone(localTagState.peek()));
};

/** 其他标签页修改了标签状态时，先落盘本地改动，再使内存缓存失效 */
export const invalidateLocalTagState = () => {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
    // 先提交本地未落盘的改动，避免用户刚做的编辑被远端写入丢弃
    GM_setValue(LOCAL_TAGS_KEY, structuredClone(localTagState.peek()));
  }
  localTagState.invalidate();
};

export const getLocalTagState = (): LocalTagState => localTagState.get();

export const getLocalTag = (tag: string) =>
  getLocalTagState().tags.find((item) => item.tag === tag);

export const hasLocalTag = (tag: string) =>
  getLocalTagState().tags.some((item) => item.tag === tag);

export const recordLocalTagTotal = (tag: string, total: number) => {
  if (!Number.isFinite(total) || total < 0) return;
  const item = getLocalTag(tag);
  if (!item || item.lastTotal === total) return;
  item.lastTotal = total;
  schedulePersist();
};

export const getCachedLocalTagDetails = (tag: string) => {
  const item = getLocalTag(tag);
  if (!item?.metadata) return;
  const age = Date.now() - item.metadata.cachedAt;
  if (age >= 0 && age < getSettings().localTagMetadataCacheTtlMs)
    return item.metadata.details;
  delete item.metadata;
  schedulePersist();
};

export const cacheLocalTagDetails = (tag: string, details: TagDetails) => {
  const item = getLocalTag(tag);
  if (!item) return;
  item.metadata = { details, cachedAt: Date.now() };
  schedulePersist();
};

export const getSortedLocalTags = () => {
  const { tags, autoSort } = getLocalTagState();
  return autoSort ? tags.slice().sort((a, b) => b.visits - a.visits) : tags;
};

export const addLocalTag = (tag: string, label: string) => {
  const state = getLocalTagState();
  if (state.tags.some((item) => item.tag === tag)) return;
  state.tags.push({ tag, label: label.trim(), visits: 0 });
  schedulePersist();
};

export const removeLocalTag = (tag: string) => {
  const state = getLocalTagState();
  state.tags = state.tags.filter((item) => item.tag !== tag);
  schedulePersist();
};

export const renameLocalTag = (tag: string, label: string) => {
  const item = getLocalTag(tag);
  if (!item) return;
  item.label = label.trim();
  schedulePersist();
};

export const moveLocalTag = (tag: string, target: number) => {
  const state = getLocalTagState();
  if (state.autoSort) return;
  const index = state.tags.findIndex((item) => item.tag === tag);
  if (
    index < 0 ||
    !Number.isInteger(target) ||
    target < 0 ||
    target >= state.tags.length ||
    index === target
  )
    return;
  const [item] = state.tags.splice(index, 1);
  state.tags.splice(target, 0, item);
  schedulePersist();
};

export const setLocalTagAutoSort = (autoSort: boolean) => {
  getLocalTagState().autoSort = autoSort;
  schedulePersist();
};

export const recordLocalTagVisit = (tag: string) => {
  const item = getLocalTag(tag);
  if (!item) return;
  item.visits++;
  schedulePersist();
};

/** 读取标签中文翻译缓存 */
export const getCachedTagTranslation = (tag: string): string | undefined => {
  const entry = tagTranslationState.get().translations[tag];
  if (!entry) return undefined;
  if (Date.now() - entry.cachedAt > getSettings().tagTranslationCacheTtlMs) {
    delete tagTranslationState.peek().translations[tag];
    return undefined;
  }
  return entry.translation;
};

const evictOverflowTagTranslations = (
  state: TagTranslationState,
  maxEntries: number
): boolean => {
  const entries = Object.entries(state.translations);
  if (entries.length <= maxEntries) return false;
  const keepCount = Math.floor(maxEntries / 2);
  const kept = entries
    .sort((a, b) => b[1].cachedAt - a[1].cachedAt)
    .slice(0, keepCount);
  state.translations = Object.fromEntries(kept);
  return true;
};

/** 缓存标签中文翻译；条目数超限时按容量一半向下取整淘汰最旧条目 */
export const cacheTagTranslation = (tag: string, translation: string) => {
  const state = tagTranslationState.peek();
  state.translations[tag] = { translation, cachedAt: Date.now() };
  evictOverflowTagTranslations(
    state,
    getSettings().tagTranslationCacheMaxEntries
  );
  GM_setValue(LOCAL_TAG_TRANSLATIONS_KEY, state);
};

/** 按当前有效期与容量清理已保存的标签翻译缓存 */
export const pruneTagTranslationCache = () => {
  const { tagTranslationCacheTtlMs, tagTranslationCacheMaxEntries } =
    getSettings();
  const state = tagTranslationState.get();
  const now = Date.now();
  let changed = false;

  for (const [tag, entry] of Object.entries(state.translations)) {
    if (now - entry.cachedAt > tagTranslationCacheTtlMs) {
      delete state.translations[tag];
      changed = true;
    }
  }

  if (evictOverflowTagTranslations(state, tagTranslationCacheMaxEntries)) {
    changed = true;
  }

  if (changed) {
    GM_setValue(LOCAL_TAG_TRANSLATIONS_KEY, state);
  }
};

export const getTagFromPath = (pathname: string): string | null => {
  const match = pathname.match(/^\/(?:en\/)?tags\/([^/]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
};

/** 供“清除缓存”使用：丢弃标签状态与翻译的内存缓存 */
export const clearLocalTagCaches = () => {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  localTagState.invalidate();
  tagTranslationState.invalidate();
  GM_setValue(LOCAL_TAG_TRANSLATIONS_KEY, { translations: {} });
};
