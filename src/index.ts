import {
  g_version,
  HIDE_FAVORITES_BUTTON_ID,
  SORT_BUTTON_ID,
  SORT_EVENT_NAME,
  SORT_NEXT_PAGE_BUTTON_ID,
  SORT_NEXT_PAGE_EVENT_NAME,
  TOOLBAR_ID,
  UPGRADE_STYLE_ID,
} from "./constants";
import { deleteCachedIllustrationDetails } from "./databases";
import { LogLevel, PageType } from "./enums";
import { loadDownloadPanel } from "./features/downloads";
import { hideFavorites } from "./features/hide-favorites";
import {
  interceptTagSearchRequests,
  loadLocalTags,
  unloadLocalTags,
} from "./features/local-tags";
import { loadIllustPreview } from "./features/preview";
import { openSettingsPanel } from "./features/settings-panel";
import { loadIllustSort } from "./features/sort";
import Texts, { formatText, setLocale } from "./i18n";
import hideFavoritesIcon from "./icons/hide-favorites.svg";
import nextPageIcon from "./icons/next-page.svg";
import sortIcon from "./icons/sort.svg";
import {
  clearAllLocalCaches,
  formatCacheBytes,
  getCacheUsage,
  pruneCachesOnStartup,
  scheduleCachePrune,
  warmUpCacheDatabase,
} from "./services/cache";
import type { GlobalSettings } from "./types";
import { injectStyle, onDomReady, waitFor } from "./utils/dom";
import { DoLog, iLog } from "./utils/logger";
import {
  getSettings,
  subscribeSettings,
  updateInternalVersion,
} from "./utils/setting";

// 当前页面类型
let g_pageType: PageType | undefined;
// 设置
let g_settings: GlobalSettings;

//#region 页面
/**
 * 工具栏来源：脚本自建，或复用页面自带的工具栏。
 * 用联合类型表达，避免出现「两者都没有」这种无法处理的页面配置。
 */
type PageToolBarSource =
  | {
      /** 创建（或复用）脚本自有的工具栏，不依赖页面渲染 */
      CreateToolBar: () => HTMLElement;
    }
  | {
      /** 页面自带工具栏（如动态页），必须等它渲染出来 */
      FindToolBar: () => HTMLElement | null;
    };

const Pages: Record<
  PageType,
  {
    PageTypeString: string;
    CheckUrl: (url: string) => boolean;
  } & PageToolBarSource
> = {
  [PageType.Search]: {
    PageTypeString: "SearchPage",
    CheckUrl: function (url) {
      // 没有 /artworks 的页面不支持
      return (
        /^https?:\/\/www.pixiv.net(\/en)?\/tags\/.+\/(artworks|illustrations|manga)/.test(
          url
        ) || /^https?:\/\/www.pixiv.net(\/en)?\/search/.test(url)
      );
    },
    CreateToolBar: createToolbar,
  },
  [PageType.BookMarkNew]: {
    PageTypeString: "BookMarkNewPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/bookmark_new_illust(_r18)?.php.*/.test(
        url
      );
    },
    CreateToolBar: createToolbar,
  },
  [PageType.Discovery]: {
    PageTypeString: "DiscoveryPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/discovery.*/.test(url);
    },
    CreateToolBar: createToolbar,
  },
  [PageType.Member]: {
    PageTypeString: "MemberPage/MemberIllustPage/MemberBookMark",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/users\/\d+/.test(url);
    },
    CreateToolBar: createToolbar,
  },
  [PageType.Home]: {
    PageTypeString: "HomePage",
    CheckUrl: function (url) {
      return (
        /https?:\/\/www.pixiv.net(\/en)?\/?$/.test(url) ||
        /https?:\/\/www.pixiv.net(\/en)?\/illustration\/?$/.test(url) ||
        /https?:\/\/www.pixiv.net(\/en)?\/manga\/?$/.test(url) ||
        /https?:\/\/www.pixiv.net(\/en)?\/cate_r18\.php$/.test(url)
      );
    },
    CreateToolBar: createToolbar,
  },
  [PageType.Ranking]: {
    PageTypeString: "RankingPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/ranking.php.*/.test(url);
    },
    CreateToolBar: createToolbar,
  },
  [PageType.NewIllust]: {
    PageTypeString: "NewIllustPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/new_illust.php.*/.test(url);
    },
    CreateToolBar: createToolbar,
  },
  [PageType.R18]: {
    PageTypeString: "R18Page",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/cate_r18.php.*/.test(url);
    },
    CreateToolBar: createToolbar,
  },
  [PageType.Stacc]: {
    PageTypeString: "StaccPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/stacc.*/.test(url);
    },
    // 动态页复用页面自带工具栏，只能等它渲染
    FindToolBar: findToolbarOld,
  },
  [PageType.Artwork]: {
    PageTypeString: "ArtworkPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/artworks\/.*/.test(url);
    },
    CreateToolBar: createToolbar,
  },
  [PageType.NovelSearch]: {
    PageTypeString: "NovelSearchPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/tags\/.*\/novels/.test(url);
    },
    CreateToolBar: createToolbar,
  },
  [PageType.SearchTop]: {
    PageTypeString: "SearchTopPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/tags\/[^/*]/.test(url);
    },
    CreateToolBar: createToolbar,
  },
};

