import assert from "node:assert/strict";

type GmChangeListener = (
  key: string,
  oldValue: unknown,
  newValue: unknown,
  remote: boolean
) => void;

const gmStore = new Map<string, unknown>();
let throwOnSettingsSet = false;
const gmListeners = new Map<string, GmChangeListener[]>();

const g = globalThis as Record<string, unknown>;
g.window = {
  GM: {
    xmlHttpRequest: async () => ({
      status: 200,
      response: { error: false, body: {} },
    }),
  },
  addEventListener: () => {},
};
g.document = {
  addEventListener: () => {},
  visibilityState: "visible",
};
g.requestIdleCallback = (cb: () => void) => setTimeout(cb, 0);
g.GM_getValue = (key: string, defaultValue?: unknown) =>
  gmStore.has(key) ? structuredClone(gmStore.get(key)) : defaultValue;
g.GM_setValue = (key: string, value: unknown) => {
  if (throwOnSettingsSet && key === "PIXIV_PREVIEWER_L_SETTINGS") {
    throw new Error("Simulated storage write error");
  }
  gmStore.set(key, structuredClone(value));
};
g.GM_addValueChangeListener = (key: string, cb: GmChangeListener) => {
  const list = gmListeners.get(key) ?? [];
  list.push(cb);
  gmListeners.set(key, list);
  return list.length;
};

let fetchCallCount = 0;
let resolvePendingFetch: ((value: unknown) => void) | null = null;
class FakeXMLHttpRequest {
  status = 200;
  responseType = "json";
  response: unknown = null;
  responseText = "";
  private listeners = new Map<string, (() => void)[]>();
  open() {}
  send() {}
  addEventListener(type: string, cb: () => void) {
    const list = this.listeners.get(type) ?? [];
    list.push(cb);
    this.listeners.set(type, list);
  }
  emitLoad() {
    for (const cb of this.listeners.get("load") ?? []) cb();
  }
}
g.unsafeWindow = {
  fetch: (url: string) => {
    fetchCallCount += 1;
    if (String(url).includes("pending-tag")) {
      return new Promise((resolve) => {
        resolvePendingFetch = resolve;
      });
    }
    return Promise.resolve({
      ok: true,
      clone() {
        return {
          json: async () => ({
            error: false,
            body: { illustManga: { total: 777 } },
          }),
        };
      },
    });
  },
  XMLHttpRequest: FakeXMLHttpRequest,
};
g.location = {
  origin: "https://www.pixiv.net",
  href: "https://www.pixiv.net/tags/miku/artworks",
  pathname: "/tags/miku/artworks",
};

const { g_defaultSettings } = await import("../src/constants");
const { SETTING_FIELD_MAP, SETTING_FIELDS, USER_SETTING_KEYS } =
  await import("../src/constants/settings");
const { createSettingsDraftSession } =
  await import("../src/features/settings-panel");
const { default: debounce } = await import("../src/utils/debounce");
const { getSettings, saveUserSettings, subscribeSettings } =
  await import("../src/utils/setting");
const {
  interceptTagSearchRequests,
  resetLocalTagVisitTrackingOnPath,
  syncLocalTagVisitForPath,
} = await import("../src/features/local-tags");
const {
  addLocalTag,
  cacheTagTranslation,
  flushLocalTagState,
  getLocalTag,
  LOCAL_TAG_TRANSLATIONS_KEY,
  LOCAL_TAGS_KEY,
} = await import("../src/utils/tags");
const { createLRUCache } = await import("../src/utils/utils");
const { pruneCachesOnStartup, scheduleCachePrune } =
  await import("../src/services/cache");
const { downloadFile, getDownloads } = await import("../src/services/download");
const { requestWithRetry } = await import("../src/services/request");

// --- Task 1.2 / 2.1: 字段清单、草稿隔离、0 收藏阈值与存储失败 ---
assert.equal(SETTING_FIELDS.filter((f) => f.section === "common").length, 18);
assert.equal(
  SETTING_FIELDS.some((f) => (f.key as string) === "version"),
  false
);

gmStore.set("PIXIV_PREVIEWER_L_SETTINGS", {
  ...g_defaultSettings,
  version: "1.8.0",
});
const initial = getSettings();
const session = createSettingsDraftSession(initial);
session.setInput("previewDelay", "120");
session.setInput("favFilter", "0");
assert.equal(getSettings().previewDelay, 300);

