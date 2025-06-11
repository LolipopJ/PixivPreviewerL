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
    newResponse[snakeToCamel(key)] = obj[key];
  }

  return newResponse;
};
