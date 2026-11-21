import { SORT_BUTTON_ID } from "../constants";
import Texts, { formatText } from "../i18n";
import { injectStyle } from "../utils/dom";

export const SORT_ERROR_PANEL_ID = "pp-sort-error";
export const SORT_RATE_LIMIT_PANEL_ID = "pp-sort-rate-limit";

const showSortNotice = (
  id: string,
  title: string,
  message: string,
  actions: JQuery
) => {
  injectStyle(
    `
      .pp-sort-notice {
        position: fixed; right: 20px; bottom: 20px; z-index: 100002;
        width: min(400px, calc(100vw - 40px)); max-height: calc(100vh - 40px);
        box-sizing: border-box; padding: 14px 16px; overflow: auto;
        overflow-wrap: anywhere; font: 14px/1.5 sans-serif;
        color-scheme: light dark; background: Canvas; color: CanvasText;
        border: 1px solid GrayText; border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, .24);
      }
      #${SORT_RATE_LIMIT_PANEL_ID} { z-index: 100003; }
      .pp-sort-notice p { margin: 6px 0 12px; }
      .pp-sort-notice footer {
        display: flex; align-items: center; flex-wrap: wrap;
        justify-content: space-between; gap: 8px;
      }
      .pp-sort-notice a { color: LinkText; text-decoration: underline; }
      .pp-sort-notice button {
        padding: 4px 8px; border: 1px solid GrayText; border-radius: 6px;
        background: Canvas; color: inherit; font: inherit; cursor: pointer;
      }
      .pp-sort-notice :is(a, button):focus-visible {
        outline: 2px solid Highlight; outline-offset: 2px;
      }
    `,
    "pp-sort-notice-style"
  );

  $(`#${id}`).remove();
  const alert = $("<div>").attr("role", "alert");
  const panel = $("<aside>")
    .attr("id", id)
    .addClass("pp-sort-notice")
    .append(alert, $("<footer>").append(actions))
    .appendTo("body");
  alert.append($("<strong>").text(title), $("<p>").text(message));
  return panel;
};

export const showSortError = (
  error: unknown,
  title = Texts.sort_failed,
  returnFocus = document.getElementById(SORT_BUTTON_ID)
) => {
  const message = error instanceof Error ? error.message : String(error);
  const close = () => {
    const hadFocus = panel.get(0)?.contains(document.activeElement);
    panel.remove();
    if (hadFocus) returnFocus?.focus();
  };
  const issueLink = $("<a>")
    .attr({
      href: process.env.BUG_REPORT_PAGE,
      target: "_blank",
      rel: "noopener noreferrer",
    })
    .text(Texts.sort_reportIssue);
  const closeButton = $("<button>")
    .attr("type", "button")
    .text(Texts.close)
    .on("click", close);
  const panel = showSortNotice(
    SORT_ERROR_PANEL_ID,
    title,
    message,
    issueLink.add(closeButton)
  );
  panel.on("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    close();
  });
};

export const showSortRateLimit = (abort: () => void) => {
  const button = $("<button>")
    .attr("type", "button")
    .text(Texts.sort_abort)
    .on("click", () => {
      const hadFocus = button.is(":focus");
      abort();
      panel.remove();
      if (hadFocus) document.getElementById(SORT_BUTTON_ID)?.focus();
    });
  const panel = showSortNotice(
    SORT_RATE_LIMIT_PANEL_ID,
    Texts.sort_rateLimited,
    Texts.sort_rateLimitHelp,
    button
  );
  return {
    setRetryTimes: (retryTimes: number) =>
      panel
        .find("p")
        .text(
          `${Texts.sort_rateLimitHelp} ${formatText(Texts.sort_rateLimitRetry, retryTimes)}`
        ),
    remove: () => panel.remove(),
  };
};