session.restoreField("previewDelay");
assert.equal(session.getDraftValue("previewDelay"), "300");
assert.equal(session.getDraftValue("favFilter"), "0");
assert.equal(getSettings().favFilter, 500);

assert.equal(session.save().ok, true);
assert.equal(getSettings().favFilter, 0);

session.setInput("favFilter", "10");
session.setInput("pageCount", "0");
assert.equal(session.save().ok, false);
assert.equal(getSettings().favFilter, 0);
assert.equal(getSettings().pageCount, 2);

session.restoreAll();
assert.equal(getSettings().favFilter, 0);
assert.equal(session.save().ok, true);
assert.equal(getSettings().favFilter, 500);
assert.equal(getSettings().version, "1.8.0");

session.setInput("favFilter", "42");
throwOnSettingsSet = true;
assert.equal(session.save().ok, false);
throwOnSettingsSet = false;
assert.equal(getSettings().favFilter, 500);
assert.equal(session.getDraftValue("favFilter"), "42");

// --- Task 1.5: 本地标签单次拦截、重复切换不重复计数、在途响应停用保护、数据保留 ---
addLocalTag("miku", "初音");
addLocalTag("pending-tag", "待定");
flushLocalTagState();

// 初始关闭：启用拦截不写入统计；随后开启再拦截一次也不重复包装 fetch
assert.equal(saveUserSettings({ enableLocalTags: false }).ok, true);
interceptTagSearchRequests();
interceptTagSearchRequests();

await (g.unsafeWindow as { fetch: (u: string) => Promise<unknown> }).fetch(
  "/ajax/search/top/miku"
);
await Promise.resolve();
assert.equal(fetchCallCount, 1);
assert.equal(getLocalTag("miku")?.lastTotal, undefined);

assert.equal(saveUserSettings({ enableLocalTags: true }).ok, true);
await (g.unsafeWindow as { fetch: (u: string) => Promise<unknown> }).fetch(
  "/ajax/search/top/miku"
);
await new Promise((r) => setTimeout(r, 0));
assert.equal(getLocalTag("miku")?.lastTotal, 777);

// 连续启停同一路径不重复增加 visits
assert.equal(syncLocalTagVisitForPath("/tags/miku/artworks"), true);
assert.equal(syncLocalTagVisitForPath("/tags/miku/artworks"), false);
assert.equal(syncLocalTagVisitForPath("/tags/miku/artworks"), false);
assert.equal(getLocalTag("miku")?.visits, 1);
resetLocalTagVisitTrackingOnPath("/tags/other/artworks");
assert.equal(syncLocalTagVisitForPath("/tags/miku/artworks"), true);
assert.equal(getLocalTag("miku")?.visits, 2);

// 在途搜索响应发起后停用本地标签，响应返回不写统计且保留已有标签数据
const pendingFetch = (
  g.unsafeWindow as { fetch: (u: string) => Promise<unknown> }
).fetch("/ajax/search/top/pending-tag");
assert.equal(saveUserSettings({ enableLocalTags: false }).ok, true);
flushLocalTagState();
resolvePendingFetch!({
  ok: true,
  clone() {
    return {
      json: async () => ({
        error: false,
        body: { illustManga: { total: 999 } },
      }),
    };
  },
});
await pendingFetch;
await new Promise((r) => setTimeout(r, 0));
assert.equal(getLocalTag("pending-tag")?.lastTotal, undefined);
const persistedTags = gmStore.get(LOCAL_TAGS_KEY) as {
  tags: { tag: string; visits: number }[];
};
assert.equal(persistedTags.tags.length, 2);
assert.equal(persistedTags.tags[0].visits, 2);

// XHR 在途请求在停用后完成同样不写统计
assert.equal(saveUserSettings({ enableLocalTags: true }).ok, true);
const xhr = new FakeXMLHttpRequest();
(xhr.open as (method: string, url: string) => void)(
  "GET",
  "/ajax/search/top/pending-tag"
);
xhr.send();
xhr.response = { error: false, body: { illustManga: { total: 888 } } };
assert.equal(saveUserSettings({ enableLocalTags: false }).ok, true);
xhr.emitLoad();
assert.equal(getLocalTag("pending-tag")?.lastTotal, undefined);

