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
import { hideFavorites } from "./features/hide-favorites";
import { loadIllustPreview } from "./features/preview";
import { loadIllustSort } from "./features/sort";
import Texts from "./i18n";
import { GlobalSettings } from "./types";
import { DoLog, iLog } from "./utils/logger";
import {
  getSettings,
  resetSettings,
  setSettingStringValue,
  setSettingValue,
  toggleSettingBooleanValue,
} from "./utils/setting";

// 添加收藏需要这个
let g_csrfToken = "";
// 当前页面类型
let g_pageType: PageType;
// 设置
let g_settings: GlobalSettings;

//#region 页面
const Pages: Record<
  PageType,
  {
    PageTypeString: string;
    CheckUrl: (url: string) => boolean;
    GetToolBar: () => HTMLElement;
  }
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
    GetToolBar: getToolbar,
  },
  [PageType.BookMarkNew]: {
    PageTypeString: "BookMarkNewPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/bookmark_new_illust(_r18)?.php.*/.test(
        url
      );
    },
    GetToolBar: getToolbar,
  },
  [PageType.Discovery]: {
    PageTypeString: "DiscoveryPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/discovery.*/.test(url);
    },
    GetToolBar: getToolbar,
  },
  [PageType.Member]: {
    PageTypeString: "MemberPage/MemberIllustPage/MemberBookMark",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/users\/\d+/.test(url);
    },
    GetToolBar: getToolbar,
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
    GetToolBar: getToolbar,
  },
  [PageType.Ranking]: {
    PageTypeString: "RankingPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/ranking.php.*/.test(url);
    },
    GetToolBar: getToolbar,
  },
  [PageType.NewIllust]: {
    PageTypeString: "NewIllustPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/new_illust.php.*/.test(url);
    },
    GetToolBar: getToolbar,
  },
  [PageType.R18]: {
    PageTypeString: "R18Page",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/cate_r18.php.*/.test(url);
    },
    GetToolBar: getToolbar,
  },
  [PageType.Stacc]: {
    PageTypeString: "StaccPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/stacc.*/.test(url);
    },
    GetToolBar: function () {
      return getToolbarOld();
    },
  },
  [PageType.Artwork]: {
    PageTypeString: "ArtworkPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/artworks\/.*/.test(url);
    },
    GetToolBar: getToolbar,
  },
  [PageType.NovelSearch]: {
    PageTypeString: "NovelSearchPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/tags\/.*\/novels/.test(url);
    },
    GetToolBar: getToolbar,
  },
  [PageType.SearchTop]: {
    PageTypeString: "SearchTopPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/tags\/[^/*]/.test(url);
    },
    GetToolBar: getToolbar,
  },
};

function getToolbar() {
  const toolbar = $(`#${TOOLBAR_ID}`);
  if (toolbar.length > 0) {
    return toolbar.get(0);
  }
  $("body").append(
    `<div id="${TOOLBAR_ID}" style="position: fixed; right: 28px; bottom: 96px;"></div>`
  );
  return $(`#${TOOLBAR_ID}`).get(0);
}

