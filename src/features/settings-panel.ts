import { g_defaultSettings, SETTINGS_STYLE_ID } from "../constants";
import {
  formatSettingInputValue,
  parseSettingInput,
  type RawDraftValues,
  SETTING_FIELD_MAP,
  SETTING_FIELDS,
  SETTING_GROUPS,
  type SettingFieldDescriptor,
} from "../constants/settings";
import Texts from "../i18n";
import restoreDefaultIcon from "../icons/restore-default.svg";
import undoIcon from "../icons/undo.svg";
import type { GlobalSettings, UserSettingKey, UserSettings } from "../types";
import { injectStyle, onDomReady } from "../utils/dom";
import {
  getSettings,
  type SaveSettingsResult,
  saveUserSettings,
  type SettingValidationError,
  subscribeSettings,
} from "../utils/setting";

const PANEL_ID = "pp-settings-panel";
const HEADING_ID = "pp-settings-heading";

const createInitialDraft = (baseline: GlobalSettings): RawDraftValues => {
  const draft = {} as Record<UserSettingKey, boolean | string>;
  for (const descriptor of SETTING_FIELDS) {
    draft[descriptor.key] = formatSettingInputValue(
      descriptor,
      baseline[descriptor.key]
    );
  }
  return draft as RawDraftValues;
};

export interface SettingsDraftSession {
  getBaseline: () => GlobalSettings;
  getDraftValue: <K extends UserSettingKey>(key: K) => RawDraftValues[K];
  getEditedKeys: () => ReadonlySet<UserSettingKey>;
  isFieldModified: (key: UserSettingKey) => boolean;
  isFieldDefault: (key: UserSettingKey) => boolean;
  hasModifiedFields: () => boolean;
  setInput: <K extends UserSettingKey>(
    key: K,
    value: RawDraftValues[K]
  ) => void;
  revertField: (key: UserSettingKey) => RawDraftValues[UserSettingKey];
  restoreField: (key: UserSettingKey) => RawDraftValues[UserSettingKey];
  restoreAll: () => RawDraftValues;
  applyRemoteUpdate: (remoteSettings: GlobalSettings) => UserSettingKey[];
  save: () => SaveSettingsResult;
}

/**
 * 隔离面板草稿与运行中配置的状态会话。
 * 保留明确编辑过的字段，使其在远程同步时不被覆盖，并在保存时与最新持久化配置合并。
 */
