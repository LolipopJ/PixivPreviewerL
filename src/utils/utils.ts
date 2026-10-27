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

/**
 * 将 Pixiv 原图链接中形如 `123456-abcdef_p0.png` 的文件名规范化为 `123456_p0.png`
 * （部分作品原图链接文件名中会插入一段哈希值，与 Pixiv 网页端展示的文件名不一致）
 */
export const sanitizeIllustFilename = (filename: string) => {
  return filename.replace(/^(\d+)-[0-9a-zA-Z]+(_.*)$/, "$1$2");
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

/**
 * 为 `GM_getValue` 一类全量反序列化的读取提供内存缓存。
 * 调用 `invalidate()` 后下次读取会重新从存储加载。
 */
export const createReadThroughCache = <V>(read: () => V) => {
  let cached: V | undefined;
  let valid = false;
  const load = () => {
    if (!valid) {
      cached = read();
      valid = true;
    }
    return cached!;
  };
  return {
    get: load,
    /** 直接修改缓存值（调用方负责持久化） */
    peek: load,
    invalidate(): void {
      valid = false;
    },
  };
};
