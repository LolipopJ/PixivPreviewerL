import { Lang } from "../enums";

const Texts = {} as Record<Lang, Record<string, string>>;

Texts[Lang.zh_CN] = {
  // 安装或更新后弹出的提示
  install_title: "欢迎使用 Pixiv Previewer by Lolipop v",
  install_body:
    '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><p>欢迎反馈问题和提出建议！><a style="color: skyblue;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback" target="_blank">反馈页面</a><</p><br><p>如果您是第一次使用，推荐到<a style="color: skyblue;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer" target="_blank"> 详情页 </a>查看脚本介绍。</p></div>',
  upgrade_body: `<div>
  <p>
    本脚本基于
    <a
      style="color: skyblue"
      href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer"
      target="_blank"
      >Pixiv Previewer</a
    >
    二次开发，旨在满足开发者自己需要的能力。
  </p>
  <br />
  <p>
    如果想要提出建议，请前往原脚本的<a
      style="color: skyblue"
      href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback"
      target="_blank"
      >反馈页面</a
    >或开启一个新的
    <a
      style="color: skyblue"
      href="https://github.com/Ocrosoft/PixivPreviewer/issues"
      target="_blank"
      >Github 议题</a
    >！
  </p>
</div>`,
  // 设置项
  setting_language: "语言",
  setting_preview: "预览",
  setting_animePreview: "动图预览",
  setting_sort: "排序（仅搜索页生效）",
  setting_anime: "动图下载（动图预览及详情页生效）",
  setting_origin: "预览时优先显示原图（慢）",
  setting_previewDelay: "延迟显示预览图（毫秒）",
  setting_previewByKey: "使用按键控制预览图展示（Ctrl）",
  setting_previewByKeyHelp:
    "开启后鼠标移动到图片上不再展示预览图，按下Ctrl键才展示，同时“延迟显示预览”设置项不生效。",
  setting_maxPage: "每次排序时统计的最大页数",
  setting_hideWork: "隐藏收藏数少于设定值的作品",
  setting_hideAiWork: "隐藏 AI 生成作品",
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
  // 搜索时过滤值太高
  sort_noWork: "没有可以显示的作品（隐藏了 %1 个作品）",
  sort_getWorks: "正在获取第 %1/%2 页作品",
  sort_getBookmarkCount: "获取收藏数：%1/%2",
  sort_getPublicFollowing: "获取公开关注画师",
  sort_getPrivateFollowing: "获取私有关注画师",
  sort_filtering: "过滤%1收藏量低于%2的作品",
  sort_filteringHideFavorite: "已收藏和",
  sort_fullSizeThumb: "全尺寸缩略图（搜索页、用户页）",
  // 小说排序
  nsort_getWorks: "正在获取第 1%/2% 页作品",
  nsort_sorting: "正在按收藏量排序",
  nsort_hideFav: "排序时隐藏已收藏的作品",
  nsort_hideFollowed: "排序时隐藏已关注作者作品",
  text_sort: "排序",
};

// translate by google
Texts[Lang.en_US] = {
  install_title: "Welcome to PixivPreviewerL v",
  install_body:
    '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><p>Feedback questions and suggestions are welcome! ><a style="color: skyblue;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback" target="_blank">Feedback Page</a><</p><br><p>If you are using it for the first time, it is recommended to go to the<a style="color: skyblue;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer" target="_blank"> Details Page </a>to see the script introduction.</p></div>',
  upgrade_body: Texts[Lang.zh_CN].upgrade_body,
  setting_language: "Language",
  setting_preview: "Preview",
  setting_animePreview: "Animation preview",
  setting_sort: "Sorting (Search page)",
  setting_anime: "Animation download (Preview and Artwork page)",
  setting_origin: "Display original image when preview (slow)",
  setting_previewDelay: "Delay of display preview image(Million seconds)",
  setting_previewByKey: "Use keys to control the preview image display (Ctrl)",
  setting_previewByKeyHelp:
    'After enabling it, move the mouse to the picture and no longer display the preview image. Press the Ctrl key to display it, and the "Delayed Display Preview" setting item does not take effect.',
  setting_maxPage: "Maximum number of pages counted per sort",
  setting_hideWork: "Hide works with bookmark count less than set value",
  setting_hideAiWork: "Hide AI works",
  setting_hideFav: "Hide favorites when sorting",
  setting_hideFollowed: "Hide artworks of followed artists when sorting",
  setting_hideByTag: "Hide artworks by tag",
  setting_hideByTagPlaceholder:
    "Input tag name, multiple tags separated by ','",
  setting_clearFollowingCache: "Cache",
  setting_clearFollowingCacheHelp:
    "The folloing artists info. will be saved locally for one day, if you want to update immediately, please click this to clear cache",
  setting_followingCacheCleared: "Success, please refresh the page.",
  setting_blank: "Open works' details page in new tab",
  setting_turnPage: "Use ← → to turn pages (Search page)",
  setting_save: "Save",
  setting_reset: "Reset",
  setting_resetHint:
    "This will delete all settings and set it to default. Are you sure?",
  setting_novelSort: "Sorting (Novel)",
  setting_novelMaxPage: "Maximum number of pages counted for novel sorting",
  setting_novelHideWork: "Hide works with bookmark count less than set value",
  setting_novelHideFav: "Hide favorites when sorting",
  sort_noWork: "No works to display (%1 works hideen)",
  sort_getWorks: "Getting artworks of page: %1 of %2",
  sort_getBookmarkCount: "Getting bookmark count of artworks：%1 of %2",
  sort_getPublicFollowing: "Getting public following list",
  sort_getPrivateFollowing: "Getting private following list",
  sort_filtering: "Filtering%1works with bookmark count less than %2",
  sort_filteringHideFavorite: " favorited works and ",
  sort_fullSizeThumb:
    "Display not cropped images.(Search page and User page only.)",
  nsort_getWorks: "Getting novels of page: 1% of 2%",
  nsort_sorting: "Sorting by bookmark cound",
  nsort_hideFav: "Hide favorites when sorting",
  nsort_hideFollowed: "Hide artworks of followed authors when sorting",
  text_sort: "sort",
};