// --- Task 1.6: 单监听跨标签页合并、同字段最后保存生效、全部恢复后远程编辑再保存 ---
const settingsKey = "PIXIV_PREVIEWER_L_SETTINGS";
assert.equal(gmListeners.get(settingsKey)?.length, 1);

const emitRemoteSettings = (remoteObj: Record<string, unknown>) => {
  const prev = gmStore.get(settingsKey);
  gmStore.set(settingsKey, structuredClone(remoteObj));
  for (const cb of gmListeners.get(settingsKey) ?? []) {
    cb(settingsKey, prev, structuredClone(remoteObj), true);
  }
};

// 场景 A：A 修改 previewDelay 未保存，B 保存 favFilter=888，A 保存后不覆盖 B 的 favFilter
const tabASession = createSettingsDraftSession(getSettings());
const unsubPanelSync = subscribeSettings((next, _prev, source) => {
  if (source === "remote") tabASession.applyRemoteUpdate(next);
});
tabASession.setInput("previewDelay", "150");
emitRemoteSettings({ ...getSettings(), favFilter: 888 });
assert.equal(getSettings().favFilter, 888);
assert.equal(tabASession.getDraftValue("favFilter"), "888");
assert.equal(tabASession.getDraftValue("previewDelay"), "150");
assert.equal(tabASession.save().ok, true);
assert.equal(getSettings().favFilter, 888);
assert.equal(getSettings().previewDelay, 150);

// 场景 B：同字段最后一次成功保存生效
tabASession.setInput("favFilter", "123");
emitRemoteSettings({ ...getSettings(), favFilter: 777 });
assert.equal(tabASession.getDraftValue("favFilter"), "123");
assert.equal(tabASession.save().ok, true);
assert.equal(getSettings().favFilter, 123);

// 场景 C：A 全部恢复默认未保存，B 远程修改 favFilter 与内部 version，A 再保存应恢复全部默认值并保留新 version
tabASession.restoreAll();
emitRemoteSettings({ ...getSettings(), favFilter: 999, version: "1.9.0" });
assert.equal(tabASession.getDraftValue("favFilter"), "500");
assert.equal(tabASession.save().ok, true);
assert.equal(getSettings().favFilter, 500);
assert.equal(getSettings().previewDelay, 300);
assert.equal(getSettings().version, "1.9.0");
unsubPanelSync();

// --- Task 2.1 - 2.3: 常用区 18 个字段、允许 0 延迟与旧计时取消 ---
assert.equal(SETTING_FIELDS.filter((f) => f.section === "common").length, 18);
const zeroDelaySession = createSettingsDraftSession(getSettings());
zeroDelaySession.setInput("previewDelay", "0");
zeroDelaySession.setInput("previewLoadingOverlayDelayMs", "0");
zeroDelaySession.setInput("previewDownloadNoticeMs", "0");
zeroDelaySession.setInput("localTagPopoverShowDelayMs", "0");
zeroDelaySession.setInput("localTagPopoverHideDelayMs", "0");
assert.equal(zeroDelaySession.save().ok, true);
assert.equal(getSettings().previewDelay, 0);
assert.equal(getSettings().previewLoadingOverlayDelayMs, 0);
assert.equal(getSettings().previewDownloadNoticeMs, 0);
assert.equal(getSettings().localTagPopoverShowDelayMs, 0);
assert.equal(getSettings().localTagPopoverHideDelayMs, 0);
// 非零正有限字段 previewHoldMs 不允许 0
zeroDelaySession.setInput("previewHoldMs", "0");
assert.equal(zeroDelaySession.save().ok, false);
assert.equal(getSettings().previewHoldMs, 300);

// 更改预览延迟时取消旧的待触发计时，后续调度读取新延迟
assert.equal(saveUserSettings({ previewDelay: 200 }).ok, true);
const firedWith: number[] = [];
const debouncedHover = debounce(
  (v: number) => firedWith.push(v),
  () => getSettings().previewDelay / 5
);
debouncedHover(1);
assert.equal(debouncedHover.isPending(), true);
debouncedHover.cancel();
assert.equal(debouncedHover.isPending(), false);
assert.equal(saveUserSettings({ previewDelay: 0 }).ok, true);
debouncedHover(2);
await new Promise((r) => setTimeout(r, 60));
assert.deepEqual(firedWith, [2]);

