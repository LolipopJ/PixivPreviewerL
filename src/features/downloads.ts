import downloadIcon from "../icons/download.svg";
import retryIcon from "../icons/retry.svg";
import stopIcon from "../icons/stop.svg";
import {
  abortDownload,
  clearCompletedDownloads,
  type DownloadRecord,
  getDownloads,
  ignoreRetryableDownloads,
  isDownloadingInThisTab,
  retryDownload,
  subscribeDownloads,
} from "../services/download";

const BUTTON_ID = "pp-downloads-button";
const PANEL_ID = "pp-downloads-panel";

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const createIconButton = (
  label: string,
  icon: string,
  className: string,
  onClick: () => void
) =>
  $("<button>")
    .attr({ type: "button", title: label, "aria-label": label })
    .addClass(`pp-download-icon ${className}`)
    .html(icon)
    .on("click", onClick);

export const loadDownloadPanel = (toolbar: HTMLElement) => {
  if (document.getElementById(BUTTON_ID)) return;

  $("<style>")
    .text(
      `
      .pp-toolbar-button {
        position: relative; box-sizing: border-box; display: flex;
        align-items: center; justify-content: center; width: 48px; height: 48px;
        margin-top: 5px; padding: 0; border: 0; border-radius: 50%;
        background: rgba(0, 0, 0, .55); color: #fff; cursor: pointer;
      }
      .pp-toolbar-button:hover { background: rgba(0, 0, 0, .75); }
      .pp-toolbar-button:focus-visible { outline: 3px solid #0096fa; outline-offset: 3px; }
      .pp-toolbar-button svg { display: block; width: 24px; height: 24px; }
      #${BUTTON_ID} svg { width: 20px; height: 20px; }
      .pp-toolbar-button[aria-busy="true"] svg { animation: pp-toolbar-pulse 1s ease-in-out infinite; }
      #${BUTTON_ID}[data-active="true"] svg { animation: pp-download-bounce 1s ease-in-out infinite; }
      #${BUTTON_ID} .pp-download-count {
        position: absolute; top: 0; right: 0; box-sizing: border-box;
        display: flex; align-items: center; justify-content: center;
        min-width: 18px; height: 18px; padding: 0 4px;
        border: 2px solid #fff; border-radius: 9px;
        background: #0096fa; color: #fff; font: 700 11px/14px sans-serif;
      }
      #${BUTTON_ID} .pp-download-count[hidden] { display: none; }
      #${BUTTON_ID}[data-attention="true"]::after {
        content: ""; position: absolute; bottom: 3px; right: 3px;
        width: 10px; height: 10px; border-radius: 50%; background: #e53935;
        border: 2px solid #fff;
      }
      #${PANEL_ID} {
        --pp-download-bg: #fff; --pp-download-fg: #222; --pp-download-muted: #666;
        --pp-download-border: #ddd; --pp-download-action: #006eb8;
        position: fixed; z-index: 100000; display: flex; flex-direction: column;
        width: min(380px, calc(100vw - 24px)); max-height: min(480px, calc(100vh - 24px));
        box-sizing: border-box; border: 1px solid var(--pp-download-border);
        border-radius: 12px; background: var(--pp-download-bg); color: var(--pp-download-fg);
        box-shadow: 0 8px 32px #0003; font: 14px/1.5 sans-serif;
      }
      #${PANEL_ID}[hidden], #${PANEL_ID} [hidden] { display: none; }
      #${PANEL_ID} header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
      #${PANEL_ID} h2 { margin: 0; font-size: 16px; color: inherit; }
      #${PANEL_ID} button { border: 0; background: transparent; color: var(--pp-download-action); cursor: pointer; padding: 8px; font: inherit; }
      #${PANEL_ID} button:disabled { color: var(--pp-download-muted); opacity: .6; cursor: default; }
      #${PANEL_ID} button:focus-visible, #${PANEL_ID} a:focus-visible { outline: 2px solid var(--pp-download-action); outline-offset: 2px; }
      #${PANEL_ID} .pp-download-summary { margin: 0; padding: 0 16px 4px; color: var(--pp-download-muted); }
      #${PANEL_ID} .pp-download-actions { display: flex; flex-wrap: wrap; gap: 4px; padding: 0 8px 8px; }
      #${PANEL_ID} .pp-download-actions button { font-size: 12px; }
      #${PANEL_ID} ul { list-style: none; margin: 0; padding: 0; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
      #${PANEL_ID} li { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--pp-download-border); }
      #${PANEL_ID} .pp-download-info { flex: 1; min-width: 0; }
      #${PANEL_ID} a { display: block; color: var(--pp-download-fg); overflow-wrap: anywhere; text-decoration: none; }
      #${PANEL_ID} a:hover { text-decoration: underline; }
      #${PANEL_ID} small { display: block; color: var(--pp-download-muted); overflow-wrap: anywhere; }
      #${PANEL_ID} progress { display: block; width: 100%; height: 6px; margin-top: 8px; accent-color: #0096fa; }
      #${PANEL_ID} .pp-download-icon {
        display: inline-flex; align-items: center; justify-content: center;
        flex-shrink: 0; width: 32px; height: 32px; padding: 6px; border-radius: 50%;
      }
      #${PANEL_ID} .pp-download-icon:hover { background: rgba(0, 150, 250, .12); }
      #${PANEL_ID} .pp-download-icon svg { display: block; width: 18px; height: 18px; }
      #${PANEL_ID} .pp-download-icon[hidden] { display: none; }
      #${PANEL_ID} .pp-download-abort { color: #d32f2f; }
      #${PANEL_ID} .pp-download-abort:hover { background: rgba(211, 47, 47, .12); }
      @keyframes pp-download-bounce { 0%, 100% { transform: translateY(-3px); } 50% { transform: translateY(3px); } }
      @keyframes pp-toolbar-pulse { 50% { opacity: .35; } }
      @media (prefers-reduced-motion: reduce) {
        #${BUTTON_ID}[data-active="true"] svg, .pp-toolbar-button[aria-busy="true"] svg { animation: none; }
      }
      @media (prefers-color-scheme: dark) {
        #${PANEL_ID} { --pp-download-bg: #222; --pp-download-fg: #eee;
          --pp-download-muted: #bbb; --pp-download-border: #444; --pp-download-action: #72c5ff; }
      }
      `
    )
    .appendTo("head");

  const button = $("<button>")
    .attr({
      id: BUTTON_ID,
      type: "button",
      title: "下载记录",
      "aria-label": "下载记录",
      "aria-expanded": "false",
      "aria-controls": PANEL_ID,
      "aria-haspopup": "dialog",
    })
    .addClass("pp-toolbar-button")
    .html(downloadIcon);
  button.find("svg").attr("aria-hidden", "true");
  const countBadge = $("<span>")
    .addClass("pp-download-count")
    .attr("aria-hidden", "true")
    .prop("hidden", true)
    .appendTo(button);
  $("<div>").append(button).appendTo(toolbar);
  toolbar.style.zIndex = "10000";

  const panel = $("<div>")
    .attr({
      id: PANEL_ID,
      role: "dialog",
      "aria-labelledby": "pp-downloads-heading",
    })
    .prop("hidden", true)
    .appendTo("body");
  const closeButton = $("<button>")
    .attr({
      type: "button",
      title: "关闭下载记录",
      "aria-label": "关闭下载记录",
    })
    .text("关闭");
  $("<header>")
    .append(
      $("<h2>").attr("id", "pp-downloads-heading").text("下载记录"),
      closeButton
    )
    .appendTo(panel);
  const summary = $("<p>").addClass("pp-download-summary").appendTo(panel);
  const actions = $("<div>").addClass("pp-download-actions").appendTo(panel);
  const clearCompletedButton = $("<button>")
    .attr({ type: "button", title: "清空已完成的下载记录" })
    .text("清空已完成记录")
    .on("click", clearCompletedDownloads)
    .appendTo(actions);
  const ignoreRetryableButton = $("<button>")
    .attr({ type: "button", title: "移除所有失败和中断的下载记录" })
    .text("忽略所有待重试记录")
    .on("click", ignoreRetryableDownloads)
    .appendTo(actions);
  const list = $("<ul>").attr("aria-label", "图片下载列表").appendTo(panel);
  const rows = new Map<
    string,
    {
      item: JQuery;
      status: JQuery;
      progress: JQuery<HTMLProgressElement>;
      abort: JQuery;
      retry: JQuery;
    }
  >();

  const positionPanel = () => {
    if (panel.prop("hidden")) return;
    const rect = button.get(0)!.getBoundingClientRect();
    const width = panel.outerWidth()!;
    const height = panel.outerHeight()!;
    panel.css({
      left: Math.max(
        12,
        Math.min(rect.left - width - 12, window.innerWidth - width - 12)
      ),
      top: Math.max(
        12,
        Math.min(rect.bottom - height, window.innerHeight - height - 12)
      ),
    });
  };

  const update = () => {
    const records = getDownloads();
    const active = records.filter(
      (record) => record.status === "downloading"
    ).length;
    const attention = records.filter((record) =>
      ["failed", "interrupted"].includes(record.status)
    ).length;
    const completed = records.filter(
      (record) => record.status === "completed"
    ).length;
    clearCompletedButton.prop("disabled", completed === 0);
    ignoreRetryableButton.prop("disabled", attention === 0);
    const recordIds = new Set(records.map((record) => record.id));
    for (const [id, row] of rows) {
      if (!recordIds.has(id)) {
        row.item.remove();
        rows.delete(id);
      }
    }
    const title = `下载记录（${active} 项下载中，${attention} 项待重试）`;
    countBadge.text(String(active)).prop("hidden", active === 0);
    button.attr({
      "data-active": String(active > 0),
      "data-attention": String(attention > 0),
      "aria-busy": String(active > 0),
      title,
      "aria-label": title,
    });
    summary.text(
      records.length
        ? `${active} 项下载中 · ${completed} 项已完成 · ${attention} 项待重试`
        : "暂无下载记录，点击预览中的“原图”开始下载。"
    );
    for (const record of [...records].reverse()) {
      let row = rows.get(record.id);
      if (!row) {
        const item = $("<li>");
        const info = $("<div>").addClass("pp-download-info").appendTo(item);
        const artworkId = record.filename.match(/^(\d+)_p\d+/)?.[1];
        $("<a>")
          .attr({
            href: artworkId
              ? `https://www.pixiv.net/artworks/${artworkId}`
              : record.url,
            target: "_blank",
            rel: "noopener noreferrer",
            title: "查看原作品",
          })
          .text(record.filename)
          .appendTo(info);
        const status = $("<small>").appendTo(info);
        const progress = $("<progress>")
          .attr({ max: 100, "aria-label": `${record.filename} 下载进度` })
          .appendTo(info) as JQuery<HTMLProgressElement>;
        const abort = createIconButton(
          `中止下载 ${record.filename}`,
          stopIcon,
          "pp-download-abort",
          () => abortDownload(record.id)
        ).appendTo(item);
        const retry = createIconButton(
          `重试下载 ${record.filename}`,
          retryIcon,
          "pp-download-retry",
          () => retryDownload(record.id)
        ).appendTo(item);
        list.prepend(item);
        row = { item, status, progress, abort, retry };
        rows.set(record.id, row);
      }
      const running = record.status === "downloading";
      const local = running && isDownloadingInThisTab(record.id);
      const percent =
        record.total > 0
          ? Math.min(100, Math.floor((record.loaded / record.total) * 100))
          : undefined;
      const progressText = `${percent === undefined ? formatBytes(record.loaded) : `${percent}% · ${formatBytes(record.loaded)} / ${formatBytes(record.total)}`}`;
      const labels: Record<DownloadRecord["status"], string> = {
        downloading: local
          ? `下载中 ${progressText}`
          : `其他标签页下载中 ${progressText}`,
        completed: `已下载 · ${formatBytes(record.loaded)}${record.completedAt === undefined ? "" : ` · ${formatTime(record.completedAt)}`}`,
        interrupted: "下载已中断，点击重试重新下载",
        failed: `下载失败：${record.error || "网络错误"}`,
      };
      row.status.text(labels[record.status]);
      row.abort.prop("hidden", !local);
      row.retry.prop("hidden", running || record.status === "completed");
      row.progress.prop("hidden", !running);
      if (percent === undefined) row.progress.removeAttr("value");
      else row.progress.val(percent);
    }
    positionPanel();
  };

  const close = (restoreFocus = false) => {
    panel.prop("hidden", true);
    button.attr("aria-expanded", "false");
    if (restoreFocus) button.trigger("focus");
  };
  button.on("click", () => {
    if (!panel.prop("hidden")) return close();
    update();
    panel.prop("hidden", false);
    button.attr("aria-expanded", "true");
    positionPanel();
    closeButton.trigger("focus");
  });
  closeButton.on("click", () => close(true));
  document.addEventListener("click", (event) => {
    if (!event.isTrusted || panel.prop("hidden")) return;
    if (
      !panel.get(0)!.contains(event.target as Node) &&
      !button.get(0)!.contains(event.target as Node)
    )
      close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.prop("hidden")) {
      event.preventDefault();
      close(true);
    }
  });
  window.addEventListener("resize", positionPanel);
  subscribeDownloads(update);
  update();
};
