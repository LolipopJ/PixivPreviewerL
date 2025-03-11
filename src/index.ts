import {
  g_defaultSettings,
  g_getNovelUrl,
  g_getUgoiraUrl,
  g_loadingImage,
  g_maxXhr,
  g_version,
} from "./constants";
import { Lang, LogLevel, PageType } from "./enums";
import { loadIllustPreview } from "./features/preview";
import Texts from "./i18n";
import { request } from "./services";
import { GlobalSettings } from "./types";
import { DoLog, iLog } from "./utils/logger";

// 语言
let g_language = Lang.zh_CN;
// 添加收藏需要这个
let g_csrfToken = "";
// 当前页面类型
let g_pageType = -1;
// 页面打开时的 url
let initialUrl = location.href;
// 设置
let g_settings;
// 排序是否完成（如果排序时页面出现了非刷新切换，强制刷新）
let g_sortComplete = true;

const Pages = {};

function findToolbarCommon() {
  const rootToolbar = $("#root").find("ul:last").get(0);
  if (rootToolbar) return rootToolbar;
  const nextToolbar = $("#__next").find("ul:last").get(0);
  return nextToolbar;
}
function findToolbarOld() {
  return $("._toolmenu").get(0);
}
function convertThumbUrlToSmall(thumbUrl) {
  // 目前发现有以下两种格式的缩略图
  // https://i.pximg.net/c/128x128/custom-thumb/img/2021/01/31/20/35/53/87426718_p0_custom1200.jpg
  // https://i.pximg.net/c/128x128/img-master/img/2021/01/31/10/57/06/87425082_p0_square1200.jpg
  const replace1 = "c/540x540_70/img-master";
  //let replace1 = 'img-master'; // 这个是转到regular的，比small的大多了，会很慢
  const replace2 = "_master";
  return thumbUrl
    .replace(/c\/.*\/custom-thumb/, replace1)
    .replace("_custom", replace2)
    .replace(/c\/.*\/img-master/, replace1)
    .replace("_square", replace2);
}

