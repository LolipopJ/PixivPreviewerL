// ==UserScript==
// @name                Pixiv Previewer L
// @namespace           https://github.com/LolipopJ/PixivPreviewer
// @version             1.8.1-20261117
// @description         Original project: https://github.com/Ocrosoft/PixivPreviewer.
// @author              Ocrosoft, LolipopJ
// @license             GPL-3.0-only
// @supportURL          https://github.com/LolipopJ/PixivPreviewer
// @match               *://www.pixiv.net/*
// @grant               GM_getValue
// @grant               GM_setValue
// @grant               GM_addValueChangeListener
// @grant               window.onurlchange
// @grant               GM_registerMenuCommand
// @grant               GM.xmlHttpRequest
// @grant               GM_download
// @grant               unsafeWindow
// @icon                https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=32&url=https://www.pixiv.net
// @icon64              https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=https://www.pixiv.net
// @require             https://update.greasyfork.org/scripts/515994/1478507/gh_2215_make_GM_xhr_more_parallel_again.js
// @require             https://code.jquery.com/jquery-4.0.0.min.js
// @require             https://code.jquery.com/jquery-migrate-4.0.2.min.js
// @run-at              document-start
// ==/UserScript==
// src/constants/index.ts
/** 版本号，发生改变时将会弹窗 */
const g_version = "1.8.1";
/** 默认设置 */
const g_defaultSettings = {
	enablePreview: true,
	enableAnimePreview: true,
	previewDelay: 300,
	linkBlank: true,
	previewHoldMs: 300,
	previewLoadingOverlayDelayMs: 120,
	previewDownloadNoticeMs: 3e3,
	enableLocalTags: true,
	localTagPopoverShowDelayMs: 200,
	localTagPopoverHideDelayMs: 180,
	previewPreloadCount: 5,
	previewCacheMaxEntries: 100,
	previewDetailsMaxStaleMs: 864e5,
	illustrationMutableCacheTtlMs: 216e5,
	illustrationStaticCacheTtlMs: 2592e6,
	illustrationCacheMaxEntries: 5e3,
	newIllustrationNoCacheMs: 36e5,
	illustPagesCacheTtlMs: 6048e5,
	illustPagesCacheMaxEntries: 1500,
	userIllustrationsCacheTtlMs: 108e5,
	ugoiraCacheTtlMs: 6048e5,
	ugoiraCacheMaxEntries: 20,
	ugoiraCacheMaxBytes: 67108864,
	localTagMetadataCacheTtlMs: 2592e6,
	tagTranslationCacheTtlMs: 6048e5,
	tagTranslationCacheMaxEntries: 2e3,
	completedDownloadsMaxEntries: 200,
	retryableDownloadsMaxEntries: 200,
	downloadProgressPersistMs: 1e3,
	downloadHeartbeatMs: 15e3,
	downloadOwnerTimeoutMs: 18e4,
	requestRetryIntervalMs: 1e4,
	requestMaxAttempts: null,
	tagRequestTimeoutMs: 1e4,
	ugoiraChunkBytes: 3e5,
	ugoiraTrailerBytes: 3e4,
	databaseOpenTimeoutMs: 1e4,
	domProbeIntervalMs: 300,
	domProbeMaxAttempts: 10,
	toolbarProbeIntervalMs: 200,
	toolbarProbeMaxAttempts: 25,
	localTagRenderDebounceMs: 100,
	localTagPersistDelayMs: 500,
	cacheCleanupIdleTimeoutMs: 3e3,
	pageCount: 2,
	favFilter: 500,
	orderType: 0,
	aiFilter: false,
	aiAssistedFilter: false,
	hideFavorite: true,
	hideByTag: false,
	hideByTagList: "",
	version: g_version
};
/** 加载中占位图片 */
const g_loadingImage = "https://pp-1252089172.cos.ap-chengdu.myqcloud.com/loading.gif";
/** 工具栏 ID */
const TOOLBAR_ID = "pp-toolbar";
/** 排序按钮 ID */
const SORT_BUTTON_ID = "pp-sort";
/** 排序事件名称 */
const SORT_EVENT_NAME = "PIXIV_PREVIEWER_RUN_SORT";
/** 下一页按钮 ID */
const SORT_NEXT_PAGE_BUTTON_ID = "pp-sort-next-page";
/** 下一页事件名称 */
const SORT_NEXT_PAGE_EVENT_NAME = "PIXIV_PREVIEWER_JUMP_TO_NEXT_PAGE";
/** 隐藏已收藏作品按钮 */
const HIDE_FAVORITES_BUTTON_ID = "pp-hide-favorites";
/** 各模块注入的 `<style>` 节点 ID，用于避免重复注入 */
const PREVIEW_STYLE_ID = "pp-preview-styles";
const LOCAL_TAGS_STYLE_ID = "pp-local-tags-styles";
const DOWNLOADS_STYLE_ID = "pp-downloads-styles";
const SETTINGS_STYLE_ID = "pp-settings-styles";
const UPGRADE_STYLE_ID = "pp-upgrade-styles";
/** R18G 作品原图下载目录 */
const R18G_DOWNLOAD_DIRECTORY = "r18-g";
/** R18 标签列表，全小写 */
const R18_TAGS = ["r-18", "r18"];
/** R18G 标签列表，全小写 */
const R18G_TAGS = ["r-18g", "r18g"];
/** AI 辅助标签列表，全小写 */
const AI_ASSISTED_TAGS = [
	"aiイラスト",
	"ai-generated",
	"ai-assisted",
	"ai-shoujo",
	"ai生成",
	"ai輔助",
	"ai辅助",
	"ai加筆",
	"ai加笔",
	"ai绘图",
	"ai繪圖"
];
/** 动图标签列表，全小写 */
const UGOIRA_TAGS = [
	"うごイラ",
	"ugoira",
	"动图",
	"動圖"
];

// src/utils/logger.ts
var ILog = class {
	prefix = "%c Pixiv Preview";
	v(...values) {
		console.log(this.prefix + " [VERBOSE] ", "color:#333 ;background-color: #fff", ...values);
	}
	i(...infos) {
		console.info(this.prefix + " [INFO] ", "color:#333 ;background-color: #fff;", ...infos);
	}
	w(...warnings) {
		console.warn(this.prefix + " [WARNING] ", "color:#111 ;background-color:#ffa500;", ...warnings);
	}
	e(...errors) {
		console.error(this.prefix + " [ERROR] ", "color:#111 ;background-color:#ff0000;", ...errors);
	}
	d(...data) {
		console.log(this.prefix + " [DATA] ", "color:#333 ;background-color: #fff;", ...data);
	}
};
const iLog = new ILog();
function DoLog(level = 3, ...msgOrElement) {
	switch (level) {
		case 1:
			iLog.e(...msgOrElement);
			break;
		case 2:
			iLog.w(...msgOrElement);
			break;
		case 3:
			iLog.i(...msgOrElement);
			break;
		case 4:
		case 0:
		default: iLog.v(...msgOrElement);
	}
}

// src/i18n/index.ts
const Texts = {
	install_title: "欢迎使用 Pixiv Previewer L v",
	upgrade_body: `<p>
  本脚本基于
  <a href="https://greasyfork.org/scripts/30766-pixiv-previewer" target="_blank" rel="noopener noreferrer">Pixiv Previewer</a>
  二次开发，旨在满足开发者自己需要的能力。如果您有不错的想法或建议，请前往原脚本的
  <a href="https://greasyfork.org/scripts/30766-pixiv-previewer/feedback" target="_blank" rel="noopener noreferrer">Greasy Fork 反馈页面</a>或开启一个新的
  <a href="https://github.com/Ocrosoft/PixivPreviewer/issues" target="_blank" rel="noopener noreferrer">Github 议题</a>！
</p>
<p>
  如需查看功能更新记录，可前往此脚本的
  <a href="https://greasyfork.org/scripts/533844-pixiv-previewer-l/versions" target="_blank" rel="noopener noreferrer">版本历史页面</a>。
</p>`,
	setting_language: "语言",
	setting_preview: "预览",
	setting_animePreview: "动图预览",
	setting_sort: "搜索页自动排序",
	setting_anime: "动图下载（动图预览及详情页生效）",
	setting_origin: "预览时优先显示原图（慢）",
	setting_previewDelay: "延迟显示预览图（毫秒）",
	setting_previewByKey: "使用按键控制预览图展示（Ctrl）",
	setting_previewByKeyHelp: "开启后鼠标移动到图片上不再展示预览图，按下Ctrl键才展示，同时“延迟显示预览”设置项不生效。",
	setting_maxPage: "每次排序时统计的最大页数",
	setting_hideWork: "隐藏收藏数少于设定值的作品",
	setting_sortOrderByBookmark: "按照收藏数排序作品",
	setting_hideAiWork: "排序时隐藏 AI 生成作品",
	setting_hideAiAssistedWork: "排序时隐藏 AI 辅助作品",
	setting_hideFav: "排序时隐藏已收藏的作品",
	setting_hideFollowed: "排序时隐藏已关注画师作品",
	setting_hideByTag: "排序时隐藏指定标签的作品",
	setting_hideByTagPlaceholder: "输入标签名，多个标签用','分隔",
	setting_clearFollowingCache: "清除缓存",
	setting_clearFollowingCacheHelp: "本地缓存了作品详情、作品分页、动图帧与标签信息。清除后再次访问会重新请求接口。",
	setting_followingCacheCleared: "已清除缓存，请刷新页面。",
	setting_clearCacheFailed: "部分缓存清除失败，请稍后重试。",
	cache_usage: "缓存占用",
	cache_usageHelp: "作品详情 %1 个 · 作品分页 %2 个 · 动图帧 %3 个（%4）· 标签翻译 %5 个",
	setting_blank: "使用新标签页打开作品详情页",
	setting_turnPage: "使用键盘←→进行翻页（排序后的搜索页）",
	setting_save: "保存设置",
	setting_reset: "重置脚本",
	setting_resetHint: "这会删除所有设置，相当于重新安装脚本，确定要重置吗？",
	setting_novelSort: "小说排序",
	setting_novelMaxPage: "小说排序时统计的最大页数",
	setting_novelHideWork: "隐藏收藏数少于设定值的作品",
	setting_novelHideFav: "排序时隐藏已收藏的作品",
	sort_noWork: "没有可以显示的作品（隐藏了 %1 个作品）",
	sort_getWorks: "正在获取第 %1/%2 页作品",
	sort_getBookmarkCount: "获取收藏数：%1/%2",
	sort_getPublicFollowing: "获取公开关注画师",
	sort_getPrivateFollowing: "获取私有关注画师",
	sort_filtering: "过滤%1收藏量低于%2的作品",
	sort_filteringHideFavorite: "已收藏和",
	sort_fullSizeThumb: "全尺寸缩略图（搜索页、用户页）",
	label_sort: "排序",
	label_sorting: "排序中",
	label_nextPage: "下一页",
	label_hideFav: "过滤收藏",
	settings_menu: "设置",
	settings_panelTitle: "设置",
	settings_close: "关闭",
	settings_save: "保存",
	settings_restoreDefault: "恢复默认",
	settings_revertToPrevious: "恢复到修改前",
	settings_restoreAll: "全部恢复默认",
	settings_confirmDiscard: "存在未保存的修改，关闭将放弃这些修改，确定要关闭吗？",
	settings_saveSuccess: "设置已保存并生效。",
	settings_saveFailed: "保存失败：%1",
	settings_saveStorageError: "写入本地存储失败，配置未更改。",
	settings_validationFailed: "存在无效配置，请修正：%1",
	settings_group_preview: "作品预览",
	settings_group_sort: "作品排序",
	settings_group_localTags: "本地标签",
	settings_advancedToggle: "高级设置",
	settings_group_cache: "缓存",
	settings_group_download: "下载管理",
	settings_group_network: "网络",
	settings_group_scheduling: "内部调度",
	settings_unit_ms: "毫秒",
	settings_unit_s: "秒",
	settings_unit_hour: "小时",
	settings_unit_day: "天",
	settings_unit_pages: "页",
	settings_unit_bookmarks: "收藏",
	settings_unit_images: "张",
	settings_unit_entries: "条",
	settings_unit_works: "个作品",
	settings_unit_mib: "MiB",
	settings_unit_bytes: "字节",
	settings_unit_times: "次",
	settings_field_enablePreview_label: "启用作品预览",
	settings_field_enablePreview_desc: "关闭后停止弹出作品与动图预览",
	settings_field_enableAnimePreview_label: "预览动图",
	settings_field_enableAnimePreview_desc: "受“启用作品预览”总开关约束",
	settings_field_previewDelay_label: "悬停延迟",
	settings_field_previewDelay_desc: "鼠标悬停在图片上到显示预览窗口的等待时长",
	settings_field_linkBlank_label: "在新标签页打开作品",
	settings_field_linkBlank_desc: "仅作用于作品链接，不影响作者与标签链接",
	settings_field_previewHoldMs_label: "单手预览长按时间",
	settings_field_previewHoldMs_desc: "鼠标长按进入单手预览模式的时长",
	settings_field_previewLoadingOverlayDelayMs_label: "翻页加载遮罩延迟",
	settings_field_previewLoadingOverlayDelayMs_desc: "翻页而图片未就绪时，显示毛玻璃遮罩前的等待时长",
	settings_field_previewDownloadNoticeMs_label: "下载成功提示保留时间",
	settings_field_previewDownloadNoticeMs_desc: "下载原图成功后，恢复按钮文字的等待时长",
	settings_field_pageCount_label: "每次排序页数",
	settings_field_pageCount_desc: "建议设置较少的页码数，避免触发请求风控",
	settings_field_favFilter_label: "最低收藏数",
	settings_field_favFilter_desc: "排序后根据收藏数过滤展示的作品",
	settings_field_orderType_label: "排序依据",
	settings_field_orderType_desc: "排序后展示作品的顺序",
	settings_option_orderByBookmark: "按收藏数",
	settings_option_orderByDate: "按发布时间",
	settings_field_aiFilter_label: "排序过滤 AI 生成",
	settings_field_aiFilter_desc: "排序后是否过滤 AI 生成的作品",
	settings_field_aiAssistedFilter_label: "排序过滤 AI 辅助",
	settings_field_aiAssistedFilter_desc: "排序后是否过滤 AI 辅助的作品",
	settings_field_hideFavorite_label: "排序过滤已收藏",
	settings_field_hideFavorite_desc: "排序后是否过滤已收藏的作品",
	settings_field_hideByTag_label: "启用排序标签过滤",
	settings_field_hideByTag_desc: "排序后是否过滤指定标签的作品",
	settings_field_hideByTagList_label: "排序排除标签列表",
	settings_field_hideByTagList_placeholder: "排序后自定义过滤的作品标签，多个标签用英文逗号 , 分隔",
	settings_field_hideByTagList_desc: "仅在“启用排序标签过滤”时有效，忽略首尾空白且不区分大小写",
	settings_field_enableLocalTags_label: "启用本地标签管理",
	settings_field_enableLocalTags_desc: "停用会移除界面并停止统计，但保留已有本地标签数据",
	settings_field_localTagPopoverShowDelayMs_label: "浮层显示延迟",
	settings_field_localTagPopoverShowDelayMs_desc: "悬浮或聚焦标签后弹出详情浮层的延迟",
	settings_field_localTagPopoverHideDelayMs_label: "浮层关闭延迟",
	settings_field_localTagPopoverHideDelayMs_desc: "离开标签或浮层后延迟关闭的时间",
	settings_field_previewPreloadCount_label: "预览预加载窗口",
	settings_field_previewPreloadCount_desc: "包含当前页在内的预加载张数；解码缓存上限按其两倍自动计算",
	settings_field_previewCacheMaxEntries_label: "预览内部缓存容量",
	settings_field_previewCacheMaxEntries_desc: "预览分页地址与动图元数据内存 LRU 缓存各自的容量上限",
	settings_field_previewDetailsMaxStaleMs_label: "预览详情额外陈旧容忍",
	settings_field_previewDetailsMaxStaleMs_desc: "叠加在“作品详情可变信息有效期”之上使用",
	settings_field_illustrationMutableCacheTtlMs_label: "作品详情可变信息有效期",
	settings_field_illustrationMutableCacheTtlMs_desc: "控制收藏数、收藏状态等可变信息的新鲜度",
	settings_field_illustrationStaticCacheTtlMs_label: "作品详情静态信息有效期",
	settings_field_illustrationStaticCacheTtlMs_desc: "控制标题、标签、页数等静态信息的持久化有效期",
	settings_field_illustrationCacheMaxEntries_label: "作品详情缓存容量",
	settings_field_illustrationCacheMaxEntries_desc: "IndexedDB 作品详情表最大条数",
	settings_field_newIllustrationNoCacheMs_label: "新作品免缓存窗口",
	settings_field_newIllustrationNoCacheMs_desc: "发布未满该时长的作品不写入详情缓存",
	settings_field_illustPagesCacheTtlMs_label: "作品分页缓存有效期",
	settings_field_illustPagesCacheTtlMs_desc: "IndexedDB 作品分页链接缓存有效期",
	settings_field_illustPagesCacheMaxEntries_label: "作品分页缓存容量",
	settings_field_illustPagesCacheMaxEntries_desc: "IndexedDB 作品分页表最大条数",
	settings_field_userIllustrationsCacheTtlMs_label: "用户作品列表有效期",
	settings_field_userIllustrationsCacheTtlMs_desc: "Session Storage 用户作品列表缓存有效期",
	settings_field_ugoiraCacheTtlMs_label: "动图帧缓存有效期",
	settings_field_ugoiraCacheTtlMs_desc: "IndexedDB 动图帧缓存有效期",
	settings_field_ugoiraCacheMaxEntries_label: "动图帧缓存作品数上限",
	settings_field_ugoiraCacheMaxEntries_desc: "IndexedDB 动图帧表最多保留的作品数",
	settings_field_ugoiraCacheMaxBytes_label: "动图帧缓存空间上限",
	settings_field_ugoiraCacheMaxBytes_desc: "IndexedDB 动图帧总占用上限（换算为字节需为正整数）",
	settings_field_localTagMetadataCacheTtlMs_label: "本地标签详情有效期",
	settings_field_localTagMetadataCacheTtlMs_desc: "本地标签摘要与缩略图缓存有效期",
	settings_field_tagTranslationCacheTtlMs_label: "标签翻译缓存有效期",
	settings_field_tagTranslationCacheTtlMs_desc: "标签中文翻译缓存有效期",
	settings_field_tagTranslationCacheMaxEntries_label: "标签翻译缓存容量",
	settings_field_tagTranslationCacheMaxEntries_desc: "至少 2 条；超限时按容量一半向下取整淘汰最旧条目",
	settings_field_completedDownloadsMaxEntries_label: "已完成下载记录上限",
	settings_field_completedDownloadsMaxEntries_desc: "后续记录写入或更新时淘汰超出上限的旧已完成记录",
	settings_field_retryableDownloadsMaxEntries_label: "可重试下载记录上限",
	settings_field_retryableDownloadsMaxEntries_desc: "后续记录写入或更新时淘汰超出上限的旧失败/中断记录",
	settings_field_downloadProgressPersistMs_label: "进度持久化间隔",
	settings_field_downloadProgressPersistMs_desc: "下载进度写入共享存储的最小间隔（不能大于心跳间隔）",
	settings_field_downloadHeartbeatMs_label: "下载心跳间隔",
	settings_field_downloadHeartbeatMs_desc: "刷新活动下载存活时间与检查失联的间隔（必须小于失联判定时间）",
	settings_field_downloadOwnerTimeoutMs_label: "下载失联判定时间",
	settings_field_downloadOwnerTimeoutMs_desc: "超过该时长未更新状态的活动下载视为已中断（必须大于心跳间隔）",
	settings_field_requestRetryIntervalMs_label: "请求重试间隔",
	settings_field_requestRetryIntervalMs_desc: "每次重试等待时间（最短 1 秒）",
	settings_field_requestMaxAttempts_label: "最大尝试次数",
	settings_field_requestMaxAttempts_desc: "包含首次请求；留空或填“不限”表示持续重试",
	settings_field_requestMaxAttempts_placeholder: "留空表示不限",
	settings_field_tagRequestTimeoutMs_label: "标签请求超时",
	settings_field_tagRequestTimeoutMs_desc: "标签详情与翻译接口单次请求的超时时间",
	settings_field_ugoiraChunkBytes_label: "动图下载分块大小",
	settings_field_ugoiraChunkBytes_desc: "未命中帧缓存时分段下载动图压缩包的分块大小（至少 65536 字节）",
	settings_field_ugoiraTrailerBytes_label: "动图尾部探测大小",
	settings_field_ugoiraTrailerBytes_desc: "读取动图 ZIP 中央目录的尾部探测长度（至少 22 字节）",
	settings_field_databaseOpenTimeoutMs_label: "数据库打开超时",
	settings_field_databaseOpenTimeoutMs_desc: "等待 IndexedDB 连接打开的最大时长",
	settings_field_domProbeIntervalMs_label: "通用 DOM 探测间隔",
	settings_field_domProbeIntervalMs_desc: "等待页面异步节点渲染的探测间隔",
	settings_field_domProbeMaxAttempts_label: "通用 DOM 探测次数",
	settings_field_domProbeMaxAttempts_desc: "包含首次探测在内的最大尝试次数",
	settings_field_toolbarProbeIntervalMs_label: "工具栏探测间隔",
	settings_field_toolbarProbeIntervalMs_desc: "等待页面自带工具栏渲染的探测间隔",
	settings_field_toolbarProbeMaxAttempts_label: "工具栏探测次数",
	settings_field_toolbarProbeMaxAttempts_desc: "等待页面自带工具栏的最大尝试次数",
	settings_field_localTagRenderDebounceMs_label: "标签界面更新防抖",
	settings_field_localTagRenderDebounceMs_desc: "DOM 变动后刷新本地标签入口的防抖延迟",
	settings_field_localTagPersistDelayMs_label: "本地标签延迟保存",
	settings_field_localTagPersistDelayMs_desc: "合并标签编辑写入存储的延迟，调整时不丢失待保存数据",
	settings_field_cacheCleanupIdleTimeoutMs_label: "空闲缓存清理最长等待",
	settings_field_cacheCleanupIdleTimeoutMs_desc: "浏览器空闲回调清理持久化缓存的最大等待时长",
	settings_err_required: "请输入数值，不能为空",
	settings_err_number: "请输入有效的有限数值",
	settings_err_integer: "必须为整数",
	settings_err_positive: "必须大于 0",
	settings_err_nonNegative: "不能小于 0",
	settings_err_min: "不能小于 %1",
	settings_err_option: "请选择有效的选项",
	settings_err_progressExceedsHeartbeat: "不能大于下载心跳间隔",
	settings_err_timeoutNotGreaterThanHeartbeat: "必须大于下载心跳间隔"
};

// src/constants/settings.ts
const SETTING_GROUPS = [
	{
		id: "preview",
		section: "common",
		title: Texts.settings_group_preview
	},
	{
		id: "sort",
		section: "common",
		title: Texts.settings_group_sort
	},
	{
		id: "localTags",
		section: "common",
		title: Texts.settings_group_localTags
	},
	{
		id: "cache",
		section: "advanced",
		title: Texts.settings_group_cache
	},
	{
		id: "download",
		section: "advanced",
		title: Texts.settings_group_download
	},
	{
		id: "network",
		section: "advanced",
		title: Texts.settings_group_network
	},
	{
		id: "scheduling",
		section: "advanced",
		title: Texts.settings_group_scheduling
	}
];
/** 用户可见配置字段的唯一清单，由 `UserSettingKey` 约束并明确排除 `version` */
const SETTING_FIELD_MAP = {
	enablePreview: {
		key: "enablePreview",
		section: "common",
		group: "preview",
		control: "boolean",
		label: Texts.settings_field_enablePreview_label,
		description: Texts.settings_field_enablePreview_desc
	},
	enableAnimePreview: {
		key: "enableAnimePreview",
		section: "common",
		group: "preview",
		control: "boolean",
		label: Texts.settings_field_enableAnimePreview_label,
		description: Texts.settings_field_enableAnimePreview_desc
	},
	previewDelay: {
		key: "previewDelay",
		section: "common",
		group: "preview",
		control: "number",
		label: Texts.settings_field_previewDelay_label,
		description: Texts.settings_field_previewDelay_desc,
		unit: Texts.settings_unit_ms,
		min: 0
	},
	linkBlank: {
		key: "linkBlank",
		section: "common",
		group: "preview",
		control: "boolean",
		label: Texts.settings_field_linkBlank_label,
		description: Texts.settings_field_linkBlank_desc
	},
	previewHoldMs: {
		key: "previewHoldMs",
		section: "common",
		group: "preview",
		control: "number",
		label: Texts.settings_field_previewHoldMs_label,
		description: Texts.settings_field_previewHoldMs_desc,
		unit: Texts.settings_unit_ms
	},
	previewLoadingOverlayDelayMs: {
		key: "previewLoadingOverlayDelayMs",
		section: "common",
		group: "preview",
		control: "number",
		label: Texts.settings_field_previewLoadingOverlayDelayMs_label,
		description: Texts.settings_field_previewLoadingOverlayDelayMs_desc,
		unit: Texts.settings_unit_ms,
		min: 0
	},
	previewDownloadNoticeMs: {
		key: "previewDownloadNoticeMs",
		section: "common",
		group: "preview",
		control: "number",
		label: Texts.settings_field_previewDownloadNoticeMs_label,
		description: Texts.settings_field_previewDownloadNoticeMs_desc,
		unit: Texts.settings_unit_s,
		scale: 1e3,
		min: 0
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
		integer: true
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
		integer: true
	},
	orderType: {
		key: "orderType",
		section: "common",
		group: "sort",
		control: "select",
		label: Texts.settings_field_orderType_label,
		description: Texts.settings_field_orderType_desc,
		options: [{
			value: 0,
			label: Texts.settings_option_orderByBookmark
		}, {
			value: 1,
			label: Texts.settings_option_orderByDate
		}]
	},
	aiFilter: {
		key: "aiFilter",
		section: "common",
		group: "sort",
		control: "boolean",
		label: Texts.settings_field_aiFilter_label,
		description: Texts.settings_field_aiFilter_desc
	},
	aiAssistedFilter: {
		key: "aiAssistedFilter",
		section: "common",
		group: "sort",
		control: "boolean",
		label: Texts.settings_field_aiAssistedFilter_label,
		description: Texts.settings_field_aiAssistedFilter_desc
	},
	hideFavorite: {
		key: "hideFavorite",
		section: "common",
		group: "sort",
		control: "boolean",
		label: Texts.settings_field_hideFavorite_label,
		description: Texts.settings_field_hideFavorite_desc
	},
	hideByTag: {
		key: "hideByTag",
		section: "common",
		group: "sort",
		control: "boolean",
		label: Texts.settings_field_hideByTag_label,
		description: Texts.settings_field_hideByTag_desc
	},
	hideByTagList: {
		key: "hideByTagList",
		section: "common",
		group: "sort",
		control: "text",
		label: Texts.settings_field_hideByTagList_label,
		description: Texts.settings_field_hideByTagList_desc,
		placeholder: Texts.settings_field_hideByTagList_placeholder
	},
	enableLocalTags: {
		key: "enableLocalTags",
		section: "common",
		group: "localTags",
		control: "boolean",
		label: Texts.settings_field_enableLocalTags_label,
		description: Texts.settings_field_enableLocalTags_desc
	},
	localTagPopoverShowDelayMs: {
		key: "localTagPopoverShowDelayMs",
		section: "common",
		group: "localTags",
		control: "number",
		label: Texts.settings_field_localTagPopoverShowDelayMs_label,
		description: Texts.settings_field_localTagPopoverShowDelayMs_desc,
		unit: Texts.settings_unit_ms,
		min: 0
	},
	localTagPopoverHideDelayMs: {
		key: "localTagPopoverHideDelayMs",
		section: "common",
		group: "localTags",
		control: "number",
		label: Texts.settings_field_localTagPopoverHideDelayMs_label,
		description: Texts.settings_field_localTagPopoverHideDelayMs_desc,
		unit: Texts.settings_unit_ms,
		min: 0
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
		integer: true
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
		integer: true
	},
	previewDetailsMaxStaleMs: {
		key: "previewDetailsMaxStaleMs",
		section: "advanced",
		group: "cache",
		control: "number",
		label: Texts.settings_field_previewDetailsMaxStaleMs_label,
		description: Texts.settings_field_previewDetailsMaxStaleMs_desc,
		unit: Texts.settings_unit_hour,
		scale: 36e5
	},
	illustrationMutableCacheTtlMs: {
		key: "illustrationMutableCacheTtlMs",
		section: "advanced",
		group: "cache",
		control: "number",
		label: Texts.settings_field_illustrationMutableCacheTtlMs_label,
		description: Texts.settings_field_illustrationMutableCacheTtlMs_desc,
		unit: Texts.settings_unit_hour,
		scale: 36e5
	},
	illustrationStaticCacheTtlMs: {
		key: "illustrationStaticCacheTtlMs",
		section: "advanced",
		group: "cache",
		control: "number",
		label: Texts.settings_field_illustrationStaticCacheTtlMs_label,
		description: Texts.settings_field_illustrationStaticCacheTtlMs_desc,
		unit: Texts.settings_unit_day,
		scale: 864e5
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
		integer: true
	},
	newIllustrationNoCacheMs: {
		key: "newIllustrationNoCacheMs",
		section: "advanced",
		group: "cache",
		control: "number",
		label: Texts.settings_field_newIllustrationNoCacheMs_label,
		description: Texts.settings_field_newIllustrationNoCacheMs_desc,
		unit: Texts.settings_unit_hour,
		scale: 36e5
	},
	illustPagesCacheTtlMs: {
		key: "illustPagesCacheTtlMs",
		section: "advanced",
		group: "cache",
		control: "number",
		label: Texts.settings_field_illustPagesCacheTtlMs_label,
		description: Texts.settings_field_illustPagesCacheTtlMs_desc,
		unit: Texts.settings_unit_day,
		scale: 864e5
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
		integer: true
	},
	userIllustrationsCacheTtlMs: {
		key: "userIllustrationsCacheTtlMs",
		section: "advanced",
		group: "cache",
		control: "number",
		label: Texts.settings_field_userIllustrationsCacheTtlMs_label,
		description: Texts.settings_field_userIllustrationsCacheTtlMs_desc,
		unit: Texts.settings_unit_hour,
		scale: 36e5
	},
	ugoiraCacheTtlMs: {
		key: "ugoiraCacheTtlMs",
		section: "advanced",
		group: "cache",
		control: "number",
		label: Texts.settings_field_ugoiraCacheTtlMs_label,
		description: Texts.settings_field_ugoiraCacheTtlMs_desc,
		unit: Texts.settings_unit_day,
		scale: 864e5
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
		integer: true
	},
	ugoiraCacheMaxBytes: {
		key: "ugoiraCacheMaxBytes",
		section: "advanced",
		group: "cache",
		control: "number",
		label: Texts.settings_field_ugoiraCacheMaxBytes_label,
		description: Texts.settings_field_ugoiraCacheMaxBytes_desc,
		unit: Texts.settings_unit_mib,
		scale: 1048576,
		integer: true
	},
	localTagMetadataCacheTtlMs: {
		key: "localTagMetadataCacheTtlMs",
		section: "advanced",
		group: "cache",
		control: "number",
		label: Texts.settings_field_localTagMetadataCacheTtlMs_label,
		description: Texts.settings_field_localTagMetadataCacheTtlMs_desc,
		unit: Texts.settings_unit_day,
		scale: 864e5
	},
	tagTranslationCacheTtlMs: {
		key: "tagTranslationCacheTtlMs",
		section: "advanced",
		group: "cache",
		control: "number",
		label: Texts.settings_field_tagTranslationCacheTtlMs_label,
		description: Texts.settings_field_tagTranslationCacheTtlMs_desc,
		unit: Texts.settings_unit_day,
		scale: 864e5
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
		integer: true
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
		integer: true
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
		integer: true
	},
	downloadProgressPersistMs: {
		key: "downloadProgressPersistMs",
		section: "advanced",
		group: "download",
		control: "number",
		label: Texts.settings_field_downloadProgressPersistMs_label,
		description: Texts.settings_field_downloadProgressPersistMs_desc,
		unit: Texts.settings_unit_s,
		scale: 1e3
	},
	downloadHeartbeatMs: {
		key: "downloadHeartbeatMs",
		section: "advanced",
		group: "download",
		control: "number",
		label: Texts.settings_field_downloadHeartbeatMs_label,
		description: Texts.settings_field_downloadHeartbeatMs_desc,
		unit: Texts.settings_unit_s,
		scale: 1e3
	},
	downloadOwnerTimeoutMs: {
		key: "downloadOwnerTimeoutMs",
		section: "advanced",
		group: "download",
		control: "number",
		label: Texts.settings_field_downloadOwnerTimeoutMs_label,
		description: Texts.settings_field_downloadOwnerTimeoutMs_desc,
		unit: Texts.settings_unit_s,
		scale: 1e3
	},
	requestRetryIntervalMs: {
		key: "requestRetryIntervalMs",
		section: "advanced",
		group: "network",
		control: "number",
		label: Texts.settings_field_requestRetryIntervalMs_label,
		description: Texts.settings_field_requestRetryIntervalMs_desc,
		unit: Texts.settings_unit_s,
		scale: 1e3,
		min: 1e3
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
		placeholder: Texts.settings_field_requestMaxAttempts_placeholder
	},
	tagRequestTimeoutMs: {
		key: "tagRequestTimeoutMs",
		section: "advanced",
		group: "network",
		control: "number",
		label: Texts.settings_field_tagRequestTimeoutMs_label,
		description: Texts.settings_field_tagRequestTimeoutMs_desc,
		unit: Texts.settings_unit_s,
		scale: 1e3
	},
	ugoiraChunkBytes: {
		key: "ugoiraChunkBytes",
		section: "advanced",
		group: "network",
		control: "number",
		label: Texts.settings_field_ugoiraChunkBytes_label,
		description: Texts.settings_field_ugoiraChunkBytes_desc,
		unit: Texts.settings_unit_bytes,
		min: 65536,
		integer: true
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
		integer: true
	},
	databaseOpenTimeoutMs: {
		key: "databaseOpenTimeoutMs",
		section: "advanced",
		group: "scheduling",
		control: "number",
		label: Texts.settings_field_databaseOpenTimeoutMs_label,
		description: Texts.settings_field_databaseOpenTimeoutMs_desc,
		unit: Texts.settings_unit_s,
		scale: 1e3
	},
	domProbeIntervalMs: {
		key: "domProbeIntervalMs",
		section: "advanced",
		group: "scheduling",
		control: "number",
		label: Texts.settings_field_domProbeIntervalMs_label,
		description: Texts.settings_field_domProbeIntervalMs_desc,
		unit: Texts.settings_unit_ms
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
		integer: true
	},
	toolbarProbeIntervalMs: {
		key: "toolbarProbeIntervalMs",
		section: "advanced",
		group: "scheduling",
		control: "number",
		label: Texts.settings_field_toolbarProbeIntervalMs_label,
		description: Texts.settings_field_toolbarProbeIntervalMs_desc,
		unit: Texts.settings_unit_ms
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
		integer: true
	},
	localTagRenderDebounceMs: {
		key: "localTagRenderDebounceMs",
		section: "advanced",
		group: "scheduling",
		control: "number",
		label: Texts.settings_field_localTagRenderDebounceMs_label,
		description: Texts.settings_field_localTagRenderDebounceMs_desc,
		unit: Texts.settings_unit_ms,
		min: 0
	},
	localTagPersistDelayMs: {
		key: "localTagPersistDelayMs",
		section: "advanced",
		group: "scheduling",
		control: "number",
		label: Texts.settings_field_localTagPersistDelayMs_label,
		description: Texts.settings_field_localTagPersistDelayMs_desc,
		unit: Texts.settings_unit_ms,
		min: 0
	},
	cacheCleanupIdleTimeoutMs: {
		key: "cacheCleanupIdleTimeoutMs",
		section: "advanced",
		group: "scheduling",
		control: "number",
		label: Texts.settings_field_cacheCleanupIdleTimeoutMs_label,
		description: Texts.settings_field_cacheCleanupIdleTimeoutMs_desc,
		unit: Texts.settings_unit_s,
		scale: 1e3
	}
};
const SETTING_FIELDS = Object.values(SETTING_FIELD_MAP);
const USER_SETTING_KEYS = SETTING_FIELDS.map((field) => field.key);
/** 将内部存储值格式化为面板输入值 */
const formatSettingInputValue = (descriptor, value) => {
	if (descriptor.control === "boolean") return Boolean(value);
	if (descriptor.control === "number") {
		if (value === null) return "";
		const scale = descriptor.scale ?? 1;
		return String(Number((value / scale).toPrecision(12)));
	}
	return String(value ?? "");
};
/** 校验内部表示的单个字段值是否合法 */
const validateSettingValue = (descriptor, value) => {
	switch (descriptor.control) {
		case "boolean": return typeof value === "boolean" ? null : Texts.settings_err_option;
		case "text": return typeof value === "string" ? null : Texts.settings_err_required;
		case "select": return descriptor.options?.some((opt) => opt.value === value) ? null : Texts.settings_err_option;
		case "number":
			if (value === null) return descriptor.allowNullUnlimited ? null : Texts.settings_err_required;
			if (typeof value !== "number" || !Number.isFinite(value)) return Texts.settings_err_number;
			if (descriptor.integer && !Number.isInteger(value)) return Texts.settings_err_integer;
			if (descriptor.min !== void 0) {
				if (descriptor.min === 0 && value < 0) return Texts.settings_err_nonNegative;
				if (value < descriptor.min) {
					const displayMin = descriptor.scale ? Number((descriptor.min / descriptor.scale).toPrecision(12)) : descriptor.min;
					const minText = descriptor.unit ? `${displayMin} ${descriptor.unit}` : String(displayMin);
					return Texts.settings_err_min.replace("%1", minText);
				}
			} else if (value <= 0) return Texts.settings_err_positive;
			return null;
	}
};
/** 解析并校验来自配置面板的单个用户输入 */
const parseSettingInput = (descriptor, rawValue) => {
	if (descriptor.control === "boolean") return {
		ok: true,
		value: Boolean(rawValue)
	};
	if (descriptor.control === "text") return {
		ok: true,
		value: String(rawValue)
	};
	if (descriptor.control === "select") {
		const parsed = Number(rawValue);
		const error = validateSettingValue(descriptor, parsed);
		if (error) return {
			ok: false,
			message: error
		};
		return {
			ok: true,
			value: parsed
		};
	}
	const trimmed = String(rawValue).trim();
	if (!trimmed || descriptor.allowNullUnlimited && trimmed === "不限") {
		if (descriptor.allowNullUnlimited) return {
			ok: true,
			value: null
		};
		return {
			ok: false,
			message: Texts.settings_err_required
		};
	}
	const rawNumber = Number(trimmed);
	if (!Number.isFinite(rawNumber)) return {
		ok: false,
		message: Texts.settings_err_number
	};
	const scale = descriptor.scale ?? 1;
	const scaled = Number((rawNumber * scale).toPrecision(12));
	const error = validateSettingValue(descriptor, scaled);
	if (error) return {
		ok: false,
		message: error
	};
	return {
		ok: true,
		value: scaled
	};
};