// --- Task 3.1: 16 个高级缓存字段、单位换算与隐藏字段恢复 ---
assert.equal(SETTING_FIELDS.filter((f) => f.group === "cache").length, 16);
const cacheDraft = createSettingsDraftSession(getSettings());
cacheDraft.setInput("ugoiraCacheMaxBytes", "0");
const errZeroUgoiraBytes = cacheDraft.save();
assert.equal(errZeroUgoiraBytes.ok, false);
if (!errZeroUgoiraBytes.ok) {
  assert.equal(errZeroUgoiraBytes.errors[0].message, "必须大于 0");
}
cacheDraft.setInput("ugoiraCacheMaxBytes", "32");
cacheDraft.setInput("illustrationStaticCacheTtlMs", "15");
cacheDraft.setInput("tagTranslationCacheMaxEntries", "1"); // 至少 2 条
assert.equal(cacheDraft.save().ok, false);
cacheDraft.setInput("tagTranslationCacheMaxEntries", "1200");
assert.equal(cacheDraft.save().ok, true);
assert.equal(getSettings().ugoiraCacheMaxBytes, 32 * 1024 * 1024);
assert.equal(getSettings().illustrationStaticCacheTtlMs, 15 * 86400000);
assert.equal(getSettings().tagTranslationCacheMaxEntries, 1200);
cacheDraft.restoreAll();
assert.equal(cacheDraft.save().ok, true);
assert.equal(getSettings().ugoiraCacheMaxBytes, 64 * 1024 * 1024);

// --- Task 3.3 & 3.4: LRU 容量收缩、派生容量计算与配置变更触发持久化清理 ---
const lru = createLRUCache<number>(5);
for (let i = 1; i <= 5; i += 1) lru.set(`k${i}`, i);
assert.equal(lru.size(), 5);
lru.setMaxSize(3);
assert.equal(lru.size(), 3);
assert.equal(lru.get("k1"), undefined);
assert.equal(lru.get("k2"), undefined);
assert.equal(lru.get("k3"), 3);

// 预加载数量改为 3、翻译容量改为 1200 的派生计算与无独立派生字段
assert.equal(
  SETTING_FIELDS.some(
    (f) =>
      f.key.toLowerCase().includes("decoded") ||
      f.key.toLowerCase().includes("evict")
  ),
  false
);
assert.equal(saveUserSettings({ tagTranslationCacheMaxEntries: 5 }).ok, true);
for (let i = 0; i < 6; i += 1) {
  cacheTagTranslation(`t${i}`, `译${i}`);
}
const afterEvict = gmStore.get(LOCAL_TAG_TRANSLATIONS_KEY) as {
  translations: Record<string, unknown>;
};
// 上限 5，超出后按 Math.floor(5 / 2) = 2 淘汰保留
assert.equal(Object.keys(afterEvict.translations).length, 2);

// 启动单次清理之后，缩小翻译容量再调用 scheduleCachePrune 不被 hasPruned 阻止
await pruneCachesOnStartup();
assert.equal(saveUserSettings({ tagTranslationCacheMaxEntries: 10 }).ok, true);
for (let i = 10; i < 16; i += 1) {
  cacheTagTranslation(`t${i}`, `译${i}`);
}
assert.equal(saveUserSettings({ tagTranslationCacheMaxEntries: 4 }).ok, true);
await scheduleCachePrune();
const afterShrinkPrune = gmStore.get(LOCAL_TAG_TRANSLATIONS_KEY) as {
  translations: Record<string, unknown>;
};
assert.equal(Object.keys(afterShrinkPrune.translations).length, 2);

// --- Task 4.1 - 4.3: 下载关系校验、单一心跳重设与收紧失联边界 ---
const dlDraft = createSettingsDraftSession(getSettings());
dlDraft.setInput("downloadProgressPersistMs", "20");
dlDraft.setInput("downloadHeartbeatMs", "15");
const errProgress = dlDraft.save();
assert.equal(errProgress.ok, false);
if (!errProgress.ok) {
  assert.equal(errProgress.errors[0].key, "downloadProgressPersistMs");
}

