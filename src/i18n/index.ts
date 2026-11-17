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
  setting_previewByKeyHelp:
    "开启后鼠标移动到图片上不再展示预览图，按下Ctrl键才展示，同时“延迟显示预览”设置项不生效。",
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
  setting_clearFollowingCacheHelp:
    "本地缓存了作品详情、作品分页、动图帧与标签信息。清除后再次访问会重新请求接口。",
  setting_followingCacheCleared: "已清除缓存，请刷新页面。",
  setting_clearCacheFailed: "部分缓存清除失败，请稍后重试。",
  cache_usage: "缓存占用",
  cache_usageHelp:
    "作品详情 %1 个 · 作品分页 %2 个 · 动图帧 %3 个（%4）· 标签翻译 %5 个",
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
  settings_confirmDiscard:
    "存在未保存的修改，关闭将放弃这些修改，确定要关闭吗？",
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
  settings_field_previewLoadingOverlayDelayMs_desc:
    "翻页而图片未就绪时，显示毛玻璃遮罩前的等待时长",
  settings_field_previewDownloadNoticeMs_label: "下载成功提示保留时间",
  settings_field_previewDownloadNoticeMs_desc:
    "下载原图成功后，恢复按钮文字的等待时长",

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
  settings_field_hideByTagList_placeholder:
    "排序后自定义过滤的作品标签，多个标签用英文逗号 , 分隔",
  settings_field_hideByTagList_desc:
    "仅在“启用排序标签过滤”时有效，忽略首尾空白且不区分大小写",

  settings_field_enableLocalTags_label: "启用本地标签管理",
  settings_field_enableLocalTags_desc:
    "停用会移除界面并停止统计，但保留已有本地标签数据",
  settings_field_localTagPopoverShowDelayMs_label: "浮层显示延迟",
  settings_field_localTagPopoverShowDelayMs_desc:
    "悬浮或聚焦标签后弹出详情浮层的延迟",
  settings_field_localTagPopoverHideDelayMs_label: "浮层关闭延迟",
  settings_field_localTagPopoverHideDelayMs_desc:
    "离开标签或浮层后延迟关闭的时间",

  settings_field_previewPreloadCount_label: "预览预加载窗口",
  settings_field_previewPreloadCount_desc:
    "包含当前页在内的预加载张数；解码缓存上限按其两倍自动计算",
  settings_field_previewCacheMaxEntries_label: "预览内部缓存容量",
  settings_field_previewCacheMaxEntries_desc:
    "预览分页地址与动图元数据内存 LRU 缓存各自的容量上限",
  settings_field_previewDetailsMaxStaleMs_label: "预览详情额外陈旧容忍",
  settings_field_previewDetailsMaxStaleMs_desc:
    "叠加在“作品详情可变信息有效期”之上使用",
  settings_field_illustrationMutableCacheTtlMs_label: "作品详情可变信息有效期",
  settings_field_illustrationMutableCacheTtlMs_desc:
    "控制收藏数、收藏状态等可变信息的新鲜度",
  settings_field_illustrationStaticCacheTtlMs_label: "作品详情静态信息有效期",
  settings_field_illustrationStaticCacheTtlMs_desc:
    "控制标题、标签、页数等静态信息的持久化有效期",
  settings_field_illustrationCacheMaxEntries_label: "作品详情缓存容量",
  settings_field_illustrationCacheMaxEntries_desc:
    "IndexedDB 作品详情表最大条数",
  settings_field_newIllustrationNoCacheMs_label: "新作品免缓存窗口",
  settings_field_newIllustrationNoCacheMs_desc:
    "发布未满该时长的作品不写入详情缓存",
  settings_field_illustPagesCacheTtlMs_label: "作品分页缓存有效期",
  settings_field_illustPagesCacheTtlMs_desc: "IndexedDB 作品分页链接缓存有效期",
  settings_field_illustPagesCacheMaxEntries_label: "作品分页缓存容量",
  settings_field_illustPagesCacheMaxEntries_desc:
    "IndexedDB 作品分页表最大条数",
  settings_field_userIllustrationsCacheTtlMs_label: "用户作品列表有效期",
  settings_field_userIllustrationsCacheTtlMs_desc:
    "Session Storage 用户作品列表缓存有效期",
  settings_field_ugoiraCacheTtlMs_label: "动图帧缓存有效期",
  settings_field_ugoiraCacheTtlMs_desc: "IndexedDB 动图帧缓存有效期",
  settings_field_ugoiraCacheMaxEntries_label: "动图帧缓存作品数上限",
  settings_field_ugoiraCacheMaxEntries_desc:
    "IndexedDB 动图帧表最多保留的作品数",
  settings_field_ugoiraCacheMaxBytes_label: "动图帧缓存空间上限",
  settings_field_ugoiraCacheMaxBytes_desc:
    "IndexedDB 动图帧总占用上限（换算为字节需为正整数）",
  settings_field_localTagMetadataCacheTtlMs_label: "本地标签详情有效期",
  settings_field_localTagMetadataCacheTtlMs_desc:
    "本地标签摘要与缩略图缓存有效期",
  settings_field_tagTranslationCacheTtlMs_label: "标签翻译缓存有效期",
  settings_field_tagTranslationCacheTtlMs_desc: "标签中文翻译缓存有效期",
  settings_field_tagTranslationCacheMaxEntries_label: "标签翻译缓存容量",
  settings_field_tagTranslationCacheMaxEntries_desc:
    "至少 2 条；超限时按容量一半向下取整淘汰最旧条目",

  settings_field_completedDownloadsMaxEntries_label: "已完成下载记录上限",
  settings_field_completedDownloadsMaxEntries_desc:
    "后续记录写入或更新时淘汰超出上限的旧已完成记录",
  settings_field_retryableDownloadsMaxEntries_label: "可重试下载记录上限",
  settings_field_retryableDownloadsMaxEntries_desc:
    "后续记录写入或更新时淘汰超出上限的旧失败/中断记录",
  settings_field_downloadProgressPersistMs_label: "进度持久化间隔",
  settings_field_downloadProgressPersistMs_desc:
    "下载进度写入共享存储的最小间隔（不能大于心跳间隔）",
  settings_field_downloadHeartbeatMs_label: "下载心跳间隔",
  settings_field_downloadHeartbeatMs_desc:
    "刷新活动下载存活时间与检查失联的间隔（必须小于失联判定时间）",
  settings_field_downloadOwnerTimeoutMs_label: "下载失联判定时间",
  settings_field_downloadOwnerTimeoutMs_desc:
    "超过该时长未更新状态的活动下载视为已中断（必须大于心跳间隔）",

  settings_field_requestRetryIntervalMs_label: "请求重试间隔",
  settings_field_requestRetryIntervalMs_desc: "每次重试等待时间（最短 1 秒）",
  settings_field_requestMaxAttempts_label: "最大尝试次数",
  settings_field_requestMaxAttempts_desc:
    "包含首次请求；留空或填“不限”表示持续重试",
  settings_field_requestMaxAttempts_placeholder: "留空表示不限",
  settings_field_tagRequestTimeoutMs_label: "标签请求超时",
  settings_field_tagRequestTimeoutMs_desc:
    "标签详情与翻译接口单次请求的超时时间",
  settings_field_ugoiraChunkBytes_label: "动图下载分块大小",
  settings_field_ugoiraChunkBytes_desc:
    "未命中帧缓存时分段下载动图压缩包的分块大小（至少 65536 字节）",
  settings_field_ugoiraTrailerBytes_label: "动图尾部探测大小",
  settings_field_ugoiraTrailerBytes_desc:
    "读取动图 ZIP 中央目录的尾部探测长度（至少 22 字节）",

  settings_field_databaseOpenTimeoutMs_label: "数据库打开超时",
  settings_field_databaseOpenTimeoutMs_desc:
    "等待 IndexedDB 连接打开的最大时长",
  settings_field_domProbeIntervalMs_label: "通用 DOM 探测间隔",
  settings_field_domProbeIntervalMs_desc: "等待页面异步节点渲染的探测间隔",
  settings_field_domProbeMaxAttempts_label: "通用 DOM 探测次数",
  settings_field_domProbeMaxAttempts_desc: "包含首次探测在内的最大尝试次数",
  settings_field_toolbarProbeIntervalMs_label: "工具栏探测间隔",
  settings_field_toolbarProbeIntervalMs_desc:
    "等待页面自带工具栏渲染的探测间隔",
  settings_field_toolbarProbeMaxAttempts_label: "工具栏探测次数",
  settings_field_toolbarProbeMaxAttempts_desc:
    "等待页面自带工具栏的最大尝试次数",
  settings_field_localTagRenderDebounceMs_label: "标签界面更新防抖",
  settings_field_localTagRenderDebounceMs_desc:
    "DOM 变动后刷新本地标签入口的防抖延迟",
  settings_field_localTagPersistDelayMs_label: "本地标签延迟保存",
  settings_field_localTagPersistDelayMs_desc:
    "合并标签编辑写入存储的延迟，调整时不丢失待保存数据",
  settings_field_cacheCleanupIdleTimeoutMs_label: "空闲缓存清理最长等待",
  settings_field_cacheCleanupIdleTimeoutMs_desc:
    "浏览器空闲回调清理持久化缓存的最大等待时长",

  settings_err_required: "请输入数值，不能为空",
  settings_err_number: "请输入有效的有限数值",
  settings_err_integer: "必须为整数",
  settings_err_positive: "必须大于 0",
  settings_err_nonNegative: "不能小于 0",
  settings_err_min: "不能小于 %1",
  settings_err_option: "请选择有效的选项",
  settings_err_progressExceedsHeartbeat: "不能大于下载心跳间隔",
  settings_err_timeoutNotGreaterThanHeartbeat: "必须大于下载心跳间隔",
};

export default Texts;
