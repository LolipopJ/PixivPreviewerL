import { g_defaultSettings } from "../constants";
import type { GlobalSettings } from "../types";

const SETTINGS_KEY = "PIXIV_PREVIEWER_L_SETTINGS";

export const toggleSettingBooleanValue = (key: keyof GlobalSettings) => {
  const settings = getSettings();
  const currentValue = Boolean(settings[key] ?? g_defaultSettings[key]);
  const newValue = !currentValue;
  GM_setValue(SETTINGS_KEY, { ...settings, [key]: newValue });
};

export const setSettingStringValue = (
  key: keyof GlobalSettings,
  label: string,
  {
    parseValue = (v) => v,
    onSet,
  }: {
    parseValue?: (newValue: string) => unknown;
    onSet?: (newValue: unknown) => void;
  }
) => {
  const settings = getSettings();
  const currentValue = settings[key] ?? g_defaultSettings[key];

  const newValue = prompt(label, String(currentValue));
  if (newValue !== null) {
    const savedValue = parseValue(newValue);
    GM_setValue(SETTINGS_KEY, { ...settings, [key]: savedValue });
    onSet?.(savedValue);
  }
};

export const setSettingValue = (key: keyof GlobalSettings, value: unknown) => {
  const settings = getSettings();
  const newValue = value ?? g_defaultSettings[key];
  GM_setValue(SETTINGS_KEY, { ...settings, [key]: newValue });
};

export const getSettings = (): GlobalSettings => {
  const savedSettings =
    GM_getValue<Partial<GlobalSettings>>(SETTINGS_KEY) ?? {};
  const settings = { ...g_defaultSettings, ...savedSettings };
  if (
    Object.keys(g_defaultSettings).some(
      (key) => !Object.hasOwn(savedSettings, key)
    )
  ) {
    // 新增键时自动保存
    GM_setValue(SETTINGS_KEY, settings);
  }
  return settings;
};

export const resetSettings = () => {
  GM_setValue(SETTINGS_KEY, g_defaultSettings);
};
