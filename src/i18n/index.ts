const Texts = {
  install_title: "欢迎使用 Pixiv Previewer (LolipopJ Edition) v",
  upgrade_body: `<div>
  <p style="line-height: 1.6;">
    本脚本基于
    <a
      style="color: skyblue"
      href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer"
      target="_blank"
      >Pixiv Previewer</a
    >
    二次开发，旨在满足开发者自己需要的能力。如果您有不错的想法或建议，请前往原脚本的
    <a
      style="color: skyblue"
      href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback"
      target="_blank"
      >Greasy Fork 反馈页面</a
    >或开启一个新的
    <a
      style="color: skyblue"
      href="https://github.com/Ocrosoft/PixivPreviewer/issues"
      target="_blank"
      >Github 议题</a
    >！
  </p>
</div>
`,
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
    "关注画师信息会在本地保存一天，如果希望立即更新，请点击清除缓存",
  setting_followingCacheCleared: "已清除缓存，请刷新页面。",
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
};

export default Texts;