export const createSettingsDraftSession = (
  initialBaseline: GlobalSettings = getSettings(),
  persist: (
    edits: Partial<UserSettings>
  ) => SaveSettingsResult = saveUserSettings
): SettingsDraftSession => {
  let baseline: GlobalSettings = { ...initialBaseline };
  let draftRaw: RawDraftValues = createInitialDraft(baseline);
  const editedKeys = new Set<UserSettingKey>();

  const getBaselineFormatted = <K extends UserSettingKey>(key: K) =>
    formatSettingInputValue(SETTING_FIELD_MAP[key], baseline[key]);

  const getDefaultFormatted = <K extends UserSettingKey>(key: K) =>
    formatSettingInputValue(SETTING_FIELD_MAP[key], g_defaultSettings[key]);

  const isFieldModified = (key: UserSettingKey) =>
    draftRaw[key] !== getBaselineFormatted(key);

  const isFieldDefault = (key: UserSettingKey) =>
    draftRaw[key] === getDefaultFormatted(key);

  return {
    getBaseline: () => ({ ...baseline }),
    getDraftValue: (key) => draftRaw[key],
    getEditedKeys: () => editedKeys,
    isFieldModified,
    isFieldDefault,
    hasModifiedFields: () =>
      SETTING_FIELDS.some((field) => isFieldModified(field.key)),
    setInput: (key, value) => {
      (draftRaw as Record<UserSettingKey, boolean | string>)[key] = value;
      if (value === getBaselineFormatted(key)) {
        editedKeys.delete(key);
      } else {
        editedKeys.add(key);
      }
    },
    revertField: (key) => {
      const previousValue = getBaselineFormatted(key);
      (draftRaw as Record<UserSettingKey, boolean | string>)[key] =
        previousValue;
      editedKeys.delete(key);
      return previousValue;
    },
    restoreField: (key) => {
      const descriptor = SETTING_FIELD_MAP[key];
      const defaultFormatted = formatSettingInputValue(
        descriptor,
        g_defaultSettings[key]
      );
      (draftRaw as Record<UserSettingKey, boolean | string>)[key] =
        defaultFormatted;
      editedKeys.add(key);
      return draftRaw[key];
    },
    restoreAll: () => {
      for (const descriptor of SETTING_FIELDS) {
        (draftRaw as Record<UserSettingKey, boolean | string>)[descriptor.key] =
          formatSettingInputValue(
            descriptor,
            g_defaultSettings[descriptor.key]
          );
        editedKeys.add(descriptor.key);
      }
      return { ...draftRaw };
    },
    applyRemoteUpdate: (remoteSettings) => {
      baseline = { ...remoteSettings };
      const updatedKeys: UserSettingKey[] = [];
      for (const descriptor of SETTING_FIELDS) {
        if (editedKeys.has(descriptor.key)) continue;
        (draftRaw as Record<UserSettingKey, boolean | string>)[descriptor.key] =
          formatSettingInputValue(descriptor, remoteSettings[descriptor.key]);
        updatedKeys.push(descriptor.key);
      }
      return updatedKeys;
    },
    save: () => {
      const parseErrors: SettingValidationError[] = [];
      const parsedAll: Partial<UserSettings> = {};

      for (const descriptor of SETTING_FIELDS) {
        const parsed = parseSettingInput(descriptor, draftRaw[descriptor.key]);
        if (!parsed.ok) {
          parseErrors.push({ key: descriptor.key, message: parsed.message });
        } else {
          (parsedAll as Record<UserSettingKey, unknown>)[descriptor.key] =
            parsed.value;
        }
      }

      if (parseErrors.length > 0) {
        return { ok: false, errors: parseErrors };
      }

      const edits: Partial<UserSettings> = {};
      for (const key of editedKeys) {
        (edits as Record<UserSettingKey, unknown>)[key] = parsedAll[key];
      }

      const result = persist(edits);
      if (result.ok) {
        baseline = { ...result.settings };
        draftRaw = createInitialDraft(baseline);
        editedKeys.clear();
      }
      return result;
    },
  };
};

