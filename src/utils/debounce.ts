// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DebouncedFunction<T extends (...args: any[]) => void> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
  isPending: () => boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number | (() => number) = 100
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (...args: Parameters<T>) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    const wait = typeof delay === "function" ? delay() : delay;
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  } as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  debounced.isPending = () => timeout !== null;

  return debounced;
}

export default debounce;