function findToolbar() {
  return $(`#${TOOLBAR_ID}`).get(0) ?? null;
}

function createToolbar() {
  const toolbar = findToolbar();
  if (toolbar) return toolbar;
  $("body").append(
    `<div id="${TOOLBAR_ID}" style="position: fixed; right: 28px; bottom: 96px;"></div>`
  );
  return findToolbar()!;
}

function findToolbarOld() {
  return $("._toolmenu").get(0) ?? null;
}

// Replaces deleted artwork indicators with search engine links.
function showSearchLinksForDeletedArtworks() {
  // Array of search engines.
  const searchEngines = [
    { name: "Google", url: "https://www.google.com/search?q=" },
    { name: "Bing", url: "https://www.bing.com/search?q=" },
    { name: "Baidu", url: "https://www.baidu.com/s?wd=" },
  ];
  // Find all <span> elements with a "to" attribute.
  const spans = document.querySelectorAll("span[to]");
  spans.forEach((span) => {
    const artworkPath = span.getAttribute("to");
    // Check if the span indicates that it is a deleted artwork
    if (
      span.textContent.trim() === "-----" &&
      artworkPath !== null &&
      artworkPath.startsWith("/artworks/")
    ) {
      // Extract ID from artworkPath by slicing off "/artworks/".
      const keyword = `pixiv "${artworkPath.slice(10)}"`;
      // Create a container element to hold the links.
      const container = document.createElement("span");
      container.className = span.className;
      // For each search engine, create an <a> element and append it to the container.
      searchEngines.forEach((engine, i) => {
        const link = document.createElement("a");
        link.href = engine.url + encodeURIComponent(keyword);
        link.textContent = engine.name; // Display the search engine's name.
        link.target = "_blank"; // Open in a new tab.
        container.appendChild(link);
        // Append a separator between links, except after the last one.
        if (i < searchEngines.length - 1) {
          container.appendChild(document.createTextNode(" | "));
        }
      });
      // Replace the original <span> with the container holding the links.
      if (span.parentNode) {
        span.parentNode.replaceChild(container, span);
      }
    }
  });
}
//#endregion

//#region 设置
const registerSettingsMenu = () => {
  GM_registerMenuCommand(`⚙️ ${Texts.settings_title}`, () => {
    openSettingsPanel();
  });
  GM_registerMenuCommand(`🧹 ${Texts.setting_clearFollowingCache}`, () => {
    if (!confirm(Texts.setting_clearFollowingCacheHelp)) return;
    void clearAllLocalCaches().then((cleared) => {
      if (!cleared) {
        // 清空失败时不能提示成功并刷新，否则用户会以为缓存已被清除
        alert(Texts.setting_clearCacheFailed);
        return;
      }
      alert(Texts.setting_followingCacheCleared);
      location.reload();
    });
  });
  GM_registerMenuCommand(`📊 ${Texts.cache_usage}`, () => {
    void getCacheUsage().then((usage) => {
      alert(
        formatText(
          Texts.cache_usageHelp,
          usage.illustrationDetails,
          usage.illustPages,
          usage.ugoiraFrames,
          formatCacheBytes(usage.ugoiraBytes),
          usage.tagTranslations
        )
      );
    });
  });
};

