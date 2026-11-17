import { IllustSortOrder } from "../enums";
import Texts from "../i18n";
import type { UserSettingKey, UserSettings } from "../types";

export type SettingSection = "common" | "advanced";

export type SettingGroup =
  | "preview"
  | "sort"
  | "localTags"
  | "cache"
  | "download"
  | "network"
  | "scheduling";

export type SettingControlKind = "boolean" | "number" | "text" | "select";

export interface SettingFieldOption {
  value: number;
  label: string;
}

export interface SettingFieldDescriptor<
  K extends UserSettingKey = UserSettingKey,
> {
  key: K;
  section: SettingSection;
  group: SettingGroup;
  control: SettingControlKind;
  label: string;
  description: string;
  unit?: string;
  /** 面板输入值乘以该倍率后作为内部持久化值（如秒 -> 毫秒为 1000） */
  scale?: number;
  /** 内部持久化值的最小允许值 */
  min?: number;
  /** 是否要求内部持久化值为整数 */
  integer?: boolean;
  /** 是否允许空/“不限”以持久化为 null */
  allowNullUnlimited?: boolean;
  placeholder?: string;
  options?: readonly SettingFieldOption[];
}

export const SETTING_GROUPS: ReadonlyArray<{
  id: SettingGroup;
  section: SettingSection;
  title: string;
}> = [
  { id: "preview", section: "common", title: Texts.settings_group_preview },
  { id: "sort", section: "common", title: Texts.settings_group_sort },
  { id: "localTags", section: "common", title: Texts.settings_group_localTags },
  { id: "cache", section: "advanced", title: Texts.settings_group_cache },
  { id: "download", section: "advanced", title: Texts.settings_group_download },
  { id: "network", section: "advanced", title: Texts.settings_group_network },
  {
    id: "scheduling",
    section: "advanced",
    title: Texts.settings_group_scheduling,
  },
];