// src/utils/setting.ts
const SETTINGS_KEY = "PIXIV_PREVIEWER_L_SETTINGS";
let activeSettings = null;
let syncListenerRegistered = false;
const listeners$1 = /* @__PURE__ */ new Set();
const normalizeStoredSettings = (raw) => {
	const normalized = { ...g_defaultSettings };
	if (!raw || typeof raw !== "object") return normalized;
	const record = raw;
	if (typeof record.version === "string") normalized.version = record.version;
	const target = normalized;
	for (const descriptor of SETTING_FIELDS) {
		if (!Object.hasOwn(record, descriptor.key)) continue;
		const value = record[descriptor.key];
		if (validateSettingValue(descriptor, value) === null) target[descriptor.key] = value;
	}
	return normalized;
};
const notifyListeners = (next, prev, source) => {
	for (const listener of listeners$1) try {
		listener({ ...next }, { ...prev }, source);
	} catch (error) {
		iLog.e("Failed to notify settings listener:", error);
	}
};
const ensureSyncListener = () => {
	if (syncListenerRegistered) return;
	syncListenerRegistered = true;
	GM_addValueChangeListener(SETTINGS_KEY, (_key, oldValue, newValue, remote) => {
		if (!remote) return;
		const prev = activeSettings ?? normalizeStoredSettings(oldValue);
		const next = normalizeStoredSettings(newValue);
		activeSettings = next;
		notifyListeners(next, prev, "remote");
	});
};
const validateCandidateSettings = (candidate) => {
	const errors = [];
	const record = candidate;
	for (const descriptor of SETTING_FIELDS) {
		const error = validateSettingValue(descriptor, record[descriptor.key]);
		if (error) errors.push({
			key: descriptor.key,
			message: error
		});
	}
	if (candidate.downloadProgressPersistMs > candidate.downloadHeartbeatMs && !errors.some((e) => e.key === "downloadProgressPersistMs")) errors.push({
		key: "downloadProgressPersistMs",
		message: Texts.settings_err_progressExceedsHeartbeat
	});
	if (candidate.downloadHeartbeatMs >= candidate.downloadOwnerTimeoutMs && !errors.some((e) => e.key === "downloadOwnerTimeoutMs")) errors.push({
		key: "downloadOwnerTimeoutMs",
		message: Texts.settings_err_timeoutNotGreaterThanHeartbeat
	});
	return errors;
};
const getSettings = () => {
	ensureSyncListener();
	if (!activeSettings) activeSettings = normalizeStoredSettings(GM_getValue(SETTINGS_KEY));
	return { ...activeSettings };
};
const subscribeSettings = (listener) => {
	ensureSyncListener();
	listeners$1.add(listener);
	return () => {
		listeners$1.delete(listener);
	};
};
/** 校验并完整保存用户配置（仅更新指定用户字段，保留最新远程未编辑字段及内部 `version`） */
const saveUserSettings = (edits) => {
	ensureSyncListener();
	let latest;
	try {
		latest = normalizeStoredSettings(GM_getValue(SETTINGS_KEY));
	} catch (error) {
		iLog.e("Failed to read latest settings before saving:", error);
		return {
			ok: false,
			errors: [{
				key: null,
				message: Texts.settings_saveStorageError
			}]
		};
	}
	const candidate = { ...latest };
	const candidateRecord = candidate;
	const editsRecord = edits;
	for (const descriptor of SETTING_FIELDS) if (Object.hasOwn(editsRecord, descriptor.key)) candidateRecord[descriptor.key] = editsRecord[descriptor.key];
	candidate.version = latest.version;
	const errors = validateCandidateSettings(candidate);
	if (errors.length > 0) return {
		ok: false,
		errors
	};
	try {
		GM_setValue(SETTINGS_KEY, candidate);
	} catch (error) {
		iLog.e("Failed to save settings:", error);
		return {
			ok: false,
			errors: [{
				key: null,
				message: Texts.settings_saveStorageError
			}]
		};
	}
	const prev = activeSettings ? { ...activeSettings } : latest;
	activeSettings = { ...candidate };
	notifyListeners(candidate, prev, "local");
	return {
		ok: true,
		settings: { ...candidate }
	};
};
/** 仅更新内部版本元数据，不改变任何用户配置字段 */
const updateInternalVersion = (version) => {
	ensureSyncListener();
	try {
		const next = {
			...normalizeStoredSettings(GM_getValue(SETTINGS_KEY)),
			version
		};
		GM_setValue(SETTINGS_KEY, next);
		activeSettings = next;
		return true;
	} catch (error) {
		iLog.e("Failed to update internal script version:", error);
		return false;
	}
};

// src/databases/connection.ts
const INDEX_DB_NAME = "PIXIV_PREVIEWER_L";
/** 2：拆分静态/可变字段的缓存时间，并新增动图帧缓存表 */
const INDEX_DB_VERSION = 2;
const ILLUSTRATION_DETAILS_CACHE_TABLE_KEY = "illustrationDetailsCache";
const ILLUST_PAGES_CACHE_TABLE_KEY = "illustPagesCache";
const UGOIRA_FRAMES_CACHE_TABLE_KEY = "ugoiraFramesCache";
const STATIC_DATE_INDEX = "staticDate";
const CACHE_DATE_INDEX = "cacheDate";
const CACHE_TABLE_KEYS = [
	ILLUSTRATION_DETAILS_CACHE_TABLE_KEY,
	ILLUST_PAGES_CACHE_TABLE_KEY,
	UGOIRA_FRAMES_CACHE_TABLE_KEY
];
let dbPromise = null;
let hasLoggedOpenError = false;
const openDatabase = () => new Promise((resolve, reject) => {
	if (typeof indexedDB === "undefined") {
		reject(/* @__PURE__ */ new Error("IndexedDB is not available"));
		return;
	}
	let settled = false;
	const settle = (action) => {
		if (settled) return;
		settled = true;
		clearTimeout(timeout);
		action();
	};
	const timeout = setTimeout(() => {
		settle(() => reject(/* @__PURE__ */ new Error("Opening IndexedDB timed out")));
	}, getSettings().databaseOpenTimeoutMs);
	const request = indexedDB.open(INDEX_DB_NAME, INDEX_DB_VERSION);
	request.onupgradeneeded = () => {
		const db = request.result;
		CACHE_TABLE_KEYS.forEach((key) => {
			if (db.objectStoreNames.contains(key)) db.deleteObjectStore(key);
		});
		db.createObjectStore(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, { keyPath: "id" }).createIndex(STATIC_DATE_INDEX, "staticDate");
		db.createObjectStore(ILLUST_PAGES_CACHE_TABLE_KEY, { keyPath: "id" }).createIndex(CACHE_DATE_INDEX, "cacheDate");
		db.createObjectStore(UGOIRA_FRAMES_CACHE_TABLE_KEY, { keyPath: "id" }).createIndex(CACHE_DATE_INDEX, "cacheDate");
	};
	request.onsuccess = () => {
		const db = request.result;
		iLog.d("Open IndexedDB successfully:", db);
		db.onversionchange = () => {
			db.close();
			dbPromise = null;
		};
		settle(() => resolve(db));
	};
	request.onerror = () => {
		if (!hasLoggedOpenError) {
			hasLoggedOpenError = true;
			iLog.e("An error occurred while requesting IndexedDB", request.error);
		}
		settle(() => reject(request.error ?? /* @__PURE__ */ new Error("Failed to open IndexedDB")));
	};
	request.onblocked = () => {
		iLog.w("IndexedDB upgrade is blocked by another tab, cache disabled.");
		settle(() => reject(/* @__PURE__ */ new Error("IndexedDB upgrade is blocked")));
	};
});
/** 获取数据库连接；打开失败时返回 `null`，所有缓存操作降级为直接回源 */
const getDatabase = () => {
	if (!dbPromise) dbPromise = openDatabase().catch((error) => {
		dbPromise = null;
		throw error;
	});
	return dbPromise.catch((error) => {
		iLog.e("IndexedDB is unavailable, cache is disabled:", error);
		return null;
	});
};
/** 执行单次请求，任何失败都返回 `null` 而不是抛出 */
const runRequest = async (storeName, mode, createRequest) => {
	const db = await getDatabase();
	if (!db) return null;
	return new Promise((resolve) => {
		try {
			const transaction = db.transaction(storeName, mode);
			const request = createRequest(transaction.objectStore(storeName));
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => {
				iLog.e(`IndexedDB request on \`${storeName}\` failed`, request.error);
				resolve(null);
			};
			transaction.onabort = () => {
				iLog.e(`IndexedDB transaction on \`${storeName}\` aborted`, transaction.error);
				resolve(null);
			};
		} catch (error) {
			iLog.e(`IndexedDB transaction on \`${storeName}\` failed`, error);
			resolve(null);
		}
	});
};
/** 在一个事务中执行多次写入，以事务完成作为成功标志 */
const runTransaction = async (storeName, mutate) => {
	const db = await getDatabase();
	if (!db) return false;
	return new Promise((resolve) => {
		try {
			const transaction = db.transaction(storeName, "readwrite");
			transaction.oncomplete = () => resolve(true);
			transaction.onerror = () => {
				iLog.e(`IndexedDB transaction on \`${storeName}\` failed`, transaction.error);
				resolve(false);
			};
			transaction.onabort = () => {
				iLog.e(`IndexedDB transaction on \`${storeName}\` aborted`, transaction.error);
				resolve(false);
			};
			mutate(transaction.objectStore(storeName));
		} catch (error) {
			iLog.e(`IndexedDB transaction on \`${storeName}\` failed`, error);
			resolve(false);
		}
	});
};
/** 兼容旧版本以 `Date` 保存的时间字段 */
const toTimestamp = (value, fallback) => {
	if (value instanceof Date) return value.getTime();
	if (typeof value === "number" && Number.isFinite(value)) return value;
	return fallback;
};
/**
* 清理单个缓存表：在同一次游标遍历中删除过期与超出上限（按时间升序）的记录。
*/
const pruneCacheTable = async (storeName, indexName, maxAge, maxEntries) => {
	const db = await getDatabase();
	if (!db) return;
	const cutoff = Date.now() - maxAge;
	await new Promise((resolve) => {
		try {
			const transaction = db.transaction(storeName, "readwrite");
			const store = transaction.objectStore(storeName);
			const index = store.index(indexName);
			const countRequest = store.count();
			countRequest.onsuccess = () => {
				let overLimit = Math.max(0, countRequest.result - maxEntries);
				const cursorRequest = index.openKeyCursor();
				cursorRequest.onsuccess = () => {
					const cursor = cursorRequest.result;
					if (!cursor) return;
					const expired = Number(cursor.key) <= cutoff;
					if (!expired && overLimit <= 0) return;
					if (!expired) overLimit -= 1;
					store.delete(cursor.primaryKey);
					cursor.continue();
				};
			};
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => {
				iLog.w(`Failed to prune \`${storeName}\`:`, transaction.error);
				resolve();
			};
			transaction.onabort = () => {
				iLog.w(`Pruning \`${storeName}\` was aborted:`, transaction.error);
				resolve();
			};
		} catch (error) {
			iLog.w(`Failed to prune \`${storeName}\`:`, error);
			resolve();
		}
	});
};
/** 清空指定缓存表 */
const clearCacheTables = async (storeNames) => {
	return (await Promise.all(storeNames.map((storeName) => runTransaction(storeName, (store) => {
		store.clear();
	})))).every(Boolean);
};
/** 统计指定缓存表的条目数 */
const countCacheTable = async (storeNames) => {
	const counts = await Promise.all(storeNames.map((storeName) => runRequest(storeName, "readonly", (store) => store.count())));
	return Object.fromEntries(storeNames.map((storeName, index) => [storeName, counts[index] ?? 0]));
};

// src/databases/illustration-cache.ts
/** 缓存作品详情；发布不足免缓存窗口的作品跳过缓存 */
const cacheIllustrationDetails = (illustrations, now = Date.now()) => {
	const { newIllustrationNoCacheMs } = getSettings();
	const cacheable = illustrations.filter((illustration) => now - illustration.uploadTimestamp * 1e3 > newIllustrationNoCacheMs);
	if (!cacheable.length) return Promise.resolve(true);
	return runTransaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, (store) => {
		cacheable.forEach((illustration) => {
			const request = store.get(illustration.id);
			request.onsuccess = () => {
				const existing = request.result;
				const entry = {
					...illustration,
					staticDate: toTimestamp(existing?.staticDate, now),
					cacheDate: now
				};
				const putRequest = store.put(entry);
				putRequest.onerror = () => {
					iLog.e(`An error occurred while caching illustration details of ${illustration.id}`, putRequest.error);
				};
			};
			request.onerror = () => {
				iLog.e(`An error occurred while reading cached details of illustration ${illustration.id}`, request.error);
			};
		});
	});
};
/** 读取作品详情缓存。静态字段超过有效期时删除缓存并返回 `null` */
const getCachedIllustrationDetails = async (id, now = Date.now(), mutableMaxAge = getSettings().illustrationMutableCacheTtlMs) => {
	const { illustrationStaticCacheTtlMs } = getSettings();
	const entry = await runRequest(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, "readonly", (store) => store.get(id));
	if (!entry) return null;
	const cacheDate = toTimestamp(entry.cacheDate, 0);
	if (now - toTimestamp(entry.staticDate, cacheDate) > illustrationStaticCacheTtlMs) {
		deleteCachedIllustrationDetails([id]);
		return null;
	}
	return {
		details: stripCacheMetadata(entry),
		mutableFresh: now - cacheDate <= mutableMaxAge
	};
};
/** 移除只用于缓存管理的时间字段，避免泄露到业务数据中 */
const stripCacheMetadata = (entry) => {
	const details = { ...entry };
	delete details.staticDate;
	delete details.cacheDate;
	return details;
};
const deleteCachedIllustrationDetails = (ids) => {
	if (!ids.length) return Promise.resolve(true);
	return runTransaction(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, (store) => {
		ids.forEach((id) => {
			const request = store.delete(id);
			request.onerror = () => {
				iLog.w(`An error occurred while deleting cached details of illustration ${id}`, request.error);
			};
		});
	});
};
/** 缓存作品分页信息（图片访问链接） */
const cacheIllustPages = (id, urls, now = Date.now()) => runTransaction(ILLUST_PAGES_CACHE_TABLE_KEY, (store) => {
	const entry = {
		id,
		regularUrls: urls.regularUrls,
		originalUrls: urls.originalUrls,
		cacheDate: now
	};
	const request = store.put(entry);
	request.onerror = () => {
		iLog.e(`An error occurred while caching pages of illust ${id}`, request.error);
	};
});
/** 读取作品分页信息缓存，过期时删除 */
const getCachedIllustPages = async (id, now = Date.now()) => {
	const { illustPagesCacheTtlMs } = getSettings();
	const entry = await runRequest(ILLUST_PAGES_CACHE_TABLE_KEY, "readonly", (store) => store.get(id));
	if (!entry) return null;
	if (now - toTimestamp(entry.cacheDate, 0) > illustPagesCacheTtlMs) {
		runTransaction(ILLUST_PAGES_CACHE_TABLE_KEY, (store) => {
			store.delete(id);
		});
		return null;
	}
	return {
		regularUrls: entry.regularUrls,
		originalUrls: entry.originalUrls
	};
};
/** 清理过期的作品详情与分页缓存 */
const pruneIllustrationCaches = async () => {
	const { illustrationStaticCacheTtlMs, illustrationCacheMaxEntries, illustPagesCacheTtlMs, illustPagesCacheMaxEntries } = getSettings();
	await pruneCacheTable(ILLUSTRATION_DETAILS_CACHE_TABLE_KEY, STATIC_DATE_INDEX, illustrationStaticCacheTtlMs, illustrationCacheMaxEntries);
	await pruneCacheTable(ILLUST_PAGES_CACHE_TABLE_KEY, CACHE_DATE_INDEX, illustPagesCacheTtlMs, illustPagesCacheMaxEntries);
};

// src/databases/ugoira-cache.ts
/** 剩余可用空间比例低于该值时不再写入缓存，避免挤占 Pixiv 自身的存储 */
const MIN_FREE_STORAGE_RATIO = .2;
const sumFrameSize = (frames) => frames.reduce((total, frame) => total + frame.blob.size, 0);
/** 存储空间是否足够写入新的动图帧缓存 */
const hasEnoughStorage = async (size) => {
	try {
		const estimate = await navigator.storage?.estimate?.();
		if (!estimate?.quota || estimate.usage === void 0) return true;
		return estimate.quota - estimate.usage - size > estimate.quota * MIN_FREE_STORAGE_RATIO;
	} catch {
		return true;
	}
};
/** 读取缓存的动图帧，过期或超出有效期时返回 `null` */
const getCachedUgoiraFrames = async (id, now = Date.now()) => {
	const { ugoiraCacheTtlMs } = getSettings();
	const entry = await runRequest(UGOIRA_FRAMES_CACHE_TABLE_KEY, "readonly", (store) => store.get(id));
	if (!entry?.frames?.length) return null;
	if (now - toTimestamp(entry.cacheDate, 0) > ugoiraCacheTtlMs) {
		runTransaction(UGOIRA_FRAMES_CACHE_TABLE_KEY, (store) => {
			store.delete(id);
		});
		return null;
	}
	if (!entry.frames.every((frame) => frame && typeof frame.file === "string" && frame.blob instanceof Blob)) {
		iLog.w(`Cached ugoira frames of ${id} are corrupted, dropping them.`);
		runTransaction(UGOIRA_FRAMES_CACHE_TABLE_KEY, (store) => {
			store.delete(id);
		});
		return null;
	}
	return { frames: entry.frames };
};
/** 缓存动图帧。空间不足或数据超出容量上限时跳过缓存 */
const cacheUgoiraFrames = async (id, data) => {
	const size = sumFrameSize(data);
	if (!data.length || size > getSettings().ugoiraCacheMaxBytes) return false;
	if (!await hasEnoughStorage(size)) return false;
	const cached = await runTransaction(UGOIRA_FRAMES_CACHE_TABLE_KEY, (store) => {
		const entry = {
			id,
			frames: data,
			size,
			cacheDate: Date.now()
		};
		const request = store.put(entry);
		request.onerror = () => {
			iLog.w(`Failed to cache ugoira frames of ${id}:`, request.error);
		};
	});
	if (cached) pruneUgoiraFrameCache();
	return cached;
};
/**
* 清理动图帧缓存：删除过期条目，并按“最旧优先”删除直到满足条目与字节上限。
* Blob 在 IndexedDB 中是惰性引用，读取时不会真正加载字节。
*/
const pruneUgoiraFrameCache = async () => {
	const db = await getDatabase();
	if (!db) return;
	const { ugoiraCacheTtlMs, ugoiraCacheMaxEntries, ugoiraCacheMaxBytes } = getSettings();
	const now = Date.now();
	await new Promise((resolve) => {
		try {
			const transaction = db.transaction(UGOIRA_FRAMES_CACHE_TABLE_KEY, "readwrite");
			const store = transaction.objectStore(UGOIRA_FRAMES_CACHE_TABLE_KEY);
			const request = store.index(CACHE_DATE_INDEX).openCursor();
			let totalSize = 0;
			let totalCount = 0;
			const entries = [];
			request.onsuccess = () => {
				const cursor = request.result;
				if (!cursor) {
					entries.sort((a, b) => a.cacheDate - b.cacheDate);
					for (const entry of entries) {
						if (!(now - entry.cacheDate > ugoiraCacheTtlMs) && totalCount <= ugoiraCacheMaxEntries && totalSize <= ugoiraCacheMaxBytes) break;
						store.delete(entry.id);
						totalCount -= 1;
						totalSize -= entry.size;
					}
					return;
				}
				const value = cursor.value;
				entries.push({
					id: value.id,
					size: value.size ?? 0,
					cacheDate: toTimestamp(value.cacheDate, 0)
				});
				totalCount += 1;
				totalSize += value.size ?? 0;
				cursor.continue();
			};
			request.onerror = () => {
				iLog.w("Failed to read ugoira frames cache:", request.error);
			};
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => {
				iLog.w("Failed to prune ugoira frames cache:", transaction.error);
				resolve();
			};
			transaction.onabort = () => {
				iLog.w("Pruning ugoira frames cache was aborted:", transaction.error);
				resolve();
			};
		} catch (error) {
			iLog.w("Failed to prune ugoira frames cache:", error);
			resolve();
		}
	});
};
/** 统计动图帧缓存的条目数与占用字节数 */
const getUgoiraFrameCacheStats = async () => {
	const db = await getDatabase();
	if (!db) return {
		count: 0,
		bytes: 0
	};
	return new Promise((resolve) => {
		try {
			const request = db.transaction(UGOIRA_FRAMES_CACHE_TABLE_KEY, "readonly").objectStore(UGOIRA_FRAMES_CACHE_TABLE_KEY).getAll();
			request.onsuccess = () => {
				const entries = request.result;
				resolve({
					count: entries.length,
					bytes: entries.reduce((total, entry) => total + (entry.size ?? 0), 0)
				});
			};
			request.onerror = () => resolve({
				count: 0,
				bytes: 0
			});
		} catch {
			resolve({
				count: 0,
				bytes: 0
			});
		}
	});
};

// src/icons/download.svg
var download_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg t=\"1742281193586\"\n     class=\"icon\"\n     viewBox=\"0 0 1024 1024\"\n     version=\"1.1\"\n     xmlns=\"http://www.w3.org/2000/svg\"\n     p-id=\"24408\"\n     width=\"10\"\n     height=\"10\">\n    <path d=\"M1024 896v128H0v-320h128v192h768v-192h128v192zM576 554.688L810.688 320 896 405.312l-384 384-384-384L213.312 320 448 554.688V0h128v554.688z\"\n          fill=\"#ffffff\"\n          p-id=\"24409\" />\n</svg>";

// src/icons/retry.svg
var retry_default = "<svg\r\n  xmlns=\"http://www.w3.org/2000/svg\"\r\n  viewBox=\"0 0 24 24\"\r\n  fill=\"none\"\r\n  stroke=\"currentColor\"\r\n  stroke-width=\"2\"\r\n  stroke-linecap=\"round\"\r\n  stroke-linejoin=\"round\"\r\n  aria-hidden=\"true\"\r\n  focusable=\"false\"\r\n>\r\n  <path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" />\r\n  <path d=\"M3 3v5h5\" />\r\n</svg>";

// src/icons/stop.svg
var stop_default = "<svg\r\n  xmlns=\"http://www.w3.org/2000/svg\"\r\n  viewBox=\"0 0 24 24\"\r\n  fill=\"none\"\r\n  stroke=\"currentColor\"\r\n  stroke-width=\"2\"\r\n  stroke-linecap=\"round\"\r\n  stroke-linejoin=\"round\"\r\n  aria-hidden=\"true\"\r\n  focusable=\"false\"\r\n>\r\n  <rect x=\"5\" y=\"5\" width=\"14\" height=\"14\" rx=\"2\" />\r\n</svg>";

// src/icons/trash.svg
var trash_default = "<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n  aria-hidden=\"true\"\n  focusable=\"false\"\n>\n  <path d=\"M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7\" />\n</svg>";

// src/utils/utils.ts
const pause = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
const convertObjectKeysFromSnakeToCamel = (obj) => {
	function snakeToCamel(snake) {
		return snake.replace(/_([a-z])/g, (result) => result[1].toUpperCase());
	}
	const newResponse = {};
	for (const key in obj) newResponse[snakeToCamel(key)] = obj[key];
	return newResponse;
};
/**
* 将 Pixiv 原图链接中形如 `123456-abcdef_p0.png` 的文件名规范化为 `123456_p0.png`
* （部分作品原图链接文件名中会插入一段哈希值，与 Pixiv 网页端展示的文件名不一致）
*/
const sanitizeIllustFilename = (filename) => {
	return filename.replace(/^(\d+)-[0-9a-zA-Z]+(_.*)$/, "$1$2");
};
const createLRUCache = (maxSize) => {
	let limit = Math.max(0, Math.floor(maxSize));
	const map = /* @__PURE__ */ new Map();
	const evictOverflow = () => {
		while (map.size > limit) {
			const oldestKey = map.keys().next().value;
			if (oldestKey === void 0) break;
			map.delete(oldestKey);
		}
	};
	return {
		get(key) {
			if (!map.has(key)) return void 0;
			const val = map.get(key);
			map.delete(key);
			map.set(key, val);
			return val;
		},
		set(key, val) {
			if (limit <= 0) return;
			if (map.has(key)) map.delete(key);
			map.set(key, val);
			evictOverflow();
		},
		setMaxSize(nextMaxSize) {
			limit = Math.max(0, Math.floor(nextMaxSize));
			evictOverflow();
		},
		size() {
			return map.size;
		},
		maxSize() {
			return limit;
		}
	};
};
/**
* 为 `GM_getValue` 一类全量反序列化的读取提供内存缓存。
* 调用 `invalidate()` 后下次读取会重新从存储加载。
*/
const createReadThroughCache = (read) => {
	let cached;
	let valid = false;
	const load = () => {
		if (!valid) {
			cached = read();
			valid = true;
		}
		return cached;
	};
	return {
		get: load,
		/** 直接修改缓存值（调用方负责持久化） */
		peek: load,
		invalidate() {
			valid = false;
		}
	};
};

// src/services/request.ts
const request = (options) => {
	const { headers, ...restOptions } = options;
	return window.GM.xmlHttpRequest({
		responseType: "json",
		...restOptions,
		headers: {
			referer: "https://www.pixiv.net/",
			...headers
		}
	});
};
const requestWithRetry = async (options) => {
	const { retryDelay, maxRetryTimes, onRetry, ...restOptions } = options;
	const maxAttempts = maxRetryTimes === void 0 ? getSettings().requestMaxAttempts ?? 1e400 : maxRetryTimes ?? 1e400;
	let response;
	let attempts = 0;
	while (attempts < maxAttempts) {
		response = await request(restOptions);
		if (response.status === 200) {
			if (!response.response.error) return response;
		}
		attempts += 1;
		if (attempts >= maxAttempts) break;
		onRetry?.(response, attempts);
		await pause(retryDelay ?? getSettings().requestRetryIntervalMs);
	}
	throw new Error(`Request for ${restOptions.url} failed: ${response?.responseText}`);
};

