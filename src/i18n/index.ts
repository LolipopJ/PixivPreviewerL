import en from "./en";
import ja from "./ja";
import ko from "./ko";
import zh, { type Messages } from "./zh";

export type TextKey = keyof Messages;

const catalogs = new Map<string, Messages>([
  ["en", en],
  ["ja", ja],
  ["ko", ko],
  ["zh", zh],
]);

export let locale = "en";
let texts: Messages = en;
let lastLang: string | undefined;

export const setLocale = (
  preferredLang = "auto",
  pageLang = document.documentElement?.lang ?? ""
) => {
  const rawLang =
    preferredLang && preferredLang !== "auto" ? preferredLang : pageLang;
  if (rawLang === lastLang) return;
  lastLang = rawLang;
  const language = rawLang.trim().toLowerCase().split("-")[0];
  const catalog = catalogs.get(language);
  locale = catalog ? (language === "zh" ? "zh-CN" : language) : "en";
  texts = catalog ?? en;
};

export const formatText = (message: string, ...values: (string | number)[]) =>
  message.replace(/%(\d+)/g, (placeholder: string, index: string) =>
    String(values[Number(index) - 1] ?? placeholder)
  );

export { texts as default };
