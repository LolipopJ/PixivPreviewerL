import type { Messages } from "./zh";

export default {
  install_title: "Willkommen bei Pixiv Previewer L v%1",
  upgrade_body:
    "<p>Dieses Skript basiert auf %1 und wurde an die Bedürfnisse des Entwicklers angepasst. Vorschläge für das Originalskript können auf der %2 oder als %3 eingereicht werden.</p><p>Änderungen an diesem Skript finden Sie im %4.</p>",
  upgrade_feedback: "Greasy-Fork-Feedback-Seite",
  upgrade_issue: "GitHub-Issue",
  upgrade_versions: "Versionsverlauf",
  close: "Schließen",
  setting_clearFollowingCache: "Cache leeren",
  setting_clearFollowingCacheHelp:
    "Werkdetails, Bildseiten, Ugoira-Frames und Tag-Informationen sind lokal zwischengespeichert. Nach dem Leeren werden sie bei Bedarf erneut abgerufen.\n\nCache wirklich leeren?",
  setting_followingCacheCleared:
    "Cache geleert. Bitte laden Sie die Seite neu.",
  setting_clearCacheFailed:
    "Einige zwischengespeicherte Daten konnten nicht gelöscht werden. Bitte versuchen Sie es später erneut.",
  cache_usage: "Cache-Nutzung",
  cache_usageHelp:
    "Werkdetails: %1 · Bildseiten: %2 · Ugoira-Frames: %3 (%4) · Tag-Übersetzungen: %5",

  label_sort: "Werke sortieren",
  label_sorting: "Werke werden sortiert",
  label_nextPage: "Zur nächsten Seite",
  label_hideFav: "Gespeicherte Werke ausblenden",
  sort_getUserWorks: "Werke dieses Nutzers werden geladen…",
  sort_getWorks: "Werke auf Seite %1 werden geladen…",
  sort_retryWorks: "Seite %1 wird erneut geladen (Versuch %2)…",
  sort_getDetails: "Werkdetails werden geladen (%1/%2)…",
  sort_filtering: "Werke werden gefiltert…",
  sort_sorting: "Ergebnisse werden sortiert…",
  preview_original: "Original",
  preview_ugoira: "Ugoira",
  artwork_aiGenerated: "KI-generiert",
  artwork_aiAssisted: "KI-gestützt",

  download_title: "Download-Verlauf",
  download_close: "Download-Verlauf schließen",
  download_clearCompleted: "Abgeschlossene leeren",
  download_clearCompletedHelp: "Abgeschlossene Download-Einträge entfernen",
  download_retryFailed: "Fehlgeschlagene wiederholen",
  download_moreActions: "Weitere Aktionen",
  download_ignoreRetryable: "Ausstehende Wiederholungen verwerfen",
  download_ignoreRetryableHelp:
    "Alle fehlgeschlagenen und unterbrochenen Download-Einträge entfernen",
  download_list: "Bild-Downloads",
  download_empty:
    "Noch keine Downloads. Klicken Sie in der Vorschau auf „Original“, um einen Download zu starten.",
  download_summary: "%1 aktiv · %2 abgeschlossen · %3 ausstehend",
  download_progress: "Download-Fortschritt für %1",
  download_abort: "Download von %1 abbrechen",
  download_retry: "Download von %1 wiederholen",
  download_remove: "Eintrag für %1 entfernen",
  download_downloading: "Wird geladen",
  download_downloadingHere: "Wird geladen %1",
  download_downloadingElsewhere: "Lädt in anderem Tab %1",
  download_completed: "Heruntergeladen",
  download_interrupted:
    "Download unterbrochen. Auf Wiederholen klicken, um erneut zu laden.",
  download_failed: "Download fehlgeschlagen: %1",
  download_errorNetwork: "Netzwerkfehler",
  download_errorTimeout: "Zeitüberschreitung beim Download",
  download_errorCanceled: "Download abgebrochen",

  tag_details: "Tag-Details",
  tag_openPreview: "Vorgeschautes Werk in neuem Tab öffnen",
  tag_adding: "Wird hinzugefügt…",
  tag_addFailed:
    "Tag konnte nicht hinzugefügt werden. Zum Wiederholen klicken.",
  tag_add: "Zu lokalen Tags hinzufügen",
  tag_total: "Illustrationen und Manga gesamt: %1",
  tag_totalAdded: "Illustrationen und Manga gesamt: %1 (+%2)",
  tag_totalRemoved: "Illustrationen und Manga gesamt: %1 (-%2)",
  tag_loadingDetails: "Tag-Details werden geladen…",
  tag_noDescription: "Keine Tag-Beschreibung",
  tag_thumbnail: "Vorschaubild für %1",
  tag_loadFailed:
    "Tag-Details konnten nicht geladen werden. Zum Wiederholen erneut über den Tag fahren.",
  tag_manage: "Lokale Tags verwalten",
  tag_autoSort: "Automatisch sortieren (häufigste zuerst)",
  tag_empty:
    "Noch keine lokalen Tags. Fahren Sie über einen beliebigen Tag und wählen Sie „Zu lokalen Tags hinzufügen“.",
  tag_visits: "Aufrufe: %1",
  tag_dragSort: "Zum Sortieren ziehen",
  tag_reorder: "%1 neu anordnen",
  tag_labelPlaceholder: "Spitznamen eingeben",
  tag_label: "Anzeigename für %1",
  tag_saveLabel: "Spitznamen speichern",
  tag_moveUp: "Nach oben",
  tag_moveDown: "Nach unten",
  tag_moveUpNamed: "%1 nach oben",
  tag_moveDownNamed: "%1 nach unten",
  tag_remove: "%1 entfernen",

  settings_title: "Einstellungen",
  settings_save: "Speichern",
  settings_restoreDefault: "Standard",
  settings_revertToPrevious: "Änderung verwerfen",
  settings_restoreField: "Standard für %1 wiederherstellen",
  settings_revertField: "Änderungen an %1 verwerfen",
  settings_restoreAll: "Alle zurücksetzen",
  settings_confirmDiscard:
    "Es gibt ungespeicherte Änderungen. Schließen und Änderungen verwerfen?",
  settings_saveSuccess: "Einstellungen gespeichert und angewendet.",
  settings_saveFailed: "Einstellungen konnten nicht gespeichert werden (%1)",
  settings_saveStorageError:
    "Schreiben in den lokalen Speicher fehlgeschlagen. Einstellungen unverändert.",
  settings_validationFailed: "Ungültiger Wert für %1 (%2)",

  settings_group_general: "Allgemein",
  settings_group_preview: "Werkvorschau",
  settings_group_sort: "Werksortierung",
  settings_group_localTags: "Lokale Tags",
  settings_advancedToggle: "Erweiterte Einstellungen",
  settings_group_cache: "Cache",
  settings_group_download: "Downloads",
  settings_group_network: "Netzwerk",
  settings_group_scheduling: "Zeitplanung",

  settings_unit_ms: "ms",
  settings_unit_s: "s",
  settings_unit_hour: "Std.",
  settings_unit_day: "Tage",
  settings_unit_pages: "Seiten",
  settings_unit_bookmarks: "Lesezeichen",
  settings_unit_images: "Bilder",
  settings_unit_entries: "Einträge",
  settings_unit_works: "Werke",
  settings_unit_mib: "MiB",
  settings_unit_bytes: "Bytes",
  settings_unit_times: "Versuche",

  settings_field_language_label: "Sprache",
  settings_field_language_desc:
    "Anzeigesprache der Skript-Oberfläche. Folgt standardmäßig der Seitensprache mit Fallback auf Englisch.",
  settings_option_languageAuto: "Seitensprache folgen",

  settings_field_enablePreview_label: "Werkvorschau aktivieren",
  settings_field_enablePreview_desc:
    "Wenn deaktiviert, werden keine Werk- und Ugoira-Vorschauen angezeigt.",
  settings_field_enableAnimePreview_label: "Ugoira-Vorschau",
  settings_field_enableAnimePreview_desc:
    "Erfordert, dass die Werkvorschau aktiviert ist.",
  settings_field_previewDelay_label: "Hover-Verzögerung",
  settings_field_previewDelay_desc:
    "Wartezeit nach dem Überfahren eines Bildes bis zur Anzeige der Vorschau.",
  settings_field_linkBlank_label: "Werke in neuem Tab öffnen",
  settings_field_linkBlank_desc:
    "Gilt für Werk-Links. Künstler- und Tag-Links bleiben unverändert.",
  settings_field_previewHoldMs_label: "Haltedauer für Einhand-Vorschau",
  settings_field_previewHoldMs_desc:
    "So lange die Maustaste gedrückt halten, um den Einhand-Vorschaumodus zu aktivieren.",
  settings_field_previewLoadingOverlayDelayMs_label:
    "Verzögerung des Lade-Overlays",
  settings_field_previewLoadingOverlayDelayMs_desc:
    "Wartezeit vor Anzeige eines unscharfen Overlays, falls das nächste Bild noch lädt.",
  settings_field_previewDownloadNoticeMs_label:
    "Anzeigedauer der Download-Bestätigung",
  settings_field_previewDownloadNoticeMs_desc:
    "Wie lange die Vorschau-Schaltfläche nach erfolgreichem Download den Status anzeigt.",

  settings_field_pageCount_label: "Seiten pro Sortierung",
  settings_field_pageCount_desc:
    "Weniger Seiten verringern das Risiko, Pixivs Anfragelimits auszulösen.",
  settings_field_favFilter_label: "Mindestanzahl Lesezeichen",
  settings_field_favFilter_desc:
    "Zeigt in sortierten Ergebnissen nur Werke mit mindestens so vielen Lesezeichen.",
  settings_field_orderType_label: "Sortieren nach",
  settings_field_orderType_desc:
    "Legt die Reihenfolge der Werke in den sortierten Ergebnissen fest.",
  settings_option_orderByBookmark: "Lesezeichenzahl",
  settings_option_orderByDate: "Veröffentlichungsdatum",
  settings_field_aiFilter_label: "KI-generierte Werke ausblenden",
  settings_field_aiFilter_desc:
    "Schließt KI-generierte Werke aus den sortierten Ergebnissen aus.",
  settings_field_aiAssistedFilter_label: "KI-gestützte Werke ausblenden",
  settings_field_aiAssistedFilter_desc:
    "Schließt KI-gestützte Werke aus den sortierten Ergebnissen aus.",
  settings_field_hideFavorite_label: "Gespeicherte Werke ausblenden",
  settings_field_hideFavorite_desc:
    "Schließt als Lesezeichen gespeicherte Werke aus den sortierten Ergebnissen aus.",
  settings_field_hideByTag_label: "Tag-Filterung aktivieren",
  settings_field_hideByTag_desc:
    "Schließt Werke mit den angegebenen Tags aus den sortierten Ergebnissen aus.",
  settings_field_hideByTagList_label: "Ausgeschlossene Tags",
  settings_field_hideByTagList_placeholder:
    "Tags durch Komma (,) getrennt eingeben",
  settings_field_hideByTagList_desc:
    "Gilt bei aktiver Tag-Filterung. Groß-/Kleinschreibung und Randleerzeichen werden ignoriert.",

  settings_field_enableLocalTags_label: "Lokale Tags aktivieren",
  settings_field_enableLocalTags_desc:
    "Deaktivieren blendet die Steuerelemente aus und pausiert die Zählung. Gespeicherte Tags bleiben erhalten.",
  settings_field_localTagPopoverShowDelayMs_label:
    "Öffnungsverzögerung für Tag-Details",
  settings_field_localTagPopoverShowDelayMs_desc:
    "Wartezeit nach Hover oder Fokus auf einem Tag vor dem Öffnen der Details.",
  settings_field_localTagPopoverHideDelayMs_label:
    "Schließverzögerung für Tag-Details",
  settings_field_localTagPopoverHideDelayMs_desc:
    "Wartezeit nach Verlassen des Tags oder Popups vor dem Schließen.",

  settings_field_previewPreloadCount_label: "Vorschau-Vorladefenster",
  settings_field_previewPreloadCount_desc:
    "Anzahl vorzuladender Bilder inklusive aktueller Seite. Der Cache für dekodierte Bilder fasst das Doppelte.",
  settings_field_previewCacheMaxEntries_label:
    "Vorschau-Cache-Kapazität im RAM",
  settings_field_previewCacheMaxEntries_desc:
    "Maximale Einträge im Arbeitsspeicher jeweils für Vorschau-Seiten-URLs und Ugoira-Metadaten.",
  settings_field_previewDetailsMaxStaleMs_label:
    "Zusätzliche Toleranz für Vorschau-Details",
  settings_field_previewDetailsMaxStaleMs_desc:
    "Zusätzliche Zeit über die Cache-Laufzeit veränderlicher Werkdetails hinaus.",
  settings_field_illustrationMutableCacheTtlMs_label:
    "Cache-Laufzeit veränderlicher Werkdetails",
  settings_field_illustrationMutableCacheTtlMs_desc:
    "Speicherdauer veränderlicher Daten wie Lesezeichenzahl und -status.",
  settings_field_illustrationStaticCacheTtlMs_label:
    "Cache-Laufzeit statischer Werkdetails",
  settings_field_illustrationStaticCacheTtlMs_desc:
    "Speicherdauer statischer Daten wie Titel, Tags und Seitenzahl.",
  settings_field_illustrationCacheMaxEntries_label:
    "Kapazität des Werkdetail-Caches",
  settings_field_illustrationCacheMaxEntries_desc:
    "Maximale Anzahl an Werkdetail-Einträgen in IndexedDB.",
  settings_field_newIllustrationNoCacheMs_label:
    "Cache-Sperrfrist für neue Werke",
  settings_field_newIllustrationNoCacheMs_desc:
    "Details von Werken, die innerhalb dieses Zeitfensters veröffentlicht wurden, nicht cachen.",
  settings_field_illustPagesCacheTtlMs_label: "Cache-Laufzeit für Bildseiten",
  settings_field_illustPagesCacheTtlMs_desc:
    "Speicherdauer von Bildseiten-URLs in IndexedDB.",
  settings_field_illustPagesCacheMaxEntries_label:
    "Kapazität des Bildseiten-Caches",
  settings_field_illustPagesCacheMaxEntries_desc:
    "Maximale Anzahl an Bildseiten-Einträgen in IndexedDB.",
  settings_field_userIllustrationsCacheTtlMs_label:
    "Cache-Laufzeit für Nutzer-Werklisten",
  settings_field_userIllustrationsCacheTtlMs_desc:
    "Speicherdauer der Werklisten von Nutzern im Session Storage.",
  settings_field_ugoiraCacheTtlMs_label: "Cache-Laufzeit für Ugoira-Frames",
  settings_field_ugoiraCacheTtlMs_desc:
    "Speicherdauer von Ugoira-Frames in IndexedDB.",
  settings_field_ugoiraCacheMaxEntries_label:
    "Werk-Limit im Ugoira-Frame-Cache",
  settings_field_ugoiraCacheMaxEntries_desc:
    "Maximale Anzahl an Werken, deren Frames in IndexedDB gespeichert werden.",
  settings_field_ugoiraCacheMaxBytes_label:
    "Größenlimit des Ugoira-Frame-Caches",
  settings_field_ugoiraCacheMaxBytes_desc:
    "Maximaler Speicherplatz für Ugoira-Frames in IndexedDB (in Bytes eine positive Ganzzahl).",
  settings_field_localTagMetadataCacheTtlMs_label:
    "Cache-Laufzeit für lokale Tag-Details",
  settings_field_localTagMetadataCacheTtlMs_desc:
    "Speicherdauer von Beschreibungen und Vorschaubildern lokaler Tags.",
  settings_field_tagTranslationCacheTtlMs_label:
    "Cache-Laufzeit für Tag-Übersetzungen",
  settings_field_tagTranslationCacheTtlMs_desc:
    "Speicherdauer chinesischer Tag-Übersetzungen.",
  settings_field_tagTranslationCacheMaxEntries_label:
    "Kapazität für Tag-Übersetzungen",
  settings_field_tagTranslationCacheMaxEntries_desc:
    "Mindestens 2 Einträge. Bei Überschreitung werden älteste Einträge auf die abgerundete Hälfte reduziert.",

  settings_field_completedDownloadsMaxEntries_label:
    "Limit abgeschlossener Downloads",
  settings_field_completedDownloadsMaxEntries_desc:
    "Entfernt ältere abgeschlossene Einträge über diesem Limit beim Schreiben oder Aktualisieren.",
  settings_field_retryableDownloadsMaxEntries_label:
    "Limit wiederholbarer Downloads",
  settings_field_retryableDownloadsMaxEntries_desc:
    "Entfernt ältere fehlgeschlagene oder unterbrochene Einträge über diesem Limit beim Schreiben oder Aktualisieren.",
  settings_field_downloadProgressPersistMs_label:
    "Speicherintervall für Download-Fortschritt",
  settings_field_downloadProgressPersistMs_desc:
    "Mindestintervall zwischen Fortschrittsspeicherungen (höchstens das Heartbeat-Intervall).",
  settings_field_downloadHeartbeatMs_label: "Download-Heartbeat-Intervall",
  settings_field_downloadHeartbeatMs_desc:
    "Intervall für Aktivitätssignale und Unterbrechungsprüfungen (kürzer als das Timeout).",
  settings_field_downloadOwnerTimeoutMs_label:
    "Timeout für unterbrochene Downloads",
  settings_field_downloadOwnerTimeoutMs_desc:
    "Markiert einen Download als unterbrochen, wenn er so lange nicht aktualisiert wurde (größer als Heartbeat).",

  settings_field_requestRetryIntervalMs_label: "Anfrage-Wiederholungsintervall",
  settings_field_requestRetryIntervalMs_desc:
    "Wartezeit zwischen Versuchen (mindestens 1 Sekunde).",
  settings_field_requestMaxAttempts_label: "Maximale Anfrageversuche",
  settings_field_requestMaxAttempts_desc:
    "Enthält den ersten Versuch. Leer lassen oder „Unbegrenzt“ eingeben, um weiter zu wiederholen.",
  settings_field_requestMaxAttempts_placeholder: "Leer lassen für unbegrenzt",
  settings_unlimited: "Unbegrenzt",
  settings_field_tagRequestTimeoutMs_label: "Timeout für Tag-Anfragen",
  settings_field_tagRequestTimeoutMs_desc:
    "Zeitlimit je Anfrage für Tag-Details oder Übersetzungen.",
  settings_field_ugoiraChunkBytes_label: "Ugoira-Download-Blockgröße",
  settings_field_ugoiraChunkBytes_desc:
    "Blockgröße beim stückweisen Laden nicht gecachter Ugoira-Archive (mindestens 65.536 Bytes).",
  settings_field_ugoiraTrailerBytes_label: "Ugoira-ZIP-End-Scan-Größe",
  settings_field_ugoiraTrailerBytes_desc:
    "Zu lesende Bytes vom Ende einer Ugoira-ZIP-Datei für das Central Directory (mindestens 22 Bytes).",

  settings_field_databaseOpenTimeoutMs_label: "Datenbank-Öffnungs-Timeout",
  settings_field_databaseOpenTimeoutMs_desc:
    "Maximale Wartezeit auf das Öffnen einer IndexedDB-Verbindung.",
  settings_field_domProbeIntervalMs_label: "DOM-Prüfintervall",
  settings_field_domProbeIntervalMs_desc:
    "Zeitabstand zwischen Prüfungen auf asynchron geladene Seitenelemente.",
  settings_field_domProbeMaxAttempts_label: "Maximale DOM-Prüfungen",
  settings_field_domProbeMaxAttempts_desc:
    "Maximale Anzahl an Prüfungen inklusive der ersten.",
  settings_field_toolbarProbeIntervalMs_label: "Toolbar-Prüfintervall",
  settings_field_toolbarProbeIntervalMs_desc:
    "Zeitabstand zwischen Prüfungen auf die Pixiv-Symbolleiste.",
  settings_field_toolbarProbeMaxAttempts_label: "Maximale Toolbar-Prüfungen",
  settings_field_toolbarProbeMaxAttempts_desc:
    "Maximale Anzahl an Prüfungen auf die Pixiv-Symbolleiste.",
  settings_field_localTagRenderDebounceMs_label:
    "Verzögerung der Tag-UI-Aktualisierung",
  settings_field_localTagRenderDebounceMs_desc:
    "Wartet auf das Abklingen von DOM-Änderungen vor dem Aktualisieren lokaler Tag-Elemente.",
  settings_field_localTagPersistDelayMs_label:
    "Speicherverzögerung für lokale Tags",
  settings_field_localTagPersistDelayMs_desc:
    "Wartezeit vor dem gemeinsamen Speichern von Tag-Änderungen; ausstehende Änderungen bleiben erhalten.",
  settings_field_cacheCleanupIdleTimeoutMs_label:
    "Max. Wartezeit für Leerlauf-Cache-Bereinigung",
  settings_field_cacheCleanupIdleTimeoutMs_desc:
    "Maximale Wartezeit auf einen Leerlauf-Callback des Browsers zur Cache-Bereinigung.",

  settings_err_required: "Wert eingeben.",
  settings_err_number: "Gültige endliche Zahl eingeben.",
  settings_err_integer: "Ganze Zahl eingeben.",
  settings_err_positive: "Muss größer als 0 sein.",
  settings_err_nonNegative: "Muss mindestens 0 sein.",
  settings_err_min: "Muss mindestens %1 betragen.",
  settings_err_option: "Gültige Option wählen.",
  settings_err_progressExceedsHeartbeat:
    "Darf höchstens dem Download-Heartbeat-Intervall entsprechen.",
  settings_err_timeoutNotGreaterThanHeartbeat:
    "Muss länger als das Download-Heartbeat-Intervall sein.",
} satisfies Messages;
