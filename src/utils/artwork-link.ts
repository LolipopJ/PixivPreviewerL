import { stopEventPropagation } from "./event";

const LINK_BLANK_ATTR = "data-pp-link-blank";
const SORT_ARTWORK_ATTR = "data-pp-sort-artwork";

interface OriginalLinkAttrs {
  target: string | null;
  rel: string | null;
}

const originalAttrsMap = new WeakMap<HTMLAnchorElement, OriginalLinkAttrs>();

/** 判断元素是否为作品详情链接，仅处理 `/artworks/<id>` 链接，不影响作者与标签链接 */
export const getArtworkAnchor = (
  target: JQuery<HTMLElement>
): HTMLAnchorElement | null => {
  const link = target.closest("a").get(0);
  if (!(link instanceof HTMLAnchorElement)) return null;
  const href = link.getAttribute("href");
  if (!href || !/\/artworks\/(\d+)(#(\d+))?/.test(href)) return null;
  return link;
};

/** 为作品链接应用新标签页打开属性，首次修改前记录原属性以便关闭时还原 */
export const applyArtworkLinkBlank = (anchor: HTMLAnchorElement) => {
  if (!anchor.hasAttribute(LINK_BLANK_ATTR)) {
    originalAttrsMap.set(anchor, {
      target: anchor.getAttribute("target"),
      rel: anchor.getAttribute("rel"),
    });
    anchor.setAttribute(LINK_BLANK_ATTR, "1");
  }
  anchor.setAttribute("target", "_blank");
  anchor.setAttribute("rel", "external");
  const $anchor = $(anchor);
  $anchor.off("click", stopEventPropagation);
  $anchor.on("click", stopEventPropagation);
};

/** 仅撤销脚本对作品链接改写的属性和事件，恢复页面原本行为 */
export const revertArtworkLinkBlank = (anchor: HTMLAnchorElement) => {
  if (!anchor.hasAttribute(LINK_BLANK_ATTR)) return;
  const original = originalAttrsMap.get(anchor);
  if (original?.target !== null && original?.target !== undefined) {
    anchor.setAttribute("target", original.target);
  } else {
    anchor.removeAttribute("target");
  }
  if (original?.rel !== null && original?.rel !== undefined) {
    anchor.setAttribute("rel", original.rel);
  } else {
    anchor.removeAttribute("rel");
  }
  anchor.removeAttribute(LINK_BLANK_ATTR);
  $(anchor).off("click", stopEventPropagation);
  originalAttrsMap.delete(anchor);
};

/** 标记由脚本排序生成的作品链接，并根据当前设置决定是否强制新标签页打开 */
export const markSortedArtworkLink = (
  anchor: HTMLAnchorElement,
  linkBlankEnabled: boolean
) => {
  anchor.setAttribute(SORT_ARTWORK_ATTR, "1");
  if (linkBlankEnabled) {
    applyArtworkLinkBlank(anchor);
  }
};

/** 在“在新标签页打开作品”配置变更后同步页面中由脚本处理过的作品链接 */
export const syncArtworkLinksBlank = (enabled: boolean) => {
  if (!enabled) {
    document
      .querySelectorAll<HTMLAnchorElement>(`a[${LINK_BLANK_ATTR}="1"]`)
      .forEach(revertArtworkLinkBlank);
    return;
  }
  document
    .querySelectorAll<HTMLAnchorElement>(`a[${SORT_ARTWORK_ATTR}="1"]`)
    .forEach(applyArtworkLinkBlank);
};