const injectSettingsPanelStyles = () => {
  injectStyle(
    `
      #${PANEL_ID} {
        --pp-settings-bg: #fff;
        --pp-settings-fg: #222;
        --pp-settings-muted: #666;
        --pp-settings-border: #ddd;
        --pp-settings-surface: #f7f9fb;
        --pp-settings-action: #006eb8;
        --pp-settings-action-fg: #fff;
        --pp-settings-accent-bg: rgba(0, 110, 184, .08);
        --pp-settings-accent-border: rgba(0, 110, 184, .38);
        --pp-settings-danger: #c62828;
        --pp-settings-danger-bg: rgba(198, 40, 40, .08);
        --pp-settings-success: #1b5e20;
        --pp-settings-success-bg: rgba(27, 94, 32, .08);
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 100001;
        display: flex;
        flex-direction: column;
        width: min(460px, calc(100vw - 24px));
        max-height: min(680px, calc(100vh - 24px));
        box-sizing: border-box;
        border: 1px solid var(--pp-settings-border);
        border-radius: 12px;
        background: var(--pp-settings-bg);
        color: var(--pp-settings-fg);
        box-shadow: 0 12px 36px rgba(0, 0, 0, .24);
        font: 13px/1.45 sans-serif;
      }
      #${PANEL_ID} *, #${PANEL_ID} *::before, #${PANEL_ID} *::after {
        box-sizing: border-box;
      }
      #${PANEL_ID} [hidden] {
        display: none;
      }
      #${PANEL_ID} header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--pp-settings-border);
        flex-shrink: 0;
      }
      #${PANEL_ID} h2 {
        margin: 0;
        font-size: 16px;
        color: inherit;
      }
      #${PANEL_ID} .pp-settings-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      #${PANEL_ID} .pp-settings-group {
        border: 1px solid var(--pp-settings-border);
        border-radius: 8px;
        padding: 10px 12px;
        background: var(--pp-settings-surface);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      #${PANEL_ID} .pp-settings-group h3 {
        margin: 0;
        font-size: 14px;
        color: inherit;
      }
      #${PANEL_ID} .pp-settings-advanced-toggle {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        font-weight: 600;
        background: var(--pp-settings-surface);
      }
      #${PANEL_ID} .pp-settings-advanced-toggle[data-modified="true"] {
        color: var(--pp-settings-action);
        border-color: var(--pp-settings-accent-border);
        background: var(--pp-settings-accent-bg);
      }
      #${PANEL_ID} .pp-settings-advanced-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      #${PANEL_ID} .pp-settings-advanced-body[hidden] {
        display: none;
      }
      #${PANEL_ID} .pp-settings-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px;
        border-radius: 6px;
        border-top: 1px solid var(--pp-settings-border);
      }
      #${PANEL_ID} .pp-settings-field:first-of-type {
        border-top: 0;
      }
      #${PANEL_ID} .pp-settings-field[data-modified="true"] {
        background: var(--pp-settings-accent-bg);
        box-shadow: inset 3px 0 0 var(--pp-settings-action);
      }
      #${PANEL_ID} .pp-settings-field[data-modified="true"] .pp-settings-label {
        color: var(--pp-settings-action);
      }
      #${PANEL_ID} .pp-settings-field[data-modified="true"] input[type="text"]:not([aria-invalid="true"]),
      #${PANEL_ID} .pp-settings-field[data-modified="true"] select:not([aria-invalid="true"]) {
        border-color: var(--pp-settings-action);
      }
      #${PANEL_ID} .pp-settings-field[data-modified="true"] input[type="checkbox"] {
        accent-color: var(--pp-settings-action);
      }
      #${PANEL_ID} .pp-settings-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      #${PANEL_ID} .pp-settings-label {
        font-weight: 600;
        flex: 1;
        min-width: 0;
        cursor: pointer;
      }
      #${PANEL_ID} .pp-settings-control {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      #${PANEL_ID} .pp-settings-field[data-control="text"] .pp-settings-row {
        flex-wrap: wrap;
      }
      #${PANEL_ID} .pp-settings-field[data-control="text"] .pp-settings-control {
        width: 100%;
      }
      #${PANEL_ID} input[type="text"],
      #${PANEL_ID} select {
        padding: 4px 8px;
        border: 1px solid var(--pp-settings-border);
        border-radius: 6px;
        background: var(--pp-settings-bg);
        color: var(--pp-settings-fg);
        font: inherit;
      }
      #${PANEL_ID} .pp-settings-field[data-control="number"] input[type="text"] {
        width: 96px;
        text-align: right;
      }
      #${PANEL_ID} .pp-settings-field[data-control="text"] input[type="text"] {
        flex: 1;
        min-width: 0;
      }
      #${PANEL_ID} input[aria-invalid="true"],
      #${PANEL_ID} select[aria-invalid="true"] {
        border-color: var(--pp-settings-danger);
      }
      #${PANEL_ID} .pp-settings-unit {
        color: var(--pp-settings-muted);
        font-size: 12px;
        white-space: nowrap;
      }
      #${PANEL_ID} .pp-settings-desc {
        color: var(--pp-settings-muted);
        font-size: 12px;
      }
      #${PANEL_ID} .pp-settings-error {
        color: var(--pp-settings-danger);
        font-size: 12px;
      }
      #${PANEL_ID} button {
        border: 1px solid var(--pp-settings-border);
        border-radius: 6px;
        padding: 4px 8px;
        background: var(--pp-settings-bg);
        color: var(--pp-settings-fg);
        cursor: pointer;
        font: inherit;
        white-space: nowrap;
      }
      #${PANEL_ID} button:hover {
        border-color: var(--pp-settings-action);
      }
      #${PANEL_ID} button.pp-settings-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        padding: 4px;
        color: var(--pp-settings-muted);
      }
      #${PANEL_ID} button.pp-settings-icon-btn[hidden] {
        display: none;
      }
      #${PANEL_ID} button.pp-settings-icon-btn svg {
        display: block;
        width: 14px;
        height: 14px;
      }
      #${PANEL_ID} button.pp-settings-revert-one {
        color: var(--pp-settings-action);
        border-color: var(--pp-settings-accent-border);
      }
      #${PANEL_ID} button.pp-settings-primary {
        border-color: var(--pp-settings-action);
        background: var(--pp-settings-action);
        color: var(--pp-settings-action-fg);
        font-weight: 600;
        padding: 6px 14px;
      }
      #${PANEL_ID} button:focus-visible,
      #${PANEL_ID} input:focus-visible,
      #${PANEL_ID} select:focus-visible {
        outline: 2px solid var(--pp-settings-action);
        outline-offset: 2px;
      }
      #${PANEL_ID} footer {
        border-top: 1px solid var(--pp-settings-border);
        padding: 10px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex-shrink: 0;
      }
      #${PANEL_ID} .pp-settings-status {
        padding: 6px 8px;
        border-radius: 6px;
        font-size: 12px;
      }
      #${PANEL_ID} .pp-settings-status[data-state="success"] {
        color: var(--pp-settings-success);
        background: var(--pp-settings-success-bg);
      }
      #${PANEL_ID} .pp-settings-status[data-state="error"] {
        color: var(--pp-settings-danger);
        background: var(--pp-settings-danger-bg);
      }
      #${PANEL_ID} .pp-settings-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }
      #${PANEL_ID} .pp-settings-actions .pp-settings-restore-all {
        margin-right: auto;
      }
      @media (prefers-color-scheme: dark) {
        #${PANEL_ID} {
          --pp-settings-bg: #222;
          --pp-settings-fg: #eee;
          --pp-settings-muted: #bbb;
          --pp-settings-border: #444;
          --pp-settings-surface: #2a2a2a;
          --pp-settings-action: #4ea8de;
          --pp-settings-action-fg: #111;
          --pp-settings-accent-bg: rgba(78, 168, 222, .14);
          --pp-settings-accent-border: rgba(78, 168, 222, .5);
          --pp-settings-danger: #ff7b7b;
          --pp-settings-danger-bg: rgba(255, 123, 123, .14);
          --pp-settings-success: #7ee787;
          --pp-settings-success-bg: rgba(126, 231, 135, .14);
        }
      }
    `,
    SETTINGS_STYLE_ID
  );
};