dlDraft.setInput("downloadProgressPersistMs", "1");
dlDraft.setInput("downloadHeartbeatMs", "180");
dlDraft.setInput("downloadOwnerTimeoutMs", "180");
const errTimeout = dlDraft.save();
assert.equal(errTimeout.ok, false);
if (!errTimeout.ok) {
  assert.equal(errTimeout.errors[0].key, "downloadOwnerTimeoutMs");
}
dlDraft.restoreAll();
assert.equal(dlDraft.save().ok, true);
assert.equal(getSettings().completedDownloadsMaxEntries, 200);
assert.equal(getSettings().downloadOwnerTimeoutMs, 180000);

const realDateNow = Date.now;
const realSetInterval = globalThis.setInterval;
const realClearInterval = globalThis.clearInterval;
let fakeNow = 1_000_000;
let nextTimerId = 1;
const activeIntervals = new Map<number, { fn: () => void; ms: number }>();

try {
  Date.now = () => fakeNow;
  (g as { setInterval: unknown }).setInterval = (
    fn: () => void,
    ms: number
  ) => {
    const id = nextTimerId++;
    activeIntervals.set(id, { fn, ms });
    return id;
  };
  (g as { clearInterval: unknown }).clearInterval = (id: number) => {
    activeIntervals.delete(id);
  };

  const remoteUpdatedAt = fakeNow - 50_000;
  gmStore.set("pp-downloads", [
    {
      id: "dl-keep-alive",
      url: "https://i.pximg.net/img-original/1.png",
      filename: "1_p0.png",
      status: "downloading",
      loaded: 100,
      total: 1000,
      createdAt: remoteUpdatedAt,
      owner: "tab-b",
      updatedAt: remoteUpdatedAt,
    },
    {
      id: "dl-stale",
      url: "https://i.pximg.net/img-original/2.png",
      filename: "2_p0.png",
      status: "downloading",
      loaded: 100,
      total: 1000,
      createdAt: remoteUpdatedAt - 1,
      owner: "tab-c",
      updatedAt: remoteUpdatedAt,
    },
    {
      id: "dl-done-1",
      url: "https://i.pximg.net/img-original/3.png",
      filename: "3_p0.png",
      status: "completed",
      loaded: 500,
      total: 500,
      createdAt: 100,
      completedAt: 200,
    },
    {
      id: "dl-done-2",
      url: "https://i.pximg.net/img-original/4.png",
      filename: "4_p0.png",
      status: "completed",
      loaded: 500,
      total: 500,
      createdAt: 200,
      completedAt: 300,
    },
  ]);

  assert.equal(
    getDownloads().filter((r) => r.status === "downloading").length,
    2
  );
  assert.equal(activeIntervals.size, 1);

  // 收紧心跳为 5 秒、失联判定为 20 秒，并缩小已完成记录上限为 1
  assert.equal(
    saveUserSettings({
      downloadHeartbeatMs: 5000,
      downloadOwnerTimeoutMs: 20000,
      completedDownloadsMaxEntries: 1,
    }).ok,
    true
  );
  // 重设单一心跳循环，不产生重复循环
  assert.equal(activeIntervals.size, 1);
  assert.equal([...activeIntervals.values()][0].ms, 5000);

  // T+10s（距旧心跳 60s <= 原 180s）：不得立即误判旧心跳失联
  fakeNow += 10_000;
  [...activeIntervals.values()][0].fn();
  assert.equal(
    getDownloads().find((r) => r.id === "dl-keep-alive")?.status,
    "downloading"
  );
  assert.equal(
    getDownloads().find((r) => r.id === "dl-stale")?.status,
    "downloading"
  );

  // dl-keep-alive 发出一次新心跳，随后 25s 无心跳 -> 应按新 20s 超时判失联；dl-stale 仍沿用 180s
  const currentList = gmStore.get("pp-downloads") as Record<string, unknown>[];
  const updatedList = currentList.map((r) =>
    r.id === "dl-keep-alive" ? { ...r, updatedAt: fakeNow } : r
  );
  gmStore.set("pp-downloads", updatedList);
  for (const cb of gmListeners.get("pp-downloads") ?? []) {
    cb("pp-downloads", currentList, updatedList, true);
  }
  fakeNow += 25_000;
  [...activeIntervals.values()][0].fn();
  assert.equal(
    getDownloads().find((r) => r.id === "dl-keep-alive")?.status,
    "interrupted"
  );
  assert.equal(
    getDownloads().find((r) => r.id === "dl-stale")?.status,
    "downloading"
  );

  // dl-stale 始终无新心跳，超过原 180s 边界后也必须失联，不无限保活
  fakeNow = remoteUpdatedAt + 180_001;
  [...activeIntervals.values()][0].fn();
  assert.equal(
    getDownloads().find((r) => r.id === "dl-stale")?.status,
    "interrupted"
  );

  // 后续写入新下载时按 completedDownloadsMaxEntries=1 淘汰最早的已完成记录，且保留活动下载
  downloadFile("https://i.pximg.net/img-original/5.png", "5_p0.png");
  const afterTrim = getDownloads();
  assert.equal(afterTrim.filter((r) => r.status === "completed").length, 1);
  assert.equal(
    afterTrim.find((r) => r.status === "completed")?.id,
    "dl-done-2"
  );
  assert.equal(
    afterTrim.some((r) => r.status === "downloading"),
    true
  );
} finally {
  for (const id of [...activeIntervals.keys()]) activeIntervals.delete(id);
  Date.now = realDateNow;
  (g as { setInterval: unknown }).setInterval = realSetInterval;
  (g as { clearInterval: unknown }).clearInterval = realClearInterval;
}