// src/services/download.ts
const STORAGE_KEY = "pp-downloads";
/** 当前标签页的标识 */
const TAB_ID = crypto.randomUUID();
const listeners = /* @__PURE__ */ new Set();
const attempts = /* @__PURE__ */ new Map();
const requests = /* @__PURE__ */ new Map();
/** 被用户主动中止的尝试 */
const abortedAttempts = /* @__PURE__ */ new Set();
/** 配置收紧失联超时前已观察到的远端活动心跳，在新心跳到来前沿用原失联边界 */
const legacyTimeoutOverrides = /* @__PURE__ */ new Map();
let downloads;
let heartbeat;
const getEffectiveOwnerTimeoutMs = (record, defaultTimeoutMs) => {
	if (record.status !== "downloading") {
		legacyTimeoutOverrides.delete(record.id);
		return defaultTimeoutMs;
	}
	const override = legacyTimeoutOverrides.get(record.id);
	if (!override) return defaultTimeoutMs;
	if (record.updatedAt === override.observedUpdatedAt) return override.timeoutMs;
	legacyTimeoutOverrides.delete(record.id);
	return defaultTimeoutMs;
};
/** 清除记录上的下载归属信息 */
const releaseOwnership = (record) => {
	delete record.owner;
	record.updatedAt = Date.now();
};
/** 读取存储中由各标签页共享的下载记录 */
const readStoredDownloads = () => {
	const saved = GM_getValue(STORAGE_KEY, []);
	if (!Array.isArray(saved)) return [];
	const now = Date.now();
	const defaultTimeoutMs = getSettings().downloadOwnerTimeoutMs;
	return saved.filter((item) => item && typeof item.id === "string" && typeof item.url === "string" && /^https?:\/\//.test(item.url) && typeof item.filename === "string" && [
		"downloading",
		"completed",
		"interrupted",
		"failed"
	].includes(item.status) && Number.isFinite(item.loaded) && Number.isFinite(item.total) && Number.isFinite(item.createdAt) && (item.completedAt === void 0 || Number.isFinite(item.completedAt))).map((item) => {
		const record = {
			id: item.id,
			url: item.url,
			filename: item.filename,
			status: item.status,
			loaded: item.loaded,
			total: item.total,
			createdAt: item.createdAt
		};
		if (typeof item.directory === "string" && item.directory) record.directory = item.directory;
		if (Number.isFinite(item.completedAt)) record.completedAt = item.completedAt;
		if (typeof item.error === "string") record.error = item.error;
		if (typeof item.owner === "string") record.owner = item.owner;
		if (Number.isFinite(item.updatedAt)) record.updatedAt = item.updatedAt;
		if (record.status === "downloading" && (!record.owner || record.updatedAt === void 0 || now - record.updatedAt > getEffectiveOwnerTimeoutMs(record, defaultTimeoutMs))) {
			record.status = "interrupted";
			releaseOwnership(record);
			legacyTimeoutOverrides.delete(record.id);
		} else if (record.status !== "downloading") legacyTimeoutOverrides.delete(record.id);
		return record;
	});
};
/** 本标签页已删除的记录，避免合并存储快照时被旧数据带回 */
const removedIds = /* @__PURE__ */ new Set();
/** 其他标签页写入存储后置为 `true`，下次落盘前才需要重新读取 */
let remoteChangePending = false;
/**
* 合并存储快照与本地记录：按更新时间取较新状态，本标签页进行中的下载始终以本地对象为准。
* `allowDelete` 用于同步其他标签页的删除操作。
*/
const applyStored = (stored, allowDelete) => {
	const remote = stored.filter((record) => !removedIds.has(record.id));
	if (!downloads) {
		downloads = remote;
		return;
	}
	const remoteById = new Map(remote.map((record) => [record.id, record]));
	const result = [];
	for (const record of downloads) {
		if (attempts.has(record.id)) {
			result.push(record);
			continue;
		}
		const remoteRecord = remoteById.get(record.id);
		if (!remoteRecord) {
			if (!allowDelete) result.push(record);
			continue;
		}
		result.push((remoteRecord.updatedAt ?? 0) >= (record.updatedAt ?? 0) ? remoteRecord : record);
	}
	const known = new Set(result.map((record) => record.id));
	for (const record of remote) if (!known.has(record.id)) result.push(record);
	downloads = result.sort((a, b) => b.createdAt - a.createdAt);
};
const syncFromStorage = (allowDelete = false) => {
	applyStored(readStoredDownloads(), allowDelete);
};
/** 记录数超出上限时，移除最早的已完成记录和最早的待重试记录 */
const trimDownloads = () => {
	if (!downloads) return;
	const { completedDownloadsMaxEntries, retryableDownloadsMaxEntries } = getSettings();
	downloads = [...downloads].sort((a, b) => b.createdAt - a.createdAt);
	const counts = {
		completed: 0,
		retryable: 0
	};
	const kept = downloads.filter((record) => {
		const type = record.status === "completed" ? "completed" : record.status === "failed" || record.status === "interrupted" ? "retryable" : void 0;
		if (!type) return true;
		const limit = type === "completed" ? completedDownloadsMaxEntries : retryableDownloadsMaxEntries;
		if (counts[type] < limit) {
			counts[type] += 1;
			return true;
		}
		removedIds.add(record.id);
		return false;
	});
	if (kept.length === downloads.length) return;
	downloads = kept;
};
const notify = () => {
	listeners.forEach((listener) => {
		try {
			listener();
		} catch (error) {
			iLog.e("更新下载列表失败：", error);
		}
	});
};
const publish = (persist = true) => {
	if (persist) {
		const now = Date.now();
		for (const record of downloads ?? []) if (record.status === "downloading" && attempts.has(record.id)) {
			record.owner = TAB_ID;
			record.updatedAt = now;
		}
		if (remoteChangePending) {
			remoteChangePending = false;
			if (downloads) applyStored(readStoredDownloads(), true);
		}
		trimDownloads();
		try {
			GM_setValue(STORAGE_KEY, downloads);
			removedIds.clear();
		} catch (error) {
			iLog.e("保存下载记录失败：", error);
		}
	}
	notify();
	ensureHeartbeat();
};
/** 刷新本标签页下载的存活时间，并将已关闭标签页遗留的下载标记为中断 */
const tick = () => {
	const now = Date.now();
	const defaultTimeoutMs = getSettings().downloadOwnerTimeoutMs;
	let changed = false;
	for (const record of downloads ?? []) {
		if (record.status !== "downloading") {
			legacyTimeoutOverrides.delete(record.id);
			continue;
		}
		if (attempts.has(record.id)) {
			record.updatedAt = now;
			legacyTimeoutOverrides.delete(record.id);
			changed = true;
			continue;
		}
		const effectiveTimeoutMs = getEffectiveOwnerTimeoutMs(record, defaultTimeoutMs);
		if (now - (record.updatedAt ?? 0) <= effectiveTimeoutMs) continue;
		iLog.w(`下载所在标签页已关闭，标记为中断：${record.filename}`);
		record.status = "interrupted";
		releaseOwnership(record);
		legacyTimeoutOverrides.delete(record.id);
		changed = true;
	}
	if (changed) publish();
	if (!downloads?.some((record) => record.status === "downloading")) {
		if (heartbeat !== void 0) clearInterval(heartbeat);
		heartbeat = void 0;
	}
};
const ensureHeartbeat = () => {
	if (heartbeat !== void 0) return;
	if (!downloads?.some((record) => record.status === "downloading")) return;
	heartbeat = setInterval(tick, getSettings().downloadHeartbeatMs);
};
subscribeSettings((next, prev) => {
	if (next.downloadOwnerTimeoutMs < prev.downloadOwnerTimeoutMs) {
		const knownRecords = downloads ?? (() => {
			const stored = GM_getValue(STORAGE_KEY, []);
			return Array.isArray(stored) ? stored : [];
		})();
		for (const record of knownRecords) {
			if (!record || record.status !== "downloading" || attempts.has(record.id) || typeof record.updatedAt !== "number") continue;
			const effectiveTimeout = getEffectiveOwnerTimeoutMs(record, prev.downloadOwnerTimeoutMs);
			if (next.downloadOwnerTimeoutMs < effectiveTimeout) legacyTimeoutOverrides.set(record.id, {
				observedUpdatedAt: record.updatedAt,
				timeoutMs: effectiveTimeout
			});
		}
	}
	if ((next.downloadHeartbeatMs !== prev.downloadHeartbeatMs || next.downloadOwnerTimeoutMs !== prev.downloadOwnerTimeoutMs) && attempts.size > 0 && downloads) publish(true);
	if (next.downloadHeartbeatMs !== prev.downloadHeartbeatMs) {
		if (heartbeat !== void 0) {
			clearInterval(heartbeat);
			heartbeat = void 0;
		}
		ensureHeartbeat();
	}
});
GM_addValueChangeListener(STORAGE_KEY, (_key, _oldValue, _newValue, remote) => {
	if (!remote) return;
	remoteChangePending = true;
	syncFromStorage(true);
	publish(false);
});
const getDownloads = () => {
	if (!downloads) {
		downloads = readStoredDownloads();
		trimDownloads();
		ensureHeartbeat();
	}
	return downloads.map((item) => ({ ...item }));
};
const subscribeDownloads = (listener) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};
/** 下载是否正在当前标签页执行 */
const isDownloadingInThisTab = (id) => attempts.has(id);
let hasWarnedDirectoryFallback = false;
/** 使用 `<a download>` 保存文件，子目录会被浏览器替换为下划线，仅用于无目录场景 */
const saveWithAnchor = (blob, filename) => {
	const blobUrl = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	try {
		anchor.href = blobUrl;
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
	} finally {
		anchor.remove();
		URL.revokeObjectURL(blobUrl);
	}
};
/**
* 保存下载的文件。存在子目录时借助 `GM_download` 保存到子目录，
* 该能力依赖 Tampermonkey 的「浏览器 API」下载模式，不可用时回退到默认下载目录。
*/
const saveBlob = (blob, record) => {
	const { directory, filename } = record;
	const saveToDefaultDirectory = () => {
		if (directory && !hasWarnedDirectoryFallback) {
			hasWarnedDirectoryFallback = true;
			iLog.w(`无法保存到子目录 ${directory}，已改为默认下载目录。如需按子目录保存，请在 Tampermonkey 设置中将「下载模式」设为「浏览器 API」。`);
		}
		saveWithAnchor(blob, filename);
	};
	const canSaveToDirectory = globalThis.GM_info?.downloadMode !== "native" && globalThis.GM_info?.downloadMode !== "disabled" && typeof GM_download === "function";
	if (!directory || !canSaveToDirectory) {
		saveToDefaultDirectory();
		return;
	}
	try {
		GM_download({
			url: blob,
			name: `${directory}/${filename}`,
			onerror: saveToDefaultDirectory
		});
	} catch {
		saveToDefaultDirectory();
	}
};
const startDownload = (record, options = {}) => {
	const { onload, onerror, onprogress, ontimeout, onabort, ...restOptions } = options;
	record.status = "downloading";
	record.loaded = 0;
	record.total = 0;
	record.owner = TAB_ID;
	record.updatedAt = Date.now();
	delete record.completedAt;
	delete record.error;
	const attempt = Symbol();
	attempts.set(record.id, attempt);
	const isActive = () => record.status === "downloading" && attempts.get(record.id) === attempt;
	publish();
	const fail = (message) => {
		if (!isActive()) return;
		record.status = "failed";
		attempts.delete(record.id);
		releaseOwnership(record);
		record.error = message;
		publish();
		iLog.e(`Download ${record.filename} from ${record.url} failed: ${message}`);
	};
	let lastProgressSave = 0;
	try {
		const pending = request({
			...restOptions,
			url: record.url,
			method: "GET",
			responseType: "blob",
			onprogress: function(response) {
				if (!isActive()) return;
				record.loaded = Math.max(0, response.loaded || 0);
				record.total = response.lengthComputable ? Math.max(0, response.total || 0) : 0;
				const now = Date.now();
				const persist = now - lastProgressSave >= getSettings().downloadProgressPersistMs;
				if (persist) lastProgressSave = now;
				publish(persist);
				onprogress?.call(this, response);
			},
			onload: function(response) {
				if (!isActive()) return;
				if (response.status < 200 || response.status >= 300) {
					const message = `HTTP ${response.status}`;
					fail(message);
					const errorResponse = {
						...response,
						error: message
					};
					onerror?.call(errorResponse, errorResponse);
					return;
				}
				try {
					const blob = response.response instanceof Blob ? response.response : new Blob([response.response]);
					saveBlob(blob, record);
					record.status = "completed";
					attempts.delete(record.id);
					releaseOwnership(record);
					record.loaded = blob.size;
					record.total = blob.size;
					record.completedAt = Date.now();
					publish();
				} catch (error) {
					const message = String(error);
					fail(message);
					const errorResponse = {
						...response,
						error: message
					};
					onerror?.call(errorResponse, errorResponse);
					return;
				}
				onload?.call(this, response);
			},
			onerror: function(response) {
				if (!isActive()) return;
				fail(response.error || "网络错误");
				onerror?.call(this, response);
			},
			ontimeout: function() {
				if (!isActive()) return;
				fail("下载超时");
				ontimeout?.call(this);
			},
			onabort: function() {
				if (abortedAttempts.delete(attempt)) {
					onabort?.call(this);
					return;
				}
				if (!isActive()) return;
				fail("下载已取消");
				onabort?.call(this);
			}
		});
		requests.set(record.id, pending);
		Promise.resolve(pending).catch((error) => fail(String(error))).finally(() => {
			abortedAttempts.delete(attempt);
			if (requests.get(record.id) === pending) requests.delete(record.id);
		});
	} catch (error) {
		fail(String(error));
	}
};
/** 中止下载中的作品，被中止的下载视为待重试 */
const abortDownload = (id) => {
	getDownloads();
	const record = downloads.find((item) => item.id === id);
	if (record?.status !== "downloading") return;
	if (!attempts.has(id)) return;
	const pending = requests.get(id);
	const attempt = attempts.get(id);
	requests.delete(id);
	attempts.delete(id);
	if (attempt) abortedAttempts.add(attempt);
	record.status = "interrupted";
	releaseOwnership(record);
	delete record.error;
	publish();
	try {
		pending?.abort();
	} catch (error) {
		if (attempt) abortedAttempts.delete(attempt);
		iLog.e(`中止下载 ${record.filename} 失败：`, error);
	}
};
const downloadFile = (url, filename, options = {}, directory) => {
	getDownloads();
	syncFromStorage();
	const record = {
		id: crypto.randomUUID(),
		url,
		filename,
		status: "downloading",
		loaded: 0,
		total: 0,
		createdAt: Date.now()
	};
	if (directory) record.directory = directory;
	downloads.unshift(record);
	startDownload(record, options);
};
const retryDownload = (id) => {
	getDownloads();
	syncFromStorage();
	const record = downloads.find((item) => item.id === id);
	if (record?.status === "failed" || record?.status === "interrupted") startDownload(record);
};
/** 移除指定的失败或中断下载记录 */
const removeDownload = (id) => {
	getDownloads();
	syncFromStorage(true);
	const record = downloads.find((item) => item.id === id);
	if (record?.status !== "failed" && record?.status !== "interrupted") {
		publish(false);
		return;
	}
	removedIds.add(id);
	downloads = downloads.filter((item) => item.id !== id);
	publish();
};
const clearCompletedDownloads = () => {
	getDownloads();
	syncFromStorage(true);
	const removed = downloads.filter((record) => record.status === "completed");
	for (const record of removed) removedIds.add(record.id);
	downloads = downloads.filter((record) => record.status !== "completed");
	publish();
};
const ignoreRetryableDownloads = () => {
	getDownloads();
	syncFromStorage(true);
	const removed = downloads.filter((record) => record.status === "failed" || record.status === "interrupted");
	for (const record of removed) removedIds.add(record.id);
	downloads = downloads.filter((record) => record.status !== "failed" && record.status !== "interrupted");
	publish();
};
window.addEventListener("pagehide", (event) => {
	if (event.persisted) return;
	const local = downloads?.filter((record) => record.status === "downloading" && attempts.has(record.id));
	if (!local?.length) return;
	for (const record of local) {
		record.status = "interrupted";
		releaseOwnership(record);
	}
	attempts.clear();
	publish();
});
document.addEventListener("visibilitychange", () => {
	if (document.visibilityState !== "visible") return;
	syncFromStorage(true);
	publish(false);
});
window.addEventListener("pageshow", (event) => {
	if (!event.persisted) return;
	attempts.clear();
	requests.clear();
	for (const record of downloads ?? []) if (record.status === "downloading" && record.owner === TAB_ID) {
		record.status = "interrupted";
		releaseOwnership(record);
	}
	syncFromStorage(true);
	publish();
});

// src/utils/dom.ts
/** DOM 尚未就绪时排到 `DOMContentLoaded`，已就绪（脚本被延迟注入）则立即执行 */
const onDomReady = (callback) => {
	if (document.readyState !== "loading") {
		callback();
		return;
	}
	document.addEventListener("DOMContentLoaded", callback, { once: true });
};
/**
* 注入全局样式。
* `document-start` 阶段 `<head>` 可能尚未创建，此时推迟到 DOM 就绪再注入，
* 避免在 `<head>` 之前往 `<html>` 上插入节点影响页面解析。
* 传入 `id` 时重复调用只会注入一次。
*/
const injectStyle = (css, id) => {
	const insert = () => {
		const container = document.head;
		if (!container) return false;
		$("<style>").prop("type", "text/css").attr(id ? { id } : {}).text(css).appendTo(container);
		return true;
	};
	if (id && document.getElementById(id)) return;
	if (insert()) return;
	onDomReady(() => {
		if (id && document.getElementById(id)) return;
		insert();
	});
};
/**
* 等待条件成立后取一次值并执行操作。
* Pixiv 的部分节点由前端异步渲染，`DOMContentLoaded` 时未必存在，
* 因此需要有限次重试；用尽后通过 `onGiveUp` 告知调用方。
*/
const waitFor = (probe, action, { interval, maxAttempts, onGiveUp } = {}) => {
	const settings = getSettings();
	const probeInterval = interval ?? settings.domProbeIntervalMs;
	const probeMaxAttempts = maxAttempts ?? settings.domProbeMaxAttempts;
	let attempt = 1;
	const step = () => {
		const value = probe();
		if (value) {
			action(value);
			return;
		}
		if (attempt >= probeMaxAttempts) {
			onGiveUp?.();
			return;
		}
		attempt += 1;
		setTimeout(deferredStep, probeInterval);
	};
	/**
	* 后续尝试在定时器中执行，异常无法传播回调用方，只能就地记录并停止。
	* 首次尝试不经过这里，其异常会照常抛给调用方的 `try/catch`。
	*/
	const deferredStep = () => {
		try {
			step();
		} catch (error) {
			iLog.e("Failed to wait for a condition:", error);
		}
	};
	step();
};

// src/features/downloads.ts
const BUTTON_ID = "pp-downloads-button";
const PANEL_ID$1 = "pp-downloads-panel";
const formatBytes = (bytes) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
const formatTime = (timestamp) => {
	const date = new Date(timestamp);
	const pad = (value) => String(value).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const createIconButton$1 = (label, icon, className, onClick) => $("<button>").attr({
	type: "button",
	title: label,
	"aria-label": label
}).addClass(`pp-download-icon ${className}`).html(icon).on("click", onClick);
const injectDownloadPanelStyles = () => {
	injectStyle(`
      .pp-toolbar-button {
        position: relative; box-sizing: border-box; display: flex;
        align-items: center; justify-content: center; width: 48px; height: 48px;
        margin-top: 5px; padding: 0; border: 0; border-radius: 50%;
        background: rgba(0, 0, 0, .55); color: #fff; cursor: pointer;
      }
      .pp-toolbar-button:hover { background: rgba(0, 0, 0, .75); }
      .pp-toolbar-button:focus-visible { outline: 3px solid #0096fa; outline-offset: 3px; }
      .pp-toolbar-button svg { display: block; width: 24px; height: 24px; }
      #${BUTTON_ID} svg { width: 20px; height: 20px; }
      .pp-toolbar-button[aria-busy="true"] svg { animation: pp-toolbar-pulse 1s ease-in-out infinite; }
      #${BUTTON_ID}[data-active="true"] svg { animation: pp-download-bounce 1s ease-in-out infinite; }
      #${BUTTON_ID} .pp-download-count {
        position: absolute; top: 0; right: 0; box-sizing: border-box;
        display: flex; align-items: center; justify-content: center;
        min-width: 18px; height: 18px; padding: 0 4px;
        border: 2px solid #fff; border-radius: 9px;
        background: #0096fa; color: #fff; font: 700 11px/14px sans-serif;
      }
      #${BUTTON_ID} .pp-download-count[hidden] { display: none; }
      #${BUTTON_ID}[data-attention="true"]::after {
        content: ""; position: absolute; bottom: 3px; right: 3px;
        width: 10px; height: 10px; border-radius: 50%; background: #e53935;
        border: 2px solid #fff;
      }
      #${PANEL_ID$1} {
        --pp-download-bg: #fff; --pp-download-fg: #222; --pp-download-muted: #666;
        --pp-download-border: #ddd; --pp-download-action: #006eb8;
        --pp-download-danger: #d32f2f; --pp-download-danger-hover: rgba(211, 47, 47, .12);
        position: fixed; z-index: 100000; display: flex; flex-direction: column;
        width: min(380px, calc(100vw - 24px)); max-height: min(480px, calc(100vh - 24px));
        box-sizing: border-box; border: 1px solid var(--pp-download-border);
        border-radius: 12px; background: var(--pp-download-bg); color: var(--pp-download-fg);
        box-shadow: 0 8px 32px #0003; font: 14px/1.5 sans-serif;
      }
      #${PANEL_ID$1}[hidden], #${PANEL_ID$1} [hidden] { display: none; }
      #${PANEL_ID$1} header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
      #${PANEL_ID$1} h2 { margin: 0; font-size: 16px; color: inherit; }
      #${PANEL_ID$1} button { border: 0; background: transparent; color: var(--pp-download-action); cursor: pointer; padding: 8px; font: inherit; }
      #${PANEL_ID$1} button:disabled { color: var(--pp-download-muted); opacity: .6; cursor: default; }
      #${PANEL_ID$1} button:focus-visible, #${PANEL_ID$1} a:focus-visible, #${PANEL_ID$1} summary:focus-visible { outline: 2px solid var(--pp-download-action); outline-offset: 2px; }
      #${PANEL_ID$1} .pp-download-summary { margin: 0; padding: 0 16px 4px; color: var(--pp-download-muted); }
      #${PANEL_ID$1} .pp-download-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 0 8px 8px; }
      #${PANEL_ID$1} .pp-download-actions button { font-size: 12px; }
      #${PANEL_ID$1} .pp-download-menu { position: relative; margin-left: auto; }
      #${PANEL_ID$1} .pp-download-menu summary {
        display: flex; align-items: center; justify-content: center; list-style: none;
        width: 32px; height: 32px; border-radius: 50%; color: var(--pp-download-action);
        cursor: pointer; font-size: 24px; line-height: 1;
      }
      #${PANEL_ID$1} .pp-download-menu summary::-webkit-details-marker { display: none; }
      #${PANEL_ID$1} .pp-download-menu summary:hover,
      #${PANEL_ID$1} .pp-download-menu[open] summary,
      #${PANEL_ID$1} .pp-download-menu-content button:not(:disabled):hover { background: rgba(0, 150, 250, .12); }
      #${PANEL_ID$1} .pp-download-menu-content {
        position: absolute; z-index: 1; top: calc(100% + 4px); right: 0;
        min-width: max-content; padding: 4px; border: 1px solid var(--pp-download-border);
        border-radius: 8px; background: var(--pp-download-bg); box-shadow: 0 4px 16px #0003;
      }
      #${PANEL_ID$1} .pp-download-menu-content button { display: block; width: 100%; border-radius: 4px; text-align: left; }
      #${PANEL_ID$1} ul { list-style: none; margin: 0; padding: 0; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
      #${PANEL_ID$1} li { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--pp-download-border); }
      #${PANEL_ID$1} .pp-download-info { flex: 1; min-width: 0; }
      #${PANEL_ID$1} a { display: block; color: var(--pp-download-fg); overflow-wrap: anywhere; text-decoration: none; }
      #${PANEL_ID$1} a:hover { text-decoration: underline; }
      #${PANEL_ID$1} small { display: block; color: var(--pp-download-muted); overflow-wrap: anywhere; }
      #${PANEL_ID$1} progress { display: block; width: 100%; height: 6px; margin-top: 8px; accent-color: #0096fa; }
      #${PANEL_ID$1} .pp-download-icon {
        display: inline-flex; align-items: center; justify-content: center;
        flex-shrink: 0; width: 32px; height: 32px; padding: 6px; border-radius: 50%;
      }
      #${PANEL_ID$1} .pp-download-icon:not([hidden]) + .pp-download-icon:not([hidden]) { margin-left: -8px; }
      #${PANEL_ID$1} .pp-download-icon:hover { background: rgba(0, 150, 250, .12); }
      #${PANEL_ID$1} .pp-download-icon svg { display: block; width: 18px; height: 18px; }
      #${PANEL_ID$1} .pp-download-icon[hidden] { display: none; }
      #${PANEL_ID$1} .pp-download-abort, #${PANEL_ID$1} .pp-download-remove { color: var(--pp-download-danger); }
      #${PANEL_ID$1} .pp-download-abort:hover, #${PANEL_ID$1} .pp-download-remove:hover { background: var(--pp-download-danger-hover); }
      @keyframes pp-download-bounce { 0%, 100% { transform: translateY(-3px); } 50% { transform: translateY(3px); } }
      @keyframes pp-toolbar-pulse { 50% { opacity: .35; } }
      @media (prefers-reduced-motion: reduce) {
        #${BUTTON_ID}[data-active="true"] svg, .pp-toolbar-button[aria-busy="true"] svg { animation: none; }
      }
      @media (prefers-color-scheme: dark) {
        #${PANEL_ID$1} { --pp-download-bg: #222; --pp-download-fg: #eee;
          --pp-download-muted: #bbb; --pp-download-border: #444; --pp-download-action: #72c5ff;
          --pp-download-danger: #ff6b6b; --pp-download-danger-hover: rgba(255, 107, 107, .16); }
      }
      `, DOWNLOADS_STYLE_ID);
};
const loadDownloadPanel = (toolbar) => {
	if (document.getElementById(BUTTON_ID)) return;
	injectDownloadPanelStyles();
	const button = $("<button>").attr({
		id: BUTTON_ID,
		type: "button",
		title: "下载记录",
		"aria-label": "下载记录",
		"aria-expanded": "false",
		"aria-controls": PANEL_ID$1,
		"aria-haspopup": "dialog"
	}).addClass("pp-toolbar-button").html(download_default);
	button.find("svg").attr("aria-hidden", "true");
	const countBadge = $("<span>").addClass("pp-download-count").attr("aria-hidden", "true").prop("hidden", true).appendTo(button);
	$("<div>").append(button).appendTo(toolbar);
	toolbar.style.zIndex = "10000";
	const panel = $("<div>").attr({
		id: PANEL_ID$1,
		role: "dialog",
		"aria-labelledby": "pp-downloads-heading"
	}).prop("hidden", true).appendTo("body");
	const closeButton = $("<button>").attr({
		type: "button",
		title: "关闭下载记录",
		"aria-label": "关闭下载记录"
	}).text("关闭");
	$("<header>").append($("<h2>").attr("id", "pp-downloads-heading").text("下载记录"), closeButton).appendTo(panel);
	const summary = $("<p>").addClass("pp-download-summary").appendTo(panel);
	const actions = $("<div>").addClass("pp-download-actions").appendTo(panel);
	const clearCompletedButton = $("<button>").attr({
		type: "button",
		title: "清空已完成的下载记录"
	}).text("清空已完成记录").on("click", clearCompletedDownloads).appendTo(actions);
	const retryFailedButton = $("<button>").attr({
		type: "button",
		title: "重新下载所有失败的记录"
	}).text("重试所有失败记录").on("click", () => {
		for (const record of getDownloads()) if (record.status === "failed") retryDownload(record.id);
	}).appendTo(actions);
	const moreActions = $("<details>").addClass("pp-download-menu").appendTo(actions);
	const moreActionsSummary = $("<summary>").attr({
		title: "更多操作",
		"aria-label": "更多操作"
	}).text("⋯").appendTo(moreActions);
	const moreActionsContent = $("<div>").addClass("pp-download-menu-content").appendTo(moreActions);
	const ignoreRetryableButton = $("<button>").attr({
		type: "button",
		title: "移除所有失败和中断的下载记录"
	}).text("忽略所有待重试记录").on("click", () => {
		ignoreRetryableDownloads();
		moreActions.prop("open", false);
	}).appendTo(moreActionsContent);
	const list = $("<ul>").attr("aria-label", "图片下载列表").appendTo(panel);
	const rows = /* @__PURE__ */ new Map();
	const positionPanel = () => {
		if (panel.prop("hidden")) return;
		const rect = button.get(0).getBoundingClientRect();
		const width = panel.outerWidth();
		const height = panel.outerHeight();
		panel.css({
			left: Math.max(12, Math.min(rect.left - width - 12, window.innerWidth - width - 12)),
			top: Math.max(12, Math.min(rect.bottom - height, window.innerHeight - height - 12))
		});
	};
	const update = () => {
		const records = getDownloads();
		const active = records.filter((record) => record.status === "downloading").length;
		const attention = records.filter((record) => ["failed", "interrupted"].includes(record.status)).length;
		const completed = records.filter((record) => record.status === "completed").length;
		clearCompletedButton.prop("disabled", completed === 0);
		retryFailedButton.prop("disabled", !records.some((record) => record.status === "failed"));
		ignoreRetryableButton.prop("disabled", attention === 0);
		const recordIds = new Set(records.map((record) => record.id));
		let focusedRemovedIndex = -1;
		for (const [id, row] of rows) if (!recordIds.has(id)) {
			if (row.item.get(0).contains(document.activeElement)) focusedRemovedIndex = row.item.index();
			row.item.remove();
			rows.delete(id);
		}
		const title = `下载记录`;
		countBadge.text(String(active)).prop("hidden", active === 0);
		button.attr({
			"data-active": String(active > 0),
			"data-attention": String(attention > 0),
			"aria-busy": String(active > 0),
			title
		});
		summary.text(records.length ? `${active} 项下载中 · ${completed} 项已完成 · ${attention} 项待重试` : "暂无下载记录，点击预览中的“原图”开始下载。");
		for (const record of [...records].reverse()) {
			let row = rows.get(record.id);
			if (!row) {
				const item = $("<li>");
				const info = $("<div>").addClass("pp-download-info").appendTo(item);
				const filenameMatch = record.filename.match(/^(\d+)(?:-[0-9a-zA-Z]+)?_p(\d+)/);
				const artworkId = filenameMatch?.[1];
				const artworkPage = filenameMatch ? Number(filenameMatch[2]) + 1 : 0;
				$("<a>").attr({
					href: artworkId ? `https://www.pixiv.net/artworks/${artworkId}${artworkPage ? `#${artworkPage}` : ""}` : record.url,
					target: "_blank",
					rel: "noopener noreferrer"
				}).text(record.filename).appendTo(info);
				const status = $("<small>").appendTo(info);
				const progress = $("<progress>").attr({
					max: 100,
					"aria-label": `${record.filename} 下载进度`
				}).appendTo(info);
				const abort = createIconButton$1(`中止下载 ${record.filename}`, stop_default, "pp-download-abort", () => abortDownload(record.id)).appendTo(item);
				const retry = createIconButton$1(`重试下载 ${record.filename}`, retry_default, "pp-download-retry", () => retryDownload(record.id)).appendTo(item);
				const remove = createIconButton$1(`删除记录 ${record.filename}`, trash_default, "pp-download-remove", () => removeDownload(record.id)).appendTo(item);
				list.prepend(item);
				row = {
					item,
					status,
					progress,
					abort,
					retry,
					remove
				};
				rows.set(record.id, row);
			}
			const running = record.status === "downloading";
			const local = running && isDownloadingInThisTab(record.id);
			const retryable = record.status === "failed" || record.status === "interrupted";
			const percent = record.total > 0 ? Math.min(100, Math.floor(record.loaded / record.total * 100)) : void 0;
			const progressText = `${percent === void 0 ? formatBytes(record.loaded) : `${percent}% · ${formatBytes(record.loaded)} / ${formatBytes(record.total)}`}`;
			const labels = {
				downloading: local ? `下载中 ${progressText}` : `其他标签页下载中 ${progressText}`,
				completed: `已下载 · ${formatBytes(record.loaded)}${record.completedAt === void 0 ? "" : ` · ${formatTime(record.completedAt)}`}`,
				interrupted: "下载已中断，点击重试重新下载",
				failed: `下载失败：${record.error || "网络错误"}`
			};
			row.status.text(labels[record.status]);
			row.abort.prop("hidden", !local);
			row.retry.prop("hidden", !retryable);
			row.remove.prop("hidden", !retryable);
			row.progress.prop("hidden", !running);
			if (percent === void 0) row.progress.removeAttr("value");
			else row.progress.val(percent);
		}
		if (focusedRemovedIndex >= 0 && !panel.prop("hidden")) {
			const items = list.children("li");
			const targetItem = items.length ? items.eq(Math.min(focusedRemovedIndex, items.length - 1)) : void 0;
			(targetItem?.find(".pp-download-remove:not([hidden])").get(0) ?? targetItem?.find("a").get(0) ?? closeButton.get(0))?.focus({ preventScroll: true });
		}
		positionPanel();
	};
	const close = (restoreFocus = false) => {
		moreActions.prop("open", false);
		panel.prop("hidden", true);
		button.attr("aria-expanded", "false");
		if (restoreFocus) button.trigger("focus");
	};
	button.on("click", () => {
		if (!panel.prop("hidden")) return close();
		update();
		panel.prop("hidden", false);
		button.attr("aria-expanded", "true");
		positionPanel();
		closeButton.trigger("focus");
	});
	closeButton.on("click", () => close(true));
	document.addEventListener("click", (event) => {
		if (!event.isTrusted || panel.prop("hidden")) return;
		const path = event.composedPath();
		if (!path.includes(moreActions.get(0))) moreActions.prop("open", false);
		if (!path.includes(panel.get(0)) && !path.includes(button.get(0))) close();
	});
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && !panel.prop("hidden")) {
			event.preventDefault();
			if (moreActions.prop("open")) {
				moreActions.prop("open", false);
				moreActionsSummary.trigger("focus");
			} else close(true);
		}
	});
	window.addEventListener("resize", positionPanel);
	subscribeDownloads(update);
	update();
};

// src/features/hide-favorites.ts
let isHidden = false;
const hideFavorites = () => {
	$("svg").filter(function() {
		return $(this).css("color") === "rgb(255, 64, 96)";
	}).each(function() {
		const listItem = $(this).closest("li, div.col-span-2");
		listItem.hide();
		listItem.attr("data-pp-fav-hidden", "true");
	});
	isHidden = true;
};