const ShowUpgradeMessage = () => {
  const panelId = "pp-upgrade-panel";
  const headingId = "pp-upgrade-heading";
  $(`#${panelId}`).remove();

  injectStyle(
    `
      #${panelId} {
        --pp-upgrade-bg: #fff;
        --pp-upgrade-fg: #222;
        --pp-upgrade-border: #ddd;
        --pp-upgrade-action: #006eb8;
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 100001;
        display: flex;
        flex-direction: column;
        width: min(420px, calc(100vw - 24px));
        max-height: min(480px, calc(100vh - 24px));
        box-sizing: border-box;
        border: 1px solid var(--pp-upgrade-border);
        border-radius: 12px;
        background: var(--pp-upgrade-bg);
        color: var(--pp-upgrade-fg);
        box-shadow: 0 12px 36px rgba(0, 0, 0, .24);
        font: 14px/1.6 sans-serif;
      }
      #${panelId} *, #${panelId} *::before, #${panelId} *::after {
        box-sizing: border-box;
      }
      #${panelId} header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--pp-upgrade-border);
        flex-shrink: 0;
      }
      #${panelId} h2 {
        margin: 0;
        font-size: 16px;
        line-height: 1.4;
        color: inherit;
      }
      #${panelId} .pp-upgrade-body {
        padding: 12px 16px;
        overflow-y: auto;
        overscroll-behavior: contain;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      #${panelId} p {
        margin: 0;
      }
      #${panelId} a {
        color: var(--pp-upgrade-action);
        text-decoration: none;
      }
      #${panelId} a:hover {
        text-decoration: underline;
      }
      #${panelId} button {
        border: 1px solid var(--pp-upgrade-border);
        border-radius: 6px;
        padding: 4px 8px;
        background: var(--pp-upgrade-bg);
        color: var(--pp-upgrade-fg);
        cursor: pointer;
        font: 13px/1.45 sans-serif;
        white-space: nowrap;
        flex-shrink: 0;
      }
      #${panelId} button:hover {
        border-color: var(--pp-upgrade-action);
      }
      #${panelId} button:focus-visible,
      #${panelId} a:focus-visible {
        outline: 2px solid var(--pp-upgrade-action);
        outline-offset: 2px;
      }
      @media (prefers-color-scheme: dark) {
        #${panelId} {
          --pp-upgrade-bg: #222;
          --pp-upgrade-fg: #eee;
          --pp-upgrade-border: #444;
          --pp-upgrade-action: #4ea8de;
        }
      }
    `,
    UPGRADE_STYLE_ID
  );

  const close = () => {
    updateInternalVersion(g_version);
    panel.remove();
  };

  const closeButton = $("<button>")
    .attr({
      type: "button",
      "aria-label": Texts.close,
    })
    .text(Texts.close)
    .on("click", close);

  const link = (url: string, label: string) =>
    `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  const body = formatText(
    Texts.upgrade_body,
    link(
      "https://greasyfork.org/scripts/30766-pixiv-previewer",
      "Pixiv Previewer"
    ),
    link(
      "https://greasyfork.org/scripts/30766-pixiv-previewer/feedback",
      Texts.upgrade_feedback
    ),
    link(
      "https://github.com/Ocrosoft/PixivPreviewer/issues",
      Texts.upgrade_issue
    ),
    link(
      "https://greasyfork.org/scripts/533844-pixiv-previewer-l/versions",
      Texts.upgrade_versions
    )
  );
  const panel = $("<div>")
    .attr({
      id: panelId,
      role: "dialog",
      "aria-modal": "false",
      "aria-labelledby": headingId,
    })
    .append(
      $("<header>").append(
        $("<h2>")
          .attr("id", headingId)
          .text(formatText(Texts.install_title, g_version)),
        closeButton
      ),
      $("<div>").addClass("pp-upgrade-body").html(body)
    )
    .on("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    })
    .appendTo("body");
};
//#endregion

//#region 工具栏
/** 向工具栏追加按钮。按钮可能已由上一次初始化创建，因此先确认其不存在 */
const appendToolbarButton = (
  toolBar: HTMLElement,
  {
    id,
    title,
    icon,
    onClick,
  }: {
    id: string;
    title: string;
    icon: string;
    onClick: () => void;
  }
) => {
  if ($(`#${id}`).length) return;

  const newListItem = document.createElement("div");
  newListItem.title = title;
  const newButton = document.createElement("button");
  newButton.id = id;
  newButton.className = "pp-toolbar-button";
  newButton.type = "button";
  newButton.title = title;
  newButton.setAttribute("aria-label", title);
  newButton.innerHTML = icon;
  newButton.querySelector("svg")?.setAttribute("aria-hidden", "true");
  newListItem.appendChild(newButton);

  $(newButton).on("click", onClick);
  toolBar.appendChild(newListItem);
};