interface ActivePanelHandle {
  focus: () => void;
  close: (restoreFocus?: boolean) => void;
}

let activePanel: ActivePanelHandle | null = null;
let openScheduled = false;

const getFieldDomId = (key: UserSettingKey) => `pp-setting-${key}`;

const createFieldRow = (
  descriptor: SettingFieldDescriptor,
  session: SettingsDraftSession,
  onFieldChange: (key: UserSettingKey) => void
) => {
  const inputId = getFieldDomId(descriptor.key);
  const descId = `${inputId}-desc`;
  const errorId = `${inputId}-err`;

  const row = $("<div>").addClass("pp-settings-field").attr({
    "data-setting-key": descriptor.key,
    "data-control": descriptor.control,
  });

  const mainRow = $("<div>").addClass("pp-settings-row");
  const label = $("<label>")
    .addClass("pp-settings-label")
    .attr("for", inputId)
    .text(descriptor.label);
  const controlWrap = $("<div>").addClass("pp-settings-control");

  let input: JQuery<HTMLElement>;
  const initialValue = session.getDraftValue(descriptor.key);

  if (descriptor.control === "boolean") {
    input = $("<input>")
      .attr({
        id: inputId,
        type: "checkbox",
        "aria-describedby": descId,
      })
      .prop("checked", Boolean(initialValue))
      .on("change", () => {
        session.setInput(descriptor.key, Boolean(input.prop("checked")));
        onFieldChange(descriptor.key);
      });
  } else if (descriptor.control === "select") {
    const select = $("<select>").attr({
      id: inputId,
      "aria-describedby": descId,
    });
    for (const option of descriptor.options ?? []) {
      $("<option>")
        .val(String(option.value))
        .text(option.label)
        .appendTo(select);
    }
    select.val(String(initialValue)).on("change", () => {
      session.setInput(descriptor.key, String(select.val() ?? ""));
      onFieldChange(descriptor.key);
    });
    input = select;
  } else {
    const isNumber = descriptor.control === "number";
    input = $("<input>")
      .attr({
        id: inputId,
        type: "text",
        inputmode: isNumber
          ? descriptor.integer
            ? "numeric"
            : "decimal"
          : "text",
        placeholder: descriptor.placeholder ?? "",
        "aria-describedby": descId,
      })
      .val(String(initialValue))
      .on("input", () => {
        session.setInput(descriptor.key, String(input.val() ?? ""));
        onFieldChange(descriptor.key);
      });
  }

  const restoreOneButton = $("<button>")
    .attr({
      type: "button",
      title: Texts.settings_restoreDefault,
      "aria-label": `${Texts.settings_restoreDefault}：${descriptor.label}`,
    })
    .addClass("pp-settings-icon-btn pp-settings-reset-one")
    .html(restoreDefaultIcon)
    .prop("hidden", session.isFieldDefault(descriptor.key))
    .on("click", () => {
      const wasFocused = document.activeElement === restoreOneButton.get(0);
      const restored = session.restoreField(descriptor.key);
      syncControlValue(descriptor, input, restored);
      onFieldChange(descriptor.key);
      if (wasFocused) {
        input.trigger("focus");
      }
    });

  const revertOneButton = $("<button>")
    .attr({
      type: "button",
      title: Texts.settings_revertToPrevious,
      "aria-label": `${Texts.settings_revertToPrevious}：${descriptor.label}`,
    })
    .addClass("pp-settings-icon-btn pp-settings-revert-one")
    .html(undoIcon)
    .prop("hidden", !session.isFieldModified(descriptor.key))
    .on("click", () => {
      const wasFocused = document.activeElement === revertOneButton.get(0);
      const reverted = session.revertField(descriptor.key);
      syncControlValue(descriptor, input, reverted);
      onFieldChange(descriptor.key);
      if (wasFocused) {
        input.trigger("focus");
      }
    });

  controlWrap.append(restoreOneButton, revertOneButton, input);
  if (descriptor.unit) {
    $("<span>")
      .addClass("pp-settings-unit")
      .text(descriptor.unit)
      .appendTo(controlWrap);
  }

  mainRow.append(label, controlWrap);

  const desc = $("<div>")
    .addClass("pp-settings-desc")
    .attr("id", descId)
    .text(descriptor.description);
  const errorEl = $("<div>")
    .addClass("pp-settings-error")
    .attr("id", errorId)
    .prop("hidden", true);

  row.append(mainRow, desc, errorEl);

  return {
    row,
    input,
    restoreButton: restoreOneButton,
    revertButton: revertOneButton,
    errorEl,
    descId,
    errorId,
  };
};

