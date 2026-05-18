export const pause = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const convertObjectKeysFromSnakeToCamel = <T = Record<string, unknown>>(
  obj: T
) => {
  function snakeToCamel(snake: string) {
    return snake.replace(/_([a-z])/g, (result) => result[1].toUpperCase());
  }

  const newResponse = {} as T;
  for (const key in obj) {
    newResponse[snakeToCamel(key) as keyof T] = obj[key as keyof T];
  }

  return newResponse;
};

export const createLRUCache = <V>(maxSize: number) => {
  const map = new Map<string, V>();
  return {
    get(key: string): V | undefined {
      if (!map.has(key)) return undefined;
      const val = map.get(key)!;
      map.delete(key);
      map.set(key, val);
      return val;
    },
    set(key: string, val: V): void {
      if (map.has(key)) {
        map.delete(key);
      } else if (map.size >= maxSize) {
        map.delete(map.keys().next().value!);
      }
      map.set(key, val);
    },
  };
};
