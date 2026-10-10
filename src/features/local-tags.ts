import { getTagDetails } from "../services/tags";
import debounce from "../utils/debounce";
import {
  addLocalTag,
  getLocalTagState,
  getSortedLocalTags,
  getTagFromPath,
  LOCAL_TAGS_KEY,
  type LocalTag,
  moveLocalTag,
  recordLocalTagVisit,
  removeLocalTag,
  renameLocalTag,
  setLocalTagAutoSort,
} from "../utils/tags";

const TAG_LINK_SELECTOR =
  'a[href*="/tags/"]:not(nav > a):not(.gtm-new-work-tag-event-click):not(.gtm-new-work-translate-tag-event-click):not(.gtm-new-work-tag-thumbnail-event-click)';
const POPOVER_ID = "pp-local-tag-popover";
const MANAGER_ID = "pp-local-tags-manager";
const STRIP_CLASS = "pp-local-tags";

const createButton = (label: string, onClick: () => void) => {
  return $("<button>")
    .attr("type", "button")
    .text(label)
    .css("height", "100%")
    .on("click", onClick);
};

const createTagLink = ({ tag, label }: Pick<LocalTag, "tag" | "label">) => {
  const link = $("<a>")
    .attr({
      href: `/tags/${encodeURIComponent(tag)}`,
      "data-label": label,
      title: tag,
    })
    .append($("<span>").text(label || tag));
  if (label) link.append($("<small>").text(tag));
  return link;
};

const getTagLabel = (tag: string, text: string) => {
  let label = text.trim().replace(/^#/, "");
  const tagSuffix = `#${tag}`;
  if (label.endsWith(tagSuffix)) {
    label = label.slice(0, -tagSuffix.length).trim();
  }
  return label === tag ? "" : label;
};

const getPageTag = () => {
  const header = $('[data-ga4-label="header"]').first();
  const entityId = header.attr("data-ga4-entity-id");
  if (!entityId?.startsWith("tag/")) return null;
  const tag = getTagFromPath(`/tags/${entityId.slice(4)}`);
  if (!tag) return null;
  const rawTag = header
    .find("span")
    .filter((_, element) => $(element).text().trim() === tag)
    .first();
  if (!rawTag.length) return null;
  return { tag, label: rawTag.parent().next().text().trim() };
};

const getTagLink = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null;
  const link = $(target).closest<HTMLAnchorElement>(TAG_LINK_SELECTOR).get(0);
  if (!link) return null;
  const url = new URL($(link).prop("href"));
  if (url.origin !== location.origin) return null;
  return getTagFromPath(url.pathname) ? link : null;
};