const syncControlValue = (
  descriptor: SettingFieldDescriptor,
  input: JQuery<HTMLElement>,
  value: boolean | string
) => {
  if (descriptor.control === "boolean") {
    input.prop("checked", Boolean(value));
  } else {
    input.val(String(value));
  }
};

let fieldControls = new Map<
  UserSettingKey,
  {
    descriptor: SettingFieldDescriptor;
    row: JQuery<HTMLElement>;
    input: JQuery<HTMLElement>;
    restoreButton: JQuery<HTMLElement>;
    revertButton: JQuery<HTMLElement>;
    errorEl: JQuery<HTMLElement>;
    descId: string;
    errorId: string;
  }
>();

const DOWNLOAD_TIMING_KEYS: readonly UserSettingKey[] = [
  "downloadProgressPersistMs",
  "downloadHeartbeatMs",
  "downloadOwnerTimeoutMs",
];

const clearFieldError = (key: UserSettingKey) => {
  const control = fieldControls.get(key);
  if (!control) return;
  control.input
    .removeAttr("aria-invalid")
    .attr("aria-describedby", control.descId);
  control.errorEl.prop("hidden", true).text("");
};

const showFieldError = (key: UserSettingKey, message: string) => {
  const control = fieldControls.get(key);
  if (!control) return;
  control.input
    .attr("aria-invalid", "true")
    .attr("aria-describedby", `${control.descId} ${control.errorId}`);
  control.errorEl.text(message).prop("hidden", false);
};