// --- Task 5.1 - 5.4 / 6.1: 52 个用户字段与清单一致性、网络边界、请求尝试次数与调度零延迟 ---
assert.equal(SETTING_FIELDS.length, 52);
assert.equal(USER_SETTING_KEYS.length, 52);
assert.deepEqual(
  new Set(Object.keys(g_defaultSettings)),
  new Set([...USER_SETTING_KEYS, "version"])
);
for (const key of USER_SETTING_KEYS) {
  assert.equal(SETTING_FIELD_MAP[key].key, key);
}

const netDraft = createSettingsDraftSession(getSettings());
netDraft.setInput("requestRetryIntervalMs", "0.5");
assert.equal(netDraft.save().ok, false);
netDraft.setInput("requestRetryIntervalMs", "1");
netDraft.setInput("requestMaxAttempts", "0");
assert.equal(netDraft.save().ok, false);
netDraft.setInput("requestMaxAttempts", "");
netDraft.setInput("ugoiraChunkBytes", "65535");
assert.equal(netDraft.save().ok, false);
netDraft.setInput("ugoiraChunkBytes", "65536");
netDraft.setInput("ugoiraTrailerBytes", "21");
assert.equal(netDraft.save().ok, false);
netDraft.setInput("ugoiraTrailerBytes", "22");
netDraft.setInput("localTagRenderDebounceMs", "0");
netDraft.setInput("localTagPersistDelayMs", "0");
assert.equal(netDraft.save().ok, true);
assert.equal(getSettings().requestMaxAttempts, null);
assert.equal(getSettings().ugoiraChunkBytes, 65536);
assert.equal(getSettings().ugoiraTrailerBytes, 22);
assert.equal(getSettings().localTagRenderDebounceMs, 0);
assert.equal(getSettings().localTagPersistDelayMs, 0);

// requestMaxAttempts = 1 时失败只请求 1 次且不等待/不调用 onRetry
assert.equal(saveUserSettings({ requestMaxAttempts: 1 }).ok, true);
let xhrAttemptCount = 0;
let onRetryCalled = 0;
const origGmXhr = (g.window as { GM: { xmlHttpRequest: unknown } }).GM
  .xmlHttpRequest;
(g.window as { GM: { xmlHttpRequest: unknown } }).GM.xmlHttpRequest =
  async () => {
    xhrAttemptCount += 1;
    return { status: 500, responseText: "boom", response: { error: true } };
  };
try {
  await assert.rejects(
    requestWithRetry({
      url: "/ajax/test",
      onRetry: () => {
        onRetryCalled += 1;
      },
    })
  );
  assert.equal(xhrAttemptCount, 1);
  assert.equal(onRetryCalled, 0);
} finally {
  (g.window as { GM: { xmlHttpRequest: unknown } }).GM.xmlHttpRequest =
    origGmXhr;
}