// src/icons/settings.svg
var settings_default = "<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n  aria-hidden=\"true\"\n  focusable=\"false\"\n>\n  <path\n    d=\"m9.2 4.6.8-2.6h4l.8 2.6 2.1 1.2 2.6-.6 2 3.5-1.8 2v2.5l1.8 2-2 3.5-2.6-.6-2.1 1.2L14 22h-4l-.8-2.6-2.1-1.2-2.6.6-2-3.5 1.8-2v-2.5l-1.8-2 2-3.5 2.6.6Z\"\n  />\n  <circle cx=\"12\" cy=\"12\" r=\"3\" />\n</svg>";

// src/utils/promise.ts
const execLimitConcurrentPromises = async (promises, limit = 48) => {
	const results = [];
	let index = 0;
	const executeNext = async () => {
		if (index >= promises.length) return Promise.resolve();
		const currentIndex = index++;
		const result = await promises[currentIndex]();
		results[currentIndex] = result;
		return await executeNext();
	};
	const initialPromises = Array.from({ length: Math.min(limit, promises.length) }, () => executeNext());
	await Promise.all(initialPromises);
	return results;
};
/**
* 合并同一 key 的并发请求：在 `task` 完成前重复调用会复用同一个 Promise。
* 用于避免同一作品的详情被同时请求多次。
*/
const createPendingPromiseCache = () => {
	const pending = /* @__PURE__ */ new Map();
	return { run(key, task) {
		const existing = pending.get(key);
		if (existing) return existing;
		const promise = task().finally(() => {
			if (pending.get(key) === promise) pending.delete(key);
		});
		pending.set(key, promise);
		return promise;
	} };
};

// src/utils/tags.ts
const LOCAL_TAGS_KEY = "PIXIV_PREVIEWER_L_LOCAL_TAGS";
const LOCAL_TAG_TRANSLATIONS_KEY = "PIXIV_PREVIEWER_L_TAG_TRANSLATIONS";
const emptyLocalTagState = () => ({
	tags: [],
	autoSort: false
});
/**
* 本地标签状态在内存中只保留一份，避免 `MutationObserver` 触发的
* 高频读取反复反序列化全部标签。
*/
const localTagState = createReadThroughCache(() => GM_getValue(LOCAL_TAGS_KEY, emptyLocalTagState()));
const tagTranslationState = createReadThroughCache(() => GM_getValue(LOCAL_TAG_TRANSLATIONS_KEY, { translations: {} }));
let persistTimer = null;
let persistSettingsSubscribed = false;
const ensurePersistSettingsListener = () => {
	if (persistSettingsSubscribed) return;
	persistSettingsSubscribed = true;
	subscribeSettings((next, prev) => {
		if (next.localTagPersistDelayMs !== prev.localTagPersistDelayMs && persistTimer !== null) {
			if (next.localTagPersistDelayMs === 0) flushLocalTagState();
			else {
				clearTimeout(persistTimer);
				persistTimer = null;
				schedulePersist();
			}
		}
	});
};
/** 延迟批量落盘，合并同一轮操作中的多次写入 */
const schedulePersist = () => {
	ensurePersistSettingsListener();
	if (persistTimer !== null) return;
	persistTimer = setTimeout(() => {
		persistTimer = null;
		GM_setValue(LOCAL_TAGS_KEY, structuredClone(localTagState.peek()));
	}, getSettings().localTagPersistDelayMs);
};
/** 立即落盘 pending 的修改，用于标签页隐藏等场景 */
const flushLocalTagState = () => {
	if (persistTimer === null) return;
	clearTimeout(persistTimer);
	persistTimer = null;
	GM_setValue(LOCAL_TAGS_KEY, structuredClone(localTagState.peek()));
};
/** 其他标签页修改了标签状态时，先落盘本地改动，再使内存缓存失效 */
const invalidateLocalTagState = () => {
	if (persistTimer !== null) {
		clearTimeout(persistTimer);
		persistTimer = null;
		GM_setValue(LOCAL_TAGS_KEY, structuredClone(localTagState.peek()));
	}
	localTagState.invalidate();
};
const getLocalTagState = () => localTagState.get();
const getLocalTag = (tag) => getLocalTagState().tags.find((item) => item.tag === tag);
const hasLocalTag = (tag) => getLocalTagState().tags.some((item) => item.tag === tag);
const recordLocalTagTotal = (tag, total) => {
	if (!Number.isFinite(total) || total < 0) return;
	const item = getLocalTag(tag);
	if (!item || item.lastTotal === total) return;
	item.lastTotal = total;
	schedulePersist();
};
const getCachedLocalTagDetails = (tag) => {
	const item = getLocalTag(tag);
	if (!item?.metadata) return;
	const age = Date.now() - item.metadata.cachedAt;
	if (age >= 0 && age < getSettings().localTagMetadataCacheTtlMs) return item.metadata.details;
	delete item.metadata;
	schedulePersist();
};
const cacheLocalTagDetails = (tag, details) => {
	const item = getLocalTag(tag);
	if (!item) return;
	item.metadata = {
		details,
		cachedAt: Date.now()
	};
	schedulePersist();
};
const getSortedLocalTags = () => {
	const { tags, autoSort } = getLocalTagState();
	return autoSort ? tags.slice().sort((a, b) => b.visits - a.visits) : tags;
};
const addLocalTag = (tag, label) => {
	const state = getLocalTagState();
	if (state.tags.some((item) => item.tag === tag)) return;
	state.tags.push({
		tag,
		label: label.trim(),
		visits: 0
	});
	schedulePersist();
};
const removeLocalTag = (tag) => {
	const state = getLocalTagState();
	state.tags = state.tags.filter((item) => item.tag !== tag);
	schedulePersist();
};
const renameLocalTag = (tag, label) => {
	const item = getLocalTag(tag);
	if (!item) return;
	item.label = label.trim();
	schedulePersist();
};
const moveLocalTag = (tag, target) => {
	const state = getLocalTagState();
	if (state.autoSort) return;
	const index = state.tags.findIndex((item) => item.tag === tag);
	if (index < 0 || !Number.isInteger(target) || target < 0 || target >= state.tags.length || index === target) return;
	const [item] = state.tags.splice(index, 1);
	state.tags.splice(target, 0, item);
	schedulePersist();
};
const setLocalTagAutoSort = (autoSort) => {
	getLocalTagState().autoSort = autoSort;
	schedulePersist();
};
const recordLocalTagVisit = (tag) => {
	const item = getLocalTag(tag);
	if (!item) return;
	item.visits++;
	schedulePersist();
};
/** 读取标签中文翻译缓存 */
const getCachedTagTranslation = (tag) => {
	const entry = tagTranslationState.get().translations[tag];
	if (!entry) return void 0;
	if (Date.now() - entry.cachedAt > getSettings().tagTranslationCacheTtlMs) {
		delete tagTranslationState.peek().translations[tag];
		return;
	}
	return entry.translation;
};
const evictOverflowTagTranslations = (state, maxEntries) => {
	const entries = Object.entries(state.translations);
	if (entries.length <= maxEntries) return false;
	const keepCount = Math.floor(maxEntries / 2);
	const kept = entries.sort((a, b) => b[1].cachedAt - a[1].cachedAt).slice(0, keepCount);
	state.translations = Object.fromEntries(kept);
	return true;
};
/** 缓存标签中文翻译；条目数超限时按容量一半向下取整淘汰最旧条目 */
const cacheTagTranslation = (tag, translation) => {
	const state = tagTranslationState.peek();
	state.translations[tag] = {
		translation,
		cachedAt: Date.now()
	};
	evictOverflowTagTranslations(state, getSettings().tagTranslationCacheMaxEntries);
	GM_setValue(LOCAL_TAG_TRANSLATIONS_KEY, state);
};
/** 按当前有效期与容量清理已保存的标签翻译缓存 */
const pruneTagTranslationCache = () => {
	const { tagTranslationCacheTtlMs, tagTranslationCacheMaxEntries } = getSettings();
	const state = tagTranslationState.get();
	const now = Date.now();
	let changed = false;
	for (const [tag, entry] of Object.entries(state.translations)) if (now - entry.cachedAt > tagTranslationCacheTtlMs) {
		delete state.translations[tag];
		changed = true;
	}
	if (evictOverflowTagTranslations(state, tagTranslationCacheMaxEntries)) changed = true;
	if (changed) GM_setValue(LOCAL_TAG_TRANSLATIONS_KEY, state);
};
const getTagFromPath = (pathname) => {
	const match = pathname.match(/^\/(?:en\/)?tags\/([^/]+)/);
	if (!match) return null;
	try {
		return decodeURIComponent(match[1]);
	} catch {
		return null;
	}
};
/** 供“清除缓存”使用：丢弃标签状态与翻译的内存缓存 */
const clearLocalTagCaches = () => {
	if (persistTimer !== null) {
		clearTimeout(persistTimer);
		persistTimer = null;
	}
	localTagState.invalidate();
	tagTranslationState.invalidate();
	GM_setValue(LOCAL_TAG_TRANSLATIONS_KEY, { translations: {} });
};

// src/services/tags.ts
const pendingDetails = createPendingPromiseCache();
const pendingTotals = createPendingPromiseCache();
const pendingTranslations = createPendingPromiseCache();
/** 从标签搜索响应中提取插画漫画作品总数 */
const getIllustMangaTotal = (body) => {
	const searchBody = body;
	const illustMangaTotal = searchBody?.illustManga?.total;
	if (typeof illustMangaTotal === "number") return illustMangaTotal;
	if (!searchBody?.illust && !searchBody?.manga) return void 0;
	const illustTotal = searchBody.illust?.total ?? 0;
	const mangaTotal = searchBody.manga?.total ?? 0;
	if (typeof illustTotal === "number" && typeof mangaTotal === "number") return illustTotal + mangaTotal;
};
/** 如果标签在本地列表中且功能已启用，记录其插画漫画作品总数 */
const recordTagTotal = (tag, body) => {
	if (!getSettings().enableLocalTags) return;
	if (!hasLocalTag(tag)) return;
	const total = getIllustMangaTotal(body);
	if (total !== void 0) recordLocalTagTotal(tag, total);
};
const requestTagTopBody = async (tag) => {
	const response = await request({
		method: "GET",
		url: `/ajax/search/top/${encodeURIComponent(tag)}?lang=zh`,
		timeout: getSettings().tagRequestTimeoutMs
	});
	const data = response.response;
	if (response.status !== 200 || data.error || !data.body) throw new Error(data.message || "标签信息加载失败");
	recordTagTotal(tag, data.body);
	return data.body;
};
/** 提取中文翻译，未找到翻译或翻译与标签相同时返回空字符串 */
const getBodyTranslation = (tag, body) => {
	const translation = body.tagTranslation?.[tag]?.zh?.trim() ?? "";
	return translation === tag ? "" : translation;
};
/** 获取标签的中文翻译，优先使用本地缓存 */
const getTagTranslation = (tag) => {
	const cached = getCachedTagTranslation(tag);
	if (cached !== void 0) return Promise.resolve(cached);
	return pendingTranslations.run(tag, async () => {
		const body = await requestTagTopBody(tag);
		const translation = getBodyTranslation(tag, body);
		cacheTagTranslation(tag, translation);
		return translation;
	});
};
/** 获取标签当前的插画漫画作品总数，同时记录为上次访问总数 */
const getTagCurrentTotal = (tag) => pendingTotals.run(tag, () => requestTagTopBody(tag).then((body) => getIllustMangaTotal(body)));
const getTagDetails = (tag) => {
	const cached = getCachedLocalTagDetails(tag);
	if (cached) return Promise.resolve(cached);
	return pendingDetails.run(tag, () => request({
		method: "GET",
		url: `/ajax/tag/info?tag=${encodeURIComponent(tag)}&lang=zh`,
		timeout: getSettings().tagRequestTimeoutMs
	}).then((response) => {
		const data = response.response;
		if (response.status !== 200 || data.error || !data.body) throw new Error(data.message || "标签详情加载失败");
		cacheLocalTagDetails(tag, data.body);
		return data.body;
	}));
};

// src/utils/debounce.ts
function debounce(func, delay = 100) {
	let timeout = null;
	const debounced = function(...args) {
		if (timeout !== null) clearTimeout(timeout);
		const wait = typeof delay === "function" ? delay() : delay;
		timeout = setTimeout(() => {
			timeout = null;
			func(...args);
		}, wait);
	};
	debounced.cancel = () => {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
	};
	debounced.isPending = () => timeout !== null;
	return debounced;
}

// src/utils/tag-colors.ts
const backgrounds = Object.values({
	red: [
		"#e7000b",
		"#c10007",
		"#9f0712"
	],
	orange: [
		"#f54a00",
		"#ca3500",
		"#9f2d00"
	],
	amber: [
		"#e17100",
		"#bb4d00",
		"#973c00"
	],
	yellow: [
		"#d08700",
		"#a65f00",
		"#894b00"
	],
	lime: [
		"#5ea500",
		"#497d00",
		"#3c6300"
	],
	green: [
		"#00a63e",
		"#008236",
		"#016630"
	],
	emerald: [
		"#009966",
		"#007a55",
		"#006045"
	],
	teal: [
		"#009689",
		"#00786f",
		"#005f5a"
	],
	cyan: [
		"#0092b8",
		"#007595",
		"#005f78"
	],
	sky: [
		"#0084d1",
		"#0069a8",
		"#00598a"
	],
	blue: [
		"#155dfc",
		"#1447e6",
		"#193cb8"
	],
	indigo: [
		"#4f39f6",
		"#432dd7",
		"#372aac"
	],
	violet: [
		"#7f22fe",
		"#7008e7",
		"#5d0ec0"
	],
	purple: [
		"#9810fa",
		"#8200db",
		"#6e11b0"
	],
	fuchsia: [
		"#c800de",
		"#a800b7",
		"#8a0194"
	],
	pink: [
		"#e60076",
		"#c6005c",
		"#a3004c"
	],
	rose: [
		"#ec003f",
		"#c70036",
		"#a50036"
	],
	slate: [
		"#45556c",
		"#314158",
		"#1d293d"
	],
	gray: [
		"#4a5565",
		"#364153",
		"#1e2939"
	],
	zinc: [
		"#52525c",
		"#3f3f47",
		"#27272a"
	],
	neutral: [
		"#525252",
		"#404040",
		"#262626"
	],
	stone: [
		"#57534d",
		"#44403b",
		"#292524"
	],
	mauve: [
		"#594c5b",
		"#463947",
		"#2a212c"
	],
	olive: [
		"#5b5b4b",
		"#474739",
		"#2b2b22"
	],
	mist: [
		"#4b585b",
		"#394447",
		"#22292b"
	],
	taupe: [
		"#5b4f4b",
		"#473c39",
		"#2b2422"
	]
}).flat();
const getLocalTagColor = (tag) => {
	const characters = Array.from(tag);
	const first = characters[0]?.codePointAt(0) ?? 0;
	const last = characters.at(-1)?.codePointAt(0) ?? 0;
	return backgrounds[(first * 31 + last) % backgrounds.length];
};

// src/features/local-tags.ts
const TAG_LINK_SELECTOR = "a[href*=\"/tags/\"]:not(nav > a, .gtm-new-work-tag-event-click, .gtm-new-work-translate-tag-event-click, .gtm-new-work-tag-thumbnail-event-click, [data-ga4-label=\"tab_link\"], [data-ga4-label=\"suggest_chip\"], [data-ga4-label=\"delete_button\"], [data-ga4-label=\"submit_button\"])";
const POPOVER_ID = "pp-local-tag-popover";
const MANAGER_ID = "pp-local-tags-manager";
const STRIP_CLASS = "pp-local-tags";
const createButton = (label, onClick) => {
	return $("<button>").attr("type", "button").text(label).css("height", "100%").on("click", onClick);
};
const createIconButton = (label, icon, onClick) => createButton(label, onClick).addClass("pp-tag-icon").attr({
	title: label,
	"aria-label": label
}).html(icon).css("height", "32px");
const createTagLink = ({ tag, label }) => {
	const background = getLocalTagColor(tag);
	const link = $("<a>").attr({
		href: `/tags/${encodeURIComponent(tag)}`,
		title: tag
	}).css({
		backgroundColor: background,
		color: "#fff"
	}).append($("<span>").text(label || tag));
	if (label) link.append($("<small>").text(tag));
	return link;
};
const getTagFromSearchUrl = (url) => {
	try {
		const parsed = new URL(url, location.href);
		if (parsed.origin !== location.origin) return null;
		const match = parsed.pathname.match(/^\/ajax\/search\/top\/([^/]+)\/?$/);
		if (!match) return null;
		return decodeURIComponent(match[1]);
	} catch {
		return null;
	}
};
const recordTagSearchTotal = (tag, data) => {
	if (!getSettings().enableLocalTags) return;
	const response = data;
	if (!response || response.error) return;
	recordTagTotal(tag, response.body);
};
let isSearchIntercepted = false;
/** 拦截页面自身的标签 top 搜索请求，记录访问标签页时的作品总数（仅安装一次） */
const interceptTagSearchRequests = () => {
	if (isSearchIntercepted) return;
	isSearchIntercepted = true;
	try {
		const pageFetch = unsafeWindow.fetch.bind(unsafeWindow);
		unsafeWindow.fetch = function(input, init) {
			const url = typeof input === "string" ? input : "url" in input ? input.url : input.href;
			const response = pageFetch(input, init);
			const tag = getTagFromSearchUrl(url);
			if (tag && getSettings().enableLocalTags) response.then((result) => {
				if (!result.ok || !getSettings().enableLocalTags) return void 0;
				return result.clone().json();
			}).then((data) => {
				if (data) recordTagSearchTotal(tag, data);
			}).catch(() => {});
			return response;
		};
	} catch (error) {
		iLog.w("Failed to intercept fetch requests for local tags:", error);
	}
	try {
		const XHR = unsafeWindow.XMLHttpRequest;
		const requestUrls = /* @__PURE__ */ new WeakMap();
		const originalOpen = XHR.prototype.open;
		const originalSend = XHR.prototype.send;
		XHR.prototype.open = function(method, url, async, username, password) {
			requestUrls.set(this, String(url));
			if (async === void 0) return originalOpen.call(this, method, url);
			return originalOpen.call(this, method, url, async, username, password);
		};
		XHR.prototype.send = function(body) {
			const tag = getTagFromSearchUrl(requestUrls.get(this) ?? "");
			if (tag && getSettings().enableLocalTags) this.addEventListener("load", () => {
				if (!getSettings().enableLocalTags) return;
				if (this.status < 200 || this.status >= 300) return;
				try {
					recordTagSearchTotal(tag, this.responseType === "json" ? this.response : JSON.parse(this.responseText));
				} catch {}
			});
			return originalSend.call(this, body);
		};
	} catch (error) {
		iLog.w("Failed to intercept XHR requests for local tags:", error);
	}
};
const getTagLink = (target) => {
	if (!(target instanceof Element)) return null;
	const link = $(target).closest(TAG_LINK_SELECTOR).get(0);
	if (!link) return null;
	const url = new URL($(link).prop("href"));
	if (url.origin !== location.origin) return null;
	return getTagFromPath(url.pathname) ? link : null;
};
let activeLocalTagsTeardown = null;
let gmTagListenerRegistered = false;
let onRemoteLocalTagsUpdate = null;
let visitUrlWatcherRegistered = false;
let lastRecordedVisitTag = null;
/** 仅按路径变更重置已记录的访问标签，避免在同一标签页重复启停功能时重复计数 */
const resetLocalTagVisitTrackingOnPath = (pathname) => {
	if (getTagFromPath(pathname) !== lastRecordedVisitTag) lastRecordedVisitTag = null;
};
/** 同一路径下仅记录一次本地标签访问计数 */
const syncLocalTagVisitForPath = (pathname) => {
	const tag = getTagFromPath(pathname);
	if (tag && tag !== lastRecordedVisitTag) {
		lastRecordedVisitTag = tag;
		recordLocalTagVisit(tag);
		return true;
	}
	if (!tag) lastRecordedVisitTag = null;
	return false;
};
const ensureLocalTagGmListener = () => {
	if (gmTagListenerRegistered) return;
	gmTagListenerRegistered = true;
	GM_addValueChangeListener(LOCAL_TAGS_KEY, (_key, _oldValue, _newValue, remote) => {
		if (!remote) return;
		invalidateLocalTagState();
		onRemoteLocalTagsUpdate?.();
	});
};
const ensureLocalTagVisitUrlWatcher = () => {
	if (visitUrlWatcherRegistered) return;
	visitUrlWatcherRegistered = true;
	$(window).on("urlchange.ppLocalTagsVisit", () => {
		resetLocalTagVisitTrackingOnPath(location.pathname);
	});
};
const unloadLocalTags = () => {
	if (!activeLocalTagsTeardown) return;
	activeLocalTagsTeardown();
	activeLocalTagsTeardown = null;
};
const loadLocalTags = () => {
	if (activeLocalTagsTeardown || $(`#${POPOVER_ID}`).length) return;
	ensureLocalTagVisitUrlWatcher();
	ensureLocalTagGmListener();
	let disposed = false;
	injectStyle(`
    #${POPOVER_ID}, #${MANAGER_ID}, .${STRIP_CLASS} {
      --pp-tag-bg: #fff; --pp-tag-fg: #333; --pp-tag-muted: #666;
      --pp-tag-border: #ddd; --pp-tag-chip: #f0f6fa;
      --pp-tag-danger: #dc2626; --pp-tag-danger-hover: #b91c1c;
      color: var(--pp-tag-fg); font: 14px/1.5 sans-serif;
      box-sizing: border-box;
    }
    #${POPOVER_ID} *, #${MANAGER_ID} *, .${STRIP_CLASS} * { box-sizing: border-box; }
    #${POPOVER_ID} {
      position: fixed; z-index: 100000; width: min(340px, calc(100vw - 24px));
      max-height: calc(100vh - 24px); overflow: auto; padding: 0;
      background: var(--pp-tag-bg); border: 1px solid var(--pp-tag-border);
      border-radius: 12px; box-shadow: 0 8px 32px #0003;
    }
    #${POPOVER_ID}[hidden] { display: none; }
    #${POPOVER_ID} .pp-tag-preview {
      display: block; height: 200px; overflow: hidden;
      border-radius: 11px 11px 0 0; background: var(--pp-tag-chip);
    }
    #${POPOVER_ID} .pp-tag-preview:focus-visible { outline-offset: -2px; }
    #${POPOVER_ID} img { display: block; width: 100%; height: 100%; object-fit: cover; }
    #${POPOVER_ID} img[hidden] { display: none; }
    #${POPOVER_ID} .pp-tag-content { padding: 16px; }
    #${POPOVER_ID} h2, #${MANAGER_ID} h2 { font-size: 18px; margin: 0 0 12px; overflow-wrap: anywhere; }
    #${POPOVER_ID} p { margin: 12px 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    #${POPOVER_ID} .pp-tag-stats { color: var(--pp-tag-muted); font-size: 13px; }
    #${POPOVER_ID} .pp-tag-stats[hidden] { display: none; }
    #${POPOVER_ID} button, #${MANAGER_ID} button, .${STRIP_CLASS} button,
    .${STRIP_CLASS} a {
      border: 1px solid var(--pp-tag-border); border-radius: 6px;
      padding: 6px 10px; color: var(--pp-tag-fg); background: var(--pp-tag-chip);
      cursor: pointer; font: inherit; text-decoration: none; white-space: nowrap;
    }
    #${POPOVER_ID} button:hover, #${MANAGER_ID} button:hover,
    .${STRIP_CLASS} button:hover, .${STRIP_CLASS} a:hover { border-color: #0096fa; }
    #${MANAGER_ID} button.pp-tag-danger {
      color: #fff; background: var(--pp-tag-danger); border-color: var(--pp-tag-danger);
    }
    #${MANAGER_ID} button.pp-tag-danger:hover {
      background: var(--pp-tag-danger-hover); border-color: var(--pp-tag-danger-hover);
    }
    #${MANAGER_ID} button.pp-tag-icon, .${STRIP_CLASS} button.pp-tag-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; flex-shrink: 0; padding: 6px;
    }
    #${MANAGER_ID} .pp-tag-icon svg, .${STRIP_CLASS} .pp-tag-icon svg {
      width: 18px; height: 18px;
    }
    #${POPOVER_ID} :focus-visible, #${MANAGER_ID} :focus-visible,
    .${STRIP_CLASS} :focus-visible { outline: 2px solid #0096fa; outline-offset: 2px; }
    #${MANAGER_ID} {
      width: min(720px, calc(100vw - 32px)); max-height: calc(100vh - 48px);
      padding: 24px; border: 1px solid var(--pp-tag-border); border-radius: 12px;
      background: var(--pp-tag-bg); overflow: auto;
    }
    #${MANAGER_ID}::backdrop { background: #0006; }
    #${MANAGER_ID} header { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
    #${MANAGER_ID} label { display: flex; align-items: center; gap: 8px; }
    #${MANAGER_ID} ul { list-style: none; padding: 0; margin: 16px 0 0; }
    #${MANAGER_ID} li { padding: 12px 0; border-top: 1px solid var(--pp-tag-border); }
    #${MANAGER_ID} li.pp-tag-dragging { opacity: .4; }
    #${MANAGER_ID} .pp-tag-heading { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    #${MANAGER_ID} .pp-tag-metadata { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    #${MANAGER_ID} a { color: inherit; text-decoration: none; }
    #${MANAGER_ID} a:hover { text-decoration: underline; }
    #${MANAGER_ID} .pp-tag-drag {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 28px; height: 28px; padding: 0; cursor: grab;
    }
    #${MANAGER_ID} .pp-tag-drag:active { cursor: grabbing; }
    #${MANAGER_ID} .pp-tag-drag::before {
      content: ""; width: 2px; height: 2px; margin: -10px 5px 0 0;
      background: currentColor; border-radius: 50%;
      box-shadow: 5px 0, 0 5px, 5px 5px, 0 10px, 5px 10px;
    }
    #${MANAGER_ID} form { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    #${MANAGER_ID} input[type=text] {
      flex: 1; min-width: 120px; padding: 7px 10px; border: 1px solid var(--pp-tag-border);
      border-radius: 6px; color: var(--pp-tag-fg); background: var(--pp-tag-bg); font: inherit;
    }
    #${MANAGER_ID} small { color: var(--pp-tag-muted); margin-bottom: 8px; overflow-wrap: anywhere; }
    #${MANAGER_ID} button:disabled { opacity: .4; cursor: default; }
    .${STRIP_CLASS} { display: inline-flex; align-items: center; gap: 8px; margin-right: 8px; flex-shrink: 0; }
    .${STRIP_CLASS} [data-tag-links] { display: inline-flex; gap: 8px; }
    .${STRIP_CLASS} a { display: inline-flex; flex-direction: column; justify-content: center; line-height: 1.35; }
    .${STRIP_CLASS} a span { font-size: 14px; font-weight: bold; }
    .${STRIP_CLASS} a small { font-size: 10px; color: inherit; }
    @media (prefers-color-scheme: dark) {
      #${POPOVER_ID}, #${MANAGER_ID}, .${STRIP_CLASS} {
        --pp-tag-bg: #222; --pp-tag-fg: #eee; --pp-tag-muted: #aaa;
        --pp-tag-border: #555; --pp-tag-chip: #303c45;
      }
    }
  `, LOCAL_TAGS_STYLE_ID);
	const popover = $("<div>").attr({
		id: POPOVER_ID,
		role: "dialog",
		"aria-label": "标签详情"
	}).prop("hidden", true);
	const preview = $("<a>").attr({
		class: "pp-tag-preview",
		target: "_blank",
		rel: "noopener noreferrer",
		"aria-label": "在新窗口打开预览作品"
	});
	const thumbnail = $("<img>").appendTo(preview);
	const content = $("<div>").addClass("pp-tag-content");
	const title = $("<h2>");
	const abstract = $("<p>").attr("aria-live", "polite");
	const stats = $("<p>").addClass("pp-tag-stats").attr("aria-live", "polite").prop("hidden", true);
	thumbnail.on("error", () => {
		thumbnail.prop("hidden", true);
		preview.removeAttr("href");
	});
	let activeLink = null;
	let activeTag = null;
	let addingTag = null;
	let showTimer;
	let hideTimer;
	let scrollParents = $();
	const addTagFromApi = (tag, button) => {
		if (addingTag) return;
		addingTag = tag;
		button?.prop("disabled", true);
		button?.text("正在添加…");
		updateAction();
		getTagTranslation(tag).then((label) => {
			if (disposed || !getSettings().enableLocalTags) return;
			addLocalTag(tag, label);
			refresh();
		}).finally(() => {
			addingTag = null;
			if (disposed) return;
			button?.prop("disabled", false);
			updateAction();
		}).catch((error) => {
			if (disposed) return;
			if (button !== action || activeTag === tag) button?.text("添加失败，点击重试");
			iLog.w("Failed to add local tag:", error);
		});
	};
	const action = createButton("添加到本地标签", () => {
		if (activeTag) addTagFromApi(activeTag, action);
	});
	content.append(title, abstract, stats, action);
	popover.append(preview, content);
	popover.appendTo("body");
	const manager = $("<dialog>").attr({
		id: MANAGER_ID,
		closedby: "any",
		"aria-labelledby": "pp-local-tags-heading"
	}).appendTo("body");
	const hidePopover = () => {
		clearTimeout(showTimer);
		clearTimeout(hideTimer);
		showTimer = void 0;
		hideTimer = void 0;
		popover.prop("hidden", true);
		scrollParents.off("scroll.ppLocalTags");
		scrollParents = $();
		activeLink = null;
		activeTag = null;
	};
	const updateAction = () => {
		const pending = !!activeTag && addingTag === activeTag;
		action.prop("hidden", !activeTag || hasLocalTag(activeTag)).prop("disabled", pending).text(pending ? "正在添加…" : "添加到本地标签");
	};
	const positionPopover = () => {
		if (!activeLink || popover.prop("hidden")) return;
		const link = $(activeLink);
		const offset = link.offset();
		const viewport = $(window);
		const linkTop = offset.top - viewport.scrollTop();
		const linkBottom = linkTop + link.outerHeight();
		const width = popover.outerWidth();
		const height = popover.outerHeight();
		const left = Math.max(12, Math.min(offset.left - viewport.scrollLeft(), viewport.width() - width - 12));
		const top = linkBottom + height + 8 <= viewport.height() - 12 ? linkBottom + 8 : Math.max(12, linkTop - height - 8);
		popover.css({
			left,
			top
		});
	};
	const updateStats = async (tag, link) => {
		if (!hasLocalTag(tag)) return;
		const lastTotal = getLocalTag(tag)?.lastTotal;
		stats.text(`插画漫画作品总数：${lastTotal ?? "-"} 件`);
		stats.prop("hidden", false);
		try {
			const total = await getTagCurrentTotal(tag);
			if (disposed || total === void 0 || activeLink !== link || activeTag !== tag) return;
			if (lastTotal === void 0) stats.text(`插画漫画作品总数：${total} 件`);
			else {
				const added = total - lastTotal;
				stats.text(added >= 0 ? `插画漫画作品总数：${total} 件（新增 ${added} 件）` : `插画漫画作品总数：${total} 件（减少 ${-added} 件）`);
			}
			positionPopover();
		} catch {}
	};
	const showPopover = async (link) => {
		if (disposed) return;
		const tag = getTagFromPath(new URL($(link).prop("href")).pathname);
		if (!tag || !$.contains($("html").get(0), link) || manager.prop("open")) return;
		activeLink = link;
		activeTag = tag;
		title.text(tag);
		abstract.text("正在加载标签详情…");
		stats.prop("hidden", true).text("");
		thumbnail.prop("hidden", true).removeAttr("src");
		preview.removeAttr("href");
		popover.prop("hidden", false);
		scrollParents.off("scroll.ppLocalTags");
		scrollParents = $(link).parents();
		scrollParents.on("scroll.ppLocalTags", hidePopover);
		updateAction();
		positionPopover();
		updateStats(tag, link);
		try {
			const details = await getTagDetails(tag);
			if (disposed || activeLink !== link || activeTag !== tag) return;
			title.text(details.tag || tag);
			abstract.text(details.abstract || "暂无标签简介");
			if (details.thumbnail) {
				const artworkId = details.thumbnail.match(/\/(\d+)(?:-[\da-zA-Z]+)?_p\d+/)?.[1];
				if (artworkId) preview.attr("href", `https://www.pixiv.net/artworks/${artworkId}`);
				thumbnail.attr({
					alt: `${details.tag || tag}的缩略图`,
					src: details.thumbnail
				}).prop("hidden", false);
			}
		} catch {
			if (disposed || activeLink !== link || activeTag !== tag) return;
			abstract.text("标签详情加载失败，请稍后重新悬浮重试。");
		}
		if (!disposed) positionPopover();
	};
	const renderManager = () => {
		const focusKey = manager.find(":focus").attr("data-focus-key");
		const drafts = new Map(manager.find("input[type=\"text\"]").toArray().filter((input) => $(input).val() !== $(input).prop("defaultValue")).map((input) => [$(input).attr("data-focus-key"), $(input).val()]));
		manager.empty();
		const header = $("<header>");
		const heading = $("<h2>").attr("id", "pp-local-tags-heading").text("本地标签管理");
		header.append(heading, createButton("关闭", () => manager.get(0).close()));
		const sortLabel = $("<label>");
		const autoSort = $("<input>").attr({
			type: "checkbox",
			"data-focus-key": "auto-sort"
		}).prop("checked", getLocalTagState().autoSort);
		autoSort.on("change", () => {
			setLocalTagAutoSort(autoSort.prop("checked"));
			refresh();
		});
		sortLabel.append(autoSort, "自动排序（访问次数越多越靠前）");
		manager.append(header, sortLabel);
		const tags = getSortedLocalTags();
		if (!tags.length) manager.append($("<p>").text("暂无本地标签。悬浮任意标签，点击“添加到本地标签”。"));
		const list = $("<ul>");
		let draggedRow = null;
		list.on("drop", (event) => {
			if (!draggedRow) return;
			event.preventDefault();
			moveLocalTag(draggedRow.attr("data-tag"), list.children().index(draggedRow));
			draggedRow = null;
			refresh();
		});
		tags.forEach((item, index) => {
			const row = $("<li>").attr("data-tag", item.tag);
			const metadata = $("<div>").addClass("pp-tag-metadata").append($("<a>").attr({
				href: `/tags/${encodeURIComponent(item.tag)}`,
				target: "_blank",
				rel: "noopener noreferrer"
			}).text(item.tag), $("<small>").text(` · 访问 ${item.visits} 次`));
			const rowHeading = $("<div>").addClass("pp-tag-heading");
			if (!autoSort.prop("checked")) {
				const handle = $("<button>").attr({
					type: "button",
					draggable: "true",
					title: "拖拽排序",
					"aria-label": `排序 ${item.label || item.tag}`,
					"data-focus-key": `sort:${item.tag}`
				}).addClass("pp-tag-drag").on("dragstart", (event) => {
					draggedRow = row;
					const transfer = event.originalEvent.dataTransfer;
					transfer.effectAllowed = "move";
					transfer.setData("text/plain", item.tag);
					transfer.setDragImage(row.get(0), 0, 0);
					row.addClass("pp-tag-dragging");
				}).on("dragend", () => {
					if (!draggedRow) return;
					draggedRow = null;
					refresh();
				}).on("keydown", (event) => {
					if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
					event.preventDefault();
					moveLocalTag(item.tag, index + (event.key === "ArrowUp" ? -1 : 1));
					refresh();
				});
				rowHeading.append(handle);
				row.on("dragover", (event) => {
					if (!draggedRow) return;
					event.preventDefault();
					event.originalEvent.dataTransfer.dropEffect = "move";
					if (draggedRow.is(row)) return;
					const { top, height } = row.get(0).getBoundingClientRect();
					if (event.originalEvent.clientY < top + height / 2) row.before(draggedRow);
					else row.after(draggedRow);
				});
			}
			rowHeading.append(metadata);
			const form = $("<form>");
			const input = $("<input>").attr({
				type: "text",
				placeholder: "填一个好记的备注名吧",
				"aria-label": `${item.tag}的显示名称`,
				"data-focus-key": `label:${item.tag}`
			}).prop("defaultValue", item.label).val(drafts.get(`label:${item.tag}`) ?? item.label);
			const save = $("<button>").attr({
				type: "submit",
				"data-focus-key": `save:${item.tag}`
			}).text("保存备注名");
			form.on("submit", (event) => {
				event.preventDefault();
				const label = input.val().trim();
				renameLocalTag(item.tag, label);
				input.val(label).prop("defaultValue", label);
				refresh();
			});
			const up = createButton("上移", () => {
				moveLocalTag(item.tag, index - 1);
				refresh();
			});
			const down = createButton("下移", () => {
				moveLocalTag(item.tag, index + 1);
				refresh();
			});
			up.attr({
				"data-focus-key": `up:${item.tag}`,
				"aria-label": `上移 ${item.label || item.tag}`
			}).prop({
				hidden: autoSort.prop("checked"),
				disabled: index === 0
			});
			down.attr({
				"data-focus-key": `down:${item.tag}`,
				"aria-label": `下移 ${item.label || item.tag}`
			}).prop({
				hidden: autoSort.prop("checked"),
				disabled: index === tags.length - 1
			});
			const remove = createIconButton(`删除 ${item.label || item.tag}`, trash_default, () => {
				removeLocalTag(item.tag);
				refresh();
			}).addClass("pp-tag-danger");
			form.append(input, save, up, down, remove);
			row.append(rowHeading, form);
			list.append(row);
		});
		manager.append(list);
		if (focusKey) manager.find("[data-focus-key]").filter((_, element) => $(element).attr("data-focus-key") === focusKey).trigger("focus");
	};
	const openManager = () => {
		hidePopover();
		if (!manager.prop("open")) manager.empty();
		renderManager();
		if (!manager.prop("open")) manager.get(0).showModal();
	};
	const renderStrip = (strip) => {
		strip.empty();
		const tag = getTagFromPath(location.pathname);
		if (tag) {
			if (hasLocalTag(tag)) strip.append(createButton("本地标签管理", openManager));
			else {
				const addButton = createButton("添加到本地标签", () => addTagFromApi(tag, addButton));
				strip.append(addButton);
			}
			return;
		}
		const tags = getSortedLocalTags();
		strip.append(tags.length >= 10 ? createIconButton("本地标签管理", settings_default, openManager) : createButton("本地标签管理", openManager));
		const links = $("<span>").attr("data-tag-links", "");
		links.append(...tags.map(createTagLink));
		strip.append(links);
	};
	function refresh() {
		if (disposed) return;
		$(`.${STRIP_CLASS}`).each((_, strip) => renderStrip($(strip)));
		updateAction();
		positionPopover();
		if (manager.prop("open")) renderManager();
	}
	const mountStrip = (parent, before) => {
		if (parent.children(`.${STRIP_CLASS}`).length) return;
		const strip = $(parent.is("ul") ? "<li>" : "<span>").addClass(STRIP_CLASS);
		renderStrip(strip);
		before.before(strip);
	};
	const mountEntries = () => {
		const pathname = location.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
		if (getTagFromPath(pathname)) {
			const edit = $("button").filter((_, button) => /(?:编辑|添加(?:进|到))(喜欢|喜爱)的标签/.test($(button).text())).first();
			if (edit.length) mountStrip(edit.parent(), edit);
		} else if (/^\/(?:illustration\/?|manga\/?|cate_r18\.php)?$/.test(pathname)) {
			const firstTag = $(TAG_LINK_SELECTOR).filter((_, link) => !$(link).closest(`.${STRIP_CLASS}, header`).length && !!getTagLink(link)).first();
			if (!firstTag.length) return;
			let first = firstTag;
			let parent = firstTag.parent();
			while (parent.length && !parent.is("body")) {
				if (parent.find("a[href*=\"/artworks/\"]").length) return;
				if (parent.find(TAG_LINK_SELECTOR).length > 1 || parent.is("nav, ul, [role=tablist]") || ["flex", "inline-flex"].includes(parent.css("display"))) {
					mountStrip(parent, first);
					return;
				}
				first = parent;
				parent = parent.parent();
			}
		}
	};
	const enter = (event) => {
		const target = event.target;
		if ($(target).closest(popover).length) {
			clearTimeout(hideTimer);
			hideTimer = void 0;
			return;
		}
		const link = getTagLink(target);
		if (!link || $(link).closest(manager).length) return;
		clearTimeout(hideTimer);
		hideTimer = void 0;
		if (link === activeLink) return;
		clearTimeout(showTimer);
		showTimer = setTimeout(() => void showPopover(link), getSettings().localTagPopoverShowDelayMs);
	};
	const leave = (event) => {
		const link = getTagLink(event.target);
		const target = event.target;
		if (!link && !$(target).closest(popover).length) return;
		const related = event.relatedTarget;
		if (related instanceof Node && ($(related).closest(popover).length || link && $(related).closest(link).length)) return;
		clearTimeout(showTimer);
		showTimer = void 0;
		clearTimeout(hideTimer);
		hideTimer = setTimeout(hidePopover, getSettings().localTagPopoverHideDelayMs);
	};
	$(document).on("mouseover.ppLocalTags", enter).on("focusin.ppLocalTags", enter).on("mouseout.ppLocalTags", leave).on("focusout.ppLocalTags", leave).on("keydown.ppLocalTags", (event) => {
		if (event.key === "Escape") hidePopover();
	}).on("scroll.ppLocalTags", hidePopover);
	$(window).on("resize.ppLocalTags", positionPopover);
	const visitPage = () => {
		if (disposed) return;
		if (syncLocalTagVisitForPath(location.pathname)) refresh();
	};
	$(window).on("urlchange.ppLocalTags", () => {
		if (disposed) return;
		hidePopover();
		if (manager.prop("open")) manager.get(0).close();
		$(`.${STRIP_CLASS}`).remove();
		visitPage();
		mountEntries();
	});
	onRemoteLocalTagsUpdate = refresh;
	const onPageHide = () => flushLocalTagState();
	window.addEventListener("pagehide", onPageHide);
	const debouncedObserver = debounce(() => {
		if (disposed) return;
		if (activeLink && !$.contains($("html").get(0), activeLink)) hidePopover();
		mountEntries();
	}, () => getSettings().localTagRenderDebounceMs);
	const observer = new MutationObserver(debouncedObserver);
	observer.observe($("body").get(0), {
		childList: true,
		subtree: true
	});
	const unsubscribeSettings = subscribeSettings((next, prev) => {
		if (next.localTagPopoverShowDelayMs !== prev.localTagPopoverShowDelayMs || next.localTagPopoverHideDelayMs !== prev.localTagPopoverHideDelayMs) {
			clearTimeout(showTimer);
			clearTimeout(hideTimer);
			showTimer = void 0;
			hideTimer = void 0;
		}
		if (next.localTagRenderDebounceMs !== prev.localTagRenderDebounceMs && debouncedObserver.isPending()) {
			debouncedObserver.cancel();
			debouncedObserver();
		}
	});
	activeLocalTagsTeardown = () => {
		disposed = true;
		unsubscribeSettings();
		flushLocalTagState();
		clearTimeout(showTimer);
		clearTimeout(hideTimer);
		showTimer = void 0;
		hideTimer = void 0;
		debouncedObserver.cancel();
		observer.disconnect();
		scrollParents.off("scroll.ppLocalTags");
		scrollParents = $();
		$(document).off(".ppLocalTags");
		$(window).off(".ppLocalTags");
		window.removeEventListener("pagehide", onPageHide);
		onRemoteLocalTagsUpdate = null;
		if (manager.prop("open")) manager.get(0).close();
		popover.remove();
		manager.remove();
		$(`.${STRIP_CLASS}`).remove();
	};
	visitPage();
	mountEntries();
};

