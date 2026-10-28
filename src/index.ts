import {
  g_defaultSettings,
  g_version,
  HIDE_FAVORITES_BUTTON_ID,
  SORT_BUTTON_ID,
  SORT_EVENT_NAME,
  SORT_NEXT_PAGE_BUTTON_ID,
  SORT_NEXT_PAGE_EVENT_NAME,
  TOOLBAR_ID,
} from "./constants";
import { deleteCachedIllustrationDetails } from "./databases";
import { IllustSortOrder, LogLevel, PageType } from "./enums";
import { loadDownloadPanel } from "./features/downloads";
import { hideFavorites } from "./features/hide-favorites";
import {
  interceptTagSearchRequests,
  loadLocalTags,
} from "./features/local-tags";
import { loadIllustPreview } from "./features/preview";
import { loadIllustSort } from "./features/sort";
import Texts from "./i18n";
import hideFavoritesIcon from "./icons/hide-favorites.svg";
import nextPageIcon from "./icons/next-page.svg";
import sortIcon from "./icons/sort.svg";
import {
  clearAllLocalCaches,
  formatCacheBytes,
  getCacheUsage,
  pruneCachesOnStartup,
  warmUpCacheDatabase,
} from "./services/cache";
import type { GlobalSettings } from "./types";
import { onDomReady, waitFor } from "./utils/dom";
import { DoLog, iLog } from "./utils/logger";
import {
  getSettings,
  resetSettings,
  setSettingStringValue,
  setSettingValue,
  toggleSettingBooleanValue,
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
let menuIds: number[] = [];

const registerSettingsMenu = () => {
  const settings = getSettings();

  for (const menuId of menuIds) {
    GM_unregisterMenuCommand(menuId);
  }
  menuIds = [];

  menuIds.push(
    GM_registerMenuCommand(
      `🖼️ 插画作品预览 ${settings.enablePreview ? "✅" : "❌"}`,
      () => {
        toggleSettingBooleanValue("enablePreview");
        registerSettingsMenu();
      }
    ),
    GM_registerMenuCommand(
      `🎦 动图作品预览 ${settings.enableAnimePreview ? "✅" : "❌"}`,
      () => {
        toggleSettingBooleanValue("enableAnimePreview");
        registerSettingsMenu();
      }
    ),
    GM_registerMenuCommand(
      `🕗 延迟 ${settings.previewDelay} 毫秒显示预览图`,
      () => {
        setSettingStringValue("previewDelay", "延迟显示预览图时间（毫秒）", {
          parseValue: (newValue) =>
            Number(newValue) || g_defaultSettings.previewDelay,
          onSet: () => registerSettingsMenu(),
        });
      }
    ),
    GM_registerMenuCommand(
      `🏷️ 本地标签管理 ${settings.enableLocalTags ? "✅" : "❌"}`,
      () => {
        toggleSettingBooleanValue("enableLocalTags");
        location.reload();
      }
    ),
    GM_registerMenuCommand(`📚️ 每次排序 ${settings.pageCount} 页`, () => {
      setSettingStringValue("pageCount", "每次排序的页数", {
        parseValue: (newValue) =>
          Number(newValue) || g_defaultSettings.pageCount,
        onSet: () => registerSettingsMenu(),
      });
    }),
    GM_registerMenuCommand(
      `👨‍👩‍👧 排序隐藏收藏数少于 ${settings.favFilter} 的作品`,
      () => {
        setSettingStringValue("favFilter", "排序隐藏少于设定收藏数的作品", {
          parseValue: (newValue) =>
            Number(newValue) || g_defaultSettings.favFilter,
          onSet: () => registerSettingsMenu(),
        });
      }
    ),
    GM_registerMenuCommand(
      `🎨 按照 ${settings.orderType === IllustSortOrder.BY_BOOKMARK_COUNT ? "作品收藏数" : "作品发布时间"} 排序作品`,
      () => {
        setSettingValue(
          "orderType",
          settings.orderType === IllustSortOrder.BY_BOOKMARK_COUNT
            ? IllustSortOrder.BY_DATE
            : IllustSortOrder.BY_BOOKMARK_COUNT
        );
        registerSettingsMenu();
      }
    ),
    GM_registerMenuCommand(
      `🤖 排序过滤 AI 生成作品 ${settings.aiFilter ? "✅" : "❌"}`,
      () => {
        toggleSettingBooleanValue("aiFilter");
        registerSettingsMenu();
      }
    ),
    GM_registerMenuCommand(
      `🦾 排序过滤 AI 辅助（加笔）作品 ${settings.aiAssistedFilter ? "✅" : "❌"}`,
      () => {
        toggleSettingBooleanValue("aiAssistedFilter");
        registerSettingsMenu();
      }
    ),
    GM_registerMenuCommand(
      `❤️ 排序过滤已收藏作品 ${settings.hideFavorite ? "✅" : "❌"}`,
      () => {
        toggleSettingBooleanValue("hideFavorite");
        registerSettingsMenu();
      }
    ),
    GM_registerMenuCommand(
      `🔖 排序过滤包含指定标签的作品 ${settings.hideByTag ? "✅" : "❌"}`,
      () => {
        toggleSettingBooleanValue("hideByTag");
        registerSettingsMenu();
      }
    ),
    GM_registerMenuCommand(
      `🔖 排序过滤的标签：${settings.hideByTagList}`,
      () => {
        setSettingStringValue(
          "hideByTagList",
          "过滤的标签列表，使用`,`分隔不同标签",
          {
            onSet: () => registerSettingsMenu(),
          }
        );
      }
    ),
    GM_registerMenuCommand(
      `📑 在新标签页打开作品 ${settings.linkBlank ? "✅" : "❌"}`,
      () => {
        toggleSettingBooleanValue("linkBlank");
        registerSettingsMenu();
      }
    ),
    GM_registerMenuCommand(`🔁 重置设置`, () => {
      if (confirm("您确定要重置所有设置到脚本的默认值吗？")) {
        resetSettings();
        location.reload();
      }
    }),
    GM_registerMenuCommand(`🧹 ${Texts.setting_clearFollowingCache}`, () => {
      if (
        !confirm(`${Texts.setting_clearFollowingCacheHelp}\n\n确定要清除吗？`)
      )
        return;
      void clearAllLocalCaches().then((cleared) => {
        if (!cleared) {
          // 清空失败时不能提示成功并刷新，否则用户会以为缓存已被清除
          alert(Texts.setting_clearCacheFailed);
          return;
        }
        alert(Texts.setting_followingCacheCleared);
        location.reload();
      });
    }),
    GM_registerMenuCommand(`📊 ${Texts.cache_usage}`, () => {
      void getCacheUsage().then((usage) => {
        alert(
          Texts.cache_usageHelp
            .replace("%1", String(usage.illustrationDetails))
            .replace("%2", String(usage.illustPages))
            .replace("%3", String(usage.ugoiraFrames))
            .replace("%4", formatCacheBytes(usage.ugoiraBytes))
            .replace("%5", String(usage.tagTranslations))
        );
      });
    })
  );

  return settings;
};

const ShowUpgradeMessage = () => {
  $("#pp-bg").remove();

  const bg = $('<div id="pp-bg"></div>').css({
    position: "fixed",
    "z-index": 9999,
    "background-color": "rgba(0, 0, 0, 0.8)",
    inset: "0px",
  });
  $("body").append(bg);
  bg.get(0)!.innerHTML =
    '<img id="pps-close" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Close.png"style="position: absolute; right: 35px; top: 20px; width: 32px; height: 32px; cursor: pointer;"><div style="position: absolute; width: 40%; left: 30%; top: 25%; font-size: 25px; font-weight: bold; text-align: center; color: white;">' +
    Texts.install_title +
    g_version +
    '</div><br><div style="position: absolute; left: 50%; top: 35%; font-size: 20px; color: white; transform: translate(-50%,0); height: 50%; overflow: auto;">' +
    Texts.upgrade_body +
    "</div>";

  $("#pps-close").on("click", () => {
    setSettingValue("version", g_version);
    $("#pp-bg").remove();
  });
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

const mountToolbar = (toolBar: HTMLElement) => {
  DoLog(LogLevel.Elements, toolBar);

  appendToolbarButton(toolBar, {
    id: SORT_BUTTON_ID,
    title: "排序作品",
    icon: sortIcon,
    onClick: () => window.dispatchEvent(new Event(SORT_EVENT_NAME)),
  });
  appendToolbarButton(toolBar, {
    id: SORT_NEXT_PAGE_BUTTON_ID,
    title: "前往下一页",
    icon: nextPageIcon,
    onClick: () => window.dispatchEvent(new Event(SORT_NEXT_PAGE_EVENT_NAME)),
  });
  appendToolbarButton(toolBar, {
    id: HIDE_FAVORITES_BUTTON_ID,
    title: "隐藏已收藏作品",
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
    g_settings = registerSettingsMenu();
    iLog.i(
      "Start to initialize Pixiv Previewer with global settings:",
      g_settings
    );

    // 清理过期的持久化缓存。提前打开数据库，后续读取缓存时无需再等待连接
    warmUpCacheDatabase();
    void pruneCachesOnStartup();

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

    // 初始化作品预览功能。仅绑定事件委托，悬停时才创建预览容器
    if (g_settings.enablePreview) {
      loadIllustPreview(g_settings);
    }

    // 初始化作品排序功能。按钮稍后创建，事件监听先就位，避免点击无响应
    loadIllustSort(g_settings);
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

    if (g_settings.enableLocalTags) {
      loadLocalTags();
    }

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
      waitFor(page.FindToolBar, mountToolbar, {
        interval: 200,
        maxAttempts: 25,
        onGiveUp: () => DoLog(LogLevel.Warning, "Get toolbar failed."),
      });
    }
  } catch (e) {
    DoLog(LogLevel.Error, "An error occurred while initializing:", e);
  }
};

// 必须在 `document-start` 劫持页面自身的标签搜索请求，否则会漏掉最早的一批请求
if (getSettings().enableLocalTags) interceptTagSearchRequests();

// 预览、排序、缓存清理与页面识别不依赖 DOM，尽早启动
initializeEarly();

onDomReady(initializeDom);
//#endregion