/** 打开右下角单实例配置面板；若已打开则聚焦并保留当前草稿 */
export const openSettingsPanel = () => {
  if (activePanel) {
    activePanel.focus();
    return;
  }
  if (!document.body) {
    if (!openScheduled) {
      openScheduled = true;
      onDomReady(() => {
        openScheduled = false;
        openSettingsPanel();
      });
    }
    return;
  }

  injectSettingsPanelStyles();

  const previousFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const session = createSettingsDraftSession();
  fieldControls = new Map();

  const panel = $("<div>").attr({
    id: PANEL_ID,
    role: "dialog",
    "aria-modal": "false",
    "aria-labelledby": HEADING_ID,
  });

  const closeButton = $("<button>")
    .attr({
      type: "button",
      "aria-label": Texts.settings_close,
    })
    .text(Texts.settings_close);

  $("<header>")
    .append(
      $("<h2>").attr("id", HEADING_ID).text(Texts.settings_panelTitle),
      closeButton
    )
    .appendTo(panel);

  const body = $("<div>").addClass("pp-settings-body").appendTo(panel);
  const statusBanner = $("<div>")
    .addClass("pp-settings-status")
    .attr({ role: "status", "aria-live": "polite" })
    .prop("hidden", true);

  const clearStatus = () => {
    statusBanner.prop("hidden", true).removeAttr("data-state").text("");
  };

  const clearAllErrors = () => {
    for (const key of fieldControls.keys()) {
      clearFieldError(key);
    }
    clearStatus();
  };

  const syncFieldVisualState = (key: UserSettingKey) => {
    const control = fieldControls.get(key);
    if (!control) return;
    const modified = session.isFieldModified(key);
    if (modified) {
      control.row.attr("data-modified", "true");
    } else {
      control.row.removeAttr("data-modified");
    }
    control.restoreButton.prop("hidden", session.isFieldDefault(key));
    control.revertButton.prop("hidden", !modified);
  };

  let advancedToggle: JQuery<HTMLElement> | null = null;
  const syncAdvancedModifiedState = () => {
    if (!advancedToggle) return;
    const anyAdvancedModified = SETTING_FIELDS.some(
      (field) =>
        field.section === "advanced" && session.isFieldModified(field.key)
    );
    if (anyAdvancedModified) {
      advancedToggle.attr("data-modified", "true");
    } else {
      advancedToggle.removeAttr("data-modified");
    }
  };

  const syncAllVisualStates = () => {
    for (const key of fieldControls.keys()) {
      syncFieldVisualState(key);
    }
    syncAdvancedModifiedState();
  };

  const renderGroupSection = (group: (typeof SETTING_GROUPS)[number]) => {
    const fields = SETTING_FIELDS.filter((field) => field.group === group.id);
    if (fields.length === 0) return null;
    const section = $("<section>")
      .addClass("pp-settings-group")
      .attr("data-setting-group", group.id);
    $("<h3>").text(group.title).appendTo(section);
    for (const descriptor of fields) {
      const created = createFieldRow(descriptor, session, (key) => {
        clearFieldError(key);
        if (DOWNLOAD_TIMING_KEYS.includes(key)) {
          for (const siblingKey of DOWNLOAD_TIMING_KEYS) {
            clearFieldError(siblingKey);
          }
        }
        clearStatus();
        syncFieldVisualState(key);
        syncAdvancedModifiedState();
      });
      fieldControls.set(descriptor.key, {
        descriptor,
        row: created.row,
        input: created.input,
        restoreButton: created.restoreButton,
        revertButton: created.revertButton,
        errorEl: created.errorEl,
        descId: created.descId,
        errorId: created.errorId,
      });
      section.append(created.row);
    }
    return section;
  };

  for (const group of SETTING_GROUPS) {
    if (group.section !== "common") continue;
    const section = renderGroupSection(group);
    if (section) body.append(section);
  }

  const advancedGroups = SETTING_GROUPS.filter(
    (group) => group.section === "advanced"
  );
  const advancedBodyId = "pp-settings-advanced-body";
  const advancedBody = $("<div>")
    .attr({ id: advancedBodyId })
    .addClass("pp-settings-advanced-body")
    .prop("hidden", true);
  for (const group of advancedGroups) {
    const section = renderGroupSection(group);
    if (section) advancedBody.append(section);
  }

  let advancedExpanded = false;
  const advancedArrow = $("<span>").attr("aria-hidden", "true").text("▸");
  advancedToggle = $("<button>")
    .attr({
      type: "button",
      "aria-expanded": "false",
      "aria-controls": advancedBodyId,
    })
    .addClass("pp-settings-advanced-toggle")
    .append($("<span>").text(Texts.settings_advancedToggle), advancedArrow);

  const setAdvancedExpanded = (expanded: boolean) => {
    advancedExpanded = expanded;
    advancedToggle!.attr("aria-expanded", String(expanded));
    advancedArrow.text(expanded ? "▾" : "▸");
    advancedBody.prop("hidden", !expanded);
  };
  advancedToggle.on("click", () => setAdvancedExpanded(!advancedExpanded));
  body.append(advancedToggle, advancedBody);

  const restoreAllButton = $("<button>")
    .attr("type", "button")
    .addClass("pp-settings-restore-all")
    .text(Texts.settings_restoreAll)
    .on("click", () => {
      const nextDraft = session.restoreAll();
      for (const [key, control] of fieldControls) {
        syncControlValue(control.descriptor, control.input, nextDraft[key]);
      }
      syncAllVisualStates();
      clearAllErrors();
    });

  const saveButton = $("<button>")
    .attr("type", "button")
    .addClass("pp-settings-primary")
    .text(Texts.settings_save)
    .on("click", () => {
      clearAllErrors();
      const result = session.save();
      if (result.ok) {
        for (const [key, control] of fieldControls) {
          syncControlValue(
            control.descriptor,
            control.input,
            session.getDraftValue(key)
          );
        }
        syncAllVisualStates();
        statusBanner
          .attr("data-state", "success")
          .text(Texts.settings_saveSuccess)
          .prop("hidden", false);
        return;
      }

      const firstError = result.errors[0];
      for (const error of result.errors) {
        if (error.key) {
          showFieldError(error.key, error.message);
        }
      }

      if (
        !advancedExpanded &&
        result.errors.some(
          (err) =>
            err.key &&
            fieldControls.get(err.key)?.descriptor.section === "advanced"
        )
      ) {
        setAdvancedExpanded(true);
      }
      if (firstError?.key) {
        const control = fieldControls.get(firstError.key);
        const label = control?.descriptor.label ?? firstError.key;
        statusBanner
          .attr("data-state", "error")
          .text(
            Texts.settings_validationFailed.replace(
              "%1",
              `${label}（${firstError.message}）`
            )
          )
          .prop("hidden", false);
        const inputEl = control?.input.get(0);
        inputEl?.scrollIntoView({ block: "nearest" });
        inputEl?.focus();
      } else {
        statusBanner
          .attr("data-state", "error")
          .text(
            Texts.settings_saveFailed.replace(
              "%1",
              firstError?.message ?? Texts.settings_saveStorageError
            )
          )
          .prop("hidden", false);
      }
    });

  $("<footer>")
    .append(
      statusBanner,
      $("<div>")
        .addClass("pp-settings-actions")
        .append(restoreAllButton, saveButton)
    )
    .appendTo(panel);

  const unsubscribe = subscribeSettings((nextSettings, _prev, source) => {
    if (source !== "remote") return;
    const updatedKeys = session.applyRemoteUpdate(nextSettings);
    for (const key of updatedKeys) {
      const control = fieldControls.get(key);
      if (control) {
        clearFieldError(key);
        syncControlValue(
          control.descriptor,
          control.input,
          session.getDraftValue(key)
        );
      }
    }
    syncAllVisualStates();
  });

  const closePanel = (restoreFocus = false) => {
    unsubscribe();
    panel.remove();
    fieldControls = new Map();
    activePanel = null;
    if (
      restoreFocus &&
      previousFocus &&
      previousFocus !== document.body &&
      document.contains(previousFocus)
    ) {
      previousFocus.focus({ preventScroll: true });
    } else if (restoreFocus && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const requestClose = (restoreFocus = false) => {
    if (
      session.hasModifiedFields() &&
      !confirm(Texts.settings_confirmDiscard)
    ) {
      return;
    }
    closePanel(restoreFocus);
  };

  closeButton.on("click", () => requestClose(true));
  panel.on("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      requestClose(true);
    }
  });

  panel.appendTo("body");
  activePanel = {
    focus: () => {
      closeButton.trigger("focus");
    },
    close: closePanel,
  };
  activePanel.focus();
};