// src/icons/loading.svg
var loading_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg t=\"1742282291278\"\n     class=\"icon\"\n     viewBox=\"0 0 1024 1024\"\n     version=\"1.1\"\n     xmlns=\"http://www.w3.org/2000/svg\"\n     p-id=\"38665\"\n     width=\"48\"\n     height=\"48\">\n    <path d=\"M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 0 0-94.3-139.9 437.71 437.71 0 0 0-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3 0.1 19.9-16 36-35.9 36z\"\n          p-id=\"38666\"\n          fill=\"#1296db\" />\n</svg>";

// src/icons/page.svg
var page_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg viewBox=\"0 0 10 10\"\n     width=\"10\"\n     height=\"10\">\n    <path d=\"M 8 3 C 8.55228 3 9 3.44772 9 4 L 9 9 C 9 9.55228 8.55228 10 8 10 L 3 10 C 2.44772 10 2 9.55228 2 9 L 6 9 C 7.10457 9 8 8.10457 8 7 L 8 3 Z M 1 1 L 6 1 C 6.55228 1 7 1.44772 7 2 L 7 7 C 7 7.55228 6.55228 8 6 8 L 1 8 C 0.447715 8 0 7.55228 0 7 L 0 2 C 0 1.44772 0.447715 1 1 1 Z\"\n          fill=\"#ffffff\" />\n</svg>";

// src/services/illustration.ts
const USER_ILLUSTRATIONS_CACHE_PREFIX = "PIXIV_PREVIEWER_CACHED_ARTWORKS_OF_USER_";
const USER_ILLUSTRATIONS_CACHE_VERSION = 1;
const pendingIllustrationDetails = createPendingPromiseCache();
/** 请求指定作品的详细信息 */
const requestIllustrationDetails = async (id, retry) => {
	const requestUrl = `/touch/ajax/illust/details?illust_id=${id}`;
	const getIllustDetailsRes = retry ? await requestWithRetry({
		url: requestUrl,
		onRetry: (response, retryTimes) => {
			iLog.w(`Get illustration details via api \`${requestUrl}\` failed:`, response, `${retryTimes} times retrying...`);
		}
	}) : await request({ url: requestUrl });
	if (getIllustDetailsRes.status !== 200) return null;
	return convertObjectKeysFromSnakeToCamel(getIllustDetailsRes.response.body.illust_details);
};
/**
* 从 IndexedDB 或接口获取指定作品的详细信息。
* 静态字段与可变字段分别控制有效期：可变字段过期时会重新请求，
* 请求失败则退回缓存数据，避免排序因单个作品请求失败而中断。
*
* @param maxStale 可变字段的额外容忍时长（毫秒）。预览等不要求收藏数实时的场景
* 可以传入更大的值，减少重复请求。
*/
const getIllustrationDetailsWithCache = (id, retry = false, { maxStale = 0 } = {}) => pendingIllustrationDetails.run(`${id}|${retry}|${maxStale}`, async () => {
	const { illustrationMutableCacheTtlMs } = getSettings();
	const cached = await getCachedIllustrationDetails(id, Date.now(), illustrationMutableCacheTtlMs + maxStale);
	if (cached?.mutableFresh) {
		iLog.d(`Use cached details of illustration ${id}`, cached.details);
		return cached.details;
	}
	try {
		const illustDetails = await requestIllustrationDetails(id, retry);
		if (illustDetails) {
			cacheIllustrationDetails([illustDetails]);
			return illustDetails;
		}
	} catch (error) {
		iLog.w(`Failed to fetch details of illustration ${id}:`, error);
	}
	if (cached) {
		iLog.d(`Use stale cached details of illustration ${id}`, cached.details);
		return cached.details;
	}
	return null;
});
/** 获取用户发布的所有作品，按照发布时间倒叙 */
const getUserIllustrations = async (userId) => {
	const responseData = (await request({ url: `/ajax/user/${userId}/profile/all?sensitiveFilterMode=userSetting&lang=zh` })).response.body;
	const illusts = Object.keys(responseData.illusts).reverse();
	const manga = Object.keys(responseData.manga).reverse();
	return {
		illusts,
		manga,
		artworks: [...illusts, ...manga].sort((a, b) => Number(b) - Number(a))
	};
};
const getUserIllustrationsCacheKey = (userId) => `${USER_ILLUSTRATIONS_CACHE_PREFIX}${userId}`;
/** 读取未过期的用户作品列表缓存 */
const readUserIllustrationsCache = (userId) => {
	try {
		const cacheString = sessionStorage.getItem(getUserIllustrationsCacheKey(userId));
		if (!cacheString) return null;
		const entry = JSON.parse(cacheString);
		if (entry.version !== USER_ILLUSTRATIONS_CACHE_VERSION || typeof entry.cachedAt !== "number" || !Array.isArray(entry.artworks) || !Array.isArray(entry.illusts) || !Array.isArray(entry.manga)) return null;
		if (Date.now() - entry.cachedAt > getSettings().userIllustrationsCacheTtlMs) return null;
		return entry;
	} catch (error) {
		iLog.i("Failed to read user illustrations cache:", error);
		return null;
	}
};
/** 列出 Session Storage 中本功能写入的 key（先在遍历中收集，避免边删边遍历） */
const listUserIllustrationsCacheKeys = () => {
	const keys = [];
	for (let i = 0; i < sessionStorage.length; i += 1) {
		const key = sessionStorage.key(i);
		if (key?.startsWith(USER_ILLUSTRATIONS_CACHE_PREFIX)) keys.push(key);
	}
	return keys;
};
/** 写入用户作品列表缓存；超出配额时清理后重试一次 */
const writeUserIllustrationsCache = (userId, illustrations) => {
	const key = getUserIllustrationsCacheKey(userId);
	const entry = {
		...illustrations,
		version: USER_ILLUSTRATIONS_CACHE_VERSION,
		cachedAt: Date.now()
	};
	const value = JSON.stringify(entry);
	try {
		sessionStorage.setItem(key, value);
		return;
	} catch (error) {
		iLog.w("Failed to write user illustrations cache, retrying:", error);
	}
	try {
		listUserIllustrationsCacheKeys().forEach((item) => sessionStorage.removeItem(item));
		sessionStorage.setItem(key, value);
	} catch (error) {
		iLog.w("Failed to write user illustrations cache:", error);
	}
};
/** 从 Session Storage 或接口获取指定用户的作品列表 */
const getUserIllustrationsWithCache = async (userId, { onRequesting } = {}) => {
	const cached = readUserIllustrationsCache(userId);
	if (cached) return {
		illusts: cached.illusts,
		manga: cached.manga,
		artworks: cached.artworks
	};
	onRequesting?.();
	const userIllustrations = await getUserIllustrations(userId);
	writeUserIllustrationsCache(userId, userIllustrations);
	return userIllustrations;
};
/** 清理用户作品列表缓存，供“清除缓存”使用 */
const clearUserIllustrationsCache = () => {
	listUserIllustrationsCacheKeys().forEach((item) => sessionStorage.removeItem(item));
};

// src/services/cache.ts
let hasPruned = false;
let activePrunePromise = null;
let rerunPruneRequested = false;
/** 页面解析期间不抢占主线程，空闲时再执行重型清理 */
const whenIdle = (task) => {
	requestIdleCallback(task, { timeout: getSettings().cacheCleanupIdleTimeoutMs });
};
const runCachePrune = () => {
	if (activePrunePromise) {
		rerunPruneRequested = true;
		return activePrunePromise;
	}
	activePrunePromise = (async () => {
		try {
			do {
				rerunPruneRequested = false;
				await new Promise((resolve) => whenIdle(resolve));
				try {
					pruneTagTranslationCache();
					await Promise.all([pruneIllustrationCaches(), pruneUgoiraFrameCache()]);
				} catch (error) {
					iLog.w("Failed to prune caches:", error);
				}
			} while (rerunPruneRequested);
		} finally {
			activePrunePromise = null;
		}
	})();
	return activePrunePromise;
};
/**
* 提前建立 IndexedDB 连接。
* 连接需在首次读写缓存时才建立，提前打开可让悬浮预览直接命中缓存，
* 不必等页面渲染完成后才开始握手。
*/
const warmUpCacheDatabase = () => {
	getDatabase();
};
/**
* 启动后清理一次过期缓存。
* 清理过程中的失败都在数据库层降级为日志，不会抛出；
* 本流程在页面生命周期内只执行一次。
*/
const pruneCachesOnStartup = async () => {
	if (hasPruned) return;
	hasPruned = true;
	await runCachePrune();
};
/**
* 在配置缩小缓存上限或有效期后安排一次持久化缓存清理，不受启动单次标记阻止。
*/
const scheduleCachePrune = () => runCachePrune();
const countTagTranslations = () => {
	const state = GM_getValue(LOCAL_TAG_TRANSLATIONS_KEY, { translations: {} });
	return Object.keys(state?.translations ?? {}).length;
};
const getCacheUsage = async () => {
	const [counts, ugoira] = await Promise.all([countCacheTable(CACHE_TABLE_KEYS), getUgoiraFrameCacheStats()]);
	return {
		illustrationDetails: counts["illustrationDetailsCache"] ?? 0,
		illustPages: counts["illustPagesCache"] ?? 0,
		ugoiraFrames: counts["ugoiraFramesCache"] ?? 0,
		ugoiraBytes: ugoira.bytes,
		tagTranslations: countTagTranslations()
	};
};
/** 清空全部本地缓存（IndexedDB、会话存储、标签翻译） */
const clearAllLocalCaches = async () => {
	clearUserIllustrationsCache();
	clearLocalTagCaches();
	const cleared = await clearCacheTables(CACHE_TABLE_KEYS);
	if (!cleared) iLog.w("Failed to clear some IndexedDB caches.");
	return cleared;
};
const formatCacheBytes = (bytes) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1048576).toFixed(1)} MB`;
};

// src/services/preview.ts
/** 下载作品 */
const downloadIllust = ({ url, filename, directory, options = {} }) => {
	downloadFile(url, filename, {
		...options,
		onerror: function(resp) {
			options.onerror?.call(this, resp);
		}
	}, directory);
};
/** 获取图片分页信息和访问链接 */
const getIllustPagesRequestUrl = (id) => {
	return `/ajax/illust/${id}/pages`;
};
/** 获取动图下载链接的链接 */
const getUgoiraMetadataRequestUrl = (id) => {
	return `/ajax/illust/${id}/ugoira_meta`;
};

// src/utils/event.ts
const stopEventPropagation = (event) => {
	event.stopPropagation();
};

// src/utils/artwork-link.ts
const LINK_BLANK_ATTR = "data-pp-link-blank";
const SORT_ARTWORK_ATTR = "data-pp-sort-artwork";
const originalAttrsMap = /* @__PURE__ */ new WeakMap();
/** 判断元素是否为作品详情链接，仅处理 `/artworks/<id>` 链接，不影响作者与标签链接 */
const getArtworkAnchor = (target) => {
	const link = target.closest("a").get(0);
	if (!(link instanceof HTMLAnchorElement)) return null;
	const href = link.getAttribute("href");
	if (!href || !/\/artworks\/(\d+)(#(\d+))?/.test(href)) return null;
	return link;
};
/** 为作品链接应用新标签页打开属性，首次修改前记录原属性以便关闭时还原 */
const applyArtworkLinkBlank = (anchor) => {
	if (!anchor.hasAttribute(LINK_BLANK_ATTR)) {
		originalAttrsMap.set(anchor, {
			target: anchor.getAttribute("target"),
			rel: anchor.getAttribute("rel")
		});
		anchor.setAttribute(LINK_BLANK_ATTR, "1");
	}
	anchor.setAttribute("target", "_blank");
	anchor.setAttribute("rel", "external");
	const $anchor = $(anchor);
	$anchor.off("click", stopEventPropagation);
	$anchor.on("click", stopEventPropagation);
};
/** 仅撤销脚本对作品链接改写的属性和事件，恢复页面原本行为 */
const revertArtworkLinkBlank = (anchor) => {
	if (!anchor.hasAttribute(LINK_BLANK_ATTR)) return;
	const original = originalAttrsMap.get(anchor);
	if (original?.target !== null && original?.target !== void 0) anchor.setAttribute("target", original.target);
	else anchor.removeAttribute("target");
	if (original?.rel !== null && original?.rel !== void 0) anchor.setAttribute("rel", original.rel);
	else anchor.removeAttribute("rel");
	anchor.removeAttribute(LINK_BLANK_ATTR);
	$(anchor).off("click", stopEventPropagation);
	originalAttrsMap.delete(anchor);
};
/** 标记由脚本排序生成的作品链接，并根据当前设置决定是否强制新标签页打开 */
const markSortedArtworkLink = (anchor, linkBlankEnabled) => {
	anchor.setAttribute(SORT_ARTWORK_ATTR, "1");
	if (linkBlankEnabled) applyArtworkLinkBlank(anchor);
};
/** 在“在新标签页打开作品”配置变更后同步页面中由脚本处理过的作品链接 */
const syncArtworkLinksBlank = (enabled) => {
	if (!enabled) {
		document.querySelectorAll(`a[${LINK_BLANK_ATTR}="1"]`).forEach(revertArtworkLinkBlank);
		return;
	}
	document.querySelectorAll(`a[${SORT_ARTWORK_ATTR}="1"]`).forEach(applyArtworkLinkBlank);
};

// src/utils/illustration.ts
const checkUsingTags = (tags, targetTags) => {
	for (const tag of tags) if (targetTags.includes(tag.toLowerCase())) return true;
	return false;
};
const checkIsR18 = (tags) => {
	return checkUsingTags(tags, R18_TAGS);
};
const checkIsR18G = (tags) => {
	return checkUsingTags(tags, R18G_TAGS);
};
/**
* 获取作品原图下载时使用的子目录。
* R18G 作品优先归入 r18-g 目录，R18 作品归入 r18 目录，其他作品返回 `undefined`。
*/
const getDownloadDirectory = (tags) => {
	if (checkIsR18G(tags)) return R18G_DOWNLOAD_DIRECTORY;
	if (checkIsR18(tags)) return "r18";
};
const checkIsUgoira = (illustType) => {
	return illustType === 2;
};
const checkIsUgoiraUsingTags = (tags) => {
	return checkUsingTags(tags, UGOIRA_TAGS);
};
const checkIsAiGenerated = (aiType) => {
	return aiType === 2;
};
const checkIsAiAssisted = (tags) => {
	return checkUsingTags(tags, AI_ASSISTED_TAGS);
};

// src/utils/mouse-monitor.ts
var MouseMonitor = class {
	/** 鼠标相对网页的位置 */
	mousePos = [0, 0];
	/** 鼠标相对视窗的绝对位置 */
	mouseAbsPos = [0, 0];
	constructor() {
		document.addEventListener("mousemove", (mouseMoveEvent) => {
			this.mousePos = [mouseMoveEvent.pageX, mouseMoveEvent.pageY];
			this.mouseAbsPos = [mouseMoveEvent.clientX, mouseMoveEvent.clientY];
		});
	}
};
const mouseMonitor = new MouseMonitor();

// src/utils/ugoira-player.ts
var ZipImagePlayer = class {
	canvas;
	op;
	_loadingState;
	_dead;
	_context;
	_files;
	_frameCount;
	_frame;
	_loadFrame;
	_frameImages;
	_paused;
	_timer;
	_failed;
	_len;
	_buf;
	_pHead;
	_pNextHead;
	_pFetch;
	_pTail;
	_trailerBytes;
	_listeners = {};
	on(event, handler) {
		this._listeners[event] = handler;
	}
	off(event) {
		delete this._listeners[event];
	}
	_emit(event, ...args) {
		const handler = this._listeners[event];
		if (handler) handler(...args);
	}
	constructor(options) {
		this.canvas = options.canvas;
		this.op = options;
		this._trailerBytes = Math.max(22, Math.floor(options.trailerBytes ?? 3e4));
		this._loadingState = 0;
		this._dead = false;
		const context = options.canvas.getContext("2d");
		if (!context) this._error("Failed to get 2D context");
		this._context = context;
		this._files = {};
		this._frameCount = this.op.metadata.frames.length;
		this._debugLog("Frame count: " + this._frameCount);
		this._frame = 0;
		this._loadFrame = 0;
		this._frameImages = [];
		this._paused = false;
		this._timer = null;
		this._failed = false;
		this._len = 0;
		this._buf = null;
		this._pHead = 0;
		this._pNextHead = 0;
		this._pFetch = 0;
		this._pTail = 0;
		this._startLoad();
		if (this.op.autoStart) this.play();
		else this._paused = true;
	}
	_mkerr(msg) {
		return () => {
			this._error(msg);
		};
	}
	_error(msg) {
		this._failed = true;
		throw Error("ZipImagePlayer error: " + msg);
	}
	_debugLog(msg) {
		if (this.op.debug) console.log(msg);
	}
	_load(offset, length, callback) {
		const xhr = new XMLHttpRequest();
		xhr.addEventListener("load", () => {
			if (this._dead) return;
			this._debugLog("Load: " + offset + " " + length + " status=" + xhr.status);
			if (xhr.status == 200) {
				this._debugLog("Range disabled or unsupported, complete load");
				offset = 0;
				length = xhr.response.byteLength;
				this._len = length;
				this._buf = xhr.response;
			} else {
				if (xhr.status != 206) this._error("Unexpected HTTP status " + xhr.status);
				if (xhr.response.byteLength != length) this._error("Unexpected length " + xhr.response.byteLength + " (expected " + length + ")");
				new Uint8Array(this._buf).set(new Uint8Array(xhr.response), offset);
			}
			if (callback) callback(offset, length);
		}, false);
		xhr.addEventListener("error", this._mkerr("Fetch failed"), false);
		xhr.open("GET", this.op.source);
		xhr.responseType = "arraybuffer";
		if (offset != null && length != null) {
			const end = offset + length;
			xhr.setRequestHeader("Range", "bytes=" + offset + "-" + (end - 1));
		}
		xhr.send();
	}
	_startLoad() {
		if (this.op.cachedFrames?.length === this._frameCount) {
			this._debugLog("Use cached frames.");
			this._loadCachedFrame();
			return;
		}
		if (!this.op.source) {
			this._loadNextFrame();
			return;
		}
		$.ajax({
			url: this.op.source,
			type: "HEAD"
		}).done((_data, _status, xhr) => {
			if (this._dead) return;
			this._pHead = 0;
			this._pNextHead = 0;
			this._pFetch = 0;
			const len = parseInt(String(xhr.getResponseHeader("Content-Length")));
			if (!len) {
				this._debugLog("HEAD request failed: invalid file length.");
				this._debugLog("Falling back to full file mode.");
				this._load(null, null, (_off, fullLen) => {
					this._pTail = 0;
					this._pHead = fullLen;
					this._findCentralDirectory();
				});
				return;
			}
			this._debugLog("Len: " + len);
			this._len = len;
			this._buf = new ArrayBuffer(len);
			let off = len - this._trailerBytes;
			if (off < 0) off = 0;
			this._pTail = len;
			this._load(off, len - off, (loadedOff) => {
				this._pTail = loadedOff;
				this._findCentralDirectory();
			});
		}).fail(this._mkerr("Length fetch failed"));
	}
	_findCentralDirectory() {
		const dv = new DataView(this._buf, this._len - 22, 22);
		if (dv.getUint32(0, true) != 101010256) this._error("End of Central Directory signature not found");
		const cd_count = dv.getUint16(10, true);
		const cd_size = dv.getUint32(12, true);
		const cd_off = dv.getUint32(16, true);
		if (cd_off < this._pTail) this._load(cd_off, this._pTail - cd_off, () => {
			this._pTail = cd_off;
			this._readCentralDirectory(cd_off, cd_size, cd_count);
		});
		else this._readCentralDirectory(cd_off, cd_size, cd_count);
	}
	_readCentralDirectory(offset, size, count) {
		const dv = new DataView(this._buf, offset, size);
		let p = 0;
		for (let i = 0; i < count; i++) {
			if (dv.getUint32(p, true) != 33639248) this._error("Invalid Central Directory signature");
			const compMethod = dv.getUint16(p + 10, true);
			const uncompSize = dv.getUint32(p + 24, true);
			const nameLen = dv.getUint16(p + 28, true);
			const extraLen = dv.getUint16(p + 30, true);
			const cmtLen = dv.getUint16(p + 32, true);
			const off = dv.getUint32(p + 42, true);
			if (compMethod != 0) this._error("Unsupported compression method");
			p += 46;
			const nameView = new Uint8Array(this._buf, offset + p, nameLen);
			let name = "";
			for (let j = 0; j < nameLen; j++) name += String.fromCharCode(nameView[j]);
			p += nameLen + extraLen + cmtLen;
			this._files[name] = {
				off,
				len: uncompSize
			};
		}
		if (this._pHead >= this._pTail) {
			this._pHead = this._len;
			$(this).triggerHandler("loadProgress", [this._pHead / this._len]);
			this._loadNextFrame();
		} else {
			this._loadNextChunk();
			this._loadNextChunk();
		}
	}
	_loadNextChunk() {
		if (this._pFetch >= this._pTail) return;
		const off = this._pFetch;
		let len = this.op.chunkSize ?? 3e5;
		if (this._pFetch + len > this._pTail) len = this._pTail - this._pFetch;
		this._pFetch += len;
		this._load(off, len, (loadedOff, loadedLen) => {
			if (loadedOff == this._pHead) {
				if (this._pNextHead) {
					this._pHead = this._pNextHead;
					this._pNextHead = 0;
				} else this._pHead = loadedOff + loadedLen;
				if (this._pHead >= this._pTail) this._pHead = this._len;
				$(this).triggerHandler("loadProgress", [this._pHead / this._len]);
				this._loadNextFrame();
			} else this._pNextHead = loadedOff + loadedLen;
			this._loadNextChunk();
		});
	}
	_fileDataStart(offset) {
		const dv = new DataView(this._buf, offset, 30);
		const nameLen = dv.getUint16(26, true);
		const extraLen = dv.getUint16(28, true);
		return offset + 30 + nameLen + extraLen;
	}
	_isFileAvailable(name) {
		const info = this._files[name];
		if (!info) this._error("File " + name + " not found in ZIP");
		if (this._pHead < info.off + 30) return false;
		return this._pHead >= this._fileDataStart(info.off) + info.len;
	}
	_loadNextFrame() {
		if (this.op.cachedFrames?.length === this._frameCount) {
			this._loadCachedFrame();
			return;
		}
		if (this._dead) return;
		const frame = this._loadFrame;
		if (frame >= this._frameCount) return;
		const meta = this.op.metadata.frames[frame];
		if (!this.op.source) {
			this._loadFrame += 1;
			this._loadImage(frame, meta.file, false);
			return;
		}
		if (!this._isFileAvailable(meta.file)) return;
		this._loadFrame += 1;
		const off = this._fileDataStart(this._files[meta.file].off);
		const end = off + this._files[meta.file].len;
		const mime_type = this.op.metadata.mime_type ?? "image/png";
		const slice = this._buf.slice(off, end);
		const blob = new Blob([slice], { type: mime_type });
		this.op.onFrameDecoded?.({
			index: frame,
			file: meta.file,
			delay: meta.delay,
			blob
		});
		const url = URL.createObjectURL(blob);
		this._loadImage(frame, url, true);
	}
	/** 从帧缓存中加载下一帧 */
	_loadCachedFrame() {
		if (this._dead) return;
		const frame = this._loadFrame;
		if (frame >= this._frameCount) return;
		this._loadFrame += 1;
		const blob = this.op.cachedFrames[frame];
		this._loadImage(frame, URL.createObjectURL(blob), true);
	}
	_loadImage(frame, url, isBlob) {
		const image = new Image();
		const meta = this.op.metadata.frames[frame];
		image.addEventListener("load", () => {
			this._debugLog("Loaded " + meta.file + " to frame " + frame);
			if (isBlob) URL.revokeObjectURL(url);
			if (this._dead) return;
			this._frameImages[frame] = image;
			this._emit("frameLoaded", frame);
			if (this._loadingState == 0) this._displayFrame();
			if (frame >= this._frameCount - 1) {
				this._setLoadingState(2);
				this._buf = null;
			} else this._loadNextFrame();
		});
		image.src = url;
	}
	_setLoadingState(state) {
		if (this._loadingState != state) {
			this._loadingState = state;
			$(this).triggerHandler("loadingStateChanged", [state]);
		}
	}
	_displayFrame() {
		if (this._dead) return;
		const meta = this.op.metadata.frames[this._frame];
		this._debugLog("Displaying frame: " + this._frame + " " + meta.file);
		const image = this._frameImages[this._frame];
		if (!image) {
			this._debugLog("Image not available!");
			this._setLoadingState(0);
			return;
		}
		if (this._loadingState != 2) this._setLoadingState(1);
		if (this.op.autosize) {
			if (this._context.canvas.width != image.width || this._context.canvas.height != image.height) {
				this._context.canvas.width = image.width;
				this._context.canvas.height = image.height;
			}
		}
		this._context.clearRect(0, 0, this.op.canvas.width, this.op.canvas.height);
		this._context.drawImage(image, 0, 0);
		$(this).triggerHandler("frame", this._frame);
		if (!this._paused) this._timer = setTimeout(() => {
			this._timer = null;
			this._nextFrame();
		}, meta.delay);
	}
	_nextFrame() {
		if (this._frame >= this._frameCount - 1) {
			if (this.op.loop) this._frame = 0;
			else {
				this.pause();
				return;
			}
		} else this._frame += 1;
		this._displayFrame();
	}
	play() {
		if (this._dead) return;
		if (this._paused) {
			$(this).triggerHandler("play", [this._frame]);
			this._paused = false;
			this._displayFrame();
		}
	}
	pause() {
		if (this._dead) return;
		if (!this._paused) {
			if (this._timer) clearTimeout(this._timer);
			this._paused = true;
			$(this).triggerHandler("pause", [this._frame]);
		}
	}
	rewind() {
		if (this._dead) return;
		this._frame = 0;
		if (this._timer) clearTimeout(this._timer);
		this._displayFrame();
	}
	stop() {
		this._debugLog("Stopped!");
		this._dead = true;
		if (this._timer) clearTimeout(this._timer);
		this._frameImages = [];
		this._buf = null;
		$(this).triggerHandler("stop");
	}
	getCurrentFrame() {
		return this._frame;
	}
	getLoadedFrameImages() {
		return this._frameImages;
	}
	getLoadedFrames() {
		return this._frameImages.length;
	}
	getFrameCount() {
		return this._frameCount;
	}
	hasError() {
		return this._failed;
	}
};

// src/features/preview.ts
/**
* 已解码预览图片的 LRU 缓存。同一个作品反复悬停时复用最近解码的位图，
* 无需等待浏览器重新解码。容量按 `previewPreloadCount * 2` 自动派生。
*/
const decodedPreviewImages = createLRUCache(g_defaultSettings.previewPreloadCount * 2);
const getDecodedImageCacheKey = (illustId, page) => `${illustId}_p${page}`;
/** 创建带旋转动画的 loading 图标，预览窗口的加载状态共用 */
const createLoadingSpinner = () => $(loading_default).css({
	padding: "12px",
	animation: "pp-spin 1s linear infinite"
});
let isInitialized$1 = false;
const loadIllustPreview = () => {
	if (isInitialized$1) return;
	decodedPreviewImages.setMaxSize(getSettings().previewPreloadCount * 2);
	/**
	* 获取作品的元数据信息
	* @param target 查找的 JQuery 对象
	* @returns 作品的元数据
	*/
	const getIllustMetadata = (target) => {
		const imgLink = getArtworkAnchor(target);
		if (!imgLink) return null;
		const $imgLink = $(imgLink);
		const illustHrefMatch = $imgLink.attr("href")?.match(/\/artworks\/(\d+)(#(\d+))?/);
		if (!illustHrefMatch) return null;
		const illustId = illustHrefMatch[1];
		const previewPage = illustHrefMatch[3] ? Math.max(1, Number(illustHrefMatch[3])) : void 0;
		const ugoiraSvg = $imgLink.children("div:first").find("svg:first");
		const playIcon = $imgLink.children("div:first").find("pixiv-icon[name=\"24/Play\"]");
		return {
			/** 作品 ID */
			illustId,
			/** 作品页码 */
			previewPage,
			/** 作品类型 */
			illustType: ugoiraSvg.length || playIcon.length || $imgLink.hasClass("ugoku-illust") ? 2 : 0,
			/** 作品链接 DOM */
			illustLinkDom: $imgLink
		};
	};
	/**
	* 获取作品访问链接并在前端显示预览
	* @param target 作品的元数据
	*/
	const previewedIllust = new PreviewedIllust();
	const previewIllust = (() => {
		let currentHoveredIllustId = "";
		let getIllustPagesRequest = null;
		let getUgoiraMetaRequest = null;
		const initialCacheMax = getSettings().previewCacheMaxEntries;
		const getIllustPagesCache = createLRUCache(initialCacheMax);
		const getUgoiraMetadataCache = createLRUCache(initialCacheMax);
		/** 获取动图元数据并展示动图预览（命中缓存时直接展示） */
		const previewAsUgoira = ({ target, illustId, illustDetailsPromise }) => {
			const showUgoira = (metadata) => {
				if (!getSettings().enableAnimePreview) {
					previewedIllust.dismissLoading(illustId);
					return;
				}
				if (!previewedIllust.isActiveIllust(illustId)) return;
				previewedIllust.setUgoira({
					illustId,
					illustElement: target,
					illustrationDetails: previewedIllust.illustDetails,
					...metadata
				});
				illustDetailsPromise.then((illustrationDetails) => {
					if (currentHoveredIllustId !== illustId) return;
					previewedIllust.updateIllustrationDetails(illustrationDetails);
				});
			};
			const ugoiraMetadataCached = getUgoiraMetadataCache.get(illustId);
			if (ugoiraMetadataCached) {
				showUgoira(ugoiraMetadataCached);
				return;
			}
			if (!previewedIllust.isActiveIllust(illustId)) previewedIllust.showLoading({
				illustId,
				illustElement: target,
				isUgoira: true
			});
			getUgoiraMetaRequest = $.ajax(getUgoiraMetadataRequestUrl(illustId), {
				method: "GET",
				success: (data) => {
					if (data.error) {
						iLog.e(`An error occurred while requesting metadata of ugoira ${illustId}: ${data.message}`);
						if (!previewedIllust.illustLoaded) previewedIllust.dismissLoading(illustId);
						return;
					}
					getUgoiraMetadataCache.set(illustId, data.body);
					if (currentHoveredIllustId !== illustId) return;
					showUgoira(data.body);
				},
				error: (jqXHR, textStatus) => {
					if (textStatus === "abort") return;
					if (!previewedIllust.illustLoaded) previewedIllust.dismissLoading(illustId);
					iLog.e(`An error occurred while requesting metadata of ugoira ${illustId}: ${jqXHR.responseText}`);
				}
			});
		};
		/** 获取图片分页信息并展示插画预览；若作品详情标签显示实际为动图，则切换为动图预览 */
		const previewAsIllust = ({ target, illustId, previewPage, regularUrls, originalUrls, illustDetailsPromise, placeholderShown = false }) => {
			if (placeholderShown && !previewedIllust.isActiveIllust(illustId)) return;
			previewedIllust.setImage({
				illustId,
				illustElement: target,
				previewPage,
				regularUrls,
				originalUrls,
				illustrationDetails: null
			});
			illustDetailsPromise.then((illustrationDetails) => {
				if (currentHoveredIllustId !== illustId) return;
				if (!previewedIllust.isActiveIllust(illustId)) return;
				const isUgoira = illustrationDetails && (checkIsUgoira(illustrationDetails.type) || checkIsUgoiraUsingTags(illustrationDetails.tags));
				if (getSettings().enableAnimePreview && isUgoira) {
					previewedIllust.updateIllustrationDetails(illustrationDetails);
					previewAsUgoira({
						target,
						illustId,
						illustDetailsPromise: Promise.resolve(illustrationDetails)
					});
					return;
				}
				previewedIllust.updateIllustrationDetails(illustrationDetails);
			});
		};
		const trigger = ({ target, illustId, previewPage, illustType }) => {
			const settings = getSettings();
			if (!settings.enablePreview) return;
			if (currentHoveredIllustId === illustId && previewedIllust.isActiveIllust(illustId)) return;
			getIllustPagesRequest?.abort();
			getUgoiraMetaRequest?.abort();
			currentHoveredIllustId = illustId;
			if (illustType === 2 && !settings.enableAnimePreview) {
				iLog.i("动图预览已禁用，跳过");
				return;
			}
			const illustDetailsPromise = getIllustrationDetailsWithCache(illustId, false, { maxStale: settings.previewDetailsMaxStaleMs }).catch((error) => {
				iLog.e(`An error occurred while fetching illustration details of ${illustId}: ${error}`);
				return null;
			});
			if ([0, 1].includes(illustType)) {
				const illustPagesCached = getIllustPagesCache.get(illustId);
				if (illustPagesCached) {
					previewAsIllust({
						target,
						illustId,
						previewPage,
						illustDetailsPromise,
						...illustPagesCached
					});
					return;
				}
				previewedIllust.showLoading({
					illustId,
					illustElement: target
				});
				getCachedIllustPages(illustId).then((persistedPages) => {
					if (currentHoveredIllustId !== illustId) return;
					if (persistedPages) {
						getIllustPagesCache.set(illustId, persistedPages);
						previewAsIllust({
							target,
							illustId,
							previewPage,
							illustDetailsPromise,
							placeholderShown: true,
							...persistedPages
						});
						return;
					}
					getIllustPagesRequest = $.ajax(getIllustPagesRequestUrl(illustId), {
						method: "GET",
						success: (data) => {
							if (data.error) {
								iLog.e(`An error occurred while requesting preview urls of illust ${illustId}: ${data.message}`);
								previewedIllust.dismissLoading(illustId);
								return;
							}
							const urls = data.body.map((item) => item.urls);
							const regularUrls = urls.map((url) => url.regular);
							const originalUrls = urls.map((url) => url.original);
							getIllustPagesCache.set(illustId, {
								regularUrls,
								originalUrls
							});
							cacheIllustPages(illustId, {
								regularUrls,
								originalUrls
							});
							if (currentHoveredIllustId !== illustId) return;
							previewAsIllust({
								target,
								illustId,
								previewPage,
								regularUrls,
								originalUrls,
								illustDetailsPromise,
								placeholderShown: true
							});
						},
						error: (jqXHR, textStatus) => {
							if (textStatus === "abort") return;
							previewedIllust.dismissLoading(illustId);
							iLog.e(`An error occurred while requesting preview urls of illust ${illustId}: ${jqXHR.responseText || textStatus}`);
						}
					});
				});
			} else if (illustType === 2) previewAsUgoira({
				target,
				illustId,
				illustDetailsPromise
			});
			else {
				iLog.e("Unknown illust type.");
				return;
			}
		};
		const cancel = () => {
			currentHoveredIllustId = "";
			getIllustPagesRequest?.abort();
			getIllustPagesRequest = null;
			getUgoiraMetaRequest?.abort();
			getUgoiraMetaRequest = null;
		};
		const setCacheMaxEntries = (maxEntries) => {
			getIllustPagesCache.setMaxSize(maxEntries);
			getUgoiraMetadataCache.setMaxSize(maxEntries);
		};
		return {
			trigger,
			cancel,
			setCacheMaxEntries
		};
	})();
	let pendingHoverTimeout = null;
	let pendingHoverCleanup = null;
	const cancelPendingTrigger = () => {
		if (pendingHoverTimeout !== null) {
			clearTimeout(pendingHoverTimeout);
			pendingHoverTimeout = null;
		}
		pendingHoverCleanup?.();
		pendingHoverCleanup = null;
	};
	const onMouseOverIllust = (target) => {
		const settings = getSettings();
		if (!settings.enablePreview || previewedIllust.oneHandedMode) return;
		const { illustId, previewPage, illustType, illustLinkDom } = getIllustMetadata(target) || {};
		if (illustId === void 0 || illustType === void 0) return;
		if (settings.linkBlank && illustLinkDom) applyArtworkLinkBlank(illustLinkDom.get(0));
		cancelPendingTrigger();
		const hoverDelay = settings.previewDelay;
		const mouseHoverPreviewWait = hoverDelay - hoverDelay / 5;
		const onMouseMove = (mouseMoveEvent) => {
			if (mouseMoveEvent.ctrlKey || mouseMoveEvent.metaKey) cancelPendingTrigger();
		};
		const onMouseOut = () => {
			cancelPendingTrigger();
		};
		target.on("mousemove", onMouseMove);
		target.on("mouseout", onMouseOut);
		pendingHoverCleanup = () => {
			target.off("mousemove", onMouseMove);
			target.off("mouseout", onMouseOut);
		};
		pendingHoverTimeout = setTimeout(() => {
			cancelPendingTrigger();
			if (!getSettings().enablePreview || previewedIllust.oneHandedMode) return;
			previewIllust.trigger({
				target,
				illustId,
				previewPage,
				illustType
			});
		}, mouseHoverPreviewWait);
	};
	const debouncedOnMouseOverIllust = debounce(onMouseOverIllust, () => getSettings().previewDelay / 5);
	let prevTarget = null;
	const cancelAllHoverTimers = () => {
		debouncedOnMouseOverIllust.cancel();
		cancelPendingTrigger();
	};
	const onMouseMoveDocument = (mouseMoveEvent) => {
		const settings = getSettings();
		if (!settings.enablePreview && !settings.linkBlank) {
			prevTarget = null;
			return;
		}
		if (previewedIllust.oneHandedMode || mouseMoveEvent.ctrlKey || mouseMoveEvent.metaKey) return;
		if (mouseMoveEvent.target === prevTarget) return;
		prevTarget = mouseMoveEvent.target;
		const currentTarget = $(mouseMoveEvent.target);
		if (settings.linkBlank) {
			const link = getArtworkAnchor(currentTarget);
			if (link) applyArtworkLinkBlank(link);
		}
		if (!settings.enablePreview) return;
		debouncedOnMouseOverIllust(currentTarget);
	};
	$(document).on("mousemove", onMouseMoveDocument);
	subscribeSettings((next, prev) => {
		if (next.previewPreloadCount !== prev.previewPreloadCount) decodedPreviewImages.setMaxSize(next.previewPreloadCount * 2);
		if (next.previewCacheMaxEntries !== prev.previewCacheMaxEntries) previewIllust.setCacheMaxEntries(next.previewCacheMaxEntries);
		if (next.linkBlank !== prev.linkBlank) syncArtworkLinksBlank(next.linkBlank);
		if (!next.enablePreview && prev.enablePreview) {
			cancelAllHoverTimers();
			previewIllust.cancel();
			previewedIllust.reset();
			prevTarget = null;
			return;
		}
		if (next.enablePreview && !prev.enablePreview) prevTarget = null;
		if (next.previewDelay !== prev.previewDelay) {
			cancelAllHoverTimers();
			prevTarget = null;
		}
		if (!next.enableAnimePreview && prev.enableAnimePreview && previewedIllust.isUgoiraActive()) {
			previewIllust.cancel();
			previewedIllust.reset();
		}
	});
	(function inactiveUnexpectedDoms() {
		injectStyle(`
