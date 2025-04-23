import { g_defaultSettings, g_version, SORT_EVENT_NAME } from "./constants";
import { IllustSortOrder, LogLevel, PageType } from "./enums";
import { loadIllustPreview } from "./features/preview";
import { loadIllustSort } from "./features/sort";
import Texts from "./i18n";
import { GlobalSettings } from "./types";
import { DoLog, iLog } from "./utils/logger";

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
      return /^https?:\/\/www.pixiv.net(\/en)?\/tags\/.+\/(artworks|illustrations|manga)/.test(
        url
      );
    },
    GetToolBar: function () {
      return findToolbarCommon();
    },
  },
  [PageType.BookMarkNew]: {
    PageTypeString: "BookMarkNewPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/bookmark_new_illust(_r18)?.php.*/.test(
        url
      );
    },
    GetToolBar: function () {
      return findToolbarCommon();
    },
  },
  [PageType.Discovery]: {
    PageTypeString: "DiscoveryPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/discovery.*/.test(url);
    },
    GetToolBar: function () {
      return findToolbarCommon();
    },
  },
  [PageType.Member]: {
    PageTypeString: "MemberPage/MemberIllustPage/MemberBookMark",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/users\/\d+/.test(url);
    },
    GetToolBar: function () {
      return findToolbarCommon();
    },
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
    GetToolBar: function () {
      return findToolbarCommon();
    },
  },
  [PageType.Ranking]: {
    PageTypeString: "RankingPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/ranking.php.*/.test(url);
    },
    GetToolBar: function () {
      return findToolbarOld();
    },
  },
  [PageType.NewIllust]: {
    PageTypeString: "NewIllustPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/new_illust.php.*/.test(url);
    },
    GetToolBar: function () {
      return findToolbarCommon();
    },
  },
  [PageType.R18]: {
    PageTypeString: "R18Page",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/cate_r18.php.*/.test(url);
    },
    GetToolBar: function () {
      return findToolbarCommon();
    },
  },
  [PageType.BookMark]: {
    PageTypeString: "BookMarkPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/bookmark.php\/?$/.test(url);
    },
    GetToolBar: function () {
      return findToolbarOld();
    },
  },
  [PageType.Stacc]: {
    PageTypeString: "StaccPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/stacc.*/.test(url);
    },
    GetToolBar: function () {
      return findToolbarOld();
    },
  },
  [PageType.Artwork]: {
    PageTypeString: "ArtworkPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/artworks\/.*/.test(url);
    },
    GetToolBar: function () {
      return findToolbarCommon();
    },
  },
  [PageType.NovelSearch]: {
    PageTypeString: "NovelSearchPage",
    CheckUrl: function (url) {
      return /^https:\/\/www.pixiv.net(\/en)?\/tags\/.*\/novels/.test(url);
    },
    GetToolBar: function () {
      return findToolbarCommon();
    },
  },
  [PageType.SearchTop]: {
    PageTypeString: "SearchTopPage",
    CheckUrl: function (url) {
      return /^https?:\/\/www.pixiv.net(\/en)?\/tags\/[^/*]/.test(url);
    },
    GetToolBar: function () {
      return findToolbarCommon();
    },
  },
};

function findToolbarCommon() {
  const rootToolbar = $("#root").find("ul:last").get(0);
  if (rootToolbar) return rootToolbar;
  const nextToolbar = $("#__next").find("ul:last").get(0);
  return nextToolbar;
}

function findToolbarOld() {
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
function SetLocalStorage(name, value) {
  localStorage.setItem(name, JSON.stringify(value));
}

function GetLocalStorage(name) {
  const value = localStorage.getItem(name);
  if (!value) return null;
  return value;
}

function ShowUpgradeMessage() {
  $("#pp-bg").remove();
  const bg = $('<div id="pp-bg"></div>').css({
    width: document.documentElement.clientWidth + "px",
    height: document.documentElement.clientHeight + "px",
    position: "fixed",
    "z-index": 999999,
    "background-color": "rgba(0,0,0,0.8)",
    left: "0px",
    top: "0px",
  });
  $("body").append(bg);

  const body = Texts.upgrade_body;
  bg.get(0).innerHTML =
    '<img id="pps-close"src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Close.png"style="position: absolute; right: 35px; top: 20px; width: 32px; height: 32px; cursor: pointer;"><div style="position: absolute; width: 40%; left: 30%; top: 25%; font-size: 25px; font-weight: bold; text-align: center; color: white;">' +
    Texts.install_title +
    g_version +
    '</div><br><div style="position: absolute; left: 50%; top: 35%; font-size: 20px; color: white; transform: translate(-50%,0); height: 50%; overflow: auto;">' +
    body +
    "</div>";
  $("#pps-close").click(function () {
    $("#pp-bg").remove();
  });
}

function FillNewSetting(st) {
  // 升级可能会有部分新加字段在cookie里读不到
  let changed = false;
  $.each(g_defaultSettings, function (k) {
    if (st[k] == undefined) {
      st[k] = g_defaultSettings[k];
      changed = true;
    }
  });
  return {
    st: st,
    change: changed,
  };
}

function GetSettings() {
  let settings: GlobalSettings;

  const settingsData = GetLocalStorage("PixivPreview");
  if (settingsData == null || settingsData == "null") {
    // 新安装
    settings = g_defaultSettings;
    SetLocalStorage("PixivPreview", settings);
    ShowUpgradeMessage();
  } else {
    settings = JSON.parse(settingsData);
    const mp = FillNewSetting(settings);
    if (mp.change) {
      settings = mp.st;
      SetLocalStorage("PixivPreview", settings);
    }
    // 升级
    if (settings.version != g_version) {
      ShowUpgradeMessage();
      settings.version = g_version;
      SetLocalStorage("PixivPreview", settings);
    }
  }

  return settings;
}

function ShowSetting() {
  const screenWidth = document.documentElement.clientWidth;
  const screenHeight = document.documentElement.clientHeight;

  $("#pp-bg").remove();
  const bg = $('<div id="pp-bg"></div>').css({
    width: screenWidth + "px",
    height: screenHeight + "px",
    position: "fixed",
    "z-index": 999999,
    "background-color": "rgba(0,0,0,0.8)",
    left: "0px",
    top: "0px",
  });
  $("body").append(bg);

  const settings = GetSettings();

  const settingHTML =
    '<div style="color: white; font-size: 1em;">' +
    '<img id="pps-close" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Close.png" style="position: absolute; right: 35px; top: 20px; width: 32px; height: 32px; cursor: pointer;">' +
    '<div style="position: absolute; height: 60%; left: 50%; top: 10%; overflow-y: auto; transform: translate(-50%, 0%);">' +
    '<ul id="pps-ul" style="list-style: none; padding: 0; margin: 0;"></ul></div>' +
    '<div style="margin-top: 10px;position: absolute;bottom: 10%;width: 100%;text-align: center;">' +
    '<button id="pps-save" style="font-size: 25px; border-radius: 12px; height: 48px; min-width: 138px; max-width: 150px; background-color: green; color: white; margin: 0 32px 0 32px; cursor: pointer; border: none;">' +
    Texts.setting_save +
    "</button>" +
    '<button id="pps-reset" style="font-size: 25px; border-radius: 12px; height: 48px; min-width: 138px; max-width: 150px; background-color: darkred; color: white; margin: 0 32px 0 32px; cursor: pointer; border: none;">' +
    Texts.setting_reset +
    "</button>" +
    "</div></div>";

  bg.get(0).innerHTML = settingHTML;
  const ul = $("#pps-ul");
  function getImageAction(id) {
    return (
      '<img id="' +
      id +
      '" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png" style="height: 32px; cursor: pointer; margin-right: 20px; vertical-align: middle;"/>'
    );
  }
  function getInputAction(id) {
    return (
      '<input id="' +
      id +
      '" style="font-size: 24px; padding: 0; margin-right: 16px; border-width: 0px; width: 64px; text-align: center;"/>'
    );
  }
  function addItem(action, text) {
    ul.append(
      '<li style="font-size: 25px; padding-bottom: 5px;">' +
        action +
        text +
        "</li>"
    );
  }
  ul.empty();
  addItem(getImageAction("pps-preview"), Texts.setting_preview);
  addItem(getImageAction("pps-animePreview"), Texts.setting_animePreview);
  addItem(getInputAction("pps-previewDelay"), Texts.setting_previewDelay);
  addItem("", "&nbsp");
  addItem(getInputAction("pps-maxPage"), Texts.setting_maxPage);
  addItem(getInputAction("pps-hideLess"), Texts.setting_hideWork);
  addItem(
    getImageAction("pps-orderByBookmark"),
    Texts.setting_sortOrderByBookmark
  );
  addItem(getImageAction("pps-hideAi"), Texts.setting_hideAiWork);
  addItem(
    getImageAction("pps-hideAiAssisted"),
    Texts.setting_hideAiAssistedWork
  );
  addItem(getImageAction("pps-hideBookmarked"), Texts.setting_hideFav);
  addItem(getImageAction("pps-hideByTag"), Texts.setting_hideByTag);
  addItem(
    '<input id="pps-hideByTagList" style="font-size: 18px;padding: 0;border-width: 0px;text-align: center;width: 95%;" placeholder="' +
      Texts.setting_hideByTagPlaceholder +
      '">',
    ""
  );
  addItem(getImageAction("pps-newTab"), Texts.setting_blank);

  const imgOn = "https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png";
  const imgOff = "https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Off.png";
  $("#pps-preview")
    .attr("src", settings.enablePreview ? imgOn : imgOff)
    .addClass(settings.enablePreview ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-animePreview")
    .attr("src", settings.enableAnimePreview ? imgOn : imgOff)
    .addClass(settings.enableAnimePreview ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-previewDelay").val(settings.previewDelay);
  $("#pps-maxPage").val(settings.pageCount);
  $("#pps-hideLess").val(settings.favFilter);
  $("#pps-orderByBookmark")
    .attr(
      "src",
      settings.orderType === IllustSortOrder.BY_BOOKMARK_COUNT ? imgOn : imgOff
    )
    .addClass(
      settings.orderType === IllustSortOrder.BY_BOOKMARK_COUNT ? "on" : "off"
    )
    .css("cursor: pointer");
  $("#pps-hideAi")
    .attr("src", settings.aiFilter ? imgOn : imgOff)
    .addClass(settings.aiFilter ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-hideAiAssisted")
    .attr("src", settings.aiAssistedFilter ? imgOn : imgOff)
    .addClass(settings.aiAssistedFilter ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-hideBookmarked")
    .attr("src", settings.hideFavorite ? imgOn : imgOff)
    .addClass(settings.hideFavorite ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-hideByTag")
    .attr("src", settings.hideByTag ? imgOn : imgOff)
    .addClass(settings.hideByTag ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-hideByTagList").val(settings.hideByTagList);
  $("#pps-newTab")
    .attr("src", settings.linkBlank ? imgOn : imgOff)
    .addClass(settings.linkBlank ? "on" : "off")
    .css("cursor: pointer");

  $("#pps-ul")
    .find("img")
    .click(function () {
      const _this = $(this);

      if (_this.hasClass("on")) {
        _this.attr("src", imgOff).removeClass("on").addClass("off");
      } else {
        _this.attr("src", imgOn).removeClass("off").addClass("on");
      }
    });

  $("#pps-save").click(function () {
    if ($("#pps-maxPage").val() === "") {
      $("#pps-maxPage").val(g_defaultSettings.pageCount);
    }
    if ($("#pps-hideLess").val() == "") {
      $("#pps-hideLess").val(g_defaultSettings.favFilter);
    }

    const settings: GlobalSettings = {
      enablePreview: $("#pps-preview").hasClass("on") ? 1 : 0,
      enableAnimePreview: $("#pps-animePreview").hasClass("on") ? 1 : 0,
      previewDelay: parseInt(String($("#pps-previewDelay").val())),

      pageCount: parseInt(String($("#pps-maxPage").val())),
      favFilter: parseInt(String($("#pps-hideLess").val())),
      orderType: $("#pps-orderByBookmark").hasClass("on")
        ? IllustSortOrder.BY_BOOKMARK_COUNT
        : IllustSortOrder.BY_DATE,
      aiFilter: $("#pps-hideAi").hasClass("on") ? 1 : 0,
      aiAssistedFilter: $("#pps-hideAiAssisted").hasClass("on") ? 1 : 0,
      hideFavorite: $("#pps-hideBookmarked").hasClass("on") ? 1 : 0,
      hideByTag: $("#pps-hideByTag").hasClass("on") ? 1 : 0,
      hideByTagList: String($("#pps-hideByTagList").val()),

      linkBlank: $("#pps-newTab").hasClass("on") ? 1 : 0,

      version: g_version,
    };

    SetLocalStorage("PixivPreview", settings);
    location.reload();
  });

  $("#pps-reset").click(function () {
    const comfirmText = Texts.setting_resetHint;
    if (confirm(comfirmText)) {
      SetLocalStorage("PixivPreview", null);
      location.reload();
    }
  });

  $("#pps-close").click(function () {
    $("#pp-bg").remove();
  });
}
//#endregion

//#region 主函数
const initializePixivPreviewer = () => {
  try {
    // 读取设置
    g_settings = GetSettings();
    iLog.i(
      "Start to initialize Pixiv Previewer with global settings:",
      g_settings
    );

    // 监听窗口大小变化
    window.onresize = function () {
      if ($("#pp-bg").length > 0) {
        const screenWidth = document.documentElement.clientWidth;
        const screenHeight = document.documentElement.clientHeight;
        $("#pp-bg").css({
          width: screenWidth + "px",
          height: screenHeight + "px",
        });
      }
    };

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

    // 设置按钮
    const toolBar = Pages[g_pageType].GetToolBar();
    if (toolBar) {
      DoLog(LogLevel.Elements, toolBar);
    } else {
      DoLog(LogLevel.Warning, "Get toolbar failed.");
      return;
    }

    // 添加排序按钮
    if (!$("#pp-sort").length) {
      const newListItem = toolBar.firstChild.cloneNode(true) as HTMLElement;
      newListItem.title = "Sort artworks";
      newListItem.innerHTML = "";
      const newButton = document.createElement("button");
      newButton.id = "pp-sort";
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

    // 添加设置按钮
    if (!$("#pp-settings").length) {
      const newListItem = toolBar.firstChild.cloneNode(true) as HTMLElement;
      newListItem.title = "Pixiv Previewer Settings";
      newListItem.innerHTML = "";
      const newButton = document.createElement("button");
      newButton.id = "pp-settings";
      newButton.style.cssText =
        "box-sizing: border-box; background-color: rgba(0,0,0,0.32); margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 12px; border-radius: 24px; width: 48px; height: 48px;";
      newButton.innerHTML =
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve" style="fill: white;"><metadata> Svg Vector Icons : http://www.sfont.cn </metadata><g><path d="M377.5,500c0,67.7,54.8,122.5,122.5,122.5S622.5,567.7,622.5,500S567.7,377.5,500,377.5S377.5,432.3,377.5,500z"></path><path d="M990,546v-94.8L856.2,411c-8.9-35.8-23-69.4-41.6-100.2L879,186L812,119L689,185.2c-30.8-18.5-64.4-32.6-100.2-41.5L545.9,10h-94.8L411,143.8c-35.8,8.9-69.5,23-100.2,41.5L186.1,121l-67,66.9L185.2,311c-18.6,30.8-32.6,64.4-41.5,100.3L10,454v94.8L143.8,589c8.9,35.8,23,69.4,41.6,100.2L121,814l67,67l123-66.2c30.8,18.6,64.5,32.6,100.3,41.5L454,990h94.8L589,856.2c35.8-8.9,69.4-23,100.2-41.6L814,879l67-67l-66.2-123.1c18.6-30.7,32.6-64.4,41.5-100.2L990,546z M500,745c-135.3,0-245-109.7-245-245c0-135.3,109.7-245,245-245s245,109.7,245,245C745,635.3,635.3,745,500,745z"></path></g></svg>';
      newListItem.appendChild(newButton);
      toolBar.appendChild(newListItem);

      $(newButton).on("click", () => {
        ShowSetting();
      });
    }

    if (g_pageType === PageType.Member) {
      showSearchLinksForDeletedArtworks();
    }
  } catch (e) {
    DoLog(LogLevel.Error, "An error occurred while initializing:", e);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(initializePixivPreviewer, 1000);
});
//#endregion
