export const LOCAL_TAGS_KEY = "PIXIV_PREVIEWER_L_LOCAL_TAGS";

export interface LocalTag {
  /** 搜索关键字 TAG */
  tag: string;
  /** 显示标签 TAG_LABEL，留空使用原始标签 */
  label: string;
  visits: number;
}

interface LocalTagState {
  tags: LocalTag[];
  autoSort: boolean;
}

export const getLocalTagState = (): LocalTagState =>
  GM_getValue(LOCAL_TAGS_KEY, { tags: [], autoSort: false });

export const getSortedLocalTags = () => {
  const { tags, autoSort } = getLocalTagState();
  return autoSort ? tags.slice().sort((a, b) => b.visits - a.visits) : tags;
};

export const addLocalTag = (tag: string, label: string) => {
  const state = getLocalTagState();
  if (state.tags.some((item) => item.tag === tag)) return;
  state.tags.push({ tag, label: label.trim(), visits: 0 });
  GM_setValue(LOCAL_TAGS_KEY, state);
};

export const removeLocalTag = (tag: string) => {
  const state = getLocalTagState();
  state.tags = state.tags.filter((item) => item.tag !== tag);
  GM_setValue(LOCAL_TAGS_KEY, state);
};

export const renameLocalTag = (tag: string, label: string) => {
  const state = getLocalTagState();
  const item = state.tags.find((item) => item.tag === tag);
  if (!item) return;
  item.label = label.trim();
  GM_setValue(LOCAL_TAGS_KEY, state);
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
  GM_setValue(LOCAL_TAGS_KEY, state);
};

export const setLocalTagAutoSort = (autoSort: boolean) => {
  GM_setValue(LOCAL_TAGS_KEY, { ...getLocalTagState(), autoSort });
};

export const recordLocalTagVisit = (tag: string) => {
  const state = getLocalTagState();
  const item = state.tags.find((item) => item.tag === tag);
  if (!item) return;
  item.visits++;
  GM_setValue(LOCAL_TAGS_KEY, state);
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