/** 用户可见配置字段的唯一清单，由 `UserSettingKey` 约束并明确排除 `version` */
export const SETTING_FIELD_MAP: {
  [K in UserSettingKey]: SettingFieldDescriptor<K>;
} = {
  enablePreview: {
    key: "enablePreview",
    section: "common",
    group: "preview",
    control: "boolean",
    label: Texts.settings_field_enablePreview_label,
    description: Texts.settings_field_enablePreview_desc,
  },
  enableAnimePreview: {
    key: "enableAnimePreview",
    section: "common",
    group: "preview",
    control: "boolean",
    label: Texts.settings_field_enableAnimePreview_label,
    description: Texts.settings_field_enableAnimePreview_desc,
  },
  previewDelay: {
    key: "previewDelay",
    section: "common",
    group: "preview",
    control: "number",
    label: Texts.settings_field_previewDelay_label,
    description: Texts.settings_field_previewDelay_desc,
    unit: Texts.settings_unit_ms,
    min: 0,
  },
  linkBlank: {
    key: "linkBlank",
    section: "common",
    group: "preview",
    control: "boolean",
    label: Texts.settings_field_linkBlank_label,
    description: Texts.settings_field_linkBlank_desc,
  },
  previewHoldMs: {
    key: "previewHoldMs",
    section: "common",
    group: "preview",
    control: "number",
    label: Texts.settings_field_previewHoldMs_label,
    description: Texts.settings_field_previewHoldMs_desc,
    unit: Texts.settings_unit_ms,
  },
  previewLoadingOverlayDelayMs: {
    key: "previewLoadingOverlayDelayMs",
    section: "common",
    group: "preview",
    control: "number",
    label: Texts.settings_field_previewLoadingOverlayDelayMs_label,
    description: Texts.settings_field_previewLoadingOverlayDelayMs_desc,
    unit: Texts.settings_unit_ms,
    min: 0,
  },
  previewDownloadNoticeMs: {
    key: "previewDownloadNoticeMs",
    section: "common",
    group: "preview",
    control: "number",
    label: Texts.settings_field_previewDownloadNoticeMs_label,
    description: Texts.settings_field_previewDownloadNoticeMs_desc,
    unit: Texts.settings_unit_s,
    scale: 1000,
    min: 0,
  },
  pageCount: {
    key: "pageCount",
    section: "common",
    group: "sort",
    control: "number",
    label: Texts.settings_field_pageCount_label,
    description: Texts.settings_field_pageCount_desc,
    unit: Texts.settings_unit_pages,
    min: 1,
    integer: true,
  },
  favFilter: {
    key: "favFilter",
    section: "common",
    group: "sort",
    control: "number",
    label: Texts.settings_field_favFilter_label,
    description: Texts.settings_field_favFilter_desc,
    unit: Texts.settings_unit_bookmarks,
    min: 0,
    integer: true,
  },
  orderType: {
    key: "orderType",
    section: "common",
    group: "sort",
    control: "select",
    label: Texts.settings_field_orderType_label,
    description: Texts.settings_field_orderType_desc,
    options: [
      {
        value: IllustSortOrder.BY_BOOKMARK_COUNT,
        label: Texts.settings_option_orderByBookmark,
      },
      {
        value: IllustSortOrder.BY_DATE,
        label: Texts.settings_option_orderByDate,
      },
    ],
  },
  aiFilter: {
    key: "aiFilter",
    section: "common",
    group: "sort",
    control: "boolean",
    label: Texts.settings_field_aiFilter_label,
    description: Texts.settings_field_aiFilter_desc,
  },
  aiAssistedFilter: {
    key: "aiAssistedFilter",
    section: "common",
    group: "sort",
    control: "boolean",
    label: Texts.settings_field_aiAssistedFilter_label,
    description: Texts.settings_field_aiAssistedFilter_desc,
  },
  hideFavorite: {
    key: "hideFavorite",
    section: "common",
    group: "sort",
    control: "boolean",
    label: Texts.settings_field_hideFavorite_label,
    description: Texts.settings_field_hideFavorite_desc,
  },
  hideByTag: {
    key: "hideByTag",
    section: "common",
    group: "sort",
    control: "boolean",
    label: Texts.settings_field_hideByTag_label,
    description: Texts.settings_field_hideByTag_desc,
  },
  hideByTagList: {
    key: "hideByTagList",
    section: "common",
    group: "sort",
    control: "text",
    label: Texts.settings_field_hideByTagList_label,
    description: Texts.settings_field_hideByTagList_desc,
    placeholder: Texts.settings_field_hideByTagList_placeholder,
  },
  enableLocalTags: {
    key: "enableLocalTags",
    section: "common",
    group: "localTags",
    control: "boolean",
    label: Texts.settings_field_enableLocalTags_label,
    description: Texts.settings_field_enableLocalTags_desc,
  },
  localTagPopoverShowDelayMs: {
    key: "localTagPopoverShowDelayMs",
    section: "common",
    group: "localTags",
    control: "number",
    label: Texts.settings_field_localTagPopoverShowDelayMs_label,
    description: Texts.settings_field_localTagPopoverShowDelayMs_desc,
    unit: Texts.settings_unit_ms,
    min: 0,
  },
  localTagPopoverHideDelayMs: {
    key: "localTagPopoverHideDelayMs",
    section: "common",
    group: "localTags",
    control: "number",
    label: Texts.settings_field_localTagPopoverHideDelayMs_label,
    description: Texts.settings_field_localTagPopoverHideDelayMs_desc,
    unit: Texts.settings_unit_ms,
    min: 0,
  },
  previewPreloadCount: {
    key: "previewPreloadCount",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_previewPreloadCount_label,
    description: Texts.settings_field_previewPreloadCount_desc,
    unit: Texts.settings_unit_images,
    min: 1,
    integer: true,
  },
  previewCacheMaxEntries: {
    key: "previewCacheMaxEntries",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_previewCacheMaxEntries_label,
    description: Texts.settings_field_previewCacheMaxEntries_desc,
    unit: Texts.settings_unit_entries,
    min: 1,
    integer: true,
  },
  previewDetailsMaxStaleMs: {
    key: "previewDetailsMaxStaleMs",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_previewDetailsMaxStaleMs_label,
    description: Texts.settings_field_previewDetailsMaxStaleMs_desc,
    unit: Texts.settings_unit_hour,
    scale: 1000 * 60 * 60,
  },
  illustrationMutableCacheTtlMs: {
    key: "illustrationMutableCacheTtlMs",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_illustrationMutableCacheTtlMs_label,
    description: Texts.settings_field_illustrationMutableCacheTtlMs_desc,
    unit: Texts.settings_unit_hour,
    scale: 1000 * 60 * 60,
  },
  illustrationStaticCacheTtlMs: {
    key: "illustrationStaticCacheTtlMs",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_illustrationStaticCacheTtlMs_label,
    description: Texts.settings_field_illustrationStaticCacheTtlMs_desc,
    unit: Texts.settings_unit_day,
    scale: 1000 * 60 * 60 * 24,
  },
  illustrationCacheMaxEntries: {
    key: "illustrationCacheMaxEntries",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_illustrationCacheMaxEntries_label,
    description: Texts.settings_field_illustrationCacheMaxEntries_desc,
    unit: Texts.settings_unit_entries,
    min: 1,
    integer: true,
  },
  newIllustrationNoCacheMs: {
    key: "newIllustrationNoCacheMs",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_newIllustrationNoCacheMs_label,
    description: Texts.settings_field_newIllustrationNoCacheMs_desc,
    unit: Texts.settings_unit_hour,
    scale: 1000 * 60 * 60,
  },
  illustPagesCacheTtlMs: {
    key: "illustPagesCacheTtlMs",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_illustPagesCacheTtlMs_label,
    description: Texts.settings_field_illustPagesCacheTtlMs_desc,
    unit: Texts.settings_unit_day,
    scale: 1000 * 60 * 60 * 24,
  },
  illustPagesCacheMaxEntries: {
    key: "illustPagesCacheMaxEntries",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_illustPagesCacheMaxEntries_label,
    description: Texts.settings_field_illustPagesCacheMaxEntries_desc,
    unit: Texts.settings_unit_entries,
    min: 1,
    integer: true,
  },
  userIllustrationsCacheTtlMs: {
    key: "userIllustrationsCacheTtlMs",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_userIllustrationsCacheTtlMs_label,
    description: Texts.settings_field_userIllustrationsCacheTtlMs_desc,
    unit: Texts.settings_unit_hour,
    scale: 1000 * 60 * 60,
  },
  ugoiraCacheTtlMs: {
    key: "ugoiraCacheTtlMs",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_ugoiraCacheTtlMs_label,
    description: Texts.settings_field_ugoiraCacheTtlMs_desc,
    unit: Texts.settings_unit_day,
    scale: 1000 * 60 * 60 * 24,
  },
  ugoiraCacheMaxEntries: {
    key: "ugoiraCacheMaxEntries",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_ugoiraCacheMaxEntries_label,
    description: Texts.settings_field_ugoiraCacheMaxEntries_desc,
    unit: Texts.settings_unit_works,
    min: 1,
    integer: true,
  },
  ugoiraCacheMaxBytes: {
    key: "ugoiraCacheMaxBytes",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_ugoiraCacheMaxBytes_label,
    description: Texts.settings_field_ugoiraCacheMaxBytes_desc,
    unit: Texts.settings_unit_mib,
    scale: 1024 * 1024,
    integer: true,
  },
  localTagMetadataCacheTtlMs: {
    key: "localTagMetadataCacheTtlMs",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_localTagMetadataCacheTtlMs_label,
    description: Texts.settings_field_localTagMetadataCacheTtlMs_desc,
    unit: Texts.settings_unit_day,
    scale: 1000 * 60 * 60 * 24,
  },
  tagTranslationCacheTtlMs: {
    key: "tagTranslationCacheTtlMs",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_tagTranslationCacheTtlMs_label,
    description: Texts.settings_field_tagTranslationCacheTtlMs_desc,
    unit: Texts.settings_unit_day,
    scale: 1000 * 60 * 60 * 24,
  },
  tagTranslationCacheMaxEntries: {
    key: "tagTranslationCacheMaxEntries",
    section: "advanced",
    group: "cache",
    control: "number",
    label: Texts.settings_field_tagTranslationCacheMaxEntries_label,
    description: Texts.settings_field_tagTranslationCacheMaxEntries_desc,
    unit: Texts.settings_unit_entries,
    min: 2,
    integer: true,
  },
  completedDownloadsMaxEntries: {
    key: "completedDownloadsMaxEntries",
    section: "advanced",
    group: "download",
    control: "number",
    label: Texts.settings_field_completedDownloadsMaxEntries_label,
    description: Texts.settings_field_completedDownloadsMaxEntries_desc,
    unit: Texts.settings_unit_entries,
    min: 1,
    integer: true,
  },
  retryableDownloadsMaxEntries: {
    key: "retryableDownloadsMaxEntries",
    section: "advanced",
    group: "download",
    control: "number",
    label: Texts.settings_field_retryableDownloadsMaxEntries_label,
    description: Texts.settings_field_retryableDownloadsMaxEntries_desc,
    unit: Texts.settings_unit_entries,
    min: 1,
    integer: true,
  },
  downloadProgressPersistMs: {
    key: "downloadProgressPersistMs",
    section: "advanced",
    group: "download",
    control: "number",
    label: Texts.settings_field_downloadProgressPersistMs_label,
    description: Texts.settings_field_downloadProgressPersistMs_desc,
    unit: Texts.settings_unit_s,
    scale: 1000,
  },
  downloadHeartbeatMs: {
    key: "downloadHeartbeatMs",
    section: "advanced",
    group: "download",
    control: "number",
    label: Texts.settings_field_downloadHeartbeatMs_label,
    description: Texts.settings_field_downloadHeartbeatMs_desc,
    unit: Texts.settings_unit_s,
    scale: 1000,
  },
  downloadOwnerTimeoutMs: {
    key: "downloadOwnerTimeoutMs",
    section: "advanced",
    group: "download",
    control: "number",
    label: Texts.settings_field_downloadOwnerTimeoutMs_label,
    description: Texts.settings_field_downloadOwnerTimeoutMs_desc,
    unit: Texts.settings_unit_s,
    scale: 1000,
  },
  requestRetryIntervalMs: {
    key: "requestRetryIntervalMs",
    section: "advanced",
    group: "network",
    control: "number",
    label: Texts.settings_field_requestRetryIntervalMs_label,
    description: Texts.settings_field_requestRetryIntervalMs_desc,
    unit: Texts.settings_unit_s,
    scale: 1000,
    min: 1000,
  },
  requestMaxAttempts: {
    key: "requestMaxAttempts",
    section: "advanced",
    group: "network",
    control: "number",
    label: Texts.settings_field_requestMaxAttempts_label,
    description: Texts.settings_field_requestMaxAttempts_desc,
    unit: Texts.settings_unit_times,
    min: 1,
    integer: true,
    allowNullUnlimited: true,
    placeholder: Texts.settings_field_requestMaxAttempts_placeholder,
  },
  tagRequestTimeoutMs: {
    key: "tagRequestTimeoutMs",
    section: "advanced",
    group: "network",
    control: "number",
    label: Texts.settings_field_tagRequestTimeoutMs_label,
    description: Texts.settings_field_tagRequestTimeoutMs_desc,
    unit: Texts.settings_unit_s,
    scale: 1000,
  },
  ugoiraChunkBytes: {
    key: "ugoiraChunkBytes",
    section: "advanced",
    group: "network",
    control: "number",
    label: Texts.settings_field_ugoiraChunkBytes_label,
    description: Texts.settings_field_ugoiraChunkBytes_desc,
    unit: Texts.settings_unit_bytes,
    min: 64 * 1024,
    integer: true,
  },
  ugoiraTrailerBytes: {
    key: "ugoiraTrailerBytes",
    section: "advanced",
    group: "network",
    control: "number",
    label: Texts.settings_field_ugoiraTrailerBytes_label,
    description: Texts.settings_field_ugoiraTrailerBytes_desc,
    unit: Texts.settings_unit_bytes,
    min: 22,
    integer: true,
  },
  databaseOpenTimeoutMs: {
    key: "databaseOpenTimeoutMs",
    section: "advanced",
    group: "scheduling",
    control: "number",
    label: Texts.settings_field_databaseOpenTimeoutMs_label,
    description: Texts.settings_field_databaseOpenTimeoutMs_desc,
    unit: Texts.settings_unit_s,
    scale: 1000,
  },
  domProbeIntervalMs: {
    key: "domProbeIntervalMs",
    section: "advanced",
    group: "scheduling",
    control: "number",
    label: Texts.settings_field_domProbeIntervalMs_label,
    description: Texts.settings_field_domProbeIntervalMs_desc,
    unit: Texts.settings_unit_ms,
  },
  domProbeMaxAttempts: {
    key: "domProbeMaxAttempts",
    section: "advanced",
    group: "scheduling",
    control: "number",
    label: Texts.settings_field_domProbeMaxAttempts_label,
    description: Texts.settings_field_domProbeMaxAttempts_desc,
    unit: Texts.settings_unit_times,
    min: 1,
    integer: true,
  },
  toolbarProbeIntervalMs: {
    key: "toolbarProbeIntervalMs",
    section: "advanced",
    group: "scheduling",
    control: "number",
    label: Texts.settings_field_toolbarProbeIntervalMs_label,
    description: Texts.settings_field_toolbarProbeIntervalMs_desc,
    unit: Texts.settings_unit_ms,
  },
  toolbarProbeMaxAttempts: {
    key: "toolbarProbeMaxAttempts",
    section: "advanced",
    group: "scheduling",
    control: "number",
    label: Texts.settings_field_toolbarProbeMaxAttempts_label,
    description: Texts.settings_field_toolbarProbeMaxAttempts_desc,
    unit: Texts.settings_unit_times,
    min: 1,
    integer: true,
  },
  localTagRenderDebounceMs: {
    key: "localTagRenderDebounceMs",
    section: "advanced",
    group: "scheduling",
    control: "number",
    label: Texts.settings_field_localTagRenderDebounceMs_label,
    description: Texts.settings_field_localTagRenderDebounceMs_desc,
    unit: Texts.settings_unit_ms,
    min: 0,
  },
  localTagPersistDelayMs: {
    key: "localTagPersistDelayMs",
    section: "advanced",
    group: "scheduling",
    control: "number",
    label: Texts.settings_field_localTagPersistDelayMs_label,
    description: Texts.settings_field_localTagPersistDelayMs_desc,
    unit: Texts.settings_unit_ms,
    min: 0,
  },
  cacheCleanupIdleTimeoutMs: {
    key: "cacheCleanupIdleTimeoutMs",
    section: "advanced",
    group: "scheduling",
    control: "number",
    label: Texts.settings_field_cacheCleanupIdleTimeoutMs_label,
    description: Texts.settings_field_cacheCleanupIdleTimeoutMs_desc,
    unit: Texts.settings_unit_s,
    scale: 1000,
  },
};

