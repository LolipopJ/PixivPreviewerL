import de from "./de";
import en from "./en";
import fr from "./fr";
import ja from "./ja";
import ko from "./ko";
import ru from "./ru";
import zh, { type Messages } from "./zh";
import zhTw from "./zh-tw";

export type TextKey = keyof Messages;

const catalogs = new Map<string, Messages>([
  ["de", de],
  ["en", en],
  ["fr", fr],
  ["ja", ja],
  ["ko", ko],
  ["ru", ru],
]);

export let locale = "en";
let texts: Messages = en;
let lastLang: string | undefined;

const resolveLocale = (rawLang: string): [string, Messages] => {
  const normalized = rawLang.trim().toLowerCase().replace(/_/g, "-");
  if (!normalized) return ["en", en];

  const parts = normalized.split("-");
  const language = parts[0];
  if (language === "zh") {
    const isTraditional =
      parts.includes("hant") ||
      (!parts.includes("hans") &&
        parts.some((part) => part === "tw" || part === "hk" || part === "mo"));
    return isTraditional ? ["zh-TW", zhTw] : ["zh-CN", zh];
  }

  const catalog = catalogs.get(language);
  return catalog ? [language, catalog] : ["en", en];
};

export const setLocale = (
  preferredLang = "auto",
  pageLang = document.documentElement?.lang ?? ""
) => {
  const rawLang =
    preferredLang && preferredLang !== "auto" ? preferredLang : pageLang;
  if (rawLang === lastLang) return;
  lastLang = rawLang;
  [locale, texts] = resolveLocale(rawLang);
};

export const formatText = (message: string, ...values: (string | number)[]) =>
  message.replace(/%(\d+)/g, (placeholder: string, index: string) =>
    String(values[Number(index) - 1] ?? placeholder)
  );

export { texts as default };
