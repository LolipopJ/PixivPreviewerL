export const execLimitConcurrentPromises = async <T>(
  promises: (() => Promise<T>)[],
  limit = 48
) => {
  const results: T[] = [];
  let index = 0;

  const executeNext = async () => {
    if (index >= promises.length) return Promise.resolve();

    const currentIndex = index++;
    const result = await promises[currentIndex]();
    results[currentIndex] = result;
    return await executeNext();
  };

  const initialPromises = Array.from(
    { length: Math.min(limit, promises.length) },
    () => executeNext()
  );

  await Promise.all(initialPromises);
  return results;
};

/**
 * 合并同一 key 的并发请求：在 `task` 完成前重复调用会复用同一个 Promise。
 * 用于避免同一作品的详情被同时请求多次。
 */
export const createPendingPromiseCache = <T>() => {
  const pending = new Map<string, Promise<T>>();
  return {
    run(key: string, task: () => Promise<T>): Promise<T> {
      const existing = pending.get(key);
      if (existing) return existing;
      const promise = task().finally(() => {
        if (pending.get(key) === promise) pending.delete(key);
      });
      pending.set(key, promise);
      return promise;
    },
  };
};