// 后续新开始的重试等待使用当前 requestRetryIntervalMs（测试中拦截 pause 的 setTimeout 时长）
assert.equal(
  saveUserSettings({ requestMaxAttempts: null, requestRetryIntervalMs: 1000 })
    .ok,
  true
);
const retryDelays: number[] = [];
const realSetTimeout = globalThis.setTimeout;
let retryCount = 0;
(g as { setTimeout: unknown }).setTimeout = (fn: () => void, ms?: number) => {
  if (ms === 1000 || ms === 2500) {
    retryDelays.push(ms);
    return realSetTimeout(fn, 0);
  }
  return realSetTimeout(fn, ms);
};
(g.window as { GM: { xmlHttpRequest: unknown } }).GM.xmlHttpRequest =
  async () => {
    retryCount += 1;
    if (retryCount === 1) {
      return { status: 500, responseText: "err1", response: { error: true } };
    }
    if (retryCount === 2) {
      saveUserSettings({ requestRetryIntervalMs: 2500 });
      return { status: 500, responseText: "err2", response: { error: true } };
    }
    return { status: 200, response: { error: false, body: { ok: true } } };
  };
try {
  await requestWithRetry({ url: "/ajax/test-retry" });
  assert.deepEqual(retryDelays, [1000, 2500]);
} finally {
  (g as { setTimeout: unknown }).setTimeout = realSetTimeout;
  (g.window as { GM: { xmlHttpRequest: unknown } }).GM.xmlHttpRequest =
    origGmXhr;
}

// 修改 localTagPersistDelayMs 时待保存标签数据不丢失
assert.equal(saveUserSettings({ localTagPersistDelayMs: 5000 }).ok, true);
addLocalTag("delayed-save-tag", "延迟保存测试");
assert.equal(saveUserSettings({ localTagPersistDelayMs: 0 }).ok, true);
const persistedAfterDelayChange = gmStore.get(LOCAL_TAGS_KEY) as {
  tags: { tag: string }[];
};
assert.equal(
  persistedAfterDelayChange.tags.some((t) => t.tag === "delayed-save-tag"),
  true
);

// --- 修改状态跟踪、恢复到修改前与关闭前未保存判断 ---
assert.equal(saveUserSettings({ favFilter: 250 }).ok, true);
const dirtySession = createSettingsDraftSession(getSettings());
assert.equal(dirtySession.hasModifiedFields(), false);
assert.equal(dirtySession.isFieldModified("favFilter"), false);
assert.equal(dirtySession.isFieldDefault("favFilter"), false);
assert.equal(dirtySession.isFieldDefault("previewDelay"), true);

// 修改或恢复默认使数值偏离基线时标记为已修改，点击恢复到修改前还原为基线且清除修改标记
dirtySession.setInput("favFilter", "100");
assert.equal(dirtySession.isFieldModified("favFilter"), true);
assert.equal(dirtySession.isFieldDefault("favFilter"), false);
assert.equal(dirtySession.hasModifiedFields(), true);
assert.equal(dirtySession.revertField("favFilter"), "250");
assert.equal(dirtySession.isFieldModified("favFilter"), false);
assert.equal(dirtySession.isFieldDefault("favFilter"), false);
assert.equal(dirtySession.hasModifiedFields(), false);
assert.equal(dirtySession.getEditedKeys().has("favFilter"), false);

dirtySession.restoreField("favFilter");
assert.equal(dirtySession.getDraftValue("favFilter"), "500");
assert.equal(dirtySession.isFieldModified("favFilter"), true);
assert.equal(dirtySession.isFieldDefault("favFilter"), true);
assert.equal(dirtySession.hasModifiedFields(), true);
assert.equal(dirtySession.save().ok, true);
assert.equal(dirtySession.hasModifiedFields(), false);
assert.equal(dirtySession.isFieldDefault("favFilter"), true);

console.log(
  "Regression checks (1.2, 1.5, 1.6, 2.3, 3.1-3.4, 4.1-4.3, 5.1-5.4, UI draft state) passed."
);
