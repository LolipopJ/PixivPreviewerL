import type { Messages } from "./zh";

export default {
  install_title: "歡迎使用 Pixiv Previewer L v%1",
  upgrade_body:
    "<p>本腳本基於 %1 二次開發，旨在滿足開發者自己的使用需求。如果您有想法或建議，歡迎前往原腳本的 %2 或在 %3 提出。</p><p>如需查看功能更新紀錄，請前往此腳本的 %4。</p>",
  upgrade_feedback: "Greasy Fork 意見回饋頁面",
  upgrade_issue: "GitHub 議題",
  upgrade_versions: "版本歷史頁面",
  close: "關閉",
  setting_clearFollowingCache: "清除快取",
  setting_clearFollowingCacheHelp:
    "本機快取了作品詳情、作品分頁、動圖影格與標籤資訊。清除後再次存取會重新請求介面。\n\n確定要清除嗎？",
  setting_followingCacheCleared: "已清除快取，請重新整理頁面。",
  setting_clearCacheFailed: "部分快取清除失敗，請稍後再試。",
  cache_usage: "快取佔用",
  cache_usageHelp:
    "作品詳情 %1 筆 · 作品分頁 %2 筆 · 動圖影格 %3 筆（%4）· 標籤翻譯 %5 筆",

  label_sort: "排序作品",
  label_sorting: "正在排序作品",
  label_nextPage: "前往下一頁",
  label_hideFav: "隱藏已收藏作品",
  sort_failed: "作品排序失敗",
  sort_listMissing: "找不到可排序的作品清單。",
  sort_listAmbiguous: "找到 %1 個作品清單，無法確定要排序的清單。",
  sort_reportIssue: "前往 GitHub Issue 頁回報問題",
  sort_getUserWorks: "正在取得目前使用者的作品…",
  sort_getWorks: "正在取得第 %1 頁作品…",
  sort_retryWorks: "正在重新取得第 %1 頁作品（第 %2 次重試）…",
  sort_getDetails: "正在取得作品詳情（%1/%2）…",
  sort_filtering: "正在過濾作品…",
  sort_sorting: "正在為篩選結果排序…",
  preview_original: "原圖",
  preview_ugoira: "動圖",
  artwork_aiGenerated: "AI 生成",
  artwork_aiAssisted: "AI 輔助",

  download_title: "下載紀錄",
  download_close: "關閉下載紀錄",
  download_clearCompleted: "清空已完成紀錄",
  download_clearCompletedHelp: "清空已完成的下載紀錄",
  download_retryFailed: "重試所有失敗紀錄",
  download_moreActions: "更多操作",
  download_ignoreRetryable: "忽略所有待重試紀錄",
  download_ignoreRetryableHelp: "移除所有失敗與中斷的下載紀錄",
  download_list: "圖片下載清單",
  download_empty: "尚無下載紀錄，點擊預覽中的「原圖」開始下載。",
  download_summary: "%1 項下載中 · %2 項已完成 · %3 項待重試",
  download_progress: "%1 的下載進度",
  download_abort: "中止下載 %1",
  download_retry: "重試下載 %1",
  download_remove: "刪除紀錄 %1",
  download_downloading: "下載中",
  download_downloadingHere: "下載中 %1",
  download_downloadingElsewhere: "其他分頁下載中 %1",
  download_completed: "已下載",
  download_interrupted: "下載已中斷，點擊重試重新下載",
  download_failed: "下載失敗：%1",
  download_errorNetwork: "網路錯誤",
  download_errorTimeout: "下載逾時",
  download_errorCanceled: "下載已取消",

  tag_details: "標籤詳情",
  tag_openPreview: "在新分頁開啟預覽作品",
  tag_adding: "正在新增…",
  tag_addFailed: "新增失敗，點擊重試",
  tag_add: "新增至本地標籤",
  tag_total: "插畫漫畫作品總數：%1 件",
  tag_totalAdded: "插畫漫畫作品總數：%1 件（新增 %2 件）",
  tag_totalRemoved: "插畫漫畫作品總數：%1 件（減少 %2 件）",
  tag_loadingDetails: "正在載入標籤詳情…",
  tag_noDescription: "尚無標籤簡介",
  tag_thumbnail: "%1 的縮圖",
  tag_loadFailed: "標籤詳情載入失敗，請稍後重新懸停重試。",
  tag_manage: "本地標籤管理",
  tag_autoSort: "自動排序（存取次數越多越靠前）",
  tag_empty: "尚無本地標籤。懸停任意標籤，點擊「新增至本地標籤」。",
  tag_visits: "存取 %1 次",
  tag_dragSort: "拖曳排序",
  tag_reorder: "調整 %1 的位置",
  tag_labelPlaceholder: "填寫便於記憶的備註名稱",
  tag_label: "%1 的顯示名稱",
  tag_saveLabel: "儲存備註名稱",
  tag_moveUp: "上移",
  tag_moveDown: "下移",
  tag_moveUpNamed: "上移 %1",
  tag_moveDownNamed: "下移 %1",
  tag_remove: "刪除 %1",

  settings_title: "設定",
  settings_save: "儲存",
  settings_restoreDefault: "還原預設值",
  settings_revertToPrevious: "還原至修改前",
  settings_restoreField: "還原 %1 的預設值",
  settings_revertField: "復原對 %1 的修改",
  settings_restoreAll: "全部還原預設值",
  settings_confirmDiscard:
    "存在未儲存的修改，關閉將放棄這些修改，確定要關閉嗎？",
  settings_saveSuccess: "設定已儲存並生效。",
  settings_saveFailed: "儲存失敗：%1",
  settings_saveStorageError: "寫入本機儲存空間失敗，設定未變更。",
  settings_validationFailed: "存在無效設定，請修正 %1（%2）",

  settings_group_general: "一般設定",
  settings_group_preview: "作品預覽",
  settings_group_sort: "作品排序",
  settings_group_localTags: "本地標籤",
  settings_advancedToggle: "進階設定",
  settings_group_cache: "快取",
  settings_group_download: "下載管理",
  settings_group_network: "網路",
  settings_group_scheduling: "內部排程",

  settings_unit_ms: "毫秒",
  settings_unit_s: "秒",
  settings_unit_hour: "小時",
  settings_unit_day: "天",
  settings_unit_pages: "頁",
  settings_unit_bookmarks: "收藏",
  settings_unit_images: "張",
  settings_unit_entries: "筆",
  settings_unit_works: "個作品",
  settings_unit_mib: "MiB",
  settings_unit_bytes: "位元組",
  settings_unit_times: "次",

  settings_field_language_label: "介面語言",
  settings_field_language_desc:
    "腳本介面的顯示語言；預設跟隨頁面語言，不支援的語言將回退為英文",
  settings_option_languageAuto: "跟隨頁面語言",

  settings_field_enablePreview_label: "啟用作品預覽",
  settings_field_enablePreview_desc: "關閉後停止彈出作品與動圖預覽",
  settings_field_enableAnimePreview_label: "預覽動圖",
  settings_field_enableAnimePreview_desc: "受「啟用作品預覽」總開關約束",
  settings_field_previewDelay_label: "懸停延遲",
  settings_field_previewDelay_desc: "滑鼠懸停在圖片上到顯示預覽視窗的等待時長",
  settings_field_linkBlank_label: "在新分頁開啟作品",
  settings_field_linkBlank_desc: "僅作用於作品連結，不影響作者與標籤連結",
  settings_field_previewHoldMs_label: "單手預覽長按時間",
  settings_field_previewHoldMs_desc: "滑鼠長按進入單手預覽模式的時長",
  settings_field_previewLoadingOverlayDelayMs_label: "翻頁載入遮罩延遲",
  settings_field_previewLoadingOverlayDelayMs_desc:
    "翻頁而圖片尚未就緒時，顯示模糊遮罩前的等待時長",
  settings_field_previewDownloadNoticeMs_label: "下載成功提示保留時間",
  settings_field_previewDownloadNoticeMs_desc:
    "下載原圖成功後，恢復按鈕文字的等待時長",

  settings_field_pageCount_label: "每次排序頁數",
  settings_field_pageCount_desc: "建議設定較少的頁碼數，避免觸發請求風控",
  settings_field_favFilter_label: "最低收藏數",
  settings_field_favFilter_desc: "排序後依收藏數過濾顯示的作品",
  settings_field_orderType_label: "排序依據",
  settings_field_orderType_desc: "排序後顯示作品的順序",
  settings_option_orderByBookmark: "依收藏數",
  settings_option_orderByDate: "依發佈時間",
  settings_field_aiFilter_label: "排序過濾 AI 生成",
  settings_field_aiFilter_desc: "排序後是否過濾 AI 生成的作品",
  settings_field_aiAssistedFilter_label: "排序過濾 AI 輔助",
  settings_field_aiAssistedFilter_desc: "排序後是否過濾 AI 輔助的作品",
  settings_field_hideFavorite_label: "排序過濾已收藏",
  settings_field_hideFavorite_desc: "排序後是否過濾已收藏的作品",
  settings_field_hideByTag_label: "啟用排序標籤過濾",
  settings_field_hideByTag_desc: "排序後是否過濾指定標籤的作品",
  settings_field_hideByTagList_label: "排序排除標籤清單",
  settings_field_hideByTagList_placeholder:
    "排序後自訂過濾的作品標籤，多個標籤以半形逗號 , 分隔",
  settings_field_hideByTagList_desc:
    "僅在「啟用排序標籤過濾」時有效，忽略前後空白且不區分大小寫",

  settings_field_enableLocalTags_label: "啟用本地標籤管理",
  settings_field_enableLocalTags_desc:
    "停用會移除介面並停止統計，但保留已有本地標籤資料",
  settings_field_localTagPopoverShowDelayMs_label: "浮層顯示延遲",
  settings_field_localTagPopoverShowDelayMs_desc:
    "懸停或聚焦標籤後彈出詳情浮層的延遲",
  settings_field_localTagPopoverHideDelayMs_label: "浮層關閉延遲",
  settings_field_localTagPopoverHideDelayMs_desc:
    "離開標籤或浮層後延遲關閉的時間",

  settings_field_previewPreloadCount_label: "預覽預載視窗",
  settings_field_previewPreloadCount_desc:
    "包含目前頁面在內的預載張數；解碼快取上限依其兩倍自動計算",
  settings_field_previewCacheMaxEntries_label: "預覽內部快取容量",
  settings_field_previewCacheMaxEntries_desc:
    "預覽分頁網址與動圖中繼資料記憶體 LRU 快取各自的容量上限",
  settings_field_previewDetailsMaxStaleMs_label: "預覽詳情額外陳舊容忍",
  settings_field_previewDetailsMaxStaleMs_desc:
    "疊加在「作品詳情可變資訊有效期限」之上使用",
  settings_field_illustrationMutableCacheTtlMs_label:
    "作品詳情可變資訊有效期限",
  settings_field_illustrationMutableCacheTtlMs_desc:
    "控制收藏數、收藏狀態等可變資訊的新鮮度",
  settings_field_illustrationStaticCacheTtlMs_label: "作品詳情靜態資訊有效期限",
  settings_field_illustrationStaticCacheTtlMs_desc:
    "控制標題、標籤、頁數等靜態資訊的持久化有效期限",
  settings_field_illustrationCacheMaxEntries_label: "作品詳情快取容量",
  settings_field_illustrationCacheMaxEntries_desc:
    "IndexedDB 作品詳情表最大筆數",
  settings_field_newIllustrationNoCacheMs_label: "新作品免快取視窗",
  settings_field_newIllustrationNoCacheMs_desc:
    "發佈未滿該時長的作品不寫入詳情快取",
  settings_field_illustPagesCacheTtlMs_label: "作品分頁快取有效期限",
  settings_field_illustPagesCacheTtlMs_desc:
    "IndexedDB 作品分頁連結快取有效期限",
  settings_field_illustPagesCacheMaxEntries_label: "作品分頁快取容量",
  settings_field_illustPagesCacheMaxEntries_desc:
    "IndexedDB 作品分頁表最大筆數",
  settings_field_userIllustrationsCacheTtlMs_label: "使用者作品清單有效期限",
  settings_field_userIllustrationsCacheTtlMs_desc:
    "Session Storage 使用者作品清單快取有效期限",
  settings_field_ugoiraCacheTtlMs_label: "動圖影格快取有效期限",
  settings_field_ugoiraCacheTtlMs_desc: "IndexedDB 動圖影格快取有效期限",
  settings_field_ugoiraCacheMaxEntries_label: "動圖影格快取作品數上限",
  settings_field_ugoiraCacheMaxEntries_desc:
    "IndexedDB 動圖影格表最多保留的作品數",
  settings_field_ugoiraCacheMaxBytes_label: "動圖影格快取空間上限",
  settings_field_ugoiraCacheMaxBytes_desc:
    "IndexedDB 動圖影格總佔用上限（換算為位元組須為正整數）",
  settings_field_localTagMetadataCacheTtlMs_label: "本地標籤詳情有效期限",
  settings_field_localTagMetadataCacheTtlMs_desc:
    "本地標籤摘要與縮圖快取有效期限",
  settings_field_tagTranslationCacheTtlMs_label: "標籤翻譯快取有效期限",
  settings_field_tagTranslationCacheTtlMs_desc: "標籤中文翻譯快取有效期限",
  settings_field_tagTranslationCacheMaxEntries_label: "標籤翻譯快取容量",
  settings_field_tagTranslationCacheMaxEntries_desc:
    "至少 2 筆；超限時依容量一半無條件捨去淘汰最舊項目",

  settings_field_completedDownloadsMaxEntries_label: "已完成下載紀錄上限",
  settings_field_completedDownloadsMaxEntries_desc:
    "後續紀錄寫入或更新時淘汰超出上限的舊已完成紀錄",
  settings_field_retryableDownloadsMaxEntries_label: "可重試下載紀錄上限",
  settings_field_retryableDownloadsMaxEntries_desc:
    "後續紀錄寫入或更新時淘汰超出上限的舊失敗／中斷紀錄",
  settings_field_downloadProgressPersistMs_label: "進度持久化間隔",
  settings_field_downloadProgressPersistMs_desc:
    "下載進度寫入共享儲存空間的最小間隔（不能大於心跳間隔）",
  settings_field_downloadHeartbeatMs_label: "下載心跳間隔",
  settings_field_downloadHeartbeatMs_desc:
    "重新整理活動下載存活時間與檢查失聯的間隔（必須小於失聯判定時間）",
  settings_field_downloadOwnerTimeoutMs_label: "下載失聯判定時間",
  settings_field_downloadOwnerTimeoutMs_desc:
    "超過該時長未更新狀態的活動下載視為已中斷（必須大於心跳間隔）",

  settings_field_requestRetryIntervalMs_label: "請求重試間隔",
  settings_field_requestRetryIntervalMs_desc: "每次重試等待時間（最短 1 秒）",
  settings_field_requestMaxAttempts_label: "最大嘗試次數",
  settings_field_requestMaxAttempts_desc:
    "包含首次請求；留空或輸入「不限」表示持續重試",
  settings_field_requestMaxAttempts_placeholder: "留空表示不限",
  settings_unlimited: "不限",
  settings_field_tagRequestTimeoutMs_label: "標籤請求逾時",
  settings_field_tagRequestTimeoutMs_desc:
    "標籤詳情與翻譯介面單次請求的逾時時間",
  settings_field_ugoiraChunkBytes_label: "動圖下載分塊大小",
  settings_field_ugoiraChunkBytes_desc:
    "未命中影格快取時分段下載動圖壓縮檔的分塊大小（至少 65,536 位元組）",
  settings_field_ugoiraTrailerBytes_label: "動圖尾部探測大小",
  settings_field_ugoiraTrailerBytes_desc:
    "讀取動圖 ZIP 中央目錄的尾部探測長度（至少 22 位元組）",

  settings_field_databaseOpenTimeoutMs_label: "資料庫開啟逾時",
  settings_field_databaseOpenTimeoutMs_desc:
    "等待 IndexedDB 連線開啟的最大時長",
  settings_field_domProbeIntervalMs_label: "一般 DOM 探測間隔",
  settings_field_domProbeIntervalMs_desc: "等待頁面非同步節點渲染的探測間隔",
  settings_field_domProbeMaxAttempts_label: "一般 DOM 探測次數",
  settings_field_domProbeMaxAttempts_desc: "包含首次探測在內的最大嘗試次數",
  settings_field_toolbarProbeIntervalMs_label: "工具列探測間隔",
  settings_field_toolbarProbeIntervalMs_desc:
    "等待頁面內建工具列渲染的探測間隔",
  settings_field_toolbarProbeMaxAttempts_label: "工具列探測次數",
  settings_field_toolbarProbeMaxAttempts_desc:
    "等待頁面內建工具列的最大嘗試次數",
  settings_field_localTagRenderDebounceMs_label: "標籤介面更新防抖動",
  settings_field_localTagRenderDebounceMs_desc:
    "DOM 變動後重新整理本地標籤入口的防抖動延遲",
  settings_field_localTagPersistDelayMs_label: "本地標籤延遲儲存",
  settings_field_localTagPersistDelayMs_desc:
    "合併標籤編輯寫入儲存空間的延遲，調整時不遺失待儲存資料",
  settings_field_cacheCleanupIdleTimeoutMs_label: "閒置快取清理最長等待",
  settings_field_cacheCleanupIdleTimeoutMs_desc:
    "瀏覽器閒置回呼清理持久化快取的最大等待時長",

  settings_err_required: "請輸入數值，不能為空",
  settings_err_number: "請輸入有效的有限數值",
  settings_err_integer: "必須為整數",
  settings_err_positive: "必須大於 0",
  settings_err_nonNegative: "不能小於 0",
  settings_err_min: "不能小於 %1",
  settings_err_option: "請選擇有效的選項",
  settings_err_progressExceedsHeartbeat: "不能大於下載心跳間隔",
  settings_err_timeoutNotGreaterThanHeartbeat: "必須大於下載心跳間隔",
} satisfies Messages;