const setToolbarButtonTitle = (id: string, title: string) => {
  const button = $(`#${id}`);
  if (!button.length) return;
  button.attr({ title, "aria-label": title });
  button.parent().attr("title", title);
};

const mountToolbar = (toolBar: HTMLElement) => {
  DoLog(LogLevel.Elements, toolBar);

  appendToolbarButton(toolBar, {
    id: SORT_BUTTON_ID,
    title: Texts.label_sort,
    icon: sortIcon,
    onClick: () => window.dispatchEvent(new Event(SORT_EVENT_NAME)),
  });
  appendToolbarButton(toolBar, {
    id: SORT_NEXT_PAGE_BUTTON_ID,
    title: Texts.label_nextPage,
    icon: nextPageIcon,
    onClick: () => window.dispatchEvent(new Event(SORT_NEXT_PAGE_EVENT_NAME)),
  });
  appendToolbarButton(toolBar, {
    id: HIDE_FAVORITES_BUTTON_ID,
    title: Texts.label_hideFav,
    icon: hideFavoritesIcon,
    onClick: hideFavorites,
  });

  loadDownloadPanel(toolBar);
};
//#endregion

//#region 主函数

/** 匹配当前页面类型。仅依赖 URL，可在 `document-start` 执行 */
const matchPageType = () => {
  for (const key of Object.keys(Pages)) {
    const pageType = Number(key) as PageType;
    if (Pages[pageType].CheckUrl(location.href)) return pageType;
  }
  return undefined;
};

/**
 * 初始化不依赖 DOM 的功能。
 * 在 `document-start` 执行，避免页面渲染期间功能尚不可用。
 */
const initializeEarly = () => {
  try {
    g_settings = getSettings();
    iLog.i(
      "Start to initialize Pixiv Previewer with global settings:",
      g_settings
    );

    // 清理过期的持久化缓存。提前打开数据库，后续读取缓存时无需再等待连接
    warmUpCacheDatabase();
    void pruneCachesOnStartup();
    subscribeSettings((next, prev, source) => {
      if (source !== "local") return;
      if (
        next.illustrationCacheMaxEntries < prev.illustrationCacheMaxEntries ||
        next.illustPagesCacheMaxEntries < prev.illustPagesCacheMaxEntries ||
        next.ugoiraCacheMaxEntries < prev.ugoiraCacheMaxEntries ||
        next.ugoiraCacheMaxBytes < prev.ugoiraCacheMaxBytes ||
        next.tagTranslationCacheMaxEntries <
          prev.tagTranslationCacheMaxEntries ||
        next.illustrationStaticCacheTtlMs < prev.illustrationStaticCacheTtlMs ||
        next.illustPagesCacheTtlMs < prev.illustPagesCacheTtlMs ||
        next.ugoiraCacheTtlMs < prev.ugoiraCacheTtlMs ||
        next.tagTranslationCacheTtlMs < prev.tagTranslationCacheTtlMs
      ) {
        void scheduleCachePrune();
      }
    });

    g_pageType = matchPageType();
    if (g_pageType === undefined) {
      DoLog(LogLevel.Info, "Unsupported page.");
    } else {
      DoLog(
        LogLevel.Info,
        "Current page is " + Pages[g_pageType].PageTypeString
      );

      if (g_pageType === PageType.Artwork) {
        // 用户来到作品详情页时，可能会对当前作品进行收藏等操作，因此主动使当前作品的缓存失效
        const artworkId = location.pathname.match(/\/artworks\/(\d+)/)?.[1];
        if (artworkId) {
          void deleteCachedIllustrationDetails([artworkId]);
        }
      }
    }

    // 初始化作品预览功能。仅绑定一次事件委托，内部按当前配置决定是否触发
    loadIllustPreview();

    // 初始化作品排序功能。按钮稍后创建，事件监听先就位，避免点击无响应
    loadIllustSort();
  } catch (e) {
    DoLog(LogLevel.Error, "An error occurred while initializing:", e);
  }
};