export const SETTING_FIELDS: readonly SettingFieldDescriptor[] =
  Object.values(SETTING_FIELD_MAP);

export const USER_SETTING_KEYS: readonly UserSettingKey[] = SETTING_FIELDS.map(
  (field) => field.key
);

export type RawDraftValues = {
  [K in UserSettingKey]: UserSettings[K] extends boolean ? boolean : string;
};

/** 将内部存储值格式化为面板输入值 */
export const formatSettingInputValue = <K extends UserSettingKey>(
  descriptor: SettingFieldDescriptor<K>,
  value: UserSettings[K]
): boolean | string => {
  if (descriptor.control === "boolean") {
    return Boolean(value);
  }
  if (descriptor.control === "number") {
    if (value === null) return "";
    const scale = descriptor.scale ?? 1;
    return String(Number(((value as number) / scale).toPrecision(12)));
  }
  return String(value ?? "");
};

/** 校验内部表示的单个字段值是否合法 */
export const validateSettingValue = (
  descriptor: SettingFieldDescriptor,
  value: unknown
): string | null => {
  switch (descriptor.control) {
    case "boolean":
      return typeof value === "boolean" ? null : Texts.settings_err_option;
    case "text":
      return typeof value === "string" ? null : Texts.settings_err_required;
    case "select": {
      const valid = descriptor.options?.some((opt) => opt.value === value);
      return valid ? null : Texts.settings_err_option;
    }
    case "number": {
      if (value === null) {
        return descriptor.allowNullUnlimited
          ? null
          : Texts.settings_err_required;
      }
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return Texts.settings_err_number;
      }
      if (descriptor.integer && !Number.isInteger(value)) {
        return Texts.settings_err_integer;
      }
      if (descriptor.min !== undefined) {
        if (descriptor.min === 0 && value < 0) {
          return Texts.settings_err_nonNegative;
        }
        if (value < descriptor.min) {
          const displayMin = descriptor.scale
            ? Number((descriptor.min / descriptor.scale).toPrecision(12))
            : descriptor.min;
          const minText = descriptor.unit
            ? `${displayMin} ${descriptor.unit}`
            : String(displayMin);
          return Texts.settings_err_min.replace("%1", minText);
        }
      } else if (value <= 0) {
        return Texts.settings_err_positive;
      }
      return null;
    }
  }
};