// RU: перевод от  vanja-san
Texts[Lang.ru_RU] = {
  install_title: "Добро пожаловать в PixivPreviewerL v",
  install_body:
    '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><p>Вопросы и предложения приветствуются! ><a style="color: skyblue;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback" target="_blank">Страница обратной связи</a><</p><br><p>Если вы используете это впервые, рекомендуется перейти к<a style="color: skyblue;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer" target="_blank"> Странице подробностей </a>, чтобы посмотреть введение в скрипт.</p></div>',
  upgrade_body: Texts[Lang.zh_CN].upgrade_body,
  setting_language: "Язык",
  setting_preview: "Предпросмотр",
  setting_animePreview: Texts[Lang.en_US].setting_animePreview,
  setting_sort: "Сортировка (Страница поиска)",
  setting_anime: "Анимация скачивания (Страницы предпросмотра и Artwork)",
  setting_origin:
    "При предпросмотре, показывать изображения с оригинальным качеством (медленно)",
  setting_previewDelay:
    "Задержка отображения предпросмотра изображения (Миллион секунд)",
  setting_previewByKey: Texts[Lang.en_US].setting_previewByKey,
  setting_previewByKeyHelp: Texts[Lang.en_US].setting_previewByKeyHelp,
  setting_maxPage:
    "Максимальное количество страниц, подсчитанных за сортировку",
  setting_hideWork:
    "Скрыть работы с количеством закладок меньше установленного значения",
  setting_hideAiWork: Texts[Lang.en_US].setting_hideAiWork,
  setting_hideFav: "При сортировке, скрыть избранное",
  setting_hideFollowed:
    "При сортировке, скрыть работы художников на которых подписаны",
  setting_hideByTag: Texts[Lang.en_US].setting_hideByTag,
  setting_hideByTagPlaceholder: Texts[Lang.en_US].setting_hideByTagPlaceholder,
  setting_clearFollowingCache: "Кэш",
  setting_clearFollowingCacheHelp:
    "Следующая информация о художниках будет сохранена локально в течение одного дня, если вы хотите обновить её немедленно, нажмите на эту кнопку, чтобы очистить кэш",
  setting_followingCacheCleared: "Готово, обновите страницу.",
  setting_blank: "Открывать страницу с описанием работы на новой вкладке",
  setting_turnPage:
    "Использовать ← → для перелистывания страниц (Страница поиска)",
  setting_save: "Сохранить",
  setting_reset: "Сбросить",
  setting_resetHint:
    "Это удалит все настройки и установит их по умолчанию. Продолжить?",
  setting_novelSort: Texts[Lang.en_US].setting_novelSort,
  setting_novelMaxPage: Texts[Lang.en_US].setting_novelMaxPage,
  setting_novelHideWork:
    "Скрыть работы с количеством закладок меньше установленного значения",
  setting_novelHideFav: "При сортировке, скрыть избранное",
  sort_noWork: "Нет работ для отображения (%1 works hidden)",
  sort_getWorks: "Получение иллюстраций страницы: %1 из %2",
  sort_getBookmarkCount: "Получение количества закладок artworks：%1 из %2",
  sort_getPublicFollowing: "Получение публичного списка подписок",
  sort_getPrivateFollowing: "Получение приватного списка подписок",
  sort_filtering: "Фильтрация %1 работ с количеством закладок меньше чем %2",
  sort_filteringHideFavorite: " избранные работы и ",
  sort_fullSizeThumb:
    "Показать неотредактированное изображение (Страницы поиска и Artwork)",
  nsort_getWorks: Texts[Lang.en_US].nsort_getWorks,
  nsort_sorting: Texts[Lang.en_US].nsort_sorting,
  nsort_hideFav: Texts[Lang.en_US].nsort_hideFav,
  nsort_hideFollowed: Texts[Lang.en_US].nsort_hideFollowed,
  text_sort: Texts[Lang.en_US].text_sort,
};

