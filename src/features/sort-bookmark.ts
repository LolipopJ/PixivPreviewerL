import { deleteCachedIllustrationDetails } from "../databases";
import Texts from "../i18n";
import heartIcon from "../icons/heart.svg";
import heartFilledIcon from "../icons/heart-filled.svg";
import { addBookmark, deleteBookmark } from "../services/bookmark";
import { injectStyle } from "../utils/dom";
import { iLog } from "../utils/logger";
import { showSortError } from "./sort-notice";

export const createSortBookmarkButton = (
  illustId: string,
  initialBookmarkId: string | undefined,
  onToggle: (bookmarked: boolean) => void
) => {
  injectStyle(
    `
      .pp-sort-bookmark {
        position: absolute; right: 4px; bottom: 4px;
        display: grid; place-items: end center; width: 36px; height: 36px;
        padding: 0; border: 0; border-radius: 50%;
        background: transparent; cursor: pointer;
      }
      .pp-sort-bookmark:disabled { cursor: wait; opacity: .65; }
      .pp-sort-bookmark:focus-visible { outline: 2px solid #0096fa; }
      .pp-sort-bookmark svg {
        display: block; width: 32px; height: 32px;
        /* 补偿 SVG 底部留白，使爱心图案的底边与收藏数对齐。 */
        transform: translateY(4.6px);
      }
    `,
    "pp-sort-bookmark-style"
  );

  let bookmarkId = initialBookmarkId;
  const button = $("<button>")
    .attr({ type: "button", "aria-label": Texts.sort_bookmark })
    .addClass("pp-sort-bookmark");
  const render = () => {
    button
      .attr({
        "aria-pressed": String(Boolean(bookmarkId)),
        title: bookmarkId ? Texts.sort_removeBookmark : Texts.sort_bookmark,
      })
      .html(bookmarkId ? heartFilledIcon : heartIcon)
      .find("svg")
      .attr("aria-hidden", "true");
  };
  render();

  button.on("click", async (event) => {
    event.stopPropagation();
    if (button.prop("disabled")) return;
    button.prop("disabled", true).attr("aria-busy", "true");
    try {
      if (bookmarkId) {
        await deleteBookmark(bookmarkId);
        bookmarkId = undefined;
      } else {
        bookmarkId = await addBookmark(illustId);
      }
      render();
      onToggle(Boolean(bookmarkId));
      void deleteCachedIllustrationDetails([illustId]);
    } catch (error) {
      iLog.e("Failed to change bookmark for illustration:", illustId, error);
      const element = button.get(0);
      if (element?.isConnected) {
        showSortError(error, Texts.sort_bookmarkFailed, element);
      }
    } finally {
      button.prop("disabled", false).removeAttr("aria-busy");
    }
  });
  return button;
};