/** 解析并校验来自配置面板的单个用户输入 */
export const parseSettingInput = <K extends UserSettingKey>(
  descriptor: SettingFieldDescriptor<K>,
  rawValue: boolean | string
): { ok: true; value: UserSettings[K] } | { ok: false; message: string } => {
  if (descriptor.control === "boolean") {
    return { ok: true, value: Boolean(rawValue) as UserSettings[K] };
  }
  if (descriptor.control === "text") {
    return { ok: true, value: String(rawValue) as UserSettings[K] };
  }
  if (descriptor.control === "select") {
    const parsed = Number(rawValue);
    const error = validateSettingValue(descriptor, parsed);
    if (error) return { ok: false, message: error };
    return { ok: true, value: parsed as UserSettings[K] };
  }

  const trimmed = String(rawValue).trim();
  if (!trimmed || (descriptor.allowNullUnlimited && trimmed === "不限")) {
    if (descriptor.allowNullUnlimited) {
      return { ok: true, value: null as unknown as UserSettings[K] };
    }
    return { ok: false, message: Texts.settings_err_required };
  }
  const rawNumber = Number(trimmed);
  if (!Number.isFinite(rawNumber)) {
    return { ok: false, message: Texts.settings_err_number };
  }
  const scale = descriptor.scale ?? 1;
  const scaled = Number((rawNumber * scale).toPrecision(12));
  const error = validateSettingValue(descriptor, scaled);
  if (error) return { ok: false, message: error };
  return { ok: true, value: scaled as UserSettings[K] };
};
