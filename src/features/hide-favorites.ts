let isHidden = false;

const hideFavorites = () => {
  const svgs = $("svg");
  const favoriteSvgs = svgs.filter(function () {
    return $(this).css("color") === "rgb(255, 64, 96)";
  });
  favoriteSvgs.each(function () {
    // 兼容常规页面和搜索页 https://www.pixiv.net/search?q=*&s_mode=tag&type=illust_ugoira
    const listItem: JQuery<HTMLElement> = $(this).closest("li, div.col-span-2");
    // if (listItem.length === 0) {
    //   // 兼容主页关注作者新作品 https://www.pixiv.net/illustration
    //   // 由于此处左右滚动时会动态加载内容，隐藏后会产生预期外现象，故关闭此功能
    //   const listDom = $(this).closest("ol, ul");
    //   if (listDom.length > 0) {
    //     listItem = listDom.children().has($(this));
    //   }
    // }
    listItem.hide();
    listItem.attr("data-pp-fav-hidden", "true");
  });
  isHidden = true;
};

const showFavorites = () => {
  const hiddenItems = $("[data-pp-fav-hidden]");
  hiddenItems.show();
  hiddenItems.removeAttr("data-pp-fav-hidden");
  isHidden = false;
};

const toggleDisplayFavorites = () => {
  if (isHidden) {
    showFavorites();
  } else {
    hideFavorites();
  }
};

export { hideFavorites, showFavorites };
export default toggleDisplayFavorites;
