import { g_defaultSettings } from "../constants";
import { SETTING_FIELDS, validateSettingValue } from "../constants/settings";
import Texts, { setLocale } from "../i18n";
import type { GlobalSettings, UserSettingKey, UserSettings } from "../types";
import { iLog } from "./logger";

const SETTINGS_KEY = "PIXIV_PREVIEWER_L_SETTINGS";

export type SettingsChangeSource = "local" | "remote";

export type SettingsListener = (
  next: GlobalSettings,
  prev: GlobalSettings,
  source: SettingsChangeSource
) => void;

export interface SettingValidationError {
  key: UserSettingKey | null;
  message: string;
}

export type SaveSettingsResult =
  | { ok: true; settings: GlobalSettings }
  | { ok: false; errors: SettingValidationError[] };

let activeSettings: GlobalSettings | null = null;
let syncListenerRegistered = false;
const listeners = new Set<SettingsListener>();

const normalizeStoredSettings = (raw: unknown): GlobalSettings => {
  const normalized: GlobalSettings = { ...g_defaultSettings };
  if (!raw || typeof raw !== "object") {
    return normalized;
  }

  const record = raw as Record<string, unknown>;
  if (typeof record.version === "string") {
    normalized.version = record.version;
  }

  const target = normalized as unknown as Record<string, unknown>;
  for (const descriptor of SETTING_FIELDS) {
    if (!Object.hasOwn(record, descriptor.key)) continue;
    const value = record[descriptor.key];
    if (validateSettingValue(descriptor, value) === null) {
      target[descriptor.key] = value;
    }
  }
  return normalized;
};

const notifyListeners = (
  next: GlobalSettings,
  prev: GlobalSettings,
  source: SettingsChangeSource
) => {
  for (const listener of listeners) {
    try {
      listener({ ...next }, { ...prev }, source);
    } catch (error) {
      iLog.e("Failed to notify settings listener:", error);
    }
  }
};

const ensureSyncListener = () => {
  if (syncListenerRegistered) return;
  syncListenerRegistered = true;
  GM_addValueChangeListener(
    SETTINGS_KEY,
    (_key, oldValue, newValue, remote) => {
      if (!remote) return;
      const prev = activeSettings ?? normalizeStoredSettings(oldValue);
      const next = normalizeStoredSettings(newValue);
      activeSettings = next;
      setLocale(next.language);
      notifyListeners(next, prev, "remote");
    }
  );
};

export const validateCandidateSettings = (
  candidate: GlobalSettings
): SettingValidationError[] => {
  const errors: SettingValidationError[] = [];
  const record = candidate as unknown as Record<string, unknown>;

  for (const descriptor of SETTING_FIELDS) {
    const error = validateSettingValue(descriptor, record[descriptor.key]);
    if (error) {
      errors.push({ key: descriptor.key, message: error });
    }
  }

  if (
    candidate.downloadProgressPersistMs > candidate.downloadHeartbeatMs &&
    !errors.some((e) => e.key === "downloadProgressPersistMs")
  ) {
    errors.push({
      key: "downloadProgressPersistMs",
      message: Texts.settings_err_progressExceedsHeartbeat,
    });
  }

  if (
    candidate.downloadHeartbeatMs >= candidate.downloadOwnerTimeoutMs &&
    !errors.some((e) => e.key === "downloadOwnerTimeoutMs")
  ) {
    errors.push({
      key: "downloadOwnerTimeoutMs",
      message: Texts.settings_err_timeoutNotGreaterThanHeartbeat,
    });
  }

  return errors;
};

export const getSettings = (): GlobalSettings => {
  ensureSyncListener();
  if (!activeSettings) {
    activeSettings = normalizeStoredSettings(
      GM_getValue<Partial<GlobalSettings>>(SETTINGS_KEY)
    );
    setLocale(activeSettings.language);
  }
  return { ...activeSettings };
};

export const subscribeSettings = (listener: SettingsListener): (() => void) => {
  ensureSyncListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** 校验并完整保存用户配置（仅更新指定用户字段，保留最新远程未编辑字段及内部 `version`） */
export const saveUserSettings = (
  edits: Partial<UserSettings>
): SaveSettingsResult => {
  ensureSyncListener();

  let latest: GlobalSettings;
  try {
    latest = normalizeStoredSettings(
      GM_getValue<Partial<GlobalSettings>>(SETTINGS_KEY)
    );
  } catch (error) {
    iLog.e("Failed to read latest settings before saving:", error);
    return {
      ok: false,
      errors: [{ key: null, message: Texts.settings_saveStorageError }],
    };
  }

  const candidate: GlobalSettings = { ...latest };
  const candidateRecord = candidate as unknown as Record<string, unknown>;
  const editsRecord = edits as Record<string, unknown>;
  for (const descriptor of SETTING_FIELDS) {
    if (Object.hasOwn(editsRecord, descriptor.key)) {
      candidateRecord[descriptor.key] = editsRecord[descriptor.key];
    }
  }
  candidate.version = latest.version;

  const errors = validateCandidateSettings(candidate);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  try {
    GM_setValue(SETTINGS_KEY, candidate);
  } catch (error) {
    iLog.e("Failed to save settings:", error);
    return {
      ok: false,
      errors: [{ key: null, message: Texts.settings_saveStorageError }],
    };
  }

  const prev = activeSettings ? { ...activeSettings } : latest;
  activeSettings = { ...candidate };
  setLocale(candidate.language);
  notifyListeners(candidate, prev, "local");
  return { ok: true, settings: { ...candidate } };
};

/** 仅更新内部版本元数据，不改变任何用户配置字段 */
export const updateInternalVersion = (version: string): boolean => {
  ensureSyncListener();
  try {
    const latest = normalizeStoredSettings(
      GM_getValue<Partial<GlobalSettings>>(SETTINGS_KEY)
    );
    const next: GlobalSettings = { ...latest, version };
    GM_setValue(SETTINGS_KEY, next);
    activeSettings = next;
    return true;
  } catch (error) {
    iLog.e("Failed to update internal script version:", error);
    return false;
  }
};
