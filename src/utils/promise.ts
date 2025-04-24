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
