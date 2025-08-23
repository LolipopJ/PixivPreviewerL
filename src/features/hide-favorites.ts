let isHidden = false;

const hideFavorites = () => {
  const svgs = $("svg");
  const favoriteSvgs = svgs.filter(function () {
    return $(this).css("color") === "rgb(255, 64, 96)";
  });
  favoriteSvgs.each(function () {
    const listItem = $(this).closest("li");
    listItem.hide();
    listItem.attr("data-pp-hidden", "true");
  });
  isHidden = true;
};

const showFavorites = () => {
  const listItems = $("li[data-pp-hidden]");
  listItems.show();
  listItems.removeAttr("data-pp-hidden");
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
