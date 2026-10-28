import { iLog } from "./logger";

/** DOM 尚未就绪时排到 `DOMContentLoaded`，已就绪（脚本被延迟注入）则立即执行 */
export const onDomReady = (callback: () => void) => {
  if (document.readyState !== "loading") {
    callback();
    return;
  }
  document.addEventListener("DOMContentLoaded", callback, { once: true });
};

/**
 * 注入全局样式。
 * `document-start` 阶段 `<head>` 可能尚未创建，此时推迟到 DOM 就绪再注入，
 * 避免在 `<head>` 之前往 `<html>` 上插入节点影响页面解析。
 * 传入 `id` 时重复调用只会注入一次。
 */
export const injectStyle = (css: string, id?: string) => {
  const insert = () => {
    const container = document.head;
    if (!container) return false;
    $("<style>")
      .prop("type", "text/css")
      .attr(id ? { id } : {})
      .text(css)
      .appendTo(container);
    return true;
  };

  if (id && document.getElementById(id)) return;
  if (insert()) return;

  onDomReady(() => {
    if (id && document.getElementById(id)) return;
    insert();
  });
};

/**
 * 等待条件成立后取一次值并执行操作。
 * Pixiv 的部分节点由前端异步渲染，`DOMContentLoaded` 时未必存在，
 * 因此需要有限次重试；用尽后通过 `onGiveUp` 告知调用方。
 */
export const waitFor = <T>(
  probe: () => T | null | undefined | false,
  action: (value: T) => void,
  {
    interval = 300,
    maxAttempts = 10,
    onGiveUp,
  }: {
    /** 两次探测之间的间隔 */
    interval?: number;
    /** 总探测次数，包含首次立即执行的探测 */
    maxAttempts?: number;
    /** 用尽探测次数仍未就绪时调用 */
    onGiveUp?: () => void;
  } = {}
) => {
  let attempt = 1;

  const step = () => {
    const value = probe();
    if (value) {
      action(value);
      return;
    }
    if (attempt >= maxAttempts) {
      onGiveUp?.();
      return;
    }
    attempt += 1;
    setTimeout(deferredStep, interval);
  };

  /**
   * 后续尝试在定时器中执行，异常无法传播回调用方，只能就地记录并停止。
   * 首次尝试不经过这里，其异常会照常抛给调用方的 `try/catch`。
   */
  const deferredStep = () => {
    try {
      step();
    } catch (error) {
      iLog.e("Failed to wait for a condition:", error);
    }
  };

  step();
};
