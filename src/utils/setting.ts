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

export const getSettings = () => {
  return (GM_getValue(SETTINGS_KEY) ?? g_defaultSettings) as GlobalSettings;
};

export const resetSettings = () => {
  GM_setValue(SETTINGS_KEY, g_defaultSettings);
};