@keyframes pp-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes pp-one-handed-progress {
  to { stroke-dashoffset: 0; }
}
._layout-thumbnail img + div {
  pointer-events: none;
}
pixiv-icon[name="24/Play"] {
  pointer-events: none;
}`, PREVIEW_STYLE_ID);
	})();
	isInitialized$1 = true;
};
const DETAIL_BADGE_CSS = {
	height: "20px",
	"border-radius": "12px",
	color: "rgb(245, 245, 245)",
	background: "rgba(0, 0, 0, 0.32)",
	"font-size": "12px",
	"line-height": "1",
	"font-weight": "bold",
	padding: "3px 6px",
	display: "flex",
	"align-items": "center",
	gap: "4px"
};
/** 预览容器顶部工具栏中可交互徽章（页码 / 下载按钮）的通用样式 */
const INTERACTIVE_BADGE_CSS = {
	...DETAIL_BADGE_CSS,
	cursor: "pointer"
};
var PreviewedIllust = class {
	oneHandedMode = false;
	#longPressTimeout = null;
	#longPressProgress = $();
	#suppressLongPressClick = false;
	/** 当前正在预览的作品的 ID */
	illustId = "";
	/** 当前正在预览的作品的详细信息 */
	illustDetails = null;
	/** 当前正在预览的作品 DOM 元素 */
	illustElement = $();
	/** 当前预览的作品是否加载完毕 */
	illustLoaded = false;
	/** 图片的链接 */
	regularUrls = [];
	/** 图片的原图链接 */
	originalUrls = [];
	/** 当前预览图片的页数 */
	currentPage = 1;
	/** 当前预览图片的总页数 */
	pageCount = 1;
	/** 预览图片或动图容器 DOM */
	previewWrapperElement = $();
	/** 预览容器顶部栏 DOM */
	previewWrapperHeader = $();
	/** 当前预览作品的元数据 */
	illustMeta = $();
	/** 当前预览的是第几张图片标记 DOM */
	pageCountElement = $();
	pageCountText = $();
	/** 下载原图按钮 DOM */
	downloadOriginalElement = $();
	/** 预览图片或动图加载状态 DOM */
	previewLoadingElement = $();
	/** 翻页加载新图片时覆盖在图片上方的毛玻璃遮罩 DOM */
	pageLoadingOverlayElement = $();
	/** 当前预览的图片或动图 DOM */
	previewImageElement = $();
	/** 当前页面中各多图作品上次预览的页码，重置预览组件时保留 */
	#previewPages = /* @__PURE__ */ new Map();
	/** 下载按钮重置定时器 */
	#downloadResetTimeout = null;
	/** 翻页加载遮罩的延迟显示定时器 */
	#pageLoadingOverlayTimeout = null;
	/** 当前页图片是否仍在加载（用于判断遮罩是否需要常驻） */
	#isPageImageLoading = false;
	/** 保存的鼠标位置 */
	#prevMousePos = [0, 0];
	/** 当前预览图片的实际尺寸 */
	#currentIllustSize = [0, 0];
	/** 当前预览的动图播放器 */
	#currentUgoiraPlayer = null;
	/** 当前预览是否属于动图（含等待元数据与帧缓存期间） */
	#isUgoira = false;
	/** 预览窗口是否已由 `showLoading` 提前展示、尚未填入内容 */
	#isPlaceholder = false;
	/** 预览窗口的鼠标事件是否已绑定，避免重复绑定 */
	#mouseEventsBound = false;
	constructor() {
		this.reset();
	}
	/** 初始化预览组件 */
	reset() {
		this.oneHandedMode = false;
		this.#suppressLongPressClick = false;
		this.cancelLongPress();
		this.illustId = "";
		this.illustDetails = null;
		this.illustElement = $();
		this.illustLoaded = false;
		this.#isUgoira = false;
		this.#isPlaceholder = false;
		this.regularUrls = [];
		this.originalUrls = [];
		this.currentPage = 1;
		this.pageCount = 1;
		this.#destroyWrapperDom();
		this.#prevMousePos = [0, 0];
		this.#currentIllustSize = [0, 0];
		this.#currentUgoiraPlayer?.stop();
		this.#currentUgoiraPlayer = null;
		if (this.#downloadResetTimeout !== null) {
			clearTimeout(this.#downloadResetTimeout);
			this.#downloadResetTimeout = null;
		}
		this.#clearPageLoadingOverlayTimeout();
		this.#isPageImageLoading = false;
		this.unbindPreviewImageEvents();
		this.unbindUgoiraPreviewEvents();
		this.unbindPreviewMouseEvents();
	}
	/** 移除预览容器节点，重置时不立即重建 */
	#destroyWrapperDom() {
		this.previewWrapperElement?.remove();
		this.previewWrapperElement = $();
		this.previewWrapperHeader = $();
		this.illustMeta = $();
		this.pageCountElement = $();
		this.pageCountText = $();
		this.downloadOriginalElement = $();
		this.previewLoadingElement = $();
		this.pageLoadingOverlayElement = $();
		this.previewImageElement = $();
	}
	/**
	* 创建预览容器节点。
	* 延迟到真正需要显示预览时才创建，使初始化不再依赖 `body` 是否已存在。
	*/
	#ensureWrapperDom() {
		if (this.previewWrapperElement.length) return;
		this.previewWrapperElement = $(document.createElement("div")).attr({ id: "pp-wrapper" }).css({
			position: "fixed",
			"z-index": "999999",
			border: `${2}px solid rgb(0, 150, 250)`,
			"border-radius": `${8}px`,
			background: "rgba(31, 31, 31, 0.8)",
			"backdrop-filter": "blur(4px)",
			"text-align": "center",
			"pointer-events": "none"
		}).hide().appendTo($("body"));
		this.previewWrapperHeader = $(document.createElement("div")).css({
			position: "absolute",
			top: "0px",
			left: "0px",
			right: "0px",
			padding: "5px",
			display: "flex",
			gap: "5px",
			"align-items": "center",
			"z-index": "2"
		}).hide().appendTo(this.previewWrapperElement);
		this.illustMeta = $(document.createElement("div")).css({
			display: "flex",
			gap: "5px",
			"align-items": "center",
			"margin-right": "auto"
		}).appendTo(this.previewWrapperHeader);
		this.pageCountText = $(document.createElement("span")).text("1/1");
		this.pageCountElement = $(document.createElement("div")).css(INTERACTIVE_BADGE_CSS).append(page_default).append(this.pageCountText).hide().appendTo(this.previewWrapperHeader);
		this.downloadOriginalElement = $(document.createElement("a")).css(INTERACTIVE_BADGE_CSS).append(`${download_default}<span>原图</span>`).appendTo(this.previewWrapperHeader);
		this.previewLoadingElement = createLoadingSpinner().appendTo(this.previewWrapperElement);
		this.previewImageElement = $(new Image()).css({ "border-radius": `${8}px` }).hide().appendTo(this.previewWrapperElement);
		this.pageLoadingOverlayElement = $(document.createElement("div")).css({
			position: "absolute",
			top: "0px",
			left: "0px",
			right: "0px",
			bottom: "0px",
			"z-index": "1",
			display: "flex",
			"align-items": "center",
			"justify-content": "center",
			"border-radius": `${8}px`,
			background: "rgba(31, 31, 31, 0.32)",
			"backdrop-filter": "blur(4px)",
			"pointer-events": "none"
		}).hide().append(createLoadingSpinner()).appendTo(this.previewWrapperElement);
	}
	/**
	* 立即显示预览窗口并停留在加载状态。
	* 缓存未命中时先开窗再发请求，避免窗口要等到数据全部就绪才出现。
	* 若当前窗口已在展示同一个作品，则不做任何处理，避免反复重置打断已显示的内容。
	*/
	showLoading({ illustId, illustElement, isUgoira = false }) {
		if (this.isActiveIllust(illustId)) return;
		this.reset();
		this.initPreviewWrapper();
		this.illustId = illustId;
		this.illustElement = illustElement;
		this.#isUgoira = isUgoira;
		this.#isPlaceholder = true;
		this.bindPreviewMouseEvents();
	}
	/**
	* 指定作品的内容仍停留在加载状态时关闭窗口，避免请求或初始化失败后一直转圈。
	* 已经显示出内容（或已有静态插画在预览）时不做处理，避免把正常显示中的预览关掉。
	*/
	dismissLoading(illustId) {
		if (this.illustId === illustId && !this.illustLoaded && this.regularUrls.length === 0) this.reset();
	}
	/**
	* 预览窗口当前是否仍在展示（或正在加载）指定作品。
	* 异步回调返回时用它校验，避免鼠标已移开、窗口已关闭后又把窗口重新打开。
	* 以 `illustId` 作为唯一事实：`reset()` 会把它清空。
	*/
	isActiveIllust(illustId) {
		return this.illustId === illustId;
	}
	/** 当前是否正在加载或展示动图预览 */
	isUgoiraActive() {
		if (!this.illustId) return false;
		if (this.#isUgoira || this.#currentUgoiraPlayer || this.previewImageElement.is("canvas")) return true;
		return Boolean(this.illustDetails && (checkIsUgoira(this.illustDetails.type) || checkIsUgoiraUsingTags(this.illustDetails.tags)));
	}
	/**
	* 准备预览窗口并接管占位或静态预览状态。
	* 同一个作品仍在展示时直接复用其 DOM 节点，避免关闭窗口造成闪烁或打断展示。
	*/
	#prepareWrapper(illustId) {
		if (this.isActiveIllust(illustId)) {
			this.#isPlaceholder = false;
			return;
		}
		this.reset();
		this.initPreviewWrapper();
	}
	/** 初始化预览容器，优先显示指定页码，其次恢复当前页面中记忆的预览页码 */
	setImage({ illustId, illustElement, previewPage, regularUrls, originalUrls, illustrationDetails }) {
		if (this.isActiveIllust(illustId) && !this.#isPlaceholder) {
			if (illustrationDetails && !this.illustDetails) this.updateIllustrationDetails(illustrationDetails);
			return;
		}
		this.#prepareWrapper(illustId);
		this.illustId = illustId;
		this.illustDetails = illustrationDetails;
		this.illustElement = illustElement;
		this.regularUrls = regularUrls;
		this.originalUrls = originalUrls;
		this.pageCount = regularUrls.length;
		const initialPage = previewPage ?? this.#previewPages.get(illustId) ?? 1;
		this.currentPage = initialPage >= 1 && initialPage <= this.pageCount ? initialPage : 1;
		this.preloadImages();
		this.bindPreviewImageEvents();
		this.updatePreviewImage();
		this.renderIllustrationDetails(illustrationDetails);
	}
	bindPreviewImageEvents() {
		this.unbindPreviewImageEvents();
		this.previewImageElement.on("load", this.onImageLoad);
		this.previewImageElement.on("error", this.onImageError);
		this.previewImageElement.on("click", this.onPreviewImageMouseClick);
		this.downloadOriginalElement.on("click", this.onDownloadImage);
		$(document).on("wheel", this.onPreviewImageMouseWheel);
		$(document).on("keydown", this.onPreviewImageKeyDown);
		this.bindPreviewMouseEvents();
	}
	unbindPreviewImageEvents() {
		this.previewImageElement.off();
		this.downloadOriginalElement.off();
		$(document).off("wheel", this.onPreviewImageMouseWheel);
		$(document).off("keydown", this.onPreviewImageKeyDown);
	}
	/** 显示 pageIndex 指向的图片 */
	updatePreviewImage(page = this.currentPage) {
		const currentImageUrl = this.regularUrls[page - 1];
		const isSameImage = this.previewImageElement.attr("src") === currentImageUrl;
		if (this.illustLoaded && !isSameImage && !this.#isPageImageDecoded(page)) {
			this.#isPageImageLoading = true;
			this.#schedulePageLoadingOverlay();
		} else this.#finishPageLoading();
		this.previewImageElement.attr("src", currentImageUrl);
		this.pageCountText.text(`${page}/${this.pageCount}`);
		if (this.pageCount > 1) this.#previewPages.set(this.illustId, page);
	}
	/** 延迟显示翻页加载遮罩，图片在延迟内就绪时不显示，避免闪烁 */
	#schedulePageLoadingOverlay() {
		this.#clearPageLoadingOverlayTimeout();
		this.#pageLoadingOverlayTimeout = setTimeout(() => {
			this.#pageLoadingOverlayTimeout = null;
			if (!this.#isPageImageLoading) return;
			this.pageLoadingOverlayElement.show();
		}, getSettings().previewLoadingOverlayDelayMs);
	}
	#clearPageLoadingOverlayTimeout() {
		if (this.#pageLoadingOverlayTimeout !== null) {
			clearTimeout(this.#pageLoadingOverlayTimeout);
			this.#pageLoadingOverlayTimeout = null;
		}
	}
	/** 当前页图片已就绪（或加载失败）时收起翻页加载遮罩 */
	#finishPageLoading() {
		this.#isPageImageLoading = false;
		this.#clearPageLoadingOverlayTimeout();
		this.pageLoadingOverlayElement.hide();
	}
	onImageLoad = () => {
		this.#finishPageLoading();
		if (this.#currentUgoiraPlayer && this.previewImageElement.is("canvas")) return;
		this.illustLoaded = true;
		this.previewLoadingElement.hide();
		this.previewImageElement.show();
		this.previewWrapperHeader.show();
		const isUgoira = this.illustDetails && (checkIsUgoira(this.illustDetails.type) || checkIsUgoiraUsingTags(this.illustDetails.tags));
		if (this.pageCount > 1 && !isUgoira) this.pageCountElement.show();
		this.previewImageElement.css({
			width: "",
			height: ""
		});
		this.#currentIllustSize = [this.previewImageElement.width() ?? 0, this.previewImageElement.height() ?? 0];
		this.adjustPreviewWrapper({ baseOnMousePos: false });
	};
	onImageError = () => {
		this.#finishPageLoading();
	};
	nextPage() {
		if (this.currentPage < this.pageCount) this.currentPage += 1;
		else this.currentPage = 1;
		this.resetDownloadButton();
		this.updatePreviewImage();
		this.preloadImages();
	}
	prevPage() {
		if (this.currentPage > 1) this.currentPage -= 1;
		else this.currentPage = this.pageCount;
		this.resetDownloadButton();
		this.updatePreviewImage();
	}
	resetDownloadButton() {
		if (this.#downloadResetTimeout !== null) {
			clearTimeout(this.#downloadResetTimeout);
			this.#downloadResetTimeout = null;
		}
		this.downloadOriginalElement.find("span").text("原图");
		this.downloadOriginalElement.css({
			pointerEvents: "",
			backgroundImage: "",
			backgroundSize: "",
			backgroundRepeat: ""
		});
	}
	/** 指定页的图片是否已经预加载解码完成，可直接显示而无需等待 */
	#isPageImageDecoded(page) {
		const cachedImage = decodedPreviewImages.get(getDecodedImageCacheKey(this.illustId, page));
		return !!cachedImage?.complete && cachedImage.naturalWidth > 0;
	}
	preloadImages(from = this.currentPage - 1, to = this.currentPage - 1 + getSettings().previewPreloadCount) {
		for (let i = from; i < to && i < this.regularUrls.length; i += 1) {
			const cacheKey = getDecodedImageCacheKey(this.illustId, i + 1);
			if (decodedPreviewImages.get(cacheKey)) continue;
			const preloadImage = new Image();
			preloadImage.src = this.regularUrls[i];
			decodedPreviewImages.set(cacheKey, preloadImage);
		}
	}
	onPreviewImageMouseClick = () => {
		this.nextPage();
	};
	onPreviewImageMouseWheel = (mouseWheelEvent) => {
		if (this.oneHandedMode || mouseWheelEvent.ctrlKey || mouseWheelEvent.metaKey) {
			mouseWheelEvent.preventDefault();
			if (mouseWheelEvent.originalEvent.deltaY > 0) this.nextPage();
			else this.prevPage();
		}
	};
	onPreviewImageKeyDown = (keyDownEvent) => {
		if (this.oneHandedMode || keyDownEvent.ctrlKey || keyDownEvent.metaKey) {
			keyDownEvent.preventDefault();
			switch (keyDownEvent.key) {
				case "ArrowUp":
				case "ArrowRight":
					this.nextPage();
					break;
				case "ArrowDown":
				case "ArrowLeft": this.prevPage();
			}
		}
	};
	onDownloadImage = (onClickEvent) => {
		onClickEvent.preventDefault();
		const downloadPage = this.currentPage;
		const currentImageOriginalUrl = this.originalUrls[downloadPage - 1];
		const currentImageFilename = sanitizeIllustFilename(currentImageOriginalUrl.split("/").pop() || "illust.jpg");
		const textSpan = this.downloadOriginalElement.find("span");
		const originalText = textSpan.text();
		const downloadElement = this.downloadOriginalElement;
		const onDownloadFailed = () => {
			if (this.downloadOriginalElement !== downloadElement) return;
			textSpan.text(originalText);
			downloadElement.css({
				backgroundImage: "",
				backgroundSize: "",
				pointerEvents: ""
			});
		};
		this.downloadOriginalElement.css({
			pointerEvents: "none",
			backgroundImage: "linear-gradient(to right, rgba(0,150,250,0.28), rgba(0,150,250,0.28))",
			backgroundSize: "0% 100%",
			backgroundRepeat: "no-repeat"
		});
		textSpan.text("下载中");
		downloadIllust({
			url: currentImageOriginalUrl,
			filename: currentImageFilename,
			directory: getDownloadDirectory(this.illustDetails?.tags ?? []),
			options: {
				onerror: onDownloadFailed,
				ontimeout: onDownloadFailed,
				onabort: onDownloadFailed,
				onprogress: (ev) => {
					if (this.downloadOriginalElement !== downloadElement || this.currentPage !== downloadPage) return;
					try {
						const loaded = ev.loaded ?? 0;
						const total = ev.total ?? 0;
						let percent = 0;
						if (total && total > 0) percent = Math.min(100, Math.round(loaded / total * 100));
						this.downloadOriginalElement.css({ backgroundSize: `${percent}% 100%` });
					} catch (e) {
						console.error(`An error occurred in download progress callback: ${e}`);
					}
				},
				onload: () => {
					if (this.downloadOriginalElement !== downloadElement || this.currentPage !== downloadPage) return;
					textSpan.text("已下载");
					this.downloadOriginalElement.css({
						backgroundImage: "",
						backgroundSize: "",
						pointerEvents: ""
					});
					this.#downloadResetTimeout = setTimeout(() => {
						textSpan.text(originalText);
						this.#downloadResetTimeout = null;
					}, getSettings().previewDownloadNoticeMs);
				}
			}
		});
	};
	setUgoira({ illustId, illustElement, src, mime_type, frames, illustrationDetails }) {
		if (this.isActiveIllust(illustId) && this.#currentUgoiraPlayer) {
			if (illustrationDetails && !this.illustDetails) this.updateIllustrationDetails(illustrationDetails);
			return;
		}
		const isSwitchingFromImage = this.illustId === illustId && !this.#isPlaceholder && this.previewImageElement.length > 0;
		this.#prepareWrapper(illustId);
		this.illustId = illustId;
		this.#isUgoira = true;
		if (illustrationDetails) this.illustDetails = illustrationDetails;
		this.illustElement = illustElement;
		illustElement.siblings("svg").css({ "pointer-events": "none" });
		if (isSwitchingFromImage) {
			this.#clearPageLoadingOverlayTimeout();
			this.#finishPageLoading();
			this.pageCountElement.hide();
			this.downloadOriginalElement.hide();
			$(document).off("wheel", this.onPreviewImageMouseWheel);
			$(document).off("keydown", this.onPreviewImageKeyDown);
			this.previewImageElement.off("click", this.onPreviewImageMouseClick);
			this.downloadOriginalElement.off("click", this.onDownloadImage);
		}
		this.bindPreviewMouseEvents();
		this.loadUgoiraPlayer({
			illustId,
			src,
			mime_type,
			frames
		});
		this.renderIllustrationDetails(this.illustDetails);
	}
	/**
	* 先查询帧缓存，再决定使用缓存帧还是解包 zip。
	* 解包到全部帧时把帧写入缓存，供下次悬停时直接播放。
	*/
	async loadUgoiraPlayer({ illustId, src, mime_type, frames }) {
		const cached = await getCachedUgoiraFrames(illustId).catch(() => null);
		if (!getSettings().enableAnimePreview) {
			this.dismissLoading(illustId);
			return;
		}
		if (this.illustId !== illustId || this.#currentUgoiraPlayer) return;
		const decodedFrames = [];
		let decodedFrameCount = 0;
		const hasCachedFrames = cached?.frames.length === frames.length;
		try {
			this.#currentUgoiraPlayer = this.createUgoiraPlayer({
				source: src,
				metadata: {
					mime_type,
					frames
				},
				cachedFrames: hasCachedFrames ? cached.frames.map((frame) => frame.blob) : null,
				onFrameDecoded: ({ index, file, delay, blob }) => {
					decodedFrames[index] = {
						file,
						delay,
						blob
					};
					decodedFrameCount += 1;
					if (decodedFrameCount < frames.length) return;
					cacheUgoiraFrames(illustId, decodedFrames);
				}
			});
		} catch (error) {
			iLog.e(`Failed to create ugoira player of illust ${illustId}:`, error);
			if (this.#isPlaceholder || !this.illustLoaded) this.dismissLoading(illustId);
			return;
		}
		this.bindUgoiraPreviewEvents();
	}
	createUgoiraPlayer(options) {
		const { ugoiraChunkBytes, ugoiraTrailerBytes } = getSettings();
		const canvas = document.createElement("canvas");
		return new ZipImagePlayer({
			canvas,
			chunkSize: ugoiraChunkBytes,
			trailerBytes: ugoiraTrailerBytes,
			loop: true,
			autoStart: true,
			debug: false,
			...options
		});
	}
	bindUgoiraPreviewEvents() {
		this.unbindUgoiraPreviewEvents();
		this.#currentUgoiraPlayer?.on("frameLoaded", this.onUgoiraFrameLoaded);
		this.bindPreviewMouseEvents();
	}
	unbindUgoiraPreviewEvents() {
		this.#currentUgoiraPlayer?.off("frameLoaded");
	}
	onUgoiraFrameLoaded = (frame) => {
		if (frame !== 0 || !this.#currentUgoiraPlayer || !this.illustId) return;
		this.illustLoaded = true;
		this.previewLoadingElement.hide();
		this.previewWrapperHeader.show();
		const canvas = $(this.#currentUgoiraPlayer.canvas);
		canvas.css({ "border-radius": `${8}px` });
		this.previewImageElement.off("load error click");
		this.previewImageElement.after(canvas);
		this.previewImageElement.remove();
		this.previewImageElement = canvas;
		const frameImages = this.#currentUgoiraPlayer.getLoadedFrameImages();
		const ugoiraOriginWidth = frameImages[0]?.width ?? 0;
		const ugoiraOriginHeight = frameImages[0]?.height ?? 0;
		this.#currentIllustSize = [ugoiraOriginWidth, ugoiraOriginHeight];
		this.previewImageElement.attr({
			width: ugoiraOriginWidth,
			height: ugoiraOriginHeight
		});
		this.adjustPreviewWrapper({ baseOnMousePos: false });
	};
	/**
	* 补渲染作品详情。
	* 预览窗口会在作品详情返回前就打开，因此详情是异步补上的；
	* 期间用户可能已切换到其他作品，需要校验 ID 避免渲染到错误的窗口。
	*/
	updateIllustrationDetails(illustrationDetails) {
		if (!illustrationDetails || illustrationDetails.id !== this.illustId) return;
		this.illustDetails = illustrationDetails;
		this.renderIllustrationDetails(illustrationDetails);
	}
	/** 展示作品详情信息（标签、收藏数等） */
	renderIllustrationDetails(illustrationDetails) {
		if (illustrationDetails && illustrationDetails.id === this.illustId) {
			this.illustMeta.empty();
			const { aiType, bookmarkId, bookmarkUserTotal, tags, type } = illustrationDetails;
			const isR18 = checkIsR18(tags);
			const isR18G = checkIsR18G(tags);
			const isUgoira = checkIsUgoira(type) || checkIsUgoiraUsingTags(tags);
			const isAi = checkIsAiGenerated(aiType);
			const isAiAssisted = checkIsAiAssisted(tags);
			const illustrationDetailsElements = [];
			if (isR18 || isR18G) illustrationDetailsElements.push($(document.createElement("div")).css({
				...DETAIL_BADGE_CSS,
				background: "rgb(255, 64, 96)"
			}).text(isR18G ? "R-18G" : "R-18"));
			if (isUgoira) {
				this.downloadOriginalElement.hide();
				this.pageCountElement.hide();
				illustrationDetailsElements.push($(document.createElement("div")).css({
					...DETAIL_BADGE_CSS,
					background: "rgb(14, 116, 144)"
				}).text("动图"));
			}
			if (isAi) illustrationDetailsElements.push($(document.createElement("div")).css({
				...DETAIL_BADGE_CSS,
				background: "rgb(162, 28, 175)"
			}).text("AI 生成"));
			else if (isAiAssisted) illustrationDetailsElements.push($(document.createElement("div")).css({
				...DETAIL_BADGE_CSS,
				background: "rgb(109, 40, 217)"
			}).text("AI 辅助"));
			illustrationDetailsElements.push($(document.createElement("div")).css({
				...DETAIL_BADGE_CSS,
				background: bookmarkUserTotal > 5e4 ? "rgb(159, 18, 57)" : bookmarkUserTotal > 1e4 ? "rgb(220, 38, 38)" : bookmarkUserTotal > 5e3 ? "rgb(29, 78, 216)" : bookmarkUserTotal > 1e3 ? "rgb(21, 128, 61)" : "rgb(71, 85, 105)"
			}).text(`${bookmarkId ? "❤️" : "❤"} ${bookmarkUserTotal}`));
			this.illustMeta.append(illustrationDetailsElements);
		}
	}
	/** 初始化显示预览容器 */
	initPreviewWrapper() {
		this.#ensureWrapperDom();
		this.previewWrapperElement.show();
		this.previewLoadingElement.show();
		this.adjustPreviewWrapper({ baseOnMousePos: true });
	}
	bindPreviewMouseEvents() {
		if (this.#mouseEventsBound) return;
		this.#mouseEventsBound = true;
		$(document).on("mousemove", this.onMouseMove);
		document.addEventListener("keydown", this.onPreviewKeyDown);
		document.addEventListener("mousedown", this.onMouseDown, true);
		document.addEventListener("mouseup", this.cancelLongPress, true);
		document.addEventListener("click", this.onDocumentClick, true);
		document.addEventListener("dragstart", this.cancelLongPress, true);
		document.addEventListener("mouseleave", this.cancelLongPress);
		window.addEventListener("blur", this.cancelLongPress);
		window.addEventListener("wheel", this.preventPageZoom, { passive: false });
	}
	unbindPreviewMouseEvents() {
		this.#mouseEventsBound = false;
		this.cancelLongPress();
		$(document).off("mousemove", this.onMouseMove);
		document.removeEventListener("keydown", this.onPreviewKeyDown);
		document.removeEventListener("mousedown", this.onMouseDown, true);
		document.removeEventListener("mouseup", this.cancelLongPress, true);
		document.removeEventListener("click", this.onDocumentClick, true);
		document.removeEventListener("dragstart", this.cancelLongPress, true);
		document.removeEventListener("mouseleave", this.cancelLongPress);
		window.removeEventListener("blur", this.cancelLongPress);
		window.removeEventListener("wheel", this.preventPageZoom);
	}
	onPreviewKeyDown = (event) => {
		if (event.key === "Escape" && this.oneHandedMode) this.reset();
	};
	onMouseDown = (event) => {
		if (event.button !== 0) return;
		this.#suppressLongPressClick = false;
		const targetLink = this.illustElement.closest("a");
		const isTargetIllust = this.illustElement.is(event.target) || targetLink.length > 0 && (targetLink.is(event.target) || targetLink.has(event.target).length > 0);
		if (this.oneHandedMode || !isTargetIllust) return;
		this.cancelLongPress();
		const holdMs = getSettings().previewHoldMs;
		this.#longPressProgress = $(`<svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="12" fill="none"
          stroke="rgba(0, 0, 0, 0.35)" stroke-width="4" />
        <circle cx="16" cy="16" r="12" fill="none"
          stroke="rgb(0, 150, 250)" stroke-width="4" stroke-linecap="round"
          pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"
          transform="rotate(-90 16 16)"
          style="animation: pp-one-handed-progress ${holdMs}ms linear forwards" />
      </svg>`).css({
			position: "fixed",
			left: `${event.clientX - 16}px`,
			top: `${event.clientY - 16}px`,
			width: "32px",
			height: "32px",
			"z-index": "1000000",
			"pointer-events": "none"
		}).appendTo(document.body);
		this.#longPressTimeout = setTimeout(() => {
			this.oneHandedMode = true;
			this.#suppressLongPressClick = true;
			this.previewWrapperElement.css({ "pointer-events": "auto" });
			this.cancelLongPress();
		}, holdMs);
	};
	cancelLongPress = () => {
		if (this.#longPressTimeout !== null) {
			clearTimeout(this.#longPressTimeout);
			this.#longPressTimeout = null;
		}
		this.#longPressProgress.remove();
		this.#longPressProgress = $();
	};
	onDocumentClick = (event) => {
		if (!event.isTrusted) return;
		if (this.#suppressLongPressClick) {
			this.#suppressLongPressClick = false;
			event.preventDefault();
			event.stopImmediatePropagation();
			return;
		}
		if (this.oneHandedMode && !this.previewWrapperElement[0]?.contains(event.target)) this.reset();
	};
	/** 阻止页面缩放事件 */
	preventPageZoom = (mouseWheelEvent) => {
		if (this.oneHandedMode || mouseWheelEvent.ctrlKey || mouseWheelEvent.metaKey) mouseWheelEvent.preventDefault();
	};
	/**
	* 根据鼠标移动调整预览容器位置与显隐
	* @param mouseMoveEvent
	*/
	onMouseMove = (mouseMoveEvent) => {
		if (this.#longPressTimeout !== null) this.#longPressProgress.css({
			left: `${mouseMoveEvent.clientX - 16}px`,
			top: `${mouseMoveEvent.clientY - 16}px`
		});
		if (this.oneHandedMode || mouseMoveEvent.ctrlKey || mouseMoveEvent.metaKey) {
			this.previewWrapperElement.css({ "pointer-events": "auto" });
			return;
		}
		this.previewWrapperElement.css({ "pointer-events": "none" });
		const currentElement = $(mouseMoveEvent.target);
		const targetLink = this.illustElement.closest("a");
		if (currentElement.is(this.illustElement) || targetLink.length > 0 && (currentElement.is(targetLink) || targetLink.has(currentElement[0]).length > 0)) this.adjustPreviewWrapper({ baseOnMousePos: true });
		else this.reset();
	};
	/**
	* 调整预览容器的位置与大小
	* @param `baseOnMousePos` 是否根据当前鼠标所在位置调整
	* @param `illustSize` 作品的实际大小
	*/
	adjustPreviewWrapper({ baseOnMousePos = true } = {}) {
		const [mousePosX, mousePosY] = baseOnMousePos ? mouseMonitor.mouseAbsPos : this.#prevMousePos;
		this.#prevMousePos = [mousePosX, mousePosY];
		const [illustWidth, illustHeight] = this.#currentIllustSize;
		const screenWidth = document.documentElement.clientWidth;
		const screenHeight = document.documentElement.clientHeight;
		const DIST = 20;
		if (!illustWidth || !illustHeight) {
			const defaultPos = {
				left: `${mousePosX + DIST}px`,
				top: `${mousePosY}px`
			};
			this.previewWrapperElement.css(defaultPos);
			this.previewImageElement.css({
				width: "",
				height: ""
			});
			return;
		}
		const candidates = [
			{
				side: "left",
				availW: Math.max(0, mousePosX - DIST),
				availH: screenHeight
			},
			{
				side: "right",
				availW: Math.max(0, screenWidth - mousePosX - DIST),
				availH: screenHeight
			},
			{
				side: "top",
				availW: screenWidth,
				availH: Math.max(0, mousePosY - DIST)
			},
			{
				side: "bottom",
				availW: screenWidth,
				availH: Math.max(0, screenHeight - mousePosY - DIST)
			}
		];
		let best = null;
		for (const c of candidates) {
			let scale = 1;
			if (this.illustLoaded) {
				const sx = c.availW / illustWidth;
				const sy = c.availH / illustHeight;
				scale = Number(Math.min(sx, sy).toFixed(3));
			}
			const fitW = Math.max(0, Math.floor(illustWidth * scale));
			const fitH = Math.max(0, Math.floor(illustHeight * scale));
			const area = fitW * fitH;
			if (!best || area > best.area) best = {
				side: c.side,
				fitW,
				fitH,
				area
			};
		}
		const previewImageFitWidth = best?.fitW ?? 0;
		const previewImageFitHeight = best?.fitH ?? 0;
		const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
		const side = best?.side ?? "bottom";
		const isHorizontal = side === "left" || side === "right";
		const anchorX = isHorizontal ? side === "right" ? mousePosX + DIST : mousePosX - DIST - previewImageFitWidth : Math.floor(mousePosX - previewImageFitWidth / 2);
		const anchorY = isHorizontal ? Math.floor(mousePosY - previewImageFitHeight / 2) : side === "bottom" ? mousePosY + DIST : mousePosY - DIST - previewImageFitHeight;
		const left = clamp(anchorX, 0, Math.max(0, screenWidth - previewImageFitWidth));
		const top = clamp(anchorY, 0, Math.max(0, screenHeight - previewImageFitHeight));
		this.previewWrapperElement.css({
			left: `${left}px`,
			top: `${top}px`,
			right: "",
			bottom: ""
		});
		this.previewImageElement.css({
			width: `${previewImageFitWidth}px`,
			height: `${previewImageFitHeight}px`
		});
	}
};

// src/icons/restore-default.svg
var restore_default_default = "<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n  aria-hidden=\"true\"\n  focusable=\"false\"\n>\n  <path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" />\n  <path d=\"M3 3v5h5\" />\n  <circle cx=\"12\" cy=\"12\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\" />\n</svg>";

// src/icons/undo.svg
var undo_default = "<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n  aria-hidden=\"true\"\n  focusable=\"false\"\n>\n  <path d=\"M9 14 4 9l5-5\" />\n  <path d=\"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11\" />\n</svg>";

// src/features/settings-panel.ts
const PANEL_ID = "pp-settings-panel";
const HEADING_ID = "pp-settings-heading";
const createInitialDraft = (baseline) => {
	const draft = {};
	for (const descriptor of SETTING_FIELDS) draft[descriptor.key] = formatSettingInputValue(descriptor, baseline[descriptor.key]);
	return draft;
};
/**
* 隔离面板草稿与运行中配置的状态会话。
* 保留明确编辑过的字段，使其在远程同步时不被覆盖，并在保存时与最新持久化配置合并。
*/
const createSettingsDraftSession = (initialBaseline = getSettings(), persist = saveUserSettings) => {
	let baseline = { ...initialBaseline };
	let draftRaw = createInitialDraft(baseline);
	const editedKeys = /* @__PURE__ */ new Set();
	const getBaselineFormatted = (key) => formatSettingInputValue(SETTING_FIELD_MAP[key], baseline[key]);
	const getDefaultFormatted = (key) => formatSettingInputValue(SETTING_FIELD_MAP[key], g_defaultSettings[key]);
	const isFieldModified = (key) => draftRaw[key] !== getBaselineFormatted(key);
	const isFieldDefault = (key) => draftRaw[key] === getDefaultFormatted(key);
	return {
		getBaseline: () => ({ ...baseline }),
		getDraftValue: (key) => draftRaw[key],
		getEditedKeys: () => editedKeys,
		isFieldModified,
		isFieldDefault,
		hasModifiedFields: () => SETTING_FIELDS.some((field) => isFieldModified(field.key)),
		setInput: (key, value) => {
			draftRaw[key] = value;
			if (value === getBaselineFormatted(key)) editedKeys.delete(key);
			else editedKeys.add(key);
		},
		revertField: (key) => {
			const previousValue = getBaselineFormatted(key);
			draftRaw[key] = previousValue;
			editedKeys.delete(key);
			return previousValue;
		},
		restoreField: (key) => {
			const descriptor = SETTING_FIELD_MAP[key];
			const defaultFormatted = formatSettingInputValue(descriptor, g_defaultSettings[key]);
			draftRaw[key] = defaultFormatted;
			editedKeys.add(key);
			return draftRaw[key];
		},
		restoreAll: () => {
			for (const descriptor of SETTING_FIELDS) {
				draftRaw[descriptor.key] = formatSettingInputValue(descriptor, g_defaultSettings[descriptor.key]);
				editedKeys.add(descriptor.key);
			}
			return { ...draftRaw };
		},
		applyRemoteUpdate: (remoteSettings) => {
			baseline = { ...remoteSettings };
			const updatedKeys = [];
			for (const descriptor of SETTING_FIELDS) {
				if (editedKeys.has(descriptor.key)) continue;
				draftRaw[descriptor.key] = formatSettingInputValue(descriptor, remoteSettings[descriptor.key]);
				updatedKeys.push(descriptor.key);
			}
			return updatedKeys;
		},
		save: () => {
			const parseErrors = [];
			const parsedAll = {};
			for (const descriptor of SETTING_FIELDS) {
				const parsed = parseSettingInput(descriptor, draftRaw[descriptor.key]);
				if (!parsed.ok) parseErrors.push({
					key: descriptor.key,
					message: parsed.message
				});
				else parsedAll[descriptor.key] = parsed.value;
			}
			if (parseErrors.length > 0) return {
				ok: false,
				errors: parseErrors
			};
			const edits = {};
			for (const key of editedKeys) edits[key] = parsedAll[key];
			const result = persist(edits);
			if (result.ok) {
				baseline = { ...result.settings };
				draftRaw = createInitialDraft(baseline);
				editedKeys.clear();
			}
			return result;
		}
	};
};
const injectSettingsPanelStyles = () => {
	injectStyle(`
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
    `, SETTINGS_STYLE_ID);
};
let activePanel = null;
let openScheduled = false;
const getFieldDomId = (key) => `pp-setting-${key}`;
const createFieldRow = (descriptor, session, onFieldChange) => {
	const inputId = getFieldDomId(descriptor.key);
	const descId = `${inputId}-desc`;
	const errorId = `${inputId}-err`;
	const row = $("<div>").addClass("pp-settings-field").attr({
		"data-setting-key": descriptor.key,
		"data-control": descriptor.control
	});
	const mainRow = $("<div>").addClass("pp-settings-row");
	const label = $("<label>").addClass("pp-settings-label").attr("for", inputId).text(descriptor.label);
	const controlWrap = $("<div>").addClass("pp-settings-control");
	let input;
	const initialValue = session.getDraftValue(descriptor.key);
	if (descriptor.control === "boolean") input = $("<input>").attr({
		id: inputId,
		type: "checkbox",
		"aria-describedby": descId
	}).prop("checked", Boolean(initialValue)).on("change", () => {
		session.setInput(descriptor.key, Boolean(input.prop("checked")));
		onFieldChange(descriptor.key);
	});
	else if (descriptor.control === "select") {
		const select = $("<select>").attr({
			id: inputId,
			"aria-describedby": descId
		});
		for (const option of descriptor.options ?? []) $("<option>").val(String(option.value)).text(option.label).appendTo(select);
		select.val(String(initialValue)).on("change", () => {
			session.setInput(descriptor.key, String(select.val() ?? ""));
			onFieldChange(descriptor.key);
		});
		input = select;
	} else {
		const isNumber = descriptor.control === "number";
		input = $("<input>").attr({
			id: inputId,
			type: "text",
			inputmode: isNumber ? descriptor.integer ? "numeric" : "decimal" : "text",
			placeholder: descriptor.placeholder ?? "",
			"aria-describedby": descId
		}).val(String(initialValue)).on("input", () => {
			session.setInput(descriptor.key, String(input.val() ?? ""));
			onFieldChange(descriptor.key);
		});
	}
	const restoreOneButton = $("<button>").attr({
		type: "button",
		title: Texts.settings_restoreDefault,
		"aria-label": `${Texts.settings_restoreDefault}：${descriptor.label}`
	}).addClass("pp-settings-icon-btn pp-settings-reset-one").html(restore_default_default).prop("hidden", session.isFieldDefault(descriptor.key)).on("click", () => {
		const wasFocused = document.activeElement === restoreOneButton.get(0);
		const restored = session.restoreField(descriptor.key);
		syncControlValue(descriptor, input, restored);
		onFieldChange(descriptor.key);
		if (wasFocused) input.trigger("focus");
	});
	const revertOneButton = $("<button>").attr({
		type: "button",
		title: Texts.settings_revertToPrevious,
		"aria-label": `${Texts.settings_revertToPrevious}：${descriptor.label}`
	}).addClass("pp-settings-icon-btn pp-settings-revert-one").html(undo_default).prop("hidden", !session.isFieldModified(descriptor.key)).on("click", () => {
		const wasFocused = document.activeElement === revertOneButton.get(0);
		const reverted = session.revertField(descriptor.key);
		syncControlValue(descriptor, input, reverted);
		onFieldChange(descriptor.key);
		if (wasFocused) input.trigger("focus");
	});
	controlWrap.append(restoreOneButton, revertOneButton, input);
	if (descriptor.unit) $("<span>").addClass("pp-settings-unit").text(descriptor.unit).appendTo(controlWrap);
	mainRow.append(label, controlWrap);
	const desc = $("<div>").addClass("pp-settings-desc").attr("id", descId).text(descriptor.description);
	const errorEl = $("<div>").addClass("pp-settings-error").attr("id", errorId).prop("hidden", true);
	row.append(mainRow, desc, errorEl);
	return {
		row,
		input,
		restoreButton: restoreOneButton,
		revertButton: revertOneButton,
		errorEl,
		descId,
		errorId
	};
};
const syncControlValue = (descriptor, input, value) => {
	if (descriptor.control === "boolean") input.prop("checked", Boolean(value));
	else input.val(String(value));
};
let fieldControls = /* @__PURE__ */ new Map();
const DOWNLOAD_TIMING_KEYS = [
	"downloadProgressPersistMs",
	"downloadHeartbeatMs",
	"downloadOwnerTimeoutMs"
];
const clearFieldError = (key) => {
	const control = fieldControls.get(key);
	if (!control) return;
	control.input.removeAttr("aria-invalid").attr("aria-describedby", control.descId);
	control.errorEl.prop("hidden", true).text("");
};
const showFieldError = (key, message) => {
	const control = fieldControls.get(key);
	if (!control) return;
	control.input.attr("aria-invalid", "true").attr("aria-describedby", `${control.descId} ${control.errorId}`);
	control.errorEl.text(message).prop("hidden", false);
};
/** 打开右下角单实例配置面板；若已打开则聚焦并保留当前草稿 */
const openSettingsPanel = () => {
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
	const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const session = createSettingsDraftSession();
	fieldControls = /* @__PURE__ */ new Map();
	const panel = $("<div>").attr({
		id: PANEL_ID,
		role: "dialog",
		"aria-modal": "false",
		"aria-labelledby": HEADING_ID
	});
	const closeButton = $("<button>").attr({
		type: "button",
		"aria-label": Texts.settings_close
	}).text(Texts.settings_close);
	$("<header>").append($("<h2>").attr("id", HEADING_ID).text(Texts.settings_panelTitle), closeButton).appendTo(panel);
	const body = $("<div>").addClass("pp-settings-body").appendTo(panel);
	const statusBanner = $("<div>").addClass("pp-settings-status").attr({
		role: "status",
		"aria-live": "polite"
	}).prop("hidden", true);
	const clearStatus = () => {
		statusBanner.prop("hidden", true).removeAttr("data-state").text("");
	};
	const clearAllErrors = () => {
		for (const key of fieldControls.keys()) clearFieldError(key);
		clearStatus();
	};
	const syncFieldVisualState = (key) => {
		const control = fieldControls.get(key);
		if (!control) return;
		const modified = session.isFieldModified(key);
		if (modified) control.row.attr("data-modified", "true");
		else control.row.removeAttr("data-modified");
		control.restoreButton.prop("hidden", session.isFieldDefault(key));
		control.revertButton.prop("hidden", !modified);
	};
	let advancedToggle = null;
	const syncAdvancedModifiedState = () => {
		if (!advancedToggle) return;
		if (SETTING_FIELDS.some((field) => field.section === "advanced" && session.isFieldModified(field.key))) advancedToggle.attr("data-modified", "true");
		else advancedToggle.removeAttr("data-modified");
	};
	const syncAllVisualStates = () => {
		for (const key of fieldControls.keys()) syncFieldVisualState(key);
		syncAdvancedModifiedState();
	};
	const renderGroupSection = (group) => {
		const fields = SETTING_FIELDS.filter((field) => field.group === group.id);
		if (fields.length === 0) return null;
		const section = $("<section>").addClass("pp-settings-group").attr("data-setting-group", group.id);
		$("<h3>").text(group.title).appendTo(section);
		for (const descriptor of fields) {
			const created = createFieldRow(descriptor, session, (key) => {
				clearFieldError(key);
				if (DOWNLOAD_TIMING_KEYS.includes(key)) for (const siblingKey of DOWNLOAD_TIMING_KEYS) clearFieldError(siblingKey);
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
				errorId: created.errorId
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
	const advancedGroups = SETTING_GROUPS.filter((group) => group.section === "advanced");
	const advancedBodyId = "pp-settings-advanced-body";
	const advancedBody = $("<div>").attr({ id: advancedBodyId }).addClass("pp-settings-advanced-body").prop("hidden", true);
	for (const group of advancedGroups) {
		const section = renderGroupSection(group);
		if (section) advancedBody.append(section);
	}
	let advancedExpanded = false;
	const advancedArrow = $("<span>").attr("aria-hidden", "true").text("▸");
	advancedToggle = $("<button>").attr({
		type: "button",
		"aria-expanded": "false",
		"aria-controls": advancedBodyId
	}).addClass("pp-settings-advanced-toggle").append($("<span>").text(Texts.settings_advancedToggle), advancedArrow);
	const setAdvancedExpanded = (expanded) => {
		advancedExpanded = expanded;
		advancedToggle.attr("aria-expanded", String(expanded));
		advancedArrow.text(expanded ? "▾" : "▸");
		advancedBody.prop("hidden", !expanded);
	};
	advancedToggle.on("click", () => setAdvancedExpanded(!advancedExpanded));
	body.append(advancedToggle, advancedBody);
	const restoreAllButton = $("<button>").attr("type", "button").addClass("pp-settings-restore-all").text(Texts.settings_restoreAll).on("click", () => {
		const nextDraft = session.restoreAll();
		for (const [key, control] of fieldControls) syncControlValue(control.descriptor, control.input, nextDraft[key]);
		syncAllVisualStates();
		clearAllErrors();
	});
	const saveButton = $("<button>").attr("type", "button").addClass("pp-settings-primary").text(Texts.settings_save).on("click", () => {
		clearAllErrors();
		const result = session.save();
		if (result.ok) {
			for (const [key, control] of fieldControls) syncControlValue(control.descriptor, control.input, session.getDraftValue(key));
			syncAllVisualStates();
			statusBanner.attr("data-state", "success").text(Texts.settings_saveSuccess).prop("hidden", false);
			return;
		}
		const firstError = result.errors[0];
		for (const error of result.errors) if (error.key) showFieldError(error.key, error.message);
		if (!advancedExpanded && result.errors.some((err) => err.key && fieldControls.get(err.key)?.descriptor.section === "advanced")) setAdvancedExpanded(true);
		if (firstError?.key) {
			const control = fieldControls.get(firstError.key);
			const label = control?.descriptor.label ?? firstError.key;
			statusBanner.attr("data-state", "error").text(Texts.settings_validationFailed.replace("%1", `${label}（${firstError.message}）`)).prop("hidden", false);
			const inputEl = control?.input.get(0);
			inputEl?.scrollIntoView({ block: "nearest" });
			inputEl?.focus();
		} else statusBanner.attr("data-state", "error").text(Texts.settings_saveFailed.replace("%1", firstError?.message ?? Texts.settings_saveStorageError)).prop("hidden", false);
	});
	$("<footer>").append(statusBanner, $("<div>").addClass("pp-settings-actions").append(restoreAllButton, saveButton)).appendTo(panel);
	const unsubscribe = subscribeSettings((nextSettings, _prev, source) => {
		if (source !== "remote") return;
		const updatedKeys = session.applyRemoteUpdate(nextSettings);
		for (const key of updatedKeys) {
			const control = fieldControls.get(key);
			if (control) {
				clearFieldError(key);
				syncControlValue(control.descriptor, control.input, session.getDraftValue(key));
			}
		}
		syncAllVisualStates();
	});
	const closePanel = (restoreFocus = false) => {
		unsubscribe();
		panel.remove();
		fieldControls = /* @__PURE__ */ new Map();
		activePanel = null;
		if (restoreFocus && previousFocus && previousFocus !== document.body && document.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
		else if (restoreFocus && document.activeElement instanceof HTMLElement) document.activeElement.blur();
	};
	const requestClose = (restoreFocus = false) => {
		if (session.hasModifiedFields() && !confirm(Texts.settings_confirmDiscard)) return;
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
		close: closePanel
	};
	activePanel.focus();
};

// src/icons/heart.svg
var heart_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg viewBox=\"0 0 32 32\"\n     width=\"32\"\n     height=\"32\">\n    <path d=\"&#xA;M21,5.5 C24.8659932,5.5 28,8.63400675 28,12.5 C28,18.2694439 24.2975093,23.1517313 17.2206059,27.1100183&#xA;C16.4622493,27.5342993 15.5379984,27.5343235 14.779626,27.110148 C7.70250208,23.1517462 4,18.2694529 4,12.5&#xA;C4,8.63400691 7.13400681,5.5 11,5.5 C12.829814,5.5 14.6210123,6.4144028 16,7.8282366&#xA;C17.3789877,6.4144028 19.170186,5.5 21,5.5 Z\" />\n    <path d=\"M16,11.3317089 C15.0857201,9.28334665 13.0491506,7.5 11,7.5&#xA;C8.23857625,7.5 6,9.73857647 6,12.5 C6,17.4386065 9.2519779,21.7268174 15.7559337,25.3646328&#xA;C15.9076021,25.4494645 16.092439,25.4494644 16.2441073,25.3646326 C22.7480325,21.7268037 26,17.4385986 26,12.5&#xA;C26,9.73857625 23.7614237,7.5 21,7.5 C18.9508494,7.5 16.9142799,9.28334665 16,11.3317089 Z\"\n          style=\"fill: #fafafa;\" />\n</svg>";

// src/icons/heart-filled.svg
var heart_filled_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg viewBox=\"0 0 32 32\"\n     width=\"32\"\n     height=\"32\">\n    <path d=\"&#xA;M21,5.5 C24.8659932,5.5 28,8.63400675 28,12.5 C28,18.2694439 24.2975093,23.1517313 17.2206059,27.1100183&#xA;C16.4622493,27.5342993 15.5379984,27.5343235 14.779626,27.110148 C7.70250208,23.1517462 4,18.2694529 4,12.5&#xA;C4,8.63400691 7.13400681,5.5 11,5.5 C12.829814,5.5 14.6210123,6.4144028 16,7.8282366&#xA;C17.3789877,6.4144028 19.170186,5.5 21,5.5 Z\" />\n    <path d=\"M16,11.3317089 C15.0857201,9.28334665 13.0491506,7.5 11,7.5&#xA;C8.23857625,7.5 6,9.73857647 6,12.5 C6,17.4386065 9.2519779,21.7268174 15.7559337,25.3646328&#xA;C15.9076021,25.4494645 16.092439,25.4494644 16.2441073,25.3646326 C22.7480325,21.7268037 26,17.4385986 26,12.5&#xA;C26,9.73857625 23.7614237,7.5 21,7.5 C18.9508494,7.5 16.9142799,9.28334665 16,11.3317089 Z\"\n          style=\"fill: #dc2626;\" />\n</svg>";

// src/icons/play.svg
var play_default = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg viewBox=\"0 0 24 24\"\n     style=\"width: 48px; height: 48px; stroke: none; line-height: 0; font-size: 0px; vertical-align: middle;\">\n    <circle cx=\"12\"\n            cy=\"12\"\n            r=\"10\"\n            style=\"fill: rgba(0, 0, 0, 0.32);\" />\n    <path d=\"M9,8.74841664 L9,15.2515834 C9,15.8038681 9.44771525,16.2515834 10,16.2515834&#xA;C10.1782928,16.2515834 10.3533435,16.2039156 10.5070201,16.1135176 L16.0347118,12.8619342&#xA;C16.510745,12.5819147 16.6696454,11.969013 16.3896259,11.4929799&#xA;C16.3034179,11.3464262 16.1812655,11.2242738 16.0347118,11.1380658 L10.5070201,7.88648243&#xA;C10.030987,7.60646294 9.41808527,7.76536339 9.13806578,8.24139652&#xA;C9.04766776,8.39507316 9,8.57012386 9,8.74841664 Z\"\n          style=\"fill: rgb(245, 245, 245);\" />\n</svg>";

// src/features/sort.ts
const BOOKMARK_USER_PAGE_ILLUSTRATION_LIST_SELECTOR = "ul.sc-e967f3f1-1.cEOodl";
const USER_TYPE_ARTWORKS_PER_PAGE = 48;
const parseExcludedTags = (raw) => raw.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
let isInitialized = false;
const loadIllustSort = () => {
	if (isInitialized) return;
	class IllustSorter {
		type;
		illustrations = [];
		sorting = false;
		nextSortPage;
		listElement = $();
		progressElement = $();
		progressText = $();
		/** 按钮由本脚本创建，构造时可能尚未挂载，因此每次使用前再查询 */
		get sortButtonElement() {
			return $(`#${SORT_BUTTON_ID}`);
		}
		reset({ type }) {
			try {
				this.type = type;
				this.illustrations = [];
				this.sorting = false;
				this.nextSortPage = 1;
				this.listElement = getIllustrationsListDom(type);
				this.progressElement?.remove();
				this.progressElement = $(document.createElement("div")).attr({ id: "pp-sort-progress" }).css({
					width: "100%",
					display: "flex",
					"flex-direction": "column",
					"align-items": "center",
					"justify-content": "center",
					gap: "6px"
				}).append($(new Image(96, 96)).attr({
					id: "sort-progress__loading",
					src: g_loadingImage
				}).css({ "border-radius": "50%" })).prependTo(this.listElement).hide();
				this.progressText = $(document.createElement("div")).attr({ id: "pp-sort-progress__text" }).css({
					"text-align": "center",
					"font-size": "16px",
					"font-weight": "bold",
					color: "initial"
				}).appendTo(this.progressElement);
				this.sortButtonElement.attr({
					title: "排序作品",
					"aria-label": "排序作品",
					"aria-busy": "false"
				});
			} catch (error) {
				iLog.e(`An error occurred while resetting sorter:`, error);
				throw new Error(String(error), { cause: error });
			}
		}
		async sort({ type, api, searchParams, settings }) {
			this.sorting = true;
			iLog.i("Start to sort illustrations.");
			const { pageCount, favFilter, orderType, hideFavorite, hideByTag, hideByTagList, aiFilter, aiAssistedFilter } = settings;
			const excludedTags = hideByTag ? parseExcludedTags(hideByTagList) : [];
			this.sortButtonElement.attr({
				title: "正在排序作品",
				"aria-label": "正在排序作品",
				"aria-busy": "true"
			});
			try {
				let illustrations = [];
				const startPage = Number(searchParams.get("p") ?? 1);
				this.nextSortPage = startPage + pageCount;
				for (let page = startPage; page < startPage + pageCount; page += 1) {
					searchParams.set("p", String(page));
					if ([
						7,
						8,
						9
					].includes(type)) {
						searchParams.set("is_first_page", page > 1 ? "0" : "1");
						searchParams.delete("ids[]");
						const userId = searchParams.get("user_id") || "";
						const userIllustrations = await getUserIllustrationsWithCache(userId, { onRequesting: () => this.setProgress(`Getting illustrations of current user...`) });
						const fromIndex = (page - 1) * USER_TYPE_ARTWORKS_PER_PAGE;
						const toIndex = page * USER_TYPE_ARTWORKS_PER_PAGE;
						switch (type) {
							case 7:
								userIllustrations.artworks.slice(fromIndex, toIndex).forEach((id) => searchParams.append("ids[]", id));
								break;
							case 8:
								userIllustrations.illusts.slice(fromIndex, toIndex).forEach((id) => searchParams.append("ids[]", id));
								break;
							case 9: userIllustrations.manga.slice(fromIndex, toIndex).forEach((id) => searchParams.append("ids[]", id));
						}
					} else if ([10].includes(type)) searchParams.set("offset", String((page - 1) * USER_TYPE_ARTWORKS_PER_PAGE));
					this.setProgress(`Getting illustration list of page ${page} ...`);
					const requestUrl = `${api}?${searchParams}`;
					const extractedIllustrations = getIllustrationsFromResponse(type, (await requestWithRetry({
						url: requestUrl,
						onRetry: (response, retryTimes) => {
							iLog.w(`Get illustration list through \`${requestUrl}\` failed:`, response, `${retryTimes} times retrying...`);
							this.setProgress(`Retry to get illustration list of page ${page} (${retryTimes} times)...`);
						}
					})).response);
					illustrations = illustrations.concat(extractedIllustrations);
				}
				const getDetailedIllustrationPromises = [];
				for (let i = 0; i < illustrations.length; i += 1) {
					const illustration = illustrations[i];
					const illustrationId = illustration.id;
					const illustrationAuthorId = illustration.userId;
					if (String(illustrationAuthorId) === "0") continue;
					getDetailedIllustrationPromises.push(async () => {
						this.setProgress(`Getting details of ${i + 1}/${illustrations.length} illustration...`);
						const illustrationDetails = await getIllustrationDetailsWithCache(illustrationId, true);
						return {
							...illustration,
							bookmarkUserTotal: illustrationDetails?.bookmarkUserTotal ?? -1
						};
					});
				}
				const detailedIllustrations = await execLimitConcurrentPromises(getDetailedIllustrationPromises);
				iLog.d("Queried detailed illustrations:", detailedIllustrations);
				this.setProgress("Filtering illustrations...");
				const filteredIllustrations = detailedIllustrations.filter((illustration) => {
					if (hideFavorite && illustration.bookmarkData) return false;
					if (aiFilter && checkIsAiGenerated(illustration.aiType)) return false;
					if (aiAssistedFilter && checkIsAiAssisted(illustration.tags)) return false;
					if (excludedTags.length > 0 && illustration.tags.some((tag) => excludedTags.includes(tag.toLowerCase()))) return false;
					return illustration.bookmarkUserTotal >= favFilter;
				});
				this.setProgress("Sorting filtered illustrations...");
				const sortedIllustrations = orderType === 0 ? filteredIllustrations.sort((a, b) => b.bookmarkUserTotal - a.bookmarkUserTotal) : filteredIllustrations;
				iLog.d("Filtered and sorted illustrations:", sortedIllustrations);
				iLog.i("Sort illustrations successfully.");
				this.illustrations = sortedIllustrations;
				this.showIllustrations();
			} catch (error) {
				iLog.e("Sort illustrations failed:", error);
			}
			this.hideProgress();
			this.sorting = false;
			this.sortButtonElement.attr({
				title: "排序作品",
				"aria-label": "排序作品",
				"aria-busy": "false"
			});
		}
		setProgress(text) {
			this.progressText.text(text);
			this.progressElement.show();
		}
		hideProgress() {
			this.progressText.text("");
			this.progressElement.hide();
		}
		showIllustrations() {
			const fragment = document.createDocumentFragment();
			for (const { aiType, alt, bookmarkData, bookmarkUserTotal, id, illustType, pageCount, profileImageUrl, tags, title, url, userId, userName } of this.illustrations) {
				const isR18 = checkIsR18(tags);
				const isR18G = checkIsR18G(tags);
				const isUgoira = checkIsUgoira(illustType);
				const isAi = checkIsAiGenerated(aiType);
				const isAiAssisted = checkIsAiAssisted(tags);
				const listItem = document.createElement("li");
				listItem.className = "col-span-2";
				const container = document.createElement("div");
				container.style = "width: 184px;";
				const illustrationAnchor = document.createElement("a");
				illustrationAnchor.setAttribute("data-gtm-value", id);
				illustrationAnchor.setAttribute("data-gtm-user-id", userId);
				illustrationAnchor.href = `/artworks/${id}`;
				markSortedArtworkLink(illustrationAnchor, getSettings().linkBlank);
				illustrationAnchor.style = "display: block; position: relative; width: 184px;";
				const illustrationImageWrapper = document.createElement("div");
				illustrationImageWrapper.style = "position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;";
				const illustrationImage = document.createElement("img");
				illustrationImage.src = url;
				illustrationImage.alt = alt;
				illustrationImage.style = "object-fit: cover; object-position: center center; width: 100%; height: 100%; border-radius: 4px; background-color: rgb(31, 31, 31);";
				const ugoriaSvg = document.createElement("div");
				ugoriaSvg.style = "position: absolute;";
				ugoriaSvg.innerHTML = play_default;
				const illustrationMeta = document.createElement("div");
				illustrationMeta.style = "position: absolute; top: 0px; left: 0px; right: 0px; display: flex; align-items: flex-start; padding: 4px 4px 0; pointer-events: none; font-size: 10px;";
				illustrationMeta.innerHTML = `
          ${isR18G ? "<div style=\"padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(255, 64, 96); font-weight: bold; line-height: 16px; user-select: none;\">R-18G</div>" : isR18 ? "<div style=\"padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(255, 64, 96); font-weight: bold; line-height: 16px; user-select: none;\">R-18</div>" : ""}
          ${isAi ? "<div style=\"padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(162, 28, 175); font-weight: bold; line-height: 16px; user-select: none;\">AI 生成</div>" : isAiAssisted ? "<div style=\"padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: rgb(109, 40, 217); font-weight: bold; line-height: 16px; user-select: none;\">AI 辅助</div>" : ""}
          ${pageCount > 1 ? `
                <div style="margin-left: auto;">
                  <div style="display: flex; justify-content: center; align-items: center; height: 20px; min-width: 20px; color: rgb(245, 245, 245); font-weight: bold; padding: 0px 6px; background: rgba(0, 0, 0, 0.32); border-radius: 10px; line-height: 10px;">
                    ${page_default}
                    <span>${pageCount}</span>
                  </div>
                </div>` : ""}
        `;
				const illustrationToolbar = document.createElement("div");
				illustrationToolbar.style = "position: absolute; top: 164px; left: 0px; right: 0px; display: flex; align-items: center; padding: 0 4px 4px; pointer-events: none; font-size: 12px;";
				illustrationToolbar.innerHTML = `
          <div style="padding: 0px 4px; border-radius: 4px; color: rgb(245, 245, 245); background: ${bookmarkUserTotal > 5e4 ? "rgb(159, 18, 57)" : bookmarkUserTotal > 1e4 ? "rgb(220, 38, 38)" : bookmarkUserTotal > 5e3 ? "rgb(29, 78, 216)" : bookmarkUserTotal > 1e3 ? "rgb(21, 128, 61)" : "rgb(71, 85, 105)"}; font-weight: bold; line-height: 16px; user-select: none;">❤ ${bookmarkUserTotal}</div>
          <div style="margin-left: auto; display: none;">${bookmarkData ? heart_filled_default : heart_default}</div>
        `;
				const illustrationTitle = document.createElement("div");
				illustrationTitle.innerHTML = title;
				illustrationTitle.style = "margin-top: 4px; max-width: 100%; overflow: hidden; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; line-height: 22px; font-size: 14px; font-weight: bold; color: rgb(245, 245, 245); transition: color 0.2s;";
				const illustrationAuthor = document.createElement("a");
				illustrationAuthor.setAttribute("data-gtm-value", userId);
				illustrationAuthor.href = `/users/${userId}`;
				illustrationAuthor.target = "_blank";
				illustrationAuthor.rel = "external";
				illustrationAuthor.style = "display: flex; align-items: center; margin-top: 4px;";
				illustrationAuthor.innerHTML = `
          <img src="${profileImageUrl}" alt="${userName}" style="object-fit: cover; object-position: center top; width: 24px; height: 24px; border-radius: 50%; margin-right: 4px;">
          <span style="min-width: 0px; line-height: 22px; font-size: 14px; color: rgb(214, 214, 214); text-decoration: none; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${userName}</span>
        `;
				illustrationImageWrapper.appendChild(illustrationImage);
				if (isUgoira) illustrationImageWrapper.appendChild(ugoriaSvg);
				illustrationAnchor.appendChild(illustrationImageWrapper);
				illustrationAnchor.appendChild(illustrationMeta);
				illustrationAnchor.appendChild(illustrationToolbar);
				illustrationAnchor.appendChild(illustrationTitle);
				container.appendChild(illustrationAnchor);
				container.appendChild(illustrationAuthor);
				listItem.appendChild(container);
				fragment.appendChild(listItem);
			}
			if ([
				5,
				6,
				7,
				8,
				9,
				10
			].includes(this.type)) this.listElement.css({ gap: "24px" });
			this.listElement.children().remove();
			this.listElement.append(fragment);
		}
	}
	const illustSorter = new IllustSorter();
	window.addEventListener(SORT_EVENT_NAME, () => {
		if (illustSorter.sorting) {
			iLog.w("Current is in sorting progress.");
			return;
		}
		const url = new URL(location.href);
		const { type, api, searchParams: defaultSearchParams } = getSortOptionsFromUrl(url);
		const mergedSearchParams = new URLSearchParams(defaultSearchParams);
		url.searchParams.forEach((value, key) => {
			mergedSearchParams.set(key, value);
		});
		illustSorter.reset({ type });
		illustSorter.sort({
			type,
			api,
			searchParams: mergedSearchParams,
			settings: getSettings()
		});
	});
	window.addEventListener(SORT_NEXT_PAGE_EVENT_NAME, () => {
		const { origin, pathname, searchParams } = new URL(location.href);
		let nextPage = Number(searchParams.get("p") ?? 1) + 1;
		if (illustSorter.listElement?.length && illustSorter.nextSortPage) {
			iLog.i("Illustrations in current page are sorted, jump to next available page...");
			nextPage = illustSorter.nextSortPage;
		}
		searchParams.set("p", String(nextPage));
		location.href = `${origin}${pathname}?${searchParams}`;
	});
	isInitialized = true;
};
/** 获取作品节点 li 的父节点 ul */
function getIllustrationsListDom(type) {
	let dom;
	if ([
		0,
		1,
		2,
		3,
		4
	].includes(type)) {
		dom = $("div[data-ga4-label=\"works_content\"]").children("div").last();
		if (!dom.length) dom = $("section").find("ul").last();
	} else if ([
		5,
		6,
		10
	].includes(type)) {
		dom = $(BOOKMARK_USER_PAGE_ILLUSTRATION_LIST_SELECTOR);
		if (!dom.length) dom = $("section").find("ul").last();
	} else if ([
		7,
		8,
		9
	].includes(type)) {
		dom = $(BOOKMARK_USER_PAGE_ILLUSTRATION_LIST_SELECTOR);
		if (!dom.length) dom = $(".__top_side_menu_body").find("ul").last();
	}
	if (!dom || !dom.length) throw new Error(`Illustrations list DOM not found in current page: ${location.href}. Please create a new issue here: https://github.com/LolipopJ/PixivPreviewer/issues`);
	return dom;
}
/** 根据当前路由获取接口参数 */
function getSortOptionsFromUrl(url) {
	const { pathname, searchParams } = url;
	let type;
	let api;
	let defaultSearchParams;
	let match;
	if (match = pathname.match(/\/tags\/(.+)\/(artworks|illustrations|manga)$/)) {
		const tagName = match[1];
		switch (match[2]) {
			case "artworks":
				type = 0;
				api = `/ajax/search/artworks/${tagName}`;
				defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=all&lang=zh`;
				break;
			case "illustrations":
				type = 1;
				api = `/ajax/search/illustrations/${tagName}`;
				defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=illust_and_ugoira&lang=zh`;
				break;
			case "manga":
				type = 2;
				api = `/ajax/search/manga/${tagName}`;
				defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=manga&lang=zh`;
		}
	} else if (pathname.match(/\/search/)) {
		const tagName = searchParams.get("q");
		switch (searchParams.get("type")) {
			case "illust_ugoira":
				type = 3;
				api = `/ajax/search/illustrations/${tagName}`;
				defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=illust_and_ugoira&lang=zh`;
				break;
			case "manga":
				type = 4;
				api = `/ajax/search/manga/${tagName}`;
				defaultSearchParams = `word=${tagName}&order=date_d&mode=all&p=1&csw=0&s_mode=s_tag_full&type=manga&lang=zh`;
		}
	} else if (match = pathname.match(/\/bookmark_new_illust(_r18)?\.php$/)) {
		const isR18 = !!match[1];
		api = "/ajax/follow_latest/illust";
		if (isR18) {
			type = 5;
			defaultSearchParams = "mode=r18&lang=zh";
		} else {
			type = 6;
			defaultSearchParams = "mode=all&lang=zh";
		}
	} else if (match = pathname.match(/\/users\/(\d+)\/bookmarks\/artworks$/)) {
		const userId = match[1];
		type = 10;
		api = `/ajax/user/${userId}/illusts/bookmarks`;
		defaultSearchParams = `tag=&offset=0&limit=${USER_TYPE_ARTWORKS_PER_PAGE}&rest=show&lang=zh`;
	} else if (match = pathname.match(/\/users\/(\d+)\/(artworks|illustrations|manga)$/)) {
		const userId = match[1];
		const filterType = match[2];
		api = `/ajax/user/${userId}/profile/illusts`;
		switch (filterType) {
			case "artworks":
				type = 7;
				defaultSearchParams = `work_category=illustManga&is_first_page=1&sensitiveFilterMode=userSetting&user_id=${userId}&lang=zh`;
				break;
			case "illustrations":
				type = 8;
				defaultSearchParams = `work_category=illust&is_first_page=1&sensitiveFilterMode=userSetting&user_id=${userId}&lang=zh`;
				break;
			case "manga":
				type = 9;
				defaultSearchParams = `work_category=manga&is_first_page=1&sensitiveFilterMode=userSetting&user_id=${userId}&lang=zh`;
		}
	}
	if (type === void 0 || api === void 0 || defaultSearchParams === void 0) throw new Error("Current page doesn't support sorting illustrations.");
	return {
		type,
		api,
		searchParams: new URLSearchParams(defaultSearchParams)
	};
}
/** 从响应值里提取作品数据列表 */
function getIllustrationsFromResponse(type, response) {
	if (type === 0) return response.body.illustManga.data ?? [];
	else if (type === 1 || type === 3) return response.body.illust.data ?? [];
	else if (type === 2 || type === 4) return response.body.manga.data ?? [];
	else if ([5, 6].includes(type)) return response.body.thumbnails.illust ?? [];
	else if ([
		7,
		8,
		9,
		10
	].includes(type)) return Object.values(response.body.works);
	return [];
}