Texts[Lang.ja_JP] = {
  install_title: "Welcome to PixivPreviewerL v",
  install_body:
    '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><pご意見や提案は大歓迎です! ><a style="color: skyblue;" href="https://greasyfork.org/ja/scripts/30766-pixiv-previewer/feedback" target="_blank">フィードバックページ</a><</p><br><p>初めて使う場合は、<a style="color: skyblue;" href="https://greasyfork.org/ja/scripts/30766-pixiv-previewer" target="_blank"> 詳細ページ </a>でスクリプトの紹介を見ることをお勧めします。</p></div>',
  upgrade_body: Texts[Lang.zh_CN].upgrade_body,
  setting_language: "言語",
  setting_preview: "プレビュー機能",
  setting_animePreview: "うごイラプレビュー",
  setting_sort: "ソート",
  setting_anime: "うごイラダウンロード",
  setting_origin: "最大サイズの画像を表示する(遅くなる可能性がある)",
  setting_previewDelay: "カーソルを重ねてからプレビューするまでの遅延(ミリ秒)",
  setting_previewByKey: "キーでプレビュー画像の表示を制御する (Ctrl)",
  setting_previewByKeyHelp:
    'これを有効にすると、画像にマウスを移動してもプレビュー画像が表示されなくなります。Ctrlキーを押すと表示され、 "遅延表示プレビュー" の設定項目は無効になります。',
  setting_maxPage: "ソートするときに取得する最大ページ数",
  setting_hideWork: "一定以下のブクマーク数の作品を非表示にする",
  setting_hideAiWork: "AIの作品を非表示にする",
  setting_hideFav: "ブックマーク数をソート時に非表示にする",
  setting_hideFollowed: "ソート時にフォローしているアーティストの作品を非表示",
  setting_hideByTag: Texts[Lang.en_US].setting_hideByTag,
  setting_hideByTagPlaceholder: Texts[Lang.en_US].setting_hideByTagPlaceholder,
  setting_clearFollowingCache: "キャッシュ",
  setting_clearFollowingCacheHelp:
    "フォローしているアーティストの情報がローカルに1日保存されます。すぐに更新したい場合は、このキャッシュをクリアしてください。",
  setting_followingCacheCleared: "成功しました。ページを更新してください。",
  setting_blank: "作品の詳細ページを新しいタブで開く",
  setting_turnPage: "← → を使用してページをめくる（検索ページ）",
  setting_save: "Save",
  setting_reset: "Reset",
  setting_resetHint:
    "これにより、すべての設定が削除され、デフォルトに設定されます。よろしいですか？",
  setting_novelSort: "ソート（小説）",
  setting_novelMaxPage: "小説のソートのページ数の最大値",
  setting_novelHideWork: "設定値未満のブックマーク数の作品を非表示",
  setting_novelHideFav: "ソート時にお気に入りを非表示",
  sort_noWork: "表示する作品がありません（%1 作品が非表示）",
  sort_getWorks: "ページの作品を取得中：%1 / %2",
  sort_getBookmarkCount: "作品のブックマーク数を取得中：%1 / %2",
  sort_getPublicFollowing: "公開フォロー一覧を取得中",
  sort_getPrivateFollowing: "非公開フォロー一覧を取得中",
  sort_filtering: "ブックマーク数が%2未満の作品%1件をフィルタリング",
  sort_filteringHideFavorite: " お気に入り登録済みの作品および  ",
  sort_fullSizeThumb:
    "トリミングされていない画像を表示（検索ページおよびユーザーページのみ）。",
  nsort_getWorks: "小説のページを取得中：1% / 2%",
  nsort_sorting: "ブックマーク数で並べ替え",
  nsort_hideFav: "ソート時にお気に入りを非表示",
  nsort_hideFollowed: "ソート時にフォロー済み作者の作品を非表示",
  text_sort: "ソート",
};

export default Texts;
