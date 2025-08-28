let isHidden = false;

const hideFavorites = () => {
  if (/^https?:\/\/www.pixiv.net(\/en)?\/ranking.php.*/.test(location.href)) {
    const bookmarks = $("div._one-click-bookmark.on");
    bookmarks.each(function () {
      const sectionItem = $(this).closest("section.ranking-item");
      sectionItem.hide();
      sectionItem.attr("data-pp-fav-hidden", "true");
    });
  } else {
    const svgs = $("svg");
    const favoriteSvgs = svgs.filter(function () {
      return $(this).css("color") === "rgb(255, 64, 96)";
    });
    favoriteSvgs.each(function () {
      const listItem = $(this).closest("li");
      listItem.hide();
      listItem.attr("data-pp-fav-hidden", "true");
    });
  }
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