// src/icons/hide-favorites.svg
var hide_favorites_default = "<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path\n    d=\"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z\"\n  />\n  <path d=\"M3 3 21 21\" />\n</svg>";

// src/icons/next-page.svg
var next_page_default = "<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"m6.5 5 7 7-7 7M17.5 5v14\" />\n</svg>";

// src/icons/sort.svg
var sort_default = "<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M4 6h16M4 12h10M4 18h4m9-4 3 3 3-3m-3-5v8\" />\n</svg>";

// src/index.ts
let g_pageType;
let g_settings;
const Pages = {
	[0]: {
		PageTypeString: "SearchPage",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/tags\/.+\/(artworks|illustrations|manga)/.test(url) || /^https?:\/\/www.pixiv.net(\/en)?\/search/.test(url);
		},
		CreateToolBar: createToolbar
	},
	[1]: {
		PageTypeString: "BookMarkNewPage",
		CheckUrl: function(url) {
			return /^https:\/\/www.pixiv.net(\/en)?\/bookmark_new_illust(_r18)?.php.*/.test(url);
		},
		CreateToolBar: createToolbar
	},
	[2]: {
		PageTypeString: "DiscoveryPage",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/discovery.*/.test(url);
		},
		CreateToolBar: createToolbar
	},
	[3]: {
		PageTypeString: "MemberPage/MemberIllustPage/MemberBookMark",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/users\/\d+/.test(url);
		},
		CreateToolBar: createToolbar
	},
	[4]: {
		PageTypeString: "HomePage",
		CheckUrl: function(url) {
			return /https?:\/\/www.pixiv.net(\/en)?\/?$/.test(url) || /https?:\/\/www.pixiv.net(\/en)?\/illustration\/?$/.test(url) || /https?:\/\/www.pixiv.net(\/en)?\/manga\/?$/.test(url) || /https?:\/\/www.pixiv.net(\/en)?\/cate_r18\.php$/.test(url);
		},
		CreateToolBar: createToolbar
	},
	[5]: {
		PageTypeString: "RankingPage",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/ranking.php.*/.test(url);
		},
		CreateToolBar: createToolbar
	},
	[6]: {
		PageTypeString: "NewIllustPage",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/new_illust.php.*/.test(url);
		},
		CreateToolBar: createToolbar
	},
	[7]: {
		PageTypeString: "R18Page",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/cate_r18.php.*/.test(url);
		},
		CreateToolBar: createToolbar
	},
	[8]: {
		PageTypeString: "StaccPage",
		CheckUrl: function(url) {
			return /^https:\/\/www.pixiv.net(\/en)?\/stacc.*/.test(url);
		},
		FindToolBar: findToolbarOld
	},
	[9]: {
		PageTypeString: "ArtworkPage",
		CheckUrl: function(url) {
			return /^https:\/\/www.pixiv.net(\/en)?\/artworks\/.*/.test(url);
		},
		CreateToolBar: createToolbar
	},
	[10]: {
		PageTypeString: "NovelSearchPage",
		CheckUrl: function(url) {
			return /^https:\/\/www.pixiv.net(\/en)?\/tags\/.*\/novels/.test(url);
		},
		CreateToolBar: createToolbar
	},
	[11]: {
		PageTypeString: "SearchTopPage",
		CheckUrl: function(url) {
			return /^https?:\/\/www.pixiv.net(\/en)?\/tags\/[^/*]/.test(url);
		},
		CreateToolBar: createToolbar
	}
};
function findToolbar() {
	return $(`#${"pp-toolbar"}`).get(0) ?? null;
}
function createToolbar() {
	const toolbar = findToolbar();
	if (toolbar) return toolbar;
	$("body").append(`<div id="${TOOLBAR_ID}" style="position: fixed; right: 28px; bottom: 96px;"></div>`);
	return findToolbar();
}
function findToolbarOld() {
	return $("._toolmenu").get(0) ?? null;
}
function showSearchLinksForDeletedArtworks() {
	const searchEngines = [
		{
			name: "Google",
			url: "https://www.google.com/search?q="
		},
		{
			name: "Bing",
			url: "https://www.bing.com/search?q="
		},
		{
			name: "Baidu",
			url: "https://www.baidu.com/s?wd="
		}
	];
	document.querySelectorAll("span[to]").forEach((span) => {
		const artworkPath = span.getAttribute("to");
		if (span.textContent.trim() === "-----" && artworkPath !== null && artworkPath.startsWith("/artworks/")) {
			const keyword = `pixiv "${artworkPath.slice(10)}"`;
			const container = document.createElement("span");
			container.className = span.className;
			searchEngines.forEach((engine, i) => {
				const link = document.createElement("a");
				link.href = engine.url + encodeURIComponent(keyword);
				link.textContent = engine.name;
				link.target = "_blank";
				container.appendChild(link);
				if (i < searchEngines.length - 1) container.appendChild(document.createTextNode(" | "));
			});
			if (span.parentNode) span.parentNode.replaceChild(container, span);
		}
	});
}
const registerSettingsMenu = () => {
	const settings = getSettings();
	GM_registerMenuCommand(`⚙️ ${Texts.settings_menu}`, () => {
		openSettingsPanel();
	});
	GM_registerMenuCommand(`🧹 ${Texts.setting_clearFollowingCache}`, () => {
		if (!confirm(`${Texts.setting_clearFollowingCacheHelp}\n\n确定要清除吗？`)) return;
		clearAllLocalCaches().then((cleared) => {
			if (!cleared) {
				alert(Texts.setting_clearCacheFailed);
				return;
			}
			alert(Texts.setting_followingCacheCleared);
			location.reload();
		});
	});
	GM_registerMenuCommand(`📊 ${Texts.cache_usage}`, () => {
		getCacheUsage().then((usage) => {
			alert(Texts.cache_usageHelp.replace("%1", String(usage.illustrationDetails)).replace("%2", String(usage.illustPages)).replace("%3", String(usage.ugoiraFrames)).replace("%4", formatCacheBytes(usage.ugoiraBytes)).replace("%5", String(usage.tagTranslations)));
		});
	});
	return settings;
};
const ShowUpgradeMessage = () => {
	const panelId = "pp-upgrade-panel";
	const headingId = "pp-upgrade-heading";
	$(`#${panelId}`).remove();
	injectStyle(`
      #${panelId} {
        --pp-upgrade-bg: #fff;
        --pp-upgrade-fg: #222;
        --pp-upgrade-border: #ddd;
        --pp-upgrade-action: #006eb8;
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 100001;
        display: flex;
        flex-direction: column;
        width: min(420px, calc(100vw - 24px));
        max-height: min(480px, calc(100vh - 24px));
        box-sizing: border-box;
        border: 1px solid var(--pp-upgrade-border);
        border-radius: 12px;
        background: var(--pp-upgrade-bg);
        color: var(--pp-upgrade-fg);
        box-shadow: 0 12px 36px rgba(0, 0, 0, .24);
        font: 14px/1.6 sans-serif;
      }
      #${panelId} *, #${panelId} *::before, #${panelId} *::after {
        box-sizing: border-box;
      }
      #${panelId} header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--pp-upgrade-border);
        flex-shrink: 0;
      }
      #${panelId} h2 {
        margin: 0;
        font-size: 16px;
        line-height: 1.4;
        color: inherit;
      }
      #${panelId} .pp-upgrade-body {
        padding: 12px 16px;
        overflow-y: auto;
        overscroll-behavior: contain;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      #${panelId} p {
        margin: 0;
      }
      #${panelId} a {
        color: var(--pp-upgrade-action);
        text-decoration: none;
      }
      #${panelId} a:hover {
        text-decoration: underline;
      }
      #${panelId} button {
        border: 1px solid var(--pp-upgrade-border);
        border-radius: 6px;
        padding: 4px 8px;
        background: var(--pp-upgrade-bg);
        color: var(--pp-upgrade-fg);
        cursor: pointer;
        font: 13px/1.45 sans-serif;
        white-space: nowrap;
        flex-shrink: 0;
      }
      #${panelId} button:hover {
        border-color: var(--pp-upgrade-action);
      }
      #${panelId} button:focus-visible,
      #${panelId} a:focus-visible {
        outline: 2px solid var(--pp-upgrade-action);
        outline-offset: 2px;
      }
      @media (prefers-color-scheme: dark) {
        #${panelId} {
          --pp-upgrade-bg: #222;
          --pp-upgrade-fg: #eee;
          --pp-upgrade-border: #444;
          --pp-upgrade-action: #4ea8de;
        }
      }
    `, UPGRADE_STYLE_ID);
	const close = () => {
		updateInternalVersion(g_version);
		panel.remove();
	};
	const closeButton = $("<button>").attr({
		type: "button",
		"aria-label": Texts.settings_close
	}).text(Texts.settings_close).on("click", close);
	const panel = $("<div>").attr({
		id: panelId,
		role: "dialog",
		"aria-modal": "false",
		"aria-labelledby": headingId
	}).append($("<header>").append($("<h2>").attr("id", headingId).text(`${Texts.install_title}${g_version}`), closeButton), $("<div>").addClass("pp-upgrade-body").html(Texts.upgrade_body)).on("keydown", (event) => {
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			close();
		}
	}).appendTo("body");
};
/** 向工具栏追加按钮。按钮可能已由上一次初始化创建，因此先确认其不存在 */
const appendToolbarButton = (toolBar, { id, title, icon, onClick }) => {
	if ($(`#${id}`).length) return;
	const newListItem = document.createElement("div");
	newListItem.title = title;
	const newButton = document.createElement("button");
	newButton.id = id;
	newButton.className = "pp-toolbar-button";
	newButton.type = "button";
	newButton.title = title;
	newButton.setAttribute("aria-label", title);
	newButton.innerHTML = icon;
	newButton.querySelector("svg")?.setAttribute("aria-hidden", "true");
	newListItem.appendChild(newButton);
	$(newButton).on("click", onClick);
	toolBar.appendChild(newListItem);
};
const mountToolbar = (toolBar) => {
	DoLog(4, toolBar);
	appendToolbarButton(toolBar, {
		id: SORT_BUTTON_ID,
		title: "排序作品",
		icon: sort_default,
		onClick: () => window.dispatchEvent(new Event(SORT_EVENT_NAME))
	});
	appendToolbarButton(toolBar, {
		id: SORT_NEXT_PAGE_BUTTON_ID,
		title: "前往下一页",
		icon: next_page_default,
		onClick: () => window.dispatchEvent(new Event(SORT_NEXT_PAGE_EVENT_NAME))
	});
	appendToolbarButton(toolBar, {
		id: HIDE_FAVORITES_BUTTON_ID,
		title: "隐藏已收藏作品",
		icon: hide_favorites_default,
		onClick: hideFavorites
	});
	loadDownloadPanel(toolBar);
};
/** 匹配当前页面类型。仅依赖 URL，可在 `document-start` 执行 */
const matchPageType = () => {
	for (const key of Object.keys(Pages)) {
		const pageType = Number(key);
		if (Pages[pageType].CheckUrl(location.href)) return pageType;
	}
};
/**
* 初始化不依赖 DOM 的功能。
* 在 `document-start` 执行，避免页面渲染期间功能尚不可用。
*/
const initializeEarly = () => {
	try {
		g_settings = registerSettingsMenu();
		iLog.i("Start to initialize Pixiv Previewer with global settings:", g_settings);
		warmUpCacheDatabase();
		pruneCachesOnStartup();
		subscribeSettings((next, prev, source) => {
			if (source !== "local") return;
			if (next.illustrationCacheMaxEntries < prev.illustrationCacheMaxEntries || next.illustPagesCacheMaxEntries < prev.illustPagesCacheMaxEntries || next.ugoiraCacheMaxEntries < prev.ugoiraCacheMaxEntries || next.ugoiraCacheMaxBytes < prev.ugoiraCacheMaxBytes || next.tagTranslationCacheMaxEntries < prev.tagTranslationCacheMaxEntries || next.illustrationStaticCacheTtlMs < prev.illustrationStaticCacheTtlMs || next.illustPagesCacheTtlMs < prev.illustPagesCacheTtlMs || next.ugoiraCacheTtlMs < prev.ugoiraCacheTtlMs || next.tagTranslationCacheTtlMs < prev.tagTranslationCacheTtlMs) scheduleCachePrune();
		});
		g_pageType = matchPageType();
		if (g_pageType === void 0) DoLog(3, "Unsupported page.");
		else {
			DoLog(3, "Current page is " + Pages[g_pageType].PageTypeString);
			if (g_pageType === 9) {
				const artworkId = location.pathname.match(/\/artworks\/(\d+)/)?.[1];
				if (artworkId) deleteCachedIllustrationDetails([artworkId]);
			}
		}
		loadIllustPreview();
		loadIllustSort();
	} catch (e) {
		DoLog(1, "An error occurred while initializing:", e);
	}
};
/**
* 初始化需要 DOM 的功能。
* `body` 就绪后即可执行，无需等待页面内容渲染完成。
*/
const initializeDom = () => {
	try {
		if (!g_settings) return;
		if (getSettings().enableLocalTags) loadLocalTags();
		subscribeSettings((next, prev) => {
			if (next.enableLocalTags === prev.enableLocalTags) return;
			if (next.enableLocalTags) loadLocalTags();
			else unloadLocalTags();
		});
		if (g_settings.version !== "1.8.1") ShowUpgradeMessage();
		if (g_pageType === void 0) return;
		if (g_pageType === 3) waitFor(() => matchPageType() === 3 && document.querySelector("span[to]"), () => showSearchLinksForDeletedArtworks());
		const page = Pages[g_pageType];
		if ("CreateToolBar" in page) mountToolbar(page.CreateToolBar());
		else {
			const { toolbarProbeIntervalMs, toolbarProbeMaxAttempts } = getSettings();
			waitFor(page.FindToolBar, mountToolbar, {
				interval: toolbarProbeIntervalMs,
				maxAttempts: toolbarProbeMaxAttempts,
				onGiveUp: () => DoLog(2, "Get toolbar failed.")
			});
		}
	} catch (e) {
		DoLog(1, "An error occurred while initializing:", e);
	}
};
interceptTagSearchRequests();
initializeEarly();
onDomReady(initializeDom);