export const loadLocalTags = () => {
  if ($(`#${POPOVER_ID}`).length) return;

  $("<style>")
    .text(
      `
    #${POPOVER_ID}, #${MANAGER_ID}, .${STRIP_CLASS} {
      --pp-tag-bg: #fff; --pp-tag-fg: #333; --pp-tag-muted: #666;
      --pp-tag-border: #ddd; --pp-tag-chip: #f0f6fa;
      --pp-tag-danger: #dc2626; --pp-tag-danger-hover: #b91c1c;
      color: var(--pp-tag-fg); font: 14px/1.5 sans-serif;
      box-sizing: border-box;
    }
    #${POPOVER_ID} *, #${MANAGER_ID} *, .${STRIP_CLASS} * { box-sizing: border-box; }
    #${POPOVER_ID} {
      position: fixed; z-index: 100000; width: min(340px, calc(100vw - 24px));
      max-height: calc(100vh - 24px); overflow: auto; padding: 0;
      background: var(--pp-tag-bg); border: 1px solid var(--pp-tag-border);
      border-radius: 12px; box-shadow: 0 8px 32px #0003;
    }
    #${POPOVER_ID}[hidden] { display: none; }
    #${POPOVER_ID} .pp-tag-preview {
      display: block; height: 200px; overflow: hidden;
      border-radius: 11px 11px 0 0; background: var(--pp-tag-chip);
    }
    #${POPOVER_ID} .pp-tag-preview:focus-visible { outline-offset: -2px; }
    #${POPOVER_ID} img { display: block; width: 100%; height: 100%; object-fit: cover; }
    #${POPOVER_ID} img[hidden] { display: none; }
    #${POPOVER_ID} .pp-tag-content { padding: 16px; }
    #${POPOVER_ID} h2, #${MANAGER_ID} h2 { font-size: 18px; margin: 0 0 12px; overflow-wrap: anywhere; }
    #${POPOVER_ID} p { margin: 12px 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    #${POPOVER_ID} button, #${MANAGER_ID} button, .${STRIP_CLASS} button,
    .${STRIP_CLASS} a {
      border: 1px solid var(--pp-tag-border); border-radius: 6px;
      padding: 6px 10px; color: var(--pp-tag-fg); background: var(--pp-tag-chip);
      cursor: pointer; font: inherit; text-decoration: none; white-space: nowrap;
    }
    #${POPOVER_ID} button:hover, #${MANAGER_ID} button:hover,
    .${STRIP_CLASS} button:hover, .${STRIP_CLASS} a:hover { border-color: #0096fa; }
    #${MANAGER_ID} button.pp-tag-danger {
      color: #fff; background: var(--pp-tag-danger); border-color: var(--pp-tag-danger);
    }
    #${MANAGER_ID} button.pp-tag-danger:hover {
      background: var(--pp-tag-danger-hover); border-color: var(--pp-tag-danger-hover);
    }
    #${POPOVER_ID} :focus-visible, #${MANAGER_ID} :focus-visible,
    .${STRIP_CLASS} :focus-visible { outline: 2px solid #0096fa; outline-offset: 2px; }
    #${MANAGER_ID} {
      width: min(720px, calc(100vw - 32px)); max-height: calc(100vh - 48px);
      padding: 24px; border: 1px solid var(--pp-tag-border); border-radius: 12px;
      background: var(--pp-tag-bg); overflow: auto;
    }
    #${MANAGER_ID}::backdrop { background: #0006; }
    #${MANAGER_ID} header { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
    #${MANAGER_ID} label { display: flex; align-items: center; gap: 8px; }
    #${MANAGER_ID} ul { list-style: none; padding: 0; margin: 16px 0 0; }
    #${MANAGER_ID} li { padding: 12px 0; border-top: 1px solid var(--pp-tag-border); }
    #${MANAGER_ID} li.pp-tag-dragging { opacity: .4; }
    #${MANAGER_ID} .pp-tag-heading { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    #${MANAGER_ID} .pp-tag-metadata { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    #${MANAGER_ID} a { color: inherit; text-decoration: none; }
    #${MANAGER_ID} a:hover { text-decoration: underline; }
    #${MANAGER_ID} .pp-tag-drag {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 28px; height: 28px; padding: 0; cursor: grab;
    }
    #${MANAGER_ID} .pp-tag-drag:active { cursor: grabbing; }
    #${MANAGER_ID} .pp-tag-drag::before {
      content: ""; width: 2px; height: 2px; margin: -10px 5px 0 0;
      background: currentColor; border-radius: 50%;
      box-shadow: 5px 0, 0 5px, 5px 5px, 0 10px, 5px 10px;
    }
    #${MANAGER_ID} form { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    #${MANAGER_ID} input[type=text] {
      flex: 1; min-width: 120px; padding: 7px 10px; border: 1px solid var(--pp-tag-border);
      border-radius: 6px; color: var(--pp-tag-fg); background: var(--pp-tag-bg); font: inherit;
    }
    #${MANAGER_ID} small { color: var(--pp-tag-muted); margin-bottom: 8px; overflow-wrap: anywhere; }
    #${MANAGER_ID} button:disabled { opacity: .4; cursor: default; }
    .${STRIP_CLASS} { display: inline-flex; align-items: center; gap: 8px; margin-right: 8px; flex-shrink: 0; }
    .${STRIP_CLASS} [data-tag-links] { display: inline-flex; gap: 8px; }
    .${STRIP_CLASS} a { display: inline-flex; flex-direction: column; justify-content: center; line-height: 1.35; }
    .${STRIP_CLASS} a span { font-size: 14px; }
    .${STRIP_CLASS} a small { font-size: 10px; color: var(--pp-tag-muted); }
    @media (prefers-color-scheme: dark) {
      #${POPOVER_ID}, #${MANAGER_ID}, .${STRIP_CLASS} {
        --pp-tag-bg: #222; --pp-tag-fg: #eee; --pp-tag-muted: #aaa;
        --pp-tag-border: #555; --pp-tag-chip: #303c45;
      }
    }
  `
    )
    .appendTo("head");

  const popover = $("<div>")
    .attr({ id: POPOVER_ID, role: "dialog", "aria-label": "标签详情" })
    .prop("hidden", true);
  const preview = $("<a>").attr({
    class: "pp-tag-preview",
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": "在新窗口打开预览作品",
  });
  const thumbnail = $("<img>").appendTo(preview);
  const content = $("<div>").addClass("pp-tag-content");
  const title = $("<h2>");
  const abstract = $("<p>").attr("aria-live", "polite");
  thumbnail.on("error", () => {
    thumbnail.prop("hidden", true);
    preview.removeAttr("href");
  });
  let activeLink: HTMLAnchorElement | null = null;
  let activeTag: string | null = null;
  let activeLabel = "";
  let showTimer: ReturnType<typeof setTimeout>;
  let hideTimer: ReturnType<typeof setTimeout>;
  let scrollParents = $<HTMLElement>();

  const action = createButton("添加到本地标签", () => {
    if (!activeTag) return;
    addLocalTag(activeTag, activeLabel);
    refresh();
  });
  content.append(title, abstract, action);
  popover.append(preview, content);
  popover.appendTo("body");

  const manager = $<HTMLDialogElement>("<dialog>")
    .attr({
      id: MANAGER_ID,
      closedby: "any",
      "aria-labelledby": "pp-local-tags-heading",
    })
    .appendTo("body");

  const hidePopover = () => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    popover.prop("hidden", true);
    scrollParents.off("scroll.ppLocalTags");
    scrollParents = $<HTMLElement>();
    activeLink = null;
    activeTag = null;
  };

  const updateAction = () => {
    action.prop(
      "hidden",
      !activeTag ||
        getLocalTagState().tags.some((item) => item.tag === activeTag)
    );
  };

  const positionPopover = () => {
    if (!activeLink || popover.prop("hidden")) return;
    const link = $(activeLink);
    const offset = link.offset()!;
    const viewport = $(window);
    const linkTop = offset.top - viewport.scrollTop()!;
    const linkBottom = linkTop + link.outerHeight()!;
    const width = popover.outerWidth()!;
    const height = popover.outerHeight()!;
    const left = Math.max(
      12,
      Math.min(
        offset.left - viewport.scrollLeft()!,
        viewport.width()! - width - 12
      )
    );
    const top =
      linkBottom + height + 8 <= viewport.height()! - 12
        ? linkBottom + 8
        : Math.max(12, linkTop - height - 8);
    popover.css({ left, top });
  };
  const showPopover = async (link: HTMLAnchorElement) => {
    const tag = getTagFromPath(new URL($(link).prop("href")).pathname);
    if (!tag || !$.contains($("html").get(0)!, link) || manager.prop("open"))
      return;
    activeLink = link;
    activeTag = tag;
    activeLabel =
      $(link).attr("data-label") ?? getTagLabel(tag, $(link).text());
    title.text(tag);
    abstract.text("正在加载标签详情…");
    thumbnail.prop("hidden", true).removeAttr("src");
    preview.removeAttr("href");
    popover.prop("hidden", false);
    // scroll 不冒泡，直接监听悬浮标签的祖先，保持滚动时关闭浮层。
    scrollParents.off("scroll.ppLocalTags");
    scrollParents = $(link).parents();
    scrollParents.on("scroll.ppLocalTags", hidePopover);
    updateAction();
    positionPopover();
    try {
      const details = await getTagDetails(tag);
      // 旧请求完成时，不能覆盖正在悬浮的另一个标签。
      if (activeLink !== link || activeTag !== tag) return;
      title.text(details.tag || tag);
      abstract.text(details.abstract || "暂无标签简介");
      if (details.thumbnail) {
        const artworkId = details.thumbnail.match(
          /\/(\d+)(?:-[\da-zA-Z]+)?_p\d+/
        )?.[1];
        if (artworkId)
          preview.attr("href", `https://www.pixiv.net/artworks/${artworkId}`);
        thumbnail
          .attr({
            alt: `${details.tag || tag}的缩略图`,
            src: details.thumbnail,
          })
          .prop("hidden", false);
      }
    } catch {
      if (activeLink !== link || activeTag !== tag) return;
      abstract.text("标签详情加载失败，请稍后重新悬浮重试。");
    }
    positionPopover();
  };

  const renderManager = () => {
    const focusKey = manager.find(":focus").attr("data-focus-key");
    const drafts = new Map(
      manager
        .find('input[type="text"]')
        .toArray()
        .filter((input) => $(input).val() !== $(input).prop("defaultValue"))
        .map((input) => [
          $(input).attr("data-focus-key"),
          $(input).val() as string,
        ])
    );
    manager.empty();
    const header = $("<header>");
    const heading = $("<h2>")
      .attr("id", "pp-local-tags-heading")
      .text("本地标签管理");
    header.append(
      heading,
      createButton("关闭", () => manager.get(0)!.close())
    );
    const sortLabel = $("<label>");
    const autoSort = $("<input>")
      .attr({ type: "checkbox", "data-focus-key": "auto-sort" })
      .prop("checked", getLocalTagState().autoSort);
    autoSort.on("change", () => {
      setLocalTagAutoSort(autoSort.prop("checked"));
      refresh();
    });
    sortLabel.append(autoSort, "自动排序（访问次数越多越靠前）");
    manager.append(header, sortLabel);
    const tags = getSortedLocalTags();
    if (!tags.length) {
      manager.append(
        $("<p>").text("暂无本地标签。悬浮任意标签，点击“添加到本地标签”。")
      );
    }
    const list = $("<ul>");
    let draggedRow: JQuery<HTMLLIElement> | null = null;
    list.on("drop", (event) => {
      if (!draggedRow) return;
      event.preventDefault();
      moveLocalTag(
        draggedRow.attr("data-tag")!,
        list.children().index(draggedRow)
      );
      draggedRow = null;
      refresh();
    });
    tags.forEach((item, index) => {
      const row = $<HTMLLIElement>("<li>").attr("data-tag", item.tag);
      const metadata = $("<div>")
        .addClass("pp-tag-metadata")
        .append(
          $("<a>")
            .attr({
              href: `/tags/${encodeURIComponent(item.tag)}`,
              target: "_blank",
              rel: "noopener noreferrer",
            })
            .text(item.tag),
          $("<small>").text(` · 访问 ${item.visits} 次`)
        );
      const rowHeading = $("<div>").addClass("pp-tag-heading");
      if (!autoSort.prop("checked")) {
        const handle = $("<button>")
          .attr({
            type: "button",
            draggable: "true",
            title: "拖拽排序",
            "aria-label": `排序 ${item.label || item.tag}`,
            "data-focus-key": `sort:${item.tag}`,
          })
          .addClass("pp-tag-drag")
          .on("dragstart", (event) => {
            draggedRow = row;
            const transfer = (event.originalEvent as DragEvent).dataTransfer!;
            transfer.effectAllowed = "move";
            transfer.setData("text/plain", item.tag);
            transfer.setDragImage(row.get(0)!, 0, 0);
            row.addClass("pp-tag-dragging");
          })
          .on("dragend", () => {
            if (!draggedRow) return;
            draggedRow = null;
            refresh();
          })
          .on("keydown", (event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            event.preventDefault();
            moveLocalTag(item.tag, index + (event.key === "ArrowUp" ? -1 : 1));
            refresh();
          });
        rowHeading.append(handle);
        row.on("dragover", (event) => {
          if (!draggedRow) return;
          event.preventDefault();
          (event.originalEvent as DragEvent).dataTransfer!.dropEffect = "move";
          if (draggedRow.is(row)) return;
          const { top, height } = row.get(0)!.getBoundingClientRect();
          if ((event.originalEvent as DragEvent).clientY < top + height / 2) {
            row.before(draggedRow);
          } else {
            row.after(draggedRow);
          }
        });
      }
      rowHeading.append(metadata);
      const form = $("<form>");
      const input = $("<input>")
        .attr({
          type: "text",
          placeholder: "填一个好记的备注名吧",
          "aria-label": `${item.tag}的显示名称`,
          "data-focus-key": `label:${item.tag}`,
        })
        .prop("defaultValue", item.label)
        .val(drafts.get(`label:${item.tag}`) ?? item.label);
      const save = $("<button>")
        .attr({ type: "submit", "data-focus-key": `save:${item.tag}` })
        .text("保存备注名");
      form.on("submit", (event) => {
        event.preventDefault();
        const label = (input.val() as string).trim();
        renameLocalTag(item.tag, label);
        input.val(label).prop("defaultValue", label);
        refresh();
      });
      const up = createButton("上移", () => {
        moveLocalTag(item.tag, index - 1);
        refresh();
      });
      const down = createButton("下移", () => {
        moveLocalTag(item.tag, index + 1);
        refresh();
      });
      up.attr({
        "data-focus-key": `up:${item.tag}`,
        "aria-label": `上移 ${item.label || item.tag}`,
      }).prop({ hidden: autoSort.prop("checked"), disabled: index === 0 });
      down
        .attr({
          "data-focus-key": `down:${item.tag}`,
          "aria-label": `下移 ${item.label || item.tag}`,
        })
        .prop({
          hidden: autoSort.prop("checked"),
          disabled: index === tags.length - 1,
        });
      const remove = createButton("删除", () => {
        removeLocalTag(item.tag);
        refresh();
      });
      remove
        .addClass("pp-tag-danger")
        .attr("aria-label", `删除 ${item.label || item.tag}`);
      form.append(input, save, up, down, remove);
      row.append(rowHeading, form);
      list.append(row);
    });
    manager.append(list);
    if (focusKey) {
      manager
        .find("[data-focus-key]")
        .filter((_, element) => $(element).attr("data-focus-key") === focusKey)
        .trigger("focus");
    }
  };

  const openManager = () => {
    hidePopover();
    if (!manager.prop("open")) manager.empty();
    renderManager();
    if (!manager.prop("open")) manager.get(0)!.showModal();
  };

  const renderStrip = (strip: JQuery) => {
    strip.empty();
    const tag = getTagFromPath(location.pathname);
    if (tag) {
      const saved = getLocalTagState().tags.some((item) => item.tag === tag);
      strip.append(
        saved
          ? createButton("本地标签管理", openManager)
          : createButton("添加到本地标签", () => {
              const pageTag = getPageTag();
              if (!pageTag) return;
              addLocalTag(pageTag.tag, pageTag.label);
              refresh();
            })
      );
      return;
    }
    strip.append(createButton("本地标签管理", openManager));
    const links = $("<span>").attr("data-tag-links", "");
    links.append(...getSortedLocalTags().map(createTagLink));
    strip.append(links);
  };

  function refresh() {
    $(`.${STRIP_CLASS}`).each((_, strip) => renderStrip($(strip)));
    updateAction();
    positionPopover();
    if (manager.prop("open")) renderManager();
  }

  const mountStrip = (parent: JQuery, before: JQuery) => {
    if (parent.children(`.${STRIP_CLASS}`).length) return;
    const strip = $(parent.is("ul") ? "<li>" : "<span>").addClass(STRIP_CLASS);
    renderStrip(strip);
    before.before(strip);
  };

  const mountEntries = () => {
    const pathname = location.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
    if (getTagFromPath(pathname)) {
      const edit = $("button")
        .filter((_, button) =>
          /(?:编辑|添加(?:进|到))(喜欢|喜爱)的标签/.test($(button).text())
        )
        .first();
      if (edit.length) mountStrip(edit.parent(), edit);
    } else if (
      /^\/(?:illustration\/?|manga\/?|cate_r18\.php)?$/.test(pathname)
    ) {
      const firstTag = $(TAG_LINK_SELECTOR)
        .filter(
          (_, link) =>
            !$(link).closest(`.${STRIP_CLASS}, header`).length &&
            !!getTagLink(link)
        )
        .first();
      if (!firstTag.length) return;
      let first = firstTag;
      let parent = firstTag.parent();
      // 找到标签行，不依赖 Pixiv 会变化的 CSS 类名，也不进入作品列表。
      while (parent.length && !parent.is("body")) {
        if (parent.find('a[href*="/artworks/"]').length) return;
        if (
          parent.find(TAG_LINK_SELECTOR).length > 1 ||
          parent.is("nav, ul, [role=tablist]") ||
          ["flex", "inline-flex"].includes(parent.css("display"))
        ) {
          mountStrip(parent, first);
          return;
        }
        first = parent;
        parent = parent.parent();
      }
    }
  };

  const enter = (event: JQuery.MouseOverEvent | JQuery.FocusInEvent) => {
    const target = event.target;
    if ($(target).closest(popover).length) {
      clearTimeout(hideTimer);
      return;
    }
    const link = getTagLink(target);
    if (!link || $(link).closest(manager).length) return;
    clearTimeout(hideTimer);
    if (link === activeLink) return;
    clearTimeout(showTimer);
    showTimer = setTimeout(() => void showPopover(link), 200);
  };

  const leave = (event: JQuery.MouseOutEvent | JQuery.FocusOutEvent) => {
    const link = getTagLink(event.target);
    const target = event.target;
    if (!link && !$(target).closest(popover).length) return;
    const related = event.relatedTarget;
    if (
      related instanceof Node &&
      ($(related).closest(popover).length ||
        (link && $(related).closest(link).length))
    )
      return;
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hidePopover, 180);
  };
  $(document)
    .on("mouseover", enter)
    .on("focusin", enter)
    .on("mouseout", leave)
    .on("focusout", leave)
    .on("keydown", (event) => {
      if (event.key === "Escape") hidePopover();
    })
    .on("scroll", hidePopover);
  $(window).on("resize", positionPopover);

  let previousTag: string | null = null;
  const visitPage = () => {
    const tag = getTagFromPath(location.pathname);
    if (tag && tag !== previousTag) {
      recordLocalTagVisit(tag);
      refresh();
    }
    previousTag = tag;
  };
  $(window).on("urlchange", () => {
    hidePopover();
    if (manager.prop("open")) manager.get(0)!.close();
    $(`.${STRIP_CLASS}`).remove();
    visitPage();
    mountEntries();
  });
  GM_addValueChangeListener(
    LOCAL_TAGS_KEY,
    (_key, _oldValue, _newValue, remote) => {
      if (remote) refresh();
    }
  );
  const observer = new MutationObserver(
    debounce(() => {
      if (activeLink && !$.contains($("html").get(0)!, activeLink))
        hidePopover();
      mountEntries();
    }, 100)
  );
  observer.observe($("body").get(0)!, { childList: true, subtree: true });
  visitPage();
  mountEntries();
};