function getToolbarOld() {
  return $("._toolmenu").get(0);
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
      span.parentNode.replaceChild(container, span);
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
  bg.get(0).innerHTML =
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

//#region 主函数
const initializePixivPreviewer = () => {
  try {
    // 注册设置菜单
    g_settings = registerSettingsMenu();
    iLog.i(
      "Start to initialize Pixiv Previewer with global settings:",
      g_settings
    );

    // 显示更新信息窗口
    if (g_settings.version !== g_version) {
      ShowUpgradeMessage();
    }

    // 初始化作品预览功能
    if (g_settings.enablePreview) {
      loadIllustPreview(g_settings);
    }

    // 初始化作品排序功能
    $.get(location.href, function (data) {
      const matched = data.match(/token\\":\\"([a-z0-9]{32})/);
      if (matched.length > 0) {
        g_csrfToken = matched[1];
        DoLog(LogLevel.Info, "Got g_csrfToken: " + g_csrfToken);

        loadIllustSort({ ...g_settings, csrfToken: g_csrfToken });
      } else {
        DoLog(
          LogLevel.Error,
          "Can not get g_csrfToken, sort function is disabled."
        );
      }
    });

    // 匹配当前页面
    for (let i = 0; i < Object.keys(Pages).length; i++) {
      if (Pages[i].CheckUrl(location.href)) {
        g_pageType = i;
        break;
      }
    }

    if (g_pageType !== undefined) {
      DoLog(
        LogLevel.Info,
        "Current page is " + Pages[g_pageType].PageTypeString
      );
    } else {
      DoLog(LogLevel.Info, "Unsupported page.");
      return;
    }

    if (g_pageType === PageType.Member) {
      showSearchLinksForDeletedArtworks();
    } else if (g_pageType === PageType.Artwork) {
      // 用户来到作品详情页时，可能会对当前作品进行收藏等操作，因此主动使当前作品的缓存失效
      const artworkId =
        window.location.pathname.match(/\/artworks\/(\d+)/)?.[1];
      if (artworkId) {
        setTimeout(() => {
          deleteCachedIllustrationDetails([artworkId]);
        });
      }
    }

    //#region 初始化工具栏按钮
    // 获取工具栏按钮
    const toolBar = Pages[g_pageType].GetToolBar();
    if (toolBar) {
      DoLog(LogLevel.Elements, toolBar);
    } else {
      DoLog(LogLevel.Warning, "Get toolbar failed.");
      return;
    }

    // 添加排序按钮
    if (!$(`#${SORT_BUTTON_ID}`).length) {
      const newListItem = document.createElement("div");
      newListItem.title = "Sort artworks";
      newListItem.innerHTML = "";
      const newButton = document.createElement("button");
      newButton.id = SORT_BUTTON_ID;
      newButton.style.cssText =
        "box-sizing: border-box; background-color: rgba(0,0,0,0.32); color: #fff; margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 0px; border-radius: 24px; width: 48px; height: 48px; font-size: 12px; font-weight: bold;";
      newButton.innerHTML = Texts.label_sort;
      newListItem.appendChild(newButton);
      toolBar.appendChild(newListItem);

      $(newButton).on("click", () => {
        const sortEvent = new Event(SORT_EVENT_NAME);
        window.dispatchEvent(sortEvent);
      });
    }

    // 添加前往下一页按钮
    if (!$(`#${SORT_NEXT_PAGE_BUTTON_ID}`).length) {
      const newListItem = document.createElement("div");
      newListItem.title = "Jump to next page";
      newListItem.innerHTML = "";
      const newButton = document.createElement("button");
      newButton.id = SORT_NEXT_PAGE_BUTTON_ID;
      newButton.style.cssText =
        "box-sizing: border-box; background-color: rgba(0,0,0,0.32); color: #fff; margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 0px; border-radius: 24px; width: 48px; height: 48px; font-size: 12px; font-weight: bold;";
      newButton.innerHTML = Texts.label_nextPage;
      newListItem.appendChild(newButton);
      toolBar.appendChild(newListItem);

      $(newButton).on("click", () => {
        const sortEvent = new Event(SORT_NEXT_PAGE_EVENT_NAME);
        window.dispatchEvent(sortEvent);
      });
    }
    //#endregion

    // 添加过滤已收藏作品按钮
    if (!$(`#${HIDE_FAVORITES_BUTTON_ID}`).length) {
      const newListItem = document.createElement("div");
      newListItem.title = "Hide favorite illustrations";
      newListItem.innerHTML = "";
      const newButton = document.createElement("button");
      newButton.id = HIDE_FAVORITES_BUTTON_ID;
      newButton.style.cssText =
        "box-sizing: border-box; background-color: rgba(0,0,0,0.32); color: #fff; margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 0px; border-radius: 24px; width: 48px; height: 48px; font-size: 12px; font-weight: bold;";
      newButton.innerHTML = Texts.label_hideFav;
      newListItem.appendChild(newButton);
      toolBar.appendChild(newListItem);

      $(newButton).on("click", () => {
        hideFavorites();
      });
    }
    //#endregion
  } catch (e) {
    DoLog(LogLevel.Error, "An error occurred while initializing:", e);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(initializePixivPreviewer, 1000);
});
//#endregion
