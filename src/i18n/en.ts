import type { Messages } from "./zh";

export default {
  install_title: "Welcome to Pixiv Previewer L v%1",
  upgrade_body:
    "<p>This script is based on %1 and adapted to the developer's needs. Share suggestions for the original script on its %2 or by opening a %3.</p><p>See what changed in this script's %4.</p>",
  upgrade_feedback: "Greasy Fork feedback page",
  upgrade_issue: "GitHub issue",
  upgrade_versions: "version history",
  close: "Close",
  setting_clearFollowingCache: "Clear cache",
  setting_clearFollowingCacheHelp:
    "Artwork details, image pages, Ugoira frames, and tag information are cached locally. Clearing the cache will fetch them again when needed.\n\nClear the cache?",
  setting_followingCacheCleared: "Cache cleared. Please reload the page.",
  setting_clearCacheFailed:
    "Some cached data could not be cleared. Try again later.",
  cache_usage: "Cache usage",
  cache_usageHelp:
    "Artwork details: %1 · Image page entries: %2 · Ugoira frame entries: %3 (%4) · Tag translations: %5",

  label_sort: "Sort artworks",
  label_sorting: "Sorting artworks",
  label_nextPage: "Go to the next page",
  label_hideFav: "Hide bookmarked artworks",
  sort_failed: "Could not sort artworks",
  sort_listMissing: "Could not find the artwork list to sort.",
  sort_listAmbiguous: "Found %1 artwork lists. The sort target is ambiguous.",
  sort_reportIssue: "Report this problem on GitHub",
  sort_getUserWorks: "Loading this user's artworks…",
  sort_getWorks: "Loading artworks on page %1…",
  sort_retryWorks: "Retrying page %1 (retry %2)…",
  sort_getDetails: "Loading artwork details (%1/%2)…",
  sort_filtering: "Filtering artworks…",
  sort_sorting: "Sorting results…",
  preview_original: "Original",
  preview_ugoira: "Ugoira",
  artwork_aiGenerated: "AI-generated",
  artwork_aiAssisted: "AI-assisted",

  download_title: "Download history",
  download_close: "Close download history",
  download_clearCompleted: "Clear completed downloads",
  download_clearCompletedHelp: "Clear completed download records",
  download_retryFailed: "Retry all failed downloads",
  download_moreActions: "More actions",
  download_ignoreRetryable: "Dismiss all pending retries",
  download_ignoreRetryableHelp:
    "Remove all failed and interrupted download records",
  download_list: "Image downloads",
  download_empty:
    "No downloads yet. Select “Original” in the preview to start a download.",
  download_summary: "%1 downloading · %2 completed · %3 awaiting retry",
  download_progress: "Download progress for %1",
  download_abort: "Stop downloading %1",
  download_retry: "Retry downloading %1",
  download_remove: "Remove the record for %1",
  download_downloading: "Downloading",
  download_downloadingHere: "Downloading %1",
  download_downloadingElsewhere: "Downloading in another tab %1",
  download_completed: "Downloaded",
  download_interrupted: "Download interrupted. Select Retry to download again.",
  download_failed: "Download failed: %1",
  download_errorNetwork: "Network error",
  download_errorTimeout: "Download timed out",
  download_errorCanceled: "Download canceled",

  tag_details: "Tag details",
  tag_openPreview: "Open the previewed artwork in a new tab",
  tag_adding: "Adding…",
  tag_addFailed: "Could not add tag. Select to retry.",
  tag_add: "Add to local tags",
  tag_total: "Total illustrations and manga: %1",
  tag_totalAdded: "Total illustrations and manga: %1 (%2 added)",
  tag_totalRemoved: "Total illustrations and manga: %1 (%2 fewer)",
  tag_loadingDetails: "Loading tag details…",
  tag_noDescription: "No tag description",
  tag_thumbnail: "Thumbnail for %1",
  tag_loadFailed:
    "Could not load tag details. Hover over the tag again to retry.",
  tag_manage: "Manage local tags",
  tag_autoSort: "Sort automatically (most visited first)",
  tag_empty:
    "No local tags yet. Hover over any tag and select “Add to local tags”.",
  tag_visits: "Visits: %1",
  tag_dragSort: "Drag to reorder",
  tag_reorder: "Reorder %1",
  tag_labelPlaceholder: "Enter a nickname",
  tag_label: "Display name for %1",
  tag_saveLabel: "Save nickname",
  tag_moveUp: "Move up",
  tag_moveDown: "Move down",
  tag_moveUpNamed: "Move %1 up",
  tag_moveDownNamed: "Move %1 down",
  tag_remove: "Remove %1",

  settings_title: "Settings",
  settings_save: "Save",
  settings_restoreDefault: "Restore default",
  settings_revertToPrevious: "Revert change",
  settings_restoreField: "Restore the default for %1",
  settings_revertField: "Revert changes to %1",
  settings_restoreAll: "Restore all defaults",
  settings_confirmDiscard: "You have unsaved changes. Close and discard them?",
  settings_saveSuccess: "Settings saved and applied.",
  settings_saveFailed: "Could not save settings (%1)",
  settings_saveStorageError:
    "Could not write to local storage. Your settings are unchanged.",
  settings_validationFailed: "Check the value for %1 (%2)",

  settings_group_general: "General",
  settings_group_preview: "Artwork preview",
  settings_group_sort: "Artwork sorting",
  settings_group_localTags: "Local tags",
  settings_advancedToggle: "Advanced settings",
  settings_group_cache: "Cache",
  settings_group_download: "Downloads",
  settings_group_network: "Network",
  settings_group_scheduling: "Scheduling",

  settings_unit_ms: "ms",
  settings_unit_s: "s",
  settings_unit_hour: "h",
  settings_unit_day: "days",
  settings_unit_pages: "pages",
  settings_unit_bookmarks: "bookmarks",
  settings_unit_images: "images",
  settings_unit_entries: "entries",
  settings_unit_works: "artworks",
  settings_unit_mib: "MiB",
  settings_unit_bytes: "bytes",
  settings_unit_times: "attempts",

  settings_field_language_label: "Language",
  settings_field_language_desc:
    "Display language for the script UI. Follows the page language by default and falls back to English.",
  settings_option_languageAuto: "Follow page language",

  settings_field_enablePreview_label: "Enable artwork previews",
  settings_field_enablePreview_desc:
    "When off, artwork and Ugoira previews stop appearing.",
  settings_field_enableAnimePreview_label: "Preview Ugoira",
  settings_field_enableAnimePreview_desc:
    "Requires artwork previews to be enabled.",
  settings_field_previewDelay_label: "Hover delay",
  settings_field_previewDelay_desc:
    "Wait this long after hovering over an image before showing the preview.",
  settings_field_linkBlank_label: "Open artworks in a new tab",
  settings_field_linkBlank_desc:
    "Applies to artwork links. Artist and tag links are unaffected.",
  settings_field_previewHoldMs_label: "Press duration for one-handed preview",
  settings_field_previewHoldMs_desc:
    "Hold the mouse button this long to enter one-handed preview mode.",
  settings_field_previewLoadingOverlayDelayMs_label:
    "Page loading overlay delay",
  settings_field_previewLoadingOverlayDelayMs_desc:
    "Wait this long before showing a blurred overlay if the next image is still loading.",
  settings_field_previewDownloadNoticeMs_label:
    "Download confirmation duration",
  settings_field_previewDownloadNoticeMs_desc:
    "How long the preview button shows the download confirmation before its label resets.",

  settings_field_pageCount_label: "Pages per sort",
  settings_field_pageCount_desc:
    "Use fewer pages to reduce the chance of hitting Pixiv's request limits.",
  settings_field_favFilter_label: "Minimum bookmarks",
  settings_field_favFilter_desc:
    "Only show artworks with at least this many bookmarks in sorted results.",
  settings_field_orderType_label: "Sort by",
  settings_field_orderType_desc:
    "Controls the order of artworks in the sorted results.",
  settings_option_orderByBookmark: "Bookmark count",
  settings_option_orderByDate: "Publication date",
  settings_field_aiFilter_label: "Hide AI-generated artworks",
  settings_field_aiFilter_desc:
    "Exclude AI-generated artworks from sorted results.",
  settings_field_aiAssistedFilter_label: "Hide AI-assisted artworks",
  settings_field_aiAssistedFilter_desc:
    "Exclude AI-assisted artworks from sorted results.",
  settings_field_hideFavorite_label: "Hide bookmarked artworks",
  settings_field_hideFavorite_desc:
    "Exclude bookmarked artworks from sorted results.",
  settings_field_hideByTag_label: "Enable tag filtering",
  settings_field_hideByTag_desc:
    "Exclude artworks with the specified tags from sorted results.",
  settings_field_hideByTagList_label: "Excluded tags",
  settings_field_hideByTagList_placeholder:
    "Enter tags separated by commas (,)",
  settings_field_hideByTagList_desc:
    "Applies when tag filtering is enabled. Capitalization and surrounding spaces are ignored.",

  settings_field_enableLocalTags_label: "Enable local tags",
  settings_field_enableLocalTags_desc:
    "Turning this off hides the local tag controls and pauses tracking. Your saved tags are kept.",
  settings_field_localTagPopoverShowDelayMs_label: "Tag details opening delay",
  settings_field_localTagPopoverShowDelayMs_desc:
    "Wait this long after hovering over or focusing a tag before showing its details.",
  settings_field_localTagPopoverHideDelayMs_label: "Tag details closing delay",
  settings_field_localTagPopoverHideDelayMs_desc:
    "Wait this long after leaving the tag or its details before closing the popup.",

  settings_field_previewPreloadCount_label: "Preview preload window",
  settings_field_previewPreloadCount_desc:
    "Number of images to preload, including the current page. The decoded image cache holds up to twice this count.",
  settings_field_previewCacheMaxEntries_label:
    "In-memory preview cache capacity",
  settings_field_previewCacheMaxEntries_desc:
    "Maximum entries each for cached preview page URLs and Ugoira metadata in memory.",
  settings_field_previewDetailsMaxStaleMs_label:
    "Extra time to reuse cached preview details",
  settings_field_previewDetailsMaxStaleMs_desc:
    "Additional time beyond the cache lifetime for changing artwork details.",
  settings_field_illustrationMutableCacheTtlMs_label:
    "Cache lifetime for changing artwork details",
  settings_field_illustrationMutableCacheTtlMs_desc:
    "How long to cache changing details such as bookmark count and status.",
  settings_field_illustrationStaticCacheTtlMs_label:
    "Cache lifetime for static artwork details",
  settings_field_illustrationStaticCacheTtlMs_desc:
    "How long to cache details such as titles, tags, and page counts.",
  settings_field_illustrationCacheMaxEntries_label:
    "Artwork details cache capacity",
  settings_field_illustrationCacheMaxEntries_desc:
    "Maximum artwork detail entries in IndexedDB.",
  settings_field_newIllustrationNoCacheMs_label:
    "Delay before caching new artworks",
  settings_field_newIllustrationNoCacheMs_desc:
    "Skip caching details for artworks published within this time window.",
  settings_field_illustPagesCacheTtlMs_label: "Image page cache lifetime",
  settings_field_illustPagesCacheTtlMs_desc:
    "How long to cache image page URLs in IndexedDB.",
  settings_field_illustPagesCacheMaxEntries_label: "Image page cache capacity",
  settings_field_illustPagesCacheMaxEntries_desc:
    "Maximum image page entries in IndexedDB.",
  settings_field_userIllustrationsCacheTtlMs_label:
    "User artwork list cache lifetime",
  settings_field_userIllustrationsCacheTtlMs_desc:
    "How long to cache users' artwork lists in session storage.",
  settings_field_ugoiraCacheTtlMs_label: "Ugoira frame cache lifetime",
  settings_field_ugoiraCacheTtlMs_desc:
    "How long to cache Ugoira frames in IndexedDB.",
  settings_field_ugoiraCacheMaxEntries_label: "Ugoira frame cache capacity",
  settings_field_ugoiraCacheMaxEntries_desc:
    "Maximum artworks whose frames are cached in IndexedDB.",
  settings_field_ugoiraCacheMaxBytes_label: "Ugoira frame cache size limit",
  settings_field_ugoiraCacheMaxBytes_desc:
    "Maximum space for Ugoira frames in IndexedDB. Must convert to a positive whole number of bytes.",
  settings_field_localTagMetadataCacheTtlMs_label:
    "Local tag details cache lifetime",
  settings_field_localTagMetadataCacheTtlMs_desc:
    "How long to cache local tag descriptions and thumbnails.",
  settings_field_tagTranslationCacheTtlMs_label:
    "Tag translation cache lifetime",
  settings_field_tagTranslationCacheTtlMs_desc:
    "How long to cache Chinese tag translations.",
  settings_field_tagTranslationCacheMaxEntries_label:
    "Tag translation cache capacity",
  settings_field_tagTranslationCacheMaxEntries_desc:
    "At least 2 entries. When full, evict the oldest entries up to half the capacity, rounded down.",

  settings_field_completedDownloadsMaxEntries_label:
    "Completed download record limit",
  settings_field_completedDownloadsMaxEntries_desc:
    "When records are written or updated, drop older completed records above this limit.",
  settings_field_retryableDownloadsMaxEntries_label:
    "Retryable download record limit",
  settings_field_retryableDownloadsMaxEntries_desc:
    "When records are written or updated, drop older failed or interrupted records above this limit.",
  settings_field_downloadProgressPersistMs_label:
    "Download progress save interval",
  settings_field_downloadProgressPersistMs_desc:
    "Minimum interval between progress saves to shared storage. It must be at most the heartbeat interval.",
  settings_field_downloadHeartbeatMs_label: "Download heartbeat interval",
  settings_field_downloadHeartbeatMs_desc:
    "How often to signal active downloads and check for interruptions. It must be shorter than the interruption timeout.",
  settings_field_downloadOwnerTimeoutMs_label: "Download interruption timeout",
  settings_field_downloadOwnerTimeoutMs_desc:
    "Mark a download as interrupted if it has not updated for this long. It must exceed the heartbeat interval.",

  settings_field_requestRetryIntervalMs_label: "Request retry interval",
  settings_field_requestRetryIntervalMs_desc:
    "Wait between attempts (at least 1 second).",
  settings_field_requestMaxAttempts_label: "Maximum request attempts",
  settings_field_requestMaxAttempts_desc:
    "Includes the first attempt. Leave blank or enter “Unlimited” to keep retrying.",
  settings_field_requestMaxAttempts_placeholder:
    "Leave blank for unlimited retries",
  settings_unlimited: "Unlimited",
  settings_field_tagRequestTimeoutMs_label: "Tag request timeout",
  settings_field_tagRequestTimeoutMs_desc:
    "Timeout for each tag details or translation request.",
  settings_field_ugoiraChunkBytes_label: "Ugoira download chunk size",
  settings_field_ugoiraChunkBytes_desc:
    "Chunk size when downloading an Ugoira archive whose frames are not cached (at least 65,536 bytes).",
  settings_field_ugoiraTrailerBytes_label: "Ugoira ZIP end scan size",
  settings_field_ugoiraTrailerBytes_desc:
    "Amount to read from the end of an Ugoira ZIP to find its central directory (at least 22 bytes).",

  settings_field_databaseOpenTimeoutMs_label: "Database open timeout",
  settings_field_databaseOpenTimeoutMs_desc:
    "Maximum wait for an IndexedDB connection to open.",
  settings_field_domProbeIntervalMs_label: "DOM check interval",
  settings_field_domProbeIntervalMs_desc:
    "Time between checks for page elements that load asynchronously.",
  settings_field_domProbeMaxAttempts_label: "Maximum DOM checks",
  settings_field_domProbeMaxAttempts_desc:
    "Maximum number of checks, including the first one.",
  settings_field_toolbarProbeIntervalMs_label: "Toolbar check interval",
  settings_field_toolbarProbeIntervalMs_desc:
    "Time between checks for Pixiv's toolbar to appear.",
  settings_field_toolbarProbeMaxAttempts_label: "Maximum toolbar checks",
  settings_field_toolbarProbeMaxAttempts_desc:
    "Maximum number of checks for Pixiv's toolbar.",
  settings_field_localTagRenderDebounceMs_label: "Local tag UI refresh delay",
  settings_field_localTagRenderDebounceMs_desc:
    "Wait for DOM changes to settle before refreshing local tag controls.",
  settings_field_localTagPersistDelayMs_label: "Local tag save delay",
  settings_field_localTagPersistDelayMs_desc:
    "Wait before saving tag edits together. Changing this setting keeps unsaved edits queued.",
  settings_field_cacheCleanupIdleTimeoutMs_label:
    "Maximum wait for idle cache cleanup",
  settings_field_cacheCleanupIdleTimeoutMs_desc:
    "Maximum wait for an idle browser callback to clean up persistent caches.",

  settings_err_required: "Enter a value.",
  settings_err_number: "Enter a valid, finite number.",
  settings_err_integer: "Enter a whole number.",
  settings_err_positive: "Must be greater than 0.",
  settings_err_nonNegative: "Must be 0 or greater.",
  settings_err_min: "Must be at least %1.",
  settings_err_option: "Choose a valid option.",
  settings_err_progressExceedsHeartbeat:
    "Must be at most the download heartbeat interval.",
  settings_err_timeoutNotGreaterThanHeartbeat:
    "Must be longer than the download heartbeat interval.",
} satisfies Messages;