Pages[PageType.Search] = {
  PageTypeString: "SearchPage",
  CheckUrl: function (url) {
    // 没有 /artworks 的页面不支持
    return (
      /^https?:\/\/www.pixiv.net\/tags\/.*\/(artworks|illustrations|manga)/.test(
        url
      ) ||
      /^https?:\/\/www.pixiv.net\/en\/tags\/.*\/(artworks|illustrations|manga)/.test(
        url
      )
    );
  },
  GetToolBar: function () {
    return findToolbarCommon();
  },
  // 搜索页有 lazyload，不开排序的情况下，最后几张图片可能会无法预览。这里把它当做自动加载处理
  HasAutoLoad: true,
  GetImageListContainer: function () {
    return this.private.imageListConrainer;
  },
  GetFirstImageElement: function () {
    return $(this.private.imageListConrainer).find("li").get(0);
  },
  GetPageSelector: function () {
    const sections = $("section");
    if (sections.length === 0) {
      return null;
    }

    let resultSectionIndex = 0;
    $.each(sections, (i, e) => {
      if ($(e).find("aside").length === 0) {
        resultSectionIndex = i;
      }
    });

    const ul = $(sections[resultSectionIndex]).find("ul");
    return ul.next().get(0) ?? ul.parent().next().get(0);
  },
  private: {
    imageListContainer: null,
    pageSelector: null,
    returnMap: null,
  },
};
Pages[PageType.BookMarkNew] = {
  PageTypeString: "BookMarkNewPage",
  CheckUrl: function (url) {
    return (
      /^https:\/\/www.pixiv.net\/bookmark_new_illust.php.*/.test(url) ||
      /^https:\/\/www.pixiv.net\/bookmark_new_illust_r18.php.*/.test(url)
    );
  },
  GetToolBar: function () {
    return findToolbarCommon();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null,
  },
};
Pages[PageType.Discovery] = {
  PageTypeString: "DiscoveryPage",
  CheckUrl: function (url) {
    return /^https?:\/\/www.pixiv.net\/discovery.*/.test(url);
  },
  GetToolBar: function () {
    return findToolbarCommon();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null,
  },
};
Pages[PageType.Member] = {
  PageTypeString: "MemberPage/MemberIllustPage/MemberBookMark",
  CheckUrl: function (url) {
    return /^https?:\/\/www.pixiv.net\/(en\/)?users\/\d+/.test(url);
  },
  GetToolBar: function () {
    return findToolbarCommon();
  },
  // 跟搜索页一样的情况
  HasAutoLoad: true,
  private: {
    returnMap: null,
  },
};
Pages[PageType.Home] = {
  PageTypeString: "HomePage",
  CheckUrl: function (url) {
    return (
      /https?:\/\/www.pixiv.net\/?$/.test(url) ||
      /https?:\/\/www.pixiv.net\/en\/?$/.test(url) ||
      /https?:\/\/www.pixiv.net\/illustration\/?$/.test(url) ||
      /https?:\/\/www.pixiv.net\/manga\/?$/.test(url) ||
      /https?:\/\/www.pixiv.net\/cate_r18\.php$/.test(url) ||
      /https?:\/\/www.pixiv.net\/en\/cate_r18\.php$/.test(url)
    );
  },
  GetToolBar: function () {
    return findToolbarCommon();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null,
  },
};
Pages[PageType.Ranking] = {
  PageTypeString: "RankingPage",
  CheckUrl: function (url) {
    return /^https?:\/\/www.pixiv.net\/ranking.php.*/.test(url);
  },
  GetToolBar: function () {
    return findToolbarOld();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null,
  },
};
Pages[PageType.NewIllust] = {
  PageTypeString: "NewIllustPage",
  CheckUrl: function (url) {
    return /^https?:\/\/www.pixiv.net\/new_illust.php.*/.test(url);
  },
  GetToolBar: function () {
    return findToolbarCommon();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null,
  },
};
Pages[PageType.R18] = {
  PageTypeString: "R18Page",
  CheckUrl: function (url) {
    return /^https?:\/\/www.pixiv.net\/cate_r18.php.*/.test(url);
  },
  GetToolBar: function () {
    //
  },
  HasAutoLoad: false,
};
Pages[PageType.BookMark] = {
  PageTypeString: "BookMarkPage",
  CheckUrl: function (url) {
    return /^https:\/\/www.pixiv.net\/bookmark.php\/?$/.test(url);
  },
  GetToolBar: function () {
    return findToolbarOld();
  },
  HasAutoLoad: false,
  private: {
    returnMap: null,
  },
};
Pages[PageType.Stacc] = {
  PageTypeString: "StaccPage",
  CheckUrl: function (url) {
    return /^https:\/\/www.pixiv.net\/stacc.*/.test(url);
  },
  GetToolBar: function () {
    return findToolbarOld();
  },
  HasAutoLoad: true,
  private: {
    returnMap: null,
  },
};
Pages[PageType.Artwork] = {
  PageTypeString: "ArtworkPage",
  CheckUrl: function (url) {
    return (
      /^https:\/\/www.pixiv.net\/artworks\/.*/.test(url) ||
      /^https:\/\/www.pixiv.net\/en\/artworks\/.*/.test(url)
    );
  },
  GetToolBar: function () {
    return findToolbarCommon();
  },
  HasAutoLoad: true,
  Work: function () {
    function AddDownloadButton(button, offsetToOffsetTop) {
      if (!g_settings.enableAnimeDownload) {
        return;
      }

      const cloneButton = button.clone().css({
        bottom: "50px",
        padding: 0,
        width: "48px",
        height: "48px",
        opacity: "0.4",
        cursor: "pointer",
      });
      cloneButton.get(0).innerHTML =
        '<svg viewBox="0 0 120 120" style="width: 40px; height: 40px; stroke-width: 10; stroke-linecap: round; stroke-linejoin: round; border-radius: 24px; background-color: black; stroke: limegreen; fill: none;" class="_3Fo0Hjg"><polyline points="60,30 60,90"></polyline><polyline points="30,60 60,90 90,60"></polyline></svg></button>';

      function MoveButton() {
        function getOffset(e) {
          if (e.offsetParent) {
            const offset = getOffset(e.offsetParent);
            return {
              offsetTop: e.offsetTop + offset.offsetTop,
              offsetLeft: e.offsetLeft + offset.offsetLeft,
            };
          } else {
            return {
              offsetTop: e.offsetTop,
              offsetLeft: e.offsetLeft,
            };
          }
        }

        /*let offset = getOffset(button.get(0));
                DoLog(LogLevel.Info, 'offset of download button: ' + offset.offsetTop + ', ' + offset.offsetLeft);
                DoLog(LogLevel.Elements, offset);

                cloneButton.css({ 'position': 'absolute' }).show();*/
      }

      MoveButton();
      $(window).on("resize", MoveButton);
      button.after(cloneButton);

      cloneButton
        .mouseover(function () {
          $(this).css("opacity", "0.2");
        })
        .mouseleave(function () {
          $(this).css("opacity", "0.4");
        })
        .click(function () {
          let illustId = "";

          const matched = location.href.match(/artworks\/(\d+)/);
          if (matched) {
            illustId = matched[1];
            DoLog(LogLevel.Info, "IllustId=" + illustId);
          } else {
            DoLog(LogLevel.Error, "Can not found illust id!");
            return;
          }

          $.ajax(g_getUgoiraUrl.replace("#id#", illustId), {
            method: "GET",
            success: function (json) {
              DoLog(LogLevel.Elements, json);

              if (json.error == true) {
                DoLog(
                  LogLevel.Error,
                  "Server response an error: " + json.message
                );
                return;
              }

              // 因为浏览器会拦截不同域的 open 操作，绕一下
              const newWindow = window.open("_blank");
              newWindow.location = json.body.originalSrc;
            },
            error: function () {
              DoLog(LogLevel.Error, "Request zip file failed!");
            },
          });
        });
    }

    if (this.private.needProcess) {
      const canvas = $(".pp-canvas");
      // 普通模式，只需要添加下载按钮到内嵌模式的 div 里
      const div = $('div[role="presentation"]:last');
      const button = div.find("button");

      const headerRealHeight =
        parseInt($("header").css("height")) +
        parseInt($("header").css("padding-top")) +
        parseInt($("header").css("padding-bottom")) +
        parseInt($("header").css("margin-top")) +
        parseInt($("header").css("margin-bottom")) +
        parseInt($("header").css("border-bottom-width")) +
        parseInt($("header").css("border-top-width"));

      AddDownloadButton(button, headerRealHeight);
    }
  },
  private: {
    needProcess: false,
    returnMap: null,
  },
};
Pages[PageType.NovelSearch] = {
  PageTypeString: "NovelSearchPage",
  CheckUrl: function (url) {
    return (
      /^https:\/\/www.pixiv.net\/tags\/.*\/novels/.test(url) ||
      /^https:\/\/www.pixiv.net\/en\/tags\/.*\/novels/.test(url)
    );
  },
  GetToolBar: function () {
    return findToolbarCommon();
  },
  GetPageSelector: function () {
    return $("section:first").find("nav:first");
  },
  HasAutoLoad: false,
  private: {
    returnMap: null,
  },
};
Pages[PageType.SearchTop] = {
  PageTypeString: "SearchTopPage",
  CheckUrl: function (url) {
    return /^https?:\/\/www.pixiv.net(\/en)?\/tags\/[^/*]/.test(url);
  },
  GetToolBar: function () {
    return findToolbarCommon();
  },
  // 搜索页有 lazyload，不开排序的情况下，最后几张图片可能会无法预览。这里把它当做自动加载处理
  HasAutoLoad: false,
  GetImageListContainer: function () {
    return this.private.imageListConrainer;
  },
  GetFirstImageElement: function () {
    return $(this.private.imageListConrainer).find("li").get(0);
  },
  GetPageSelector: function () {
    const sections = $("section");
    if (sections.length == 0) {
      return null;
    }

    let resultSectionIndex = 0;
    $.each(sections, (i, e) => {
      if ($(e).find("aside").length === 0) {
        resultSectionIndex = i;
      }
    });

    const ul = $(sections[resultSectionIndex]).find("ul");
    return ul.next().get(0) ?? ul.parent().next().get(0);
  },
  private: {
    imageListContainer: null,
    pageSelector: null,
    returnMap: null,
  },
};

/* ---------------------------------------- 排序 ---------------------------------------- */
let imageElementTemplate = null;

function PixivSK(callback) {
  // 不合理的设定
  if (g_settings.pageCount < 1 || g_settings.favFilter < 0) {
    g_settings.pageCount = 1;
    g_settings.favFilter = 0;
  }
  // 当前已经取得的页面数量
  let currentGettingPageCount = 0;
  // 当前加载的页面 URL
  let currentUrl = "https://www.pixiv.net/ajax/search/";
  // 当前加载的是第几张页面
  let currentPage = 0;
  // 获取到的作品
  let works = [];
  // 作品数量
  let worksCount = 0;

  // 仅搜索页启用
  if (g_pageType != PageType.Search) {
    return;
  }

  // 获取第 currentPage 页的作品
  // 这个方法还是用带 cookie 的请求，防止未登录拉不到数据
  const getWorks = function (onloadCallback) {
    $("#progress").text(
      Texts[g_language].sort_getWorks
        .replace("%1", currentGettingPageCount + 1)
        .replace("%2", g_settings.pageCount)
    );

    let url = currentUrl.replace(/p=\d+/, "p=" + currentPage);

    if (location.href.indexOf("?") != -1) {
      let param = location.href.split("?")[1];
      param = param.replace(/^p=\d+/, "");
      param = param.replace(/&p=\d+/, "");
      url += "&" + param;
    }

    if (url.indexOf("order=") == -1) {
      url += "&order=date_d";
    }
    if (url.indexOf("mode=") == -1) {
      url += "&mode=all";
    }
    if (url.indexOf("s_mode=") == -1) {
      url += "&s_mode=s_tag_full";
    }

    DoLog(LogLevel.Info, "getWorks url: " + url);

    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.onload = function (event) {
      onloadCallback(req);
    };
    req.onerror = function (event) {
      DoLog(LogLevel.Error, "Request search page error!");
    };

    req.send(null);
  };

  function getFollowingOfType(user_id, type, offset) {
    return new Promise(function (resolve, reject) {
      if (offset == null) {
        offset = 0;
      }
      const limit = 100;
      const following_show = [];
      $.ajax(
        "https://www.pixiv.net/ajax/user/" +
          user_id +
          "/following?offset=" +
          offset +
          "&limit=" +
          limit +
          "&rest=" +
          type,
        {
          async: true,
          success: function (data) {
            if (data == null || data.error) {
              DoLog(LogLevel.Error, "Following response contains an error.");
              resolve([]);
              return;
            }
            if (data.body.users.length == 0) {
              resolve([]);
              return;
            }
            $.each(data.body.users, function (i, user) {
              following_show.push(user.userId);
            });
            getFollowingOfType(user_id, type, offset + limit).then(
              function (members) {
                resolve(following_show.concat(members));
                return;
              }
            );
          },
          error: function () {
            DoLog(LogLevel.Error, "Request following failed.");
            resolve([]);
          },
        }
      );
    });
  }

  function getFollowingOfCurrentUser() {
    return new Promise(function (resolve, reject) {
      let user_id = "";

      try {
        user_id = dataLayer[0].user_id;
      } catch (ex) {
        DoLog(LogLevel.Error, "Get user id failed.");
        resolve([]);
        return;
      }

      // show/hide
      $("#progress").text(Texts[g_language].sort_getPublicFollowing);

      // 首先从Cookie读取
      const following =
        GetLocalStorage("followingOfUid-" + user_id) ||
        GetCookie("followingOfUid-" + user_id);
      if (following != null && following != "null") {
        resolve(following);
        return;
      }

      getFollowingOfType(user_id, "show").then(function (members) {
        $("#progress").text(Texts[g_language].sort_getPrivateFollowing);
        getFollowingOfType(user_id, "hide").then(function (members2) {
          const following = members.concat(members2);
          SetLocalStorage("followingOfUid-" + user_id, following);
          resolve(following);
        });
      });
    });
  }

  // 筛选已关注画师作品
  const filterByUser = function () {
    return new Promise(function (resolve, reject) {
      if (!g_settings.hideFollowed) {
        resolve();
      }

      getFollowingOfCurrentUser().then(function (members) {
        const tempWorks = [];
        let hideWorkCount = 0;
        $(works).each(function (i, work) {
          let found = false;
          for (let i = 0; i < members.length; i++) {
            if (members[i] == work.userId) {
              found = true;
              break;
            }
          }
          if (!found) {
            tempWorks.push(work);
          } else {
            hideWorkCount++;
          }
        });
        works = tempWorks;

        DoLog(LogLevel.Info, hideWorkCount + " works were hide.");
        DoLog(LogLevel.Elements, works);
        resolve();
      });
    });
  };

  // 排序和筛选
  const filterAndSort = function () {
    return new Promise(function (resolve, reject) {
      DoLog(LogLevel.Info, "Start sort.");
      DoLog(LogLevel.Elements, works);

      // 收藏量低于 FAV_FILTER 的作品不显示
      let text = Texts[g_language].sort_filtering.replace(
        "%2",
        g_settings.favFilter
      );
      text = text.replace(
        "%1",
        g_settings.hideFavorite
          ? Texts[g_language].sort_filteringHideFavorite
          : ""
      );
      $("#progress").text(text); // 实际上这个太快完全看不到
      const tmp = [];
      const tagsToHide = new Set(
        g_settings.hideByTagList.replace("，", ",").split(",")
      );
      $(works).each(function (i, work) {
        const bookmarkCount = work.bookmarkCount ? work.bookmarkCount : 0;
        if (bookmarkCount < g_settings.favFilter) return true;
        if (g_settings.hideFavorite && work.bookmarkData) return true;
        if (g_settings.aiFilter == 1 && work.aiType == 2) return true;
        if (
          g_settings.hideByTag &&
          work.tags.some((tag) => tagsToHide.has(tag))
        )
          return true;
        tmp.push(work);
      });
      works = tmp;

      filterByUser().then(function () {
        // 排序
        works.sort(function (a, b) {
          let favA = a.bookmarkCount;
          let favB = b.bookmarkCount;
          if (!favA) {
            favA = 0;
          }
          if (!favB) {
            favB = 0;
          }
          if (favA > favB) {
            return -1;
          }
          if (favA < favB) {
            return 1;
          }
          return 0;
        });
        DoLog(LogLevel.Info, "Sort complete.");
        DoLog(LogLevel.Elements, works);
        resolve();
      });
    });
  };

  if (currentPage === 0) {
    let url = location.href;

    if (url.indexOf("&p=") == -1 && url.indexOf("?p=") == -1) {
      DoLog(LogLevel.Warning, "Can not found page in url.");
      if (url.indexOf("?") == -1) {
        url += "?p=1";
        DoLog(LogLevel.Info, 'Add "?p=1": ' + url);
      } else {
        url += "&p=1";
        DoLog(LogLevel.Info, 'Add "&p=1": ' + url);
      }
    }
    const wordMatch = url.match(/\/tags\/([^/]*)\//);
    let searchWord = "";
    if (wordMatch) {
      DoLog(LogLevel.Info, "Search key word: " + searchWord);
      searchWord = wordMatch[1];
    } else {
      DoLog(LogLevel.Error, "Can not found search key word!");
      return;
    }

    // page
    const page = url.match(/p=(\d*)/)[1];
    currentPage = parseInt(page);
    DoLog(LogLevel.Info, "Current page: " + currentPage);

    const type = url.match(/tags\/.*\/(.*)[?$]/)[1];
    currentUrl += type + "/";

    currentUrl += searchWord + "?word=" + searchWord + "&p=" + currentPage;
    DoLog(LogLevel.Info, "Current url: " + currentUrl);
  } else {
    DoLog(LogLevel.Error, "???");
  }

  const imageContainer = Pages[PageType.Search].GetImageListContainer();
  // loading
  $(imageContainer)
    .hide()
    .before(
      '<div id="loading" style="width:100%;text-align:center;"><img src="' +
        g_loadingImage +
        '" /><p id="progress" style="text-align: center;font-size: large;font-weight: bold;padding-top: 10px;">0%</p></div>'
    );

  // page
  const pageSelectorDiv = Pages[PageType.Search].GetPageSelector();
  console.log("pageSelectorDiv", pageSelectorDiv);
  if (pageSelectorDiv == null) {
    DoLog(LogLevel.Error, "Can not found page selector!");
    return;
  }

  if ($(pageSelectorDiv).find("a").length > 2) {
    const pageButton = $(pageSelectorDiv).find("a").get(1);
    const newPageButtons = [];
    const pageButtonString = "Previewer";
    for (let i = 0; i < 9; i++) {
      const newPageButton = pageButton.cloneNode(true);
      $(newPageButton).find("span").text(pageButtonString[i]);
      newPageButtons.push(newPageButton);
    }

    $(pageSelectorDiv).find("button").remove();
    while ($(pageSelectorDiv).find("a").length > 2) {
      $(pageSelectorDiv).find("a:first").next().remove();
    }

    for (let i = 0; i < 9; i++) {
      $(pageSelectorDiv).find("a:last").before(newPageButtons[i]);
    }

    $(pageSelectorDiv).find("a").attr("href", "javascript:;");

    let pageUrl = location.href;
    if (pageUrl.indexOf("&p=") == -1 && pageUrl.indexOf("?p=") == -1) {
      if (pageUrl.indexOf("?") == -1) {
        pageUrl += "?p=1";
      } else {
        pageUrl += "&p=1";
      }
    }
    const prevPageUrl = pageUrl.replace(
      /p=\d+/,
      "p=" +
        (currentPage - g_settings.pageCount > 1
          ? currentPage - g_settings.pageCount
          : 1)
    );
    const nextPageUrl = pageUrl.replace(
      /p=\d+/,
      "p=" + (currentPage + g_settings.pageCount)
    );
    DoLog(LogLevel.Info, "Previous page url: " + prevPageUrl);
    DoLog(LogLevel.Info, "Next page url: " + nextPageUrl);
    // 重新插入一遍清除事件绑定
    const prevButton = $(pageSelectorDiv).find("a:first");
    prevButton.before(prevButton.clone());
    prevButton.remove();
    const nextButton = $(pageSelectorDiv).find("a:last");
    nextButton.before(nextButton.clone());
    nextButton.remove();
    $(pageSelectorDiv)
      .find("a:first")
      .attr("href", prevPageUrl)
      .addClass("pp-prevPage");
    $(pageSelectorDiv)
      .find("a:last")
      .attr("href", nextPageUrl)
      .addClass("pp-nextPage");

    const onloadCallback = function (req) {
      let no_artworks_found = false;

      try {
        const json = JSON.parse(req.responseText);
        if (json.hasOwnProperty("error")) {
          if (json.error === false) {
            let data;
            if (json.body.illustManga) {
              data = json.body.illustManga.data;
            } else if (json.body.manga) {
              data = json.body.manga.data;
            } else if (json.body.illust) {
              data = json.body.illust.data;
            }
            if (data.length > 0) {
              works = works.concat(data);
            } else {
              no_artworks_found = true;
            }
          } else {
            DoLog(LogLevel.Error, "ajax error!");
            return;
          }
        } else {
          DoLog(LogLevel.Error, 'Key "error" not found!');
          return;
        }
      } catch (e) {
        DoLog(LogLevel.Error, "A invalid json string!");
        DoLog(LogLevel.Info, req.responseText);
      }

      currentPage++;
      currentGettingPageCount++;

      // 后面已经没有作品了
      if (no_artworks_found) {
        iLog.w(
          LogLevel.Warning,
          "No artworks found, ignore " +
            (g_settings.pageCount - currentGettingPageCount) +
            " pages."
        );
        currentPage += g_settings.pageCount - currentGettingPageCount;
        currentGettingPageCount = g_settings.pageCount;
      }
      // 设定数量的页面加载完成
      if (currentGettingPageCount == g_settings.pageCount) {
        DoLog(LogLevel.Info, "Load complete, start to load bookmark count.");
        DoLog(LogLevel.Elements, works);

        // 获取到的作品里面可能有广告，先删掉，否则后面一些处理需要做判断
        const tempWorks = [];
        const workIdsSet = new Set();
        for (let i = 0; i < works.length; i++) {
          if (works[i].id && !workIdsSet.has(works[i].id)) {
            tempWorks.push(works[i]);
            workIdsSet.add(works[i].id);
          } else {
            iLog.w("ignore work: " + works[i].id);
          }
        }
        works = tempWorks;
        worksCount = works.length;
        DoLog(LogLevel.Info, "Clear ad container complete.");
        DoLog(LogLevel.Elements, works);

        GetBookmarkCount(0);
      } else {
        getWorks(onloadCallback);
      }
    };

    getWorks(onloadCallback);
  }

  const xhrs = [];
  let currentRequestGroupMinimumIndex = 0;
  function FillXhrsArray() {
    xhrs.length = 0;
    const onloadFunc = function (event) {
      let json = null;
      try {
        json = JSON.parse(event.responseText);
      } catch (e) {
        DoLog(LogLevel.Error, "Parse json failed!");
        DoLog(LogLevel.Elements, e);
        return;
      }

      if (json) {
        let illustId = "";
        const illustIdMatched = event.finalUrl.match(/illust_id=(\d+)/);
        if (illustIdMatched) {
          illustId = illustIdMatched[1];
        } else {
          DoLog(
            LogLevel.Error,
            "Can not get illust id from url: " + event.finalUrl
          );
          return;
        }
        let indexOfThisRequest = -1;
        for (let j = 0; j < g_maxXhr; j++) {
          if (xhrs[j].illustId == illustId) {
            indexOfThisRequest = j;
            break;
          }
        }
        if (indexOfThisRequest == -1) {
          DoLog(LogLevel.Error, "This url not match any request!");
          return;
        }
        xhrs[indexOfThisRequest].complete = true;

        if (!json.error) {
          const bookmarkCount = json.body.illust_details.bookmark_user_total;
          works[
            currentRequestGroupMinimumIndex + indexOfThisRequest
          ].bookmarkCount = parseInt(bookmarkCount);
          DoLog(
            LogLevel.Info,
            "IllustId: " + illustId + ", bookmarkCount: " + bookmarkCount
          );
        } else {
          DoLog(LogLevel.Error, "Some error occured: " + json.message);
        }

        let completeCount = 0;
        // 真实完成数（不包含没有发起请求的XHR，最后一批请求时）
        let completeReally = 0;
        for (let j = 0; j < g_maxXhr; j++) {
          if (xhrs[j].complete) {
            completeCount++;
            if (xhrs[j].illustId != "") {
              completeReally++;
            }
          }
        }
        $("#loading")
          .find("#progress")
          .text(
            Texts[g_language].sort_getBookmarkCount
              .replace("%1", currentRequestGroupMinimumIndex + completeReally)
              .replace("%2", works.length)
          );
        if (completeCount == g_maxXhr) {
          currentRequestGroupMinimumIndex += g_maxXhr;
          GetBookmarkCount(currentRequestGroupMinimumIndex);
        }
      }
    };
    const onerrorFunc = function (event) {
      let illustId = "";
      const illustIdMatched = event.finalUrl.match(/illust_id=(\d+)/);
      if (illustIdMatched) {
        illustId = illustIdMatched[1];
      } else {
        DoLog(
          LogLevel.Error,
          "Can not get illust id from url: " + event.finalUrl
        );
        return;
      }

      DoLog(
        LogLevel.Error,
        "Send request failed, set this illust(" +
          illustId +
          ")'s bookmark count to 0!"
      );

      let indexOfThisRequest = -1;
      for (let j = 0; j < g_maxXhr; j++) {
        if (xhrs[j].illustId == illustId) {
          indexOfThisRequest = j;
          break;
        }
      }
      if (indexOfThisRequest == -1) {
        DoLog(LogLevel.Error, "This url not match any request!");
        return;
      }
      works[
        currentRequestGroupMinimumIndex + indexOfThisRequest
      ].bookmarkCount = 0;
      xhrs[indexOfThisRequest].complete = true;

      let completeCount = 0;
      let completeReally = 0;
      for (let j = 0; j < g_maxXhr; j++) {
        if (xhrs[j].complete) {
          completeCount++;
          if (xhrs[j].illustId != "") {
            completeReally++;
          }
        }
      }
      $("#loading")
        .find("#progress")
        .text(
          Texts[g_language].sort_getBookmarkCount
            .replace("%1", currentRequestGroupMinimumIndex + completeReally)
            .replace("%2", works.length)
        );
      if (completeCount == g_maxXhr) {
        currentRequestGroupMinimumIndex += g_maxXhr;
        GetBookmarkCount(currentRequestGroupMinimumIndex + g_maxXhr);
      }
    };
    for (let i = 0; i < g_maxXhr; i++) {
      xhrs.push({
        illustId: "",
        complete: false,
        onabort: onerrorFunc,
        onerror: onerrorFunc,
        onload: onloadFunc,
        ontimeout: onerrorFunc,
      });
    }
  }

  const GetBookmarkCount = function (index) {
    if (index >= works.length) {
      clearAndUpdateWorks();
      return;
    }

    if (xhrs.length === 0) {
      FillXhrsArray();
    }

    for (let i = 0; i < g_maxXhr; i++) {
      if (index + i >= works.length) {
        xhrs[i].complete = true;
        xhrs[i].illustId = "";
        continue;
      }

      const illustId = works[index + i].id;
      const url =
        "https://www.pixiv.net/touch/ajax/illust/details?illust_id=" + illustId;
      xhrs[i].illustId = illustId;
      xhrs[i].complete = false;
      request({
        method: "GET",
        url: url,
        synchronous: true,
        onabort: xhrs[i].onerror,
        onerror: xhrs[i].onerror,
        onload: xhrs[i].onload,
        ontimeout: xhrs[i].onerror,
      });
    }
  };

  /*
    li
    -div
    --div
    ---div
    ----div
    -----div
    ------a
    -------div: 多图标签、R18标签
    -------div: 里面是 img （以及 svg 动图标签）
    ------div: 里面是 like 相关的元素
    ---a: 作品标题，跳转链接
    ---div: 作者头像和昵称
    */
  const clearAndUpdateWorks = function () {
    filterAndSort().then(function () {
      const container = Pages[PageType.Search].GetImageListContainer();
      const firstImageElement = Pages[PageType.Search].GetFirstImageElement();
      // 排序兼容 PixivBatchDownloader
      $(firstImageElement)
        .find("[data-mouseover]")
        .removeAttr("data-mouseover");
      if (imageElementTemplate == null) {
        imageElementTemplate = firstImageElement.cloneNode(true);
        //imageElementTemplate = firstImageElement;

        // 清理模板
        // image
        const control = $(imageElementTemplate).find(".pp-control");
        if (control == null) {
          iLog.w("Cannot found some elements!");
          return;
        }
        const imageLink = control.find("a:first");
        const img = imageLink.find("img:first");
        const imageDiv = img.parent();
        const imageLinkDiv = imageLink.parent();
        const titleLinkParent = control.next();
        if (
          img == null ||
          imageDiv == null ||
          imageLink == null ||
          imageLinkDiv == null ||
          titleLinkParent == null
        ) {
          DoLog(LogLevel.Error, "Can not found some elements!");
        }
        let titleLink = $("<a></a>");
        if (titleLinkParent.children().length == 0) {
          titleLinkParent.append(titleLink);
        } else {
          titleLink = titleLinkParent.children("a:first");
        }

        // author
        const authorDiv = titleLinkParent.next();
        const authorLinkProfileImage = authorDiv.find("a:first");
        const authorLink = authorDiv.find("a:last");
        const authorName = authorLink;
        const authorImage = $(authorDiv.find("img").get(0));

        // others
        const bookmarkDiv = imageLink.next();
        const bookmarkSvg = bookmarkDiv.find("svg");
        const additionTagDiv = imageLink.children("div:last");

        const bookmarkCountDiv = additionTagDiv.clone();
        bookmarkCountDiv.css({ top: "auto", bottom: "0px", width: "65%" });
        additionTagDiv.parent().append(bookmarkCountDiv);

        // 添加 class，方便后面修改内容
        img.addClass("ppImg");
        imageLink.addClass("ppImageLink");
        titleLink.addClass("ppTitleLink");
        authorLinkProfileImage.addClass("ppAuthorLinkProfileImage");
        authorLink.addClass("ppAuthorLink");
        authorName.addClass("ppAuthorName");
        authorImage.addClass("ppAuthorImage");
        bookmarkSvg.attr("class", bookmarkSvg.attr("class") + " ppBookmarkSvg");
        additionTagDiv.addClass("ppAdditionTag");
        bookmarkCountDiv.addClass("ppBookmarkCount");

        img.attr("src", "");
        const animationTag = img.next();
        if (animationTag.length != 0 && animationTag.get(0).tagName == "SVG") {
          animationTag.remove();
        }
        additionTagDiv.empty();
        bookmarkCountDiv.empty();
        bookmarkSvg.find("path:first").css("fill", "rgb(31, 31, 31)");
        bookmarkSvg.find("path:last").css("fill", "rgb(255, 255, 255)");
        imageDiv.find("svg").remove();

        if (g_settings.linkBlank) {
          imageLink.attr("target", "_blank");
          titleLink.attr("target", "_blank");
          authorLinkProfileImage.attr("target", "_blank");
          authorLink.attr("target", "_blank");
        }
      }

      $(container).empty();
      for (let i = 0; i < works.length; i++) {
        const li = $(imageElementTemplate.cloneNode(true));

        let regularUrl = works[i].url;
        if (g_settings.fullSizeThumb) {
          regularUrl = convertThumbUrlToSmall(works[i].url);
        }
        li.find(".ppImg").attr("src", regularUrl).css("object-fit", "contain");
        li.find(".ppImageLink").attr("href", "/artworks/" + works[i].id);
        li.find(".ppTitleLink")
          .attr("href", "/artworks/" + works[i].id)
          .text(works[i].title);
        li.find(".ppAuthorLink, .ppAuthorLinkProfileImage")
          .attr("href", "/member.php?id=" + works[i].userId)
          .attr({
            userId: works[i].userId,
            profileImageUrl: works[i].profileImageUrl,
            userName: works[i].userName,
          });
        li.find(".ppAuthorName").text(works[i].userName);
        li.find(".ppAuthorImage").parent().attr("titile", works[i].userName);
        li.find(".ppAuthorImage").attr("src", works[i].profileImageUrl);
        li.find(".ppBookmarkSvg").attr("illustId", works[i].id);
        if (works[i].bookmarkData) {
          li.find(".ppBookmarkSvg")
            .find("path")
            .css("fill", "rgb(255, 64, 96)");
          li.find(".ppBookmarkSvg").attr(
            "bookmarkId",
            works[i].bookmarkData.id
          );
        }
        if (works[i].xRestrict !== 0) {
          const R18HTML =
            '<div style="margin-top: 2px; margin-left: 2px;"><div style="color: rgb(255, 255, 255);font-weight: bold;font-size: 10px;line-height: 1;padding: 3px 6px;border-radius: 3px;background: rgb(255, 64, 96);">R-18</div></div>';
          li.find(".ppAdditionTag").append(R18HTML);
        }
        if (works[i].pageCount > 1) {
          const pageCountHTML =
            '<div style="display: flex;-webkit-box-align: center;align-items: center;box-sizing: border-box;margin-left: auto;height: 20px;color: rgb(255, 255, 255);font-size: 10px;line-height: 12px;font-weight: bold;flex: 0 0 auto;padding: 4px 6px;background: rgba(0, 0, 0, 0.32);border-radius: 10px;"><svg viewBox="0 0 9 10" width="9" height="10" style="stroke: none;line-height: 0;font-size: 0px;fill: currentcolor;"><path d="M8,3 C8.55228475,3 9,3.44771525 9,4 L9,9 C9,9.55228475 8.55228475,10 8,10 L3,10 C2.44771525,10 2,9.55228475 2,9 L6,9 C7.1045695,9 8,8.1045695 8,7 L8,3 Z M1,1 L6,1 C6.55228475,1 7,1.44771525 7,2 L7,7 C7,7.55228475 6.55228475,8 6,8 L1,8 C0.44771525,8 0,7.55228475 0,7 L0,2 C0,1.44771525 0.44771525,1 1,1 Z"></path></svg><span style="margin-left: 2px;">' +
            works[i].pageCount +
            "</span></div>";
          li.find(".ppAdditionTag").append(pageCountHTML);
        }
        const bookmarkCountHTML =
          '<div style="margin-bottom: 6px; margin-left: 2px;"><div style="color: rgb(7, 95, 166);font-weight: bold;font-size: 13px;line-height: 1;padding: 3px 6px;border-radius: 3px;background: rgb(204, 236, 255);">' +
          works[i].bookmarkCount +
          " likes</div></div>";
        li.find(".ppBookmarkCount").append(bookmarkCountHTML);
        if (works[i].illustType == 2) {
          const animationHTML =
            '<svg viewBox="0 0 24 24" style="width: 48px; height: 48px;stroke: none;fill: rgb(255, 255, 255);line-height: 0;font-size: 0px;vertical-align: middle;position:absolute;"><circle cx="12" cy="12" r="10" style="fill: rgb(0, 0, 0);fill-opacity: 0.4;"></circle><path d="M9,8.74841664 L9,15.2515834 C9,15.8038681 9.44771525,16.2515834 10,16.2515834 C10.1782928,16.2515834 10.3533435,16.2039156 10.5070201,16.1135176 L16.0347118,12.8619342 C16.510745,12.5819147 16.6696454,11.969013 16.3896259,11.4929799 C16.3034179,11.3464262 16.1812655,11.2242738 16.0347118,11.1380658 L10.5070201,7.88648243 C10.030987,7.60646294 9.41808527,7.76536339 9.13806578,8.24139652 C9.04766776,8.39507316 9,8.57012386 9,8.74841664 Z"></path></svg>';
          li.find(".ppImg").after(animationHTML);
        }

        $(container).append(li);
      }

      // 监听加入书签点击事件，监听父节点，但是按照 <svg> 节点处理
      $(".ppBookmarkSvg")
        .parent()
        .on("click", function (ev) {
          if (g_csrfToken == "") {
            DoLog(LogLevel.Error, "No g_csrfToken, failed to add bookmark!");
            alert("获取 Token 失败，无法添加，请到详情页操作。");
            return;
          }
          // 非公开收藏
          let restrict = 0;
          if (ev.ctrlKey || ev.metaKey) {
            restrict = 1;
          }

          const _this = $(this).children("svg:first");
          const illustId = _this.attr("illustId");
          const bookmarkId = _this.attr("bookmarkId");
          if (bookmarkId == null || bookmarkId == "") {
            DoLog(LogLevel.Info, "Add bookmark, illustId: " + illustId);
            $.ajax("/ajax/illusts/bookmarks/add", {
              method: "POST",
              contentType: "application/json;charset=utf-8",
              headers: { "x-csrf-token": g_csrfToken },
              data:
                '{"illust_id":"' +
                illustId +
                '","restrict":' +
                restrict +
                ',"comment":"","tags":[]}',
              success: function (data) {
                DoLog(LogLevel.Info, "addBookmark result: ");
                DoLog(LogLevel.Elements, data);
                if (data.error) {
                  DoLog(
                    LogLevel.Error,
                    "Server returned an error: " + data.message
                  );
                  return;
                }
                const bookmarkId = data.body.last_bookmark_id;
                DoLog(
                  LogLevel.Info,
                  "Add bookmark success, bookmarkId is " + bookmarkId
                );
                _this.attr("bookmarkId", bookmarkId);
                _this.find("path").css("fill", "rgb(255, 64, 96)");
              },
            });
          } else {
            DoLog(LogLevel.Info, "Delete bookmark, bookmarkId: " + bookmarkId);
            $.ajax("/rpc/index.php", {
              method: "POST",
              headers: { "x-csrf-token": g_csrfToken },
              data: { mode: "delete_illust_bookmark", bookmark_id: bookmarkId },
              success: function (data) {
                DoLog(LogLevel.Info, "delete bookmark result: ");
                DoLog(LogLevel.Elements, data);
                if (data.error) {
                  DoLog(
                    LogLevel.Error,
                    "Server returned an error: " + data.message
                  );
                  return;
                }
                DoLog(LogLevel.Info, "Delete bookmark success.");
                _this.attr("bookmarkId", "");
                _this.find("path:first").css("fill", "rgb(31, 31, 31)");
                _this.find("path:last").css("fill", "rgb(255, 255, 255)");
              },
            });
          }

          _this.parent().focus();
        });

      $(".ppAuthorLink")
        .on("mouseenter", function (e) {
          const _this = $(this);

          function getOffset(e) {
            if (e.offsetParent) {
              const offset = getOffset(e.offsetParent);
              return {
                offsetTop: e.offsetTop + offset.offsetTop,
                offsetLeft: e.offsetLeft + offset.offsetLeft,
              };
            } else {
              return {
                offsetTop: e.offsetTop,
                offsetLeft: e.offsetLeft,
              };
            }
          }

          let isFollowed = false;
          $.ajax(
            "https://www.pixiv.net/ajax/user/" +
              _this.attr("userId") +
              "?full=1",
            {
              method: "GET",
              async: false,
              success: function (data) {
                if (data.error == false && data.body.isFollowed) {
                  isFollowed = true;
                }
              },
            }
          );

          $(".pp-authorDiv").remove();
          const pres = $(
            '<div class="pp-authorDiv"><div class="ppa-main" style="position: absolute; top: 0px; left: 0px; border-width: 1px; border-style: solid; z-index: 1; border-color: rgba(0, 0, 0, 0.08); border-radius: 8px;"><div class=""style="    width: 336px;    background-color: rgb(255, 255, 255);    padding-top: 24px;    flex-flow: column;"><div class=""style=" display: flex; align-items: center; flex-flow: column;"><a class="ppa-authorLink"><div role="img"size="64"class=""style=" display: inline-block; width: 64px; height: 64px; border-radius: 50%; overflow: hidden;"><img class="ppa-authorImage" width="64"height="64"style="object-fit: cover; object-position: center top;"></div></a><a class="ppa-authorLink"><div class="ppa-authorName" style=" line-height: 24px; font-size: 16px; font-weight: bold; margin: 4px 0px 0px;"></div></a><div class=""style=" margin: 12px 0px 24px;"><button type="button"class="ppa-follow"style=" padding: 9px 25px; line-height: 1; border: none; border-radius: 16px; font-weight: 700; background-color: #0096fa; color: #fff; cursor: pointer;"><span style="margin-right: 4px;"><svg viewBox="0 0 8 8"width="10"height="10"class=""style=" stroke: rgb(255, 255, 255); stroke-linecap: round; stroke-width: 2;"><line x1="1"y1="4"x2="7"y2="4"></line><line x1="4"y1="1"x2="4"y2="7"></line></svg></span>关注</button></div></div></div></div></div>'
          );
          $("body").append(pres);
          const offset = getOffset(this);
          pres.find(".ppa-main").css({
            top: offset.offsetTop - 196 + "px",
            left: offset.offsetLeft - 113 + "px",
          });
          pres
            .find(".ppa-authorLink")
            .attr("href", "/member.php?id=" + _this.attr("userId"));
          pres
            .find(".ppa-authorImage")
            .attr("src", _this.attr("profileImageUrl"));
          pres.find(".ppa-authorName").text(_this.attr("userName"));
          if (isFollowed) {
            pres.find(".ppa-follow").get(0).outerHTML =
              '<button type="button" class="ppa-follow followed" data-click-action="click" data-click-label="follow" style="padding: 9px 25px;line-height: 1;border: none;border-radius: 16px;font-size: 14px;font-weight: 700;cursor: pointer;">关注中</button>';
          }
          pres.find(".ppa-follow").attr("userId", _this.attr("userId"));
          pres
            .on("mouseleave", function (e) {
              $(this).remove();
            })
            .on("mouseenter", function () {
              $(this).addClass("mouseenter");
            });

          pres.find(".ppa-follow").on("click", function () {
            const userId = $(this).attr("userId");
            if ($(this).hasClass("followed")) {
              // 取关
              $.ajax("https://www.pixiv.net/rpc_group_setting.php", {
                method: "POST",
                headers: { "x-csrf-token": g_csrfToken },
                data: "mode=del&type=bookuser&id=" + userId,
                success: function (data) {
                  DoLog(LogLevel.Info, "delete bookmark result: ");
                  DoLog(LogLevel.Elements, data);

                  if (data.type == "bookuser") {
                    $(".ppa-follow").get(0).outerHTML =
                      '<button type="button"class="ppa-follow"style=" padding: 9px 25px; line-height: 1; border: none; border-radius: 16px; font-weight: 700; background-color: #0096fa; color: #fff; cursor: pointer;"><span style="margin-right: 4px;"><svg viewBox="0 0 8 8"width="10"height="10"class=""style=" stroke: rgb(255, 255, 255); stroke-linecap: round; stroke-width: 2;"><line x1="1"y1="4"x2="7"y2="4"></line><line x1="4"y1="1"x2="4"y2="7"></line></svg></span>关注</button>';
                  } else {
                    DoLog(LogLevel.Error, "Delete follow failed!");
                  }
                },
              });
            } else {
              // 关注
              $.ajax("https://www.pixiv.net/bookmark_add.php", {
                method: "POST",
                headers: { "x-csrf-token": g_csrfToken },
                data:
                  "mode=add&type=user&user_id=" +
                  userId +
                  "&tag=&restrict=0&format=json",
                success: function (data) {
                  DoLog(LogLevel.Info, "addBookmark result: ");
                  DoLog(LogLevel.Elements, data);
                  // success
                  if (data.length === 0) {
                    $(".ppa-follow").get(0).outerHTML =
                      '<button type="button" class="ppa-follow followed" data-click-action="click" data-click-label="follow" style="padding: 9px 25px;line-height: 1;border: none;border-radius: 16px;font-size: 14px;font-weight: 700;cursor: pointer;">关注中</button>';
                  } else {
                    DoLog(LogLevel.Error, "Follow failed!");
                  }
                },
              });
            }
          });
        })
        .on("mouseleave", function (e) {
          setTimeout(function () {
            if (!$(".pp-authorDiv").hasClass("mouseenter")) {
              $(".pp-authorDiv").remove();
            }
          }, 200);
        });

      if (works.length === 0) {
        $(container).show().get(0).outerHTML =
          '<div class=""style="display: flex;align-items: center;justify-content: center; height: 408px;flex-flow: column;"><div class=""style="margin-bottom: 12px;color: rgba(0, 0, 0, 0.16);"><svg viewBox="0 0 16 16"size="72"style="fill: currentcolor;height: 72px;vertical-align: middle;"><path d="M8.25739 9.1716C7.46696 9.69512 6.51908 10 5.5 10C2.73858 10 0.5 7.76142 0.5 5C0.5 2.23858 2.73858 0 5.5 0C8.26142 0 10.5 2.23858 10.5 5C10.5 6.01908 10.1951 6.96696 9.67161 7.75739L11.7071 9.79288C12.0976 10.1834 12.0976 10.8166 11.7071 11.2071C11.3166 11.5976 10.6834 11.5976 10.2929 11.2071L8.25739 9.1716ZM8.5 5C8.5 6.65685 7.15685 8 5.5 8C3.84315 8 2.5 6.65685 2.5 5C2.5 3.34315 3.84315 2 5.5 2C7.15685 2 8.5 3.34315 8.5 5Z"transform="translate(2.25 2.25)"fill-rule="evenodd"clip-rule="evenodd"></path></svg></div><span class="sc-LzMCO fLDUzU">' +
          Texts[g_language].sort_noWork.replace("%1", worksCount) +
          "</span></div>";
      }

      // 恢复显示
      $("#loading").remove();
      $(container).show();

      // 监听键盘的左右键，用来翻页
      $(document).keydown(function (e) {
        if (g_settings.pageByKey != 1) {
          return;
        }
        if (e.keyCode == 39) {
          const btn = $(".pp-nextPage");
          if (btn.length < 1 || btn.attr("hidden") == "hidden") {
            return;
          }
          // 很奇怪不能用 click()
          location.href = btn.attr("href");
        } else if (e.keyCode == 37) {
          const btn = $(".pp-prevPage");
          if (btn.length < 1 || btn.attr("hidden") == "hidden") {
            return;
          }
          location.href = btn.attr("href");
        }
      });

      if (callback) {
        callback();
      }
    });
  };
}
/* ---------------------------------------- 小说 ---------------------------------------- */
function PixivNS() {
  function findNovelSection() {
    const ul = $("section:first").find("ul:first");
    if (ul.length == 0) {
      DoLog(LogLevel.Error, "Can not found novel list.");
      return null;
    }
    return ul;
  }

  function getSearchParamsWithoutPage() {
    return location.search.substr(1).replace(/&?p=\d+/, "");
  }

  function getNovelTemplate(ul) {
    if (!ul) {
      return null;
    }
    if (ul.length == 0) {
      DoLog(LogLevel.Error, "Empty list, can not create template.");
      return null;
    }
    const template = ul.children().eq(0).clone(true);
    // 左侧图片
    const picDiv = template.children().eq(0).children().eq(0);
    picDiv.find("a:first").addClass("pns-link");
    picDiv.find("img:first").addClass("pns-img");
    // 右侧详情
    const detailDiv = template
      .children()
      .eq(0)
      .children()
      .eq(1)
      .children()
      .eq(0);
    const titleDiv = detailDiv.children().eq(0);
    if (titleDiv.children().length > 1) {
      titleDiv.children().eq(0).addClass("pns-series");
    } else {
      // 如果作为模板的DIV没有系列，就自己加一个
      const series = $(
        '<a class="pns-series" href="/novel/series/000000"></a>'
      );
      series.css({
        display: "inline-block",
        "white-space": "nowrap",
        "text-overflow": "ellipsis",
        overflow: "hidden",
        "max-width": "100%",
        "line-height": "22px",
        "font-size": "14px",
        "text-decoration": "none",
      });
      $("head").append(
        "<style>.pns-series:visited{color:rgb(173,173,173)}</style>"
      );
      titleDiv.prepend(series);
    }
    titleDiv
      .children()
      .eq(1)
      .children()
      .eq(0)
      .addClass("pns-title")
      .addClass("pns-link");
    detailDiv
      .find(".gtm-novel-searchpage-result-user:first")
      .addClass("pns-author-img");
    detailDiv
      .find(".gtm-novel-searchpage-result-user:last")
      .addClass("pns-author");
    const tagDiv = detailDiv.children().eq(2).children().eq(0);
    const bookmarkDiv = tagDiv.children().eq(2);
    bookmarkDiv.find("span:first").addClass("pns-text-count");
    if (bookmarkDiv.find("span").length < 2) {
      const textSpan = bookmarkDiv.find(".pns-text-count");
      textSpan.append(
        '<span class="pns-bookmark-count"><span><div class="sc-eoqmwo-1 grSeZG"><span class="sc-14heosd-0 gbNjEj"><svg viewBox="0 0 12 12" size="12" class="sc-14heosd-1 YtZop"><path fill-rule="evenodd" clip-rule="evenodd" d="M9 0.75C10.6569 0.75 12 2.09315 12 3.75C12 7.71703 7.33709 10.7126 6.23256 11.3666C6.08717 11.4526 5.91283 11.4526 5.76744 11.3666C4.6629 10.7126 0 7.71703 0 3.75C0 2.09315 1.34315 0.75 3 0.75C4.1265 0.75 5.33911 1.60202 6 2.66823C6.66089 1.60202 7.8735 0.75 9 0.75Z"></path></svg></span><span class="sc-eoqmwo-2 dfUmJJ">2,441</span></div></span></span>'
      );
      bookmarkDiv
        .find(".pns-bookmark-count")
        .addClass(textSpan.get(0).className);
    } else {
      bookmarkDiv
        .find("span:last")
        .addClass("pns-bookmark-count")
        .parent()
        .addClass("pns-bookmark-div");
    }
    tagDiv.children().eq(0).empty().addClass("pns-tag-list");
    const descDiv = tagDiv.children().eq(1);
    descDiv.children().eq(0).addClass("pns-desc");
    // 右下角爱心
    const likeDiv = detailDiv.children().eq(2).children().eq(1);
    const svg = likeDiv.find("svg");
    svg.attr("class", svg.attr("class") + " pns-like");
    likeDiv.find("path:first").css("color", "rgb(31, 31, 31)");
    likeDiv.find("path:last").css("fill", "rgb(255, 255, 255)");

    return template;
  }

  function fillTemplate(template, novel) {
    if (template == null || novel == null) {
      return null;
    }
    const link = template
      .find(".pns-link:first")
      .attr("href")
      .replace(/id=\d+/g, "id=" + novel.id);
    template.find(".pns-link").attr("href", link);
    template.find(".pns-img").attr("src", novel.url);
    if (novel.seriesId) {
      const seriesLink = template
        .find(".pns-series")
        .attr("href")
        .replace(/\d+$/, novel.seriesId);
      template
        .find(".pns-series")
        .text(novel.seriesTitle)
        .attr("title", novel.seriesTitle)
        .attr("href", seriesLink);
    } else {
      template.find(".pns-series").hide();
    }
    template.find(".pns-title").text(novel.title).attr("title", novel.title);
    template.find(".pns-title").parent().attr("title", novel.title);
    const authorLink = template
      .find(".pns-author")
      .attr("href")
      .replace(/\d+$/, novel.userId);
    template.find(".pns-author").text(novel.userName).attr("href", authorLink);
    template
      .find(".pns-author-img")
      .attr("href", authorLink)
      .find("img")
      .attr("src", novel.profileImageUrl);
    template.find(".pns-text-count").text(novel.textCount + "文字");
    if (novel.bookmarkCount == 0) {
      template.find(".pns-bookmark-div").hide();
    } else {
      template.find(".pns-bookmark-count").text(novel.bookmarkCount);
    }
    const tagList = template.find(".pns-tag-list");
    let search = getSearchParamsWithoutPage();
    if (search.length > 0) {
      search = "?" + search;
    }
    $.each(novel.tags, function (i, tag) {
      const tagItem = $(
        '<span"><a style="color: rgb(61, 118, 153);" href="/tags/' +
          encodeURIComponent(tag) +
          "/novels" +
          search +
          '">' +
          tag +
          "</a></span>"
      );
      if (tag == "R-18" || tag == "R-18G") {
        tagItem
          .find("a")
          .css({ color: "rgb(255, 64, 96)", "font-weight": "bold" })
          .text(tag);
      }
      tagList.append(tagItem);
    });
    template
      .find(".pns-desc")
      .html(novel.description)
      .attr("title", template.find(".pns-desc").text());
    const like = template.find(".pns-like");
    like.attr("novel-id", novel.id);
    if (novel.bookmarkData) {
      like.attr("bookmark-id", novel.bookmarkData.id);
      like.find("path:first").css("color", "rgb(255, 64, 96)");
      like.find("path:last").css("fill", "rgb(255, 64, 96)");
    }
    like.click(function () {
      if ($(this).attr("disable")) {
        return;
      }
      const bid = $(this).attr("bookmark-id");
      const nid = $(this).attr("novel-id");
      if (bid) {
        deleteBookmark($(this), bid);
      } else {
        addBookmark($(this), nid, 0);
      }
      $(this).blur();
    });
    if (g_settings.linkBlank) {
      template.find("a").attr("target", "_blank");
    }
    return template;
  }

  function getNovelByPage(key, from, to, total) {
    if (total == undefined) {
      total = to - from;
    }

    let url =
      location.origin +
      g_getNovelUrl.replace(/#key#/g, key).replace(/#page#/g, from);
    const search = getSearchParamsWithoutPage();
    if (search.length > 0) {
      url += "&" + search;
    }

    updateProgress(
      Texts[g_language].nsort_getWorks
        .replace("1%", total - to + from + 1)
        .replace("2%", total)
    );

    let novelList = [];
    function onLoadFinish(data, resolve) {
      if (data && data.body && data.body.novel && data.body.novel.data) {
        novelList = novelList.concat(data.body.novel.data);
      }

      if (from == to - 1) {
        resolve(novelList);
      } else {
        getNovelByPage(key, from + 1, to, total).then(function (list) {
          if (list && list.length > 0) {
            novelList = novelList.concat(list);
          }
          resolve(novelList);
        });
      }
    }

    return new Promise(function (resolve, reject) {
      $.ajax({
        url: url,
        success: function (data) {
          onLoadFinish(data, resolve);
        },
        error: function () {
          DoLog(LogLevel.Error, "get novel page " + from + " failed!");
          onLoadFinish(null, resolve);
        },
      });
    });
  }

  function sortNovel(list) {
    updateProgress(Texts[g_language].nsort_sorting);
    // 排序
    list.sort(function (a, b) {
      let bookmarkA = a.bookmarkCount;
      let bookmarkB = b.bookmarkCount;
      if (!bookmarkA) {
        bookmarkA = 0;
      }
      if (!bookmarkB) {
        bookmarkB = 0;
      }
      if (bookmarkA > bookmarkB) {
        return -1;
      }
      if (bookmarkA < bookmarkB) {
        return 1;
      }
      return 0;
    });
    // 筛选
    const filteredList = [];
    $.each(list, function (i, e) {
      // 收藏量筛选
      let bookmark = e.bookmarkCount;
      if (!bookmark) {
        bookmark = 0;
      }
      if (bookmark < g_settings.novelFavFilter) {
        return true;
      }
      // 已收藏筛选
      if (g_settings.novelHideFavorite && e.bookmarkData) {
        return true;
      }
      filteredList.push(e);
    });
    return filteredList;
  }

  function rearrangeNovel(list) {
    const ul = findNovelSection();
    if (ul == null) {
      return;
    }
    const template = getNovelTemplate(ul);
    if (template == null) {
      return;
    }
    const newList = [];
    $.each(list, function (i, novel) {
      const e = fillTemplate(template.clone(true), novel);
      if (e != null) {
        newList.push(e);
      }
    });
    ul.empty();
    $.each(newList, function (i, e) {
      $(e).css("display", "block");
      ul.append(e);
    });
    hideLoading();
  }

  function getKeyWord() {
    const match = location.pathname.match(/\/tags\/(.+)\/novels/);
    if (!match) {
      return "";
    }
    return match[1];
  }

  function getCurrentPage() {
    const match = location.search.match(/p=(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
    return 1;
  }

  function showLoading() {
    const ul = findNovelSection();
    if (ul == null) {
      iLog.e("Can not found novel section!");
      return;
    }

    ul.hide().before(
      '<div id="loading" style="width:100%;text-align:center;"><img src="' +
        g_loadingImage +
        '" /><p id="progress" style="text-align: center;font-size: large;font-weight: bold;padding-top: 10px;">0%</p></div>'
    );
  }

  function hideLoading() {
    const ul = findNovelSection();
    if (ul == null) {
      iLog.e("Can not found novel section!");
      return;
    }

    $("#loading").remove();
    ul.show();
  }

  function updateProgress(msg) {
    const p = $("#progress");
    p.text(msg);
  }

  function addBookmark(element, novelId, restrict) {
    if (g_csrfToken == "") {
      iLog.e("No g_csrfToken, failed to add bookmark!");
      alert("获取 Token 失败，无法添加，请到详情页操作。");
      return;
    }
    element.attr("disable", "disable");
    iLog.i("add bookmark: " + novelId);
    $.ajax("/ajax/novels/bookmarks/add", {
      method: "POST",
      contentType: "application/json;charset=utf-8",
      headers: { "x-csrf-token": g_csrfToken },
      data:
        '{"novel_id":"' +
        novelId +
        '","restrict":' +
        restrict +
        ',"comment":"","tags":[]}',
      success: function (data) {
        iLog.i("add novel bookmark result: ");
        iLog.d(data);
        if (data.error) {
          iLog.e("Server returned an error: " + data.message);
          return;
        }
        const bookmarkId = data.body;
        iLog.i("Add novel bookmark success, bookmarkId is " + bookmarkId);
        element.attr("bookmark-id", bookmarkId);
        element.find("path:first").css("color", "rgb(255, 64, 96)");
        element.find("path:last").css("fill", "rgb(255, 64, 96)");
        element.removeAttr("disable");
      },
      error: function () {
        element.removeAttr("disable");
      },
    });
  }

  function deleteBookmark(element, bookmarkId) {
    if (g_csrfToken == "") {
      iLog.e("No g_csrfToken, failed to add bookmark!");
      alert("获取 Token 失败，无法添加，请到详情页操作。");
      return;
    }
    element.attr("disable", "disable");
    iLog.i("delete bookmark: " + bookmarkId);
    $.ajax("/ajax/novels/bookmarks/delete", {
      method: "POST",
      headers: { "x-csrf-token": g_csrfToken },
      data: { del: 1, book_id: bookmarkId },
      success: function (data) {
        iLog.i("delete novel bookmark result: ");
        iLog.d(data);
        if (data.error) {
          iLog.e("Server returned an error: " + data.message);
          return;
        }
        iLog.i("delete novel bookmark success");
        element.removeAttr("bookmark-id");
        element.find("path:first").css("color", "rgb(31, 31, 31)");
        element.find("path:last").css("fill", "rgb(255, 255, 255)");
        element.removeAttr("disable");
      },
      error: function () {
        element.removeAttr("disable");
      },
    });
  }

  function changePageSelector() {
    const pager = Pages[PageType.NovelSearch].GetPageSelector();
    if (pager.length == 0) {
      iLog.e("can not found page selector!");
      return;
    }
    const left = pager
      .find("a:first")
      .clone()
      .attr("aria-disabled", "false")
      .removeAttr("hidden")
      .addClass("pp-prevPage");
    const right = pager
      .find("a:last")
      .clone()
      .attr("aria-disabled", "false")
      .removeAttr("hidden")
      .addClass("pp-nextPage");
    const normal = pager.find("a").eq(1).clone().removeAttr("href");
    let href = location.href;
    const match = href.match(/[?&]p=(\d+)/);
    let page = 1;
    if (match) {
      page = parseInt(match[1]);
    } else {
      if (location.search == "") {
        href += "?p=1";
      } else {
        href += "&p=1";
      }
    }
    if (page == 1) {
      left.attr("hidden", "hidden");
    }
    pager.empty();
    const lp = page - g_settings.novelPageCount;
    left.attr(
      "href",
      href.replace("?p=" + page, "?p=" + lp).replace("&p=" + page, "&p=" + lp)
    );
    pager.append(left);
    const s = "Previewer";
    for (let i = 0; i < s.length; ++i) {
      const n = normal.clone().text(s[i]);
      pager.append(n);
    }
    const rp = page + g_settings.novelPageCount;
    right.attr(
      "href",
      href.replace("?p=" + page, "?p=" + rp).replace("&p=" + page, "&p=" + rp)
    );
    pager.append(right);
  }

  function listnerToKeyBoard() {
    $(document).keydown(function (e) {
      if (g_settings.pageByKey != 1) {
        return;
      }
      if (e.keyCode == 39) {
        const btn = $(".pp-nextPage");
        if (btn.length < 1 || btn.attr("hidden") == "hidden") {
          return;
        }
        location.href = btn.attr("href");
      } else if (e.keyCode == 37) {
        const btn = $(".pp-prevPage");
        if (btn.length < 1 || btn.attr("hidden") == "hidden") {
          return;
        }
        location.href = btn.attr("href");
      }
    });
  }

  function main() {
    const keyWord = getKeyWord();
    if (keyWord.length == 0) {
      DoLog(LogLevel.Error, "Parse key word error.");
      return;
    }
    const currentPage = getCurrentPage();

    if (
      $(".gtm-novel-searchpage-gs-toggle-button").attr("data-gtm-label") ==
      "off"
    ) {
      showLoading();
      $(".gtm-novel-searchpage-gs-toggle-button").parent().next().text();
      // 不常见，不要多语言了
      $("#loading")
        .find("#progress")
        .text(
          '由于启用了 "' +
            $(".gtm-novel-searchpage-gs-toggle-button").parent().next().text() +
            '"，无法进行排序。'
        );
      setTimeout(() => hideLoading(), 3000);
      return;
    }

    showLoading();
    changePageSelector();
    listnerToKeyBoard();
    getNovelByPage(
      keyWord,
      currentPage,
      currentPage + g_settings.novelPageCount
    ).then(function (novelList) {
      rearrangeNovel(sortNovel(novelList));
    });
  }

  main();
}
/* ---------------------------------------- 设置 ---------------------------------------- */
function SetLocalStorage(name, value) {
  localStorage.setItem(name, JSON.stringify(value));
}
function GetLocalStorage(name) {
  const value = localStorage.getItem(name);
  if (!value) return null;
  return value;
}
function SetCookie(name, value, days) {
  let Days = 180;
  if (days) {
    Days = days;
  }
  const exp = new Date();
  exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
  const str = JSON.stringify(value);
  document.cookie =
    name + "=" + str + ";expires=" + exp.toGMTString() + ";path=/";
}
function GetCookie(name) {
  let arr;
  const reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
  if ((arr = document.cookie.match(reg))) {
    return unescape(arr[2]);
  } else {
    return null;
  }
}
function ShowInstallMessage() {
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

  bg.get(0).innerHTML =
    '<img id="pps-close"src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Close.png"style="position: absolute; right: 35px; top: 20px; width: 32px; height: 32px; cursor: pointer;"><div style="position: absolute;width: 40%;left: 30%;top: 25%;font-size: 25px; text-align: center; color: white;">' +
    Texts[g_language].install_title +
    g_version +
    "</div><br>" +
    Texts[g_language].install_body;
  $("#pps-close").click(function () {
    $("#pp-bg").remove();
  });
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

  const body = Texts[g_language].upgrade_body;
  bg.get(0).innerHTML =
    '<img id="pps-close"src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Close.png"style="position: absolute; right: 35px; top: 20px; width: 32px; height: 32px; cursor: pointer;"><div style="position: absolute; width: 40%; left: 30%; top: 25%; font-size: 25px; font-weight: bold; text-align: center; color: white;">' +
    Texts[g_language].install_title +
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
  $.each(g_defaultSettings, function (k, v) {
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
  let settings;

  const settingsData =
    GetLocalStorage("PixivPreview") || GetCookie("PixivPreview");
  if (settingsData == null || settingsData == "null") {
    // 新安装
    settings = g_defaultSettings;
    SetLocalStorage("PixivPreview", settings);
    //ShowInstallMessage();
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
    Texts[g_language].setting_save +
    "</button>" +
    '<button id="pps-reset" style="font-size: 25px; border-radius: 12px; height: 48px; min-width: 138px; max-width: 150px; background-color: darkred; color: white; margin: 0 32px 0 32px; cursor: pointer; border: none;">' +
    Texts[g_language].setting_reset +
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
  function getSelectAction(id) {
    return (
      '<select id="' +
      id +
      '" style="font-size: 20px; margin-right: 10px;"></select>'
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
  addItem(getSelectAction("pps-lang"), Texts[g_language].setting_language);
  addItem("", "&nbsp");
  addItem(getImageAction("pps-preview"), Texts[g_language].setting_preview);
  addItem(
    getImageAction("pps-animePreview"),
    Texts[g_language].setting_animePreview
  );
  addItem(
    getInputAction("pps-previewDelay"),
    Texts[g_language].setting_previewDelay
  );
  addItem("", "&nbsp");
  addItem(getImageAction("pps-sort"), Texts[g_language].setting_sort);
  addItem(getInputAction("pps-maxPage"), Texts[g_language].setting_maxPage);
  addItem(getInputAction("pps-hideLess"), Texts[g_language].setting_hideWork);
  addItem(getImageAction("pps-hideAi"), Texts[g_language].setting_hideAiWork);
  addItem(
    getImageAction("pps-hideBookmarked"),
    Texts[g_language].setting_hideFav
  );
  addItem(
    getImageAction("pps-hideFollowed"),
    Texts[g_language].setting_hideFollowed +
      '&nbsp<button id="pps-clearFollowingCache" style="cursor:pointer;background-color:gold;border-radius:12px;border:none;font-size:20px;padding:3px 10px;" title="' +
      Texts[g_language].setting_clearFollowingCacheHelp +
      '">' +
      Texts[g_language].setting_clearFollowingCache +
      "</button>"
  );
  addItem(getImageAction("pps-hideByTag"), Texts[g_language].setting_hideByTag);
  addItem(
    '<input id="pps-hideByTagList" style="font-size: 18px;padding: 0;border-width: 0px;text-align: center;width: 95%;" placeholder="' +
      Texts[g_language].setting_hideByTagPlaceholder +
      '">',
    ""
  );
  addItem(getImageAction("pps-newTab"), Texts[g_language].setting_blank);
  addItem(getImageAction("pps-pageKey"), Texts[g_language].setting_turnPage);

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
  $("#pps-sort")
    .attr("src", settings.enableSort ? imgOn : imgOff)
    .addClass(settings.enableSort ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-previewDelay").val(settings.previewDelay);
  $("#pps-maxPage").val(settings.pageCount);
  $("#pps-hideLess").val(settings.favFilter);
  $("#pps-hideAi")
    .attr("src", settings.aiFilter ? imgOn : imgOff)
    .addClass(settings.aiFilter ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-hideBookmarked")
    .attr("src", settings.hideFavorite ? imgOn : imgOff)
    .addClass(settings.hideFavorite ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-hideFollowed")
    .attr("src", settings.hideFollowed ? imgOn : imgOff)
    .addClass(settings.hideFollowed ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-hideByTag")
    .attr("src", settings.hideByTag ? imgOn : imgOff)
    .addClass(settings.hideFollowed ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-hideByTagList").val(settings.hideByTagList);
  $("#pps-newTab")
    .attr("src", settings.linkBlank ? imgOn : imgOff)
    .addClass(settings.linkBlank ? "on" : "off")
    .css("cursor: pointer");
  $("#pps-pageKey")
    .attr("src", settings.pageByKey ? imgOn : imgOff)
    .addClass(settings.pageByKey ? "on" : "off")
    .css("cursor: pointer");

  $("#pps-lang")
    .append('<option value="-1">Auto</option>')
    .append('<option value="' + Lang.zh_CN + '">简体中文</option>')
    .append('<option value="' + Lang.en_US + '">English</option>')
    .append('<option value="' + Lang.ru_RU + '">Русский язык</option>')
    .append('<option value="' + Lang.ja_JP + '">日本語</option>')
    .val(g_settings.lang == undefined ? Lang.auto : g_settings.lang);

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
  $("#pps-clearFollowingCache").click(function () {
    const user_id = dataLayer[0].user_id;
    SetLocalStorage("followingOfUid-" + user_id, null, -1);
    alert(Texts[g_language].setting_followingCacheCleared);
  });

  $("#pps-save").click(function () {
    if ($("#pps-maxPage").val() === "") {
      $("#pps-maxPage").val(g_defaultSettings.pageCount);
    }
    if ($("#pps-hideLess").val() == "") {
      $("#pps-hideLess").val(g_defaultSettings.favFilter);
    }

    const settings: GlobalSettings = {
      lang: Number($("#pps-lang").val()) as Lang,

      enablePreview: $("#pps-preview").hasClass("on") ? 1 : 0,
      enableAnimePreview: $("#pps-animePreview").hasClass("on") ? 1 : 0,
      previewDelay: parseInt(String($("#pps-previewDelay").val())),

      enableSort: $("#pps-sort").hasClass("on") ? 1 : 0,
      pageCount: parseInt(String($("#pps-maxPage").val())),
      favFilter: parseInt(String($("#pps-hideLess").val())),
      aiFilter: $("#pps-hideAi").hasClass("on") ? 1 : 0,
      hideFavorite: $("#pps-hideBookmarked").hasClass("on") ? 1 : 0,
      hideFollowed: $("#pps-hideFollowed").hasClass("on") ? 1 : 0,
      hideByTag: $("#pps-hideByTag").hasClass("on") ? 1 : 0,
      hideByTagList: String($("#pps-hideByTagList").val()),

      linkBlank: $("#pps-newTab").hasClass("on") ? 1 : 0,
      pageByKey: $("#pps-pageKey").hasClass("on") ? 1 : 0,

      version: g_version,
    };

    SetLocalStorage("PixivPreview", settings);
    location.reload();
  });

  $("#pps-reset").click(function () {
    const comfirmText = Texts[g_language].setting_resetHint;
    if (confirm(comfirmText)) {
      SetLocalStorage("PixivPreview", null);
      location.reload();
    }
  });

  $("#pps-close").click(function () {
    $("#pp-bg").remove();
  });
}

/* --------------------------------------- 主函数 --------------------------------------- */
let loadInterval;
function AutoDetectLanguage() {
  g_language = Lang.auto;
  if (g_settings && g_settings.lang) {
    g_language = g_settings.lang;
  }
  if (g_language == Lang.auto) {
    const lang = $("html").attr("lang");
    if (lang && lang.indexOf("zh") != -1) {
      // 简体中文和繁体中文都用简体中文
      g_language = Lang.zh_CN;
    } else if (lang && lang.indexOf("ja") != -1) {
      g_language = Lang.ja_JP;
    } else {
      // 其他的统一用英语，其他语言也不知道谷歌翻译得对不对
      g_language = Lang.en_US;
    }
  }
}

function Load() {
  // 匹配当前页面
  for (let i = 0; i < PageType.PageTypeCount; i++) {
    if (Pages[i].CheckUrl(location.href)) {
      g_pageType = i;
      break;
    }
  }

  if (g_pageType >= 0) {
    DoLog(LogLevel.Info, "Current page is " + Pages[g_pageType].PageTypeString);
  } else {
    DoLog(LogLevel.Info, "Unsupported page.");
    clearInterval(loadInterval);
    return;
  }

  // 设置按钮
  const toolBar = Pages[g_pageType].GetToolBar();
  if (toolBar) {
    DoLog(LogLevel.Elements, toolBar);
    clearInterval(loadInterval);
  } else {
    DoLog(LogLevel.Warning, "Get toolbar failed.");
    return;
  }

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

  // GetSettings 内部需要 g_language，先使用自动探测的语言
  AutoDetectLanguage();

  // 读取设置
  g_settings = GetSettings();

  // 自动检测语言
  AutoDetectLanguage();

  if ($("#pp-sort").length === 0 && !g_settings?.enableSort) {
    const newListItem = toolBar.firstChild.cloneNode(true);
    newListItem.innerHTML = "";
    const newButton = document.createElement("button");
    newButton.id = "pp-sort";
    newButton.style.cssText =
      "background-color: rgb(0, 0, 0); margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 0px; border-radius: 24px; width: 48px; height: 48px;";
    newButton.innerHTML = `<span style="color: white;vertical-align: text-top;">${Texts[g_language].text_sort}</span>`;
    newListItem.appendChild(newButton);
    toolBar.appendChild(newListItem);

    $(newButton).click(function () {
      this.disabled = true;
      runPixivPreview(true);
      setTimeout(() => {
        this.disabled = false;
      }, 7000);
    });
  }

  // A fixed next page button next to the setting button
  if ($("#pp-nextPage-fixed").length === 0) {
    const newListItem = toolBar.firstChild.cloneNode(true);
    newListItem.innerHTML = "";
    const newButton = document.createElement("button");
    newButton.id = "pp-nextPage-fixed";
    newButton.style.cssText =
      "background-color: rgb(0, 0, 0); margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 12px; border-radius: 24px; width: 48px; height: 48px;";
    newButton.innerHTML =
      '<svg viewBox="0 0 120 120" width="24" height="24" stroke="white" fill="none" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(90deg);"> <polyline points="60,105 60,8"></polyline> <polyline points="10,57 60,8 110,57"></polyline> </svg>';
    newListItem.appendChild(newButton);
    toolBar.appendChild(newListItem);

    $(newButton).click(function () {
      let nextPageHref = null;

      // Try to reuse .pp-nextPage, otherwise fallback to Pixiv native paginator's last link (>)
      const nextPageAnchor = $(".pp-nextPage");
      if (
        nextPageAnchor.length > 0 &&
        nextPageAnchor.attr("hidden") !== "hidden"
      ) {
        nextPageHref = nextPageAnchor.attr("href");
      } else {
        nextPageHref =
          (
            Array.from(document.querySelectorAll("nav")).find((nav) =>
              Array.from(nav.children)
                .filter((el) => el.tagName === "A")
                .every((el: HTMLAnchorElement) => /\?p=\d+$/.test(el.href))
            )?.lastElementChild as HTMLAnchorElement
          )?.href ?? null;
      }

      // Open the next page if available
      if (nextPageHref != null) {
        location.href = nextPageHref;
      }
    });
  }

  if ($("#pp-settings").length === 0) {
    const newListItem = toolBar.firstChild.cloneNode(true);
    newListItem.innerHTML = "";
    const newButton = document.createElement("button");
    newButton.id = "pp-settings";
    newButton.style.cssText =
      "background-color: rgb(0, 0, 0); margin-top: 5px; opacity: 0.8; cursor: pointer; border: none; padding: 12px; border-radius: 24px; width: 48px; height: 48px;";
    newButton.innerHTML =
      '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve" style="fill: white;"><metadata> Svg Vector Icons : http://www.sfont.cn </metadata><g><path d="M377.5,500c0,67.7,54.8,122.5,122.5,122.5S622.5,567.7,622.5,500S567.7,377.5,500,377.5S377.5,432.3,377.5,500z"></path><path d="M990,546v-94.8L856.2,411c-8.9-35.8-23-69.4-41.6-100.2L879,186L812,119L689,185.2c-30.8-18.5-64.4-32.6-100.2-41.5L545.9,10h-94.8L411,143.8c-35.8,8.9-69.5,23-100.2,41.5L186.1,121l-67,66.9L185.2,311c-18.6,30.8-32.6,64.4-41.5,100.3L10,454v94.8L143.8,589c8.9,35.8,23,69.4,41.6,100.2L121,814l67,67l123-66.2c30.8,18.6,64.5,32.6,100.3,41.5L454,990h94.8L589,856.2c35.8-8.9,69.4-23,100.2-41.6L814,879l67-67l-66.2-123.1c18.6-30.7,32.6-64.4,41.5-100.2L990,546z M500,745c-135.3,0-245-109.7-245-245c0-135.3,109.7-245,245-245s245,109.7,245,245C745,635.3,635.3,745,500,745z"></path></g></svg>';
    newListItem.appendChild(newButton);
    toolBar.appendChild(newListItem);

    $(newButton).click(function () {
      ShowSetting();
    });
  }

  // g_csrfToken
  if (g_pageType == PageType.Search || g_pageType == PageType.NovelSearch) {
    $.get(location.href, function (data) {
      const matched = data.match(/token":"([a-z0-9]{32})/);
      if (matched.length > 0) {
        g_csrfToken = matched[1];
        DoLog(LogLevel.Info, "Got g_csrfToken: " + g_csrfToken);
      } else {
        DoLog(
          LogLevel.Error,
          "Can not get g_csrfToken, so you can not add works to bookmark when sorting has enabled."
        );
      }
    });
  }

  function runPixivPreview(eventFromButton = false) {
    iLog.i("Global settings", g_settings);
    try {
      if (g_settings.enablePreview) {
        try {
          loadIllustPreview(g_settings);
        } catch (error) {
          iLog.e(`An error occurred while loading illust preview: ${error}`);
        }
      }

      if (g_pageType == PageType.Artwork) {
        Pages[g_pageType].Work();
      } else if (g_pageType == PageType.Search) {
        if (g_settings.enableSort || eventFromButton) {
          g_sortComplete = false;
          PixivSK(function () {
            g_sortComplete = true;
          });
        }
      } else if (g_pageType == PageType.NovelSearch) {
        if (g_settings.enableNovelSort || eventFromButton) {
          PixivNS();
        }
      }
    } catch (e) {
      DoLog(LogLevel.Error, "Unknown error: " + e);
    }
  }

  // 排序、预览
  runPixivPreview();
}

const startLoad = () => {
  loadInterval = setInterval(Load, 1000);
  setInterval(function () {
    if (location.href != initialUrl) {
      // 排序中点击搜索tag，可能导致进行中的排序出现混乱，加取消太麻烦，直接走刷新
      if (!g_sortComplete) {
        location.reload();
        return;
      }
      initialUrl = location.href;
      clearInterval(loadInterval);
      g_pageType = -1;
      loadInterval = setInterval(Load, 300);
    }
  }, 1000);
};

startLoad();