/**
 * 初始化需要 DOM 的功能。
 * `body` 就绪后即可执行，无需等待页面内容渲染完成。
 */
const initializeDom = () => {
  try {
    // 设置读取失败时 `initializeEarly` 已记录错误，此处不再重复执行
    if (!g_settings) return;

    // document-start 执行时 <html lang> 可能还未就绪。
    setLocale(getSettings().language);
    registerSettingsMenu();

    if (getSettings().enableLocalTags) {
      loadLocalTags();
    }
    subscribeSettings((next, prev) => {
      if (next.language !== prev.language) {
        if ($(`#${SORT_BUTTON_ID}`).attr("aria-busy") === "true") {
          setToolbarButtonTitle(SORT_BUTTON_ID, Texts.label_sorting);
        } else {
          setToolbarButtonTitle(SORT_BUTTON_ID, Texts.label_sort);
        }
        setToolbarButtonTitle(SORT_NEXT_PAGE_BUTTON_ID, Texts.label_nextPage);
        setToolbarButtonTitle(HIDE_FAVORITES_BUTTON_ID, Texts.label_hideFav);
        if (next.enableLocalTags) {
          unloadLocalTags();
          loadLocalTags();
        }
      }
      if (next.enableLocalTags === prev.enableLocalTags) return;
      if (next.enableLocalTags) {
        loadLocalTags();
      } else {
        unloadLocalTags();
      }
    });

    // 显示更新信息窗口
    if (g_settings.version !== g_version) {
      ShowUpgradeMessage();
    }

    if (g_pageType === undefined) return;

    if (g_pageType === PageType.Member) {
      // Pixiv 是 SPA，探测窗口内可能已跳转到其它页面；
      // 复核页面类型，避免把搜索结果链接处理逻辑套用到新页面
      waitFor(
        () =>
          matchPageType() === PageType.Member &&
          document.querySelector("span[to]"),
        () => showSearchLinksForDeletedArtworks()
      );
    }

    // 工具栏只需要挂载一次；页面自带工具栏的页面（如动态页）需等其渲染
    const page = Pages[g_pageType];
    if ("CreateToolBar" in page) {
      mountToolbar(page.CreateToolBar());
    } else {
      const { toolbarProbeIntervalMs, toolbarProbeMaxAttempts } = getSettings();
      waitFor(page.FindToolBar, mountToolbar, {
        interval: toolbarProbeIntervalMs,
        maxAttempts: toolbarProbeMaxAttempts,
        onGiveUp: () => DoLog(LogLevel.Warning, "Get toolbar failed."),
      });
    }
  } catch (e) {
    DoLog(LogLevel.Error, "An error occurred while initializing:", e);
  }
};

// 必须在 `document-start` 劫持页面自身的标签搜索请求（仅安装一次，按当前开关决定是否统计）
interceptTagSearchRequests();

// 预览、排序、缓存清理与页面识别不依赖 DOM，尽早启动
initializeEarly();

onDomReady(initializeDom);
//#endregion
