import { Lang } from "../enums";

const Texts = {} as Record<Lang, Record<string, string>>;

Texts[Lang.zh_CN] = {
  // 安装或更新后弹出的提示
  install_title: "欢迎使用 Pixiv Previewer ",
  install_body:
    '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><p style="text-indent: 2em;">欢迎反馈问题和提出建议！><a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback" target="_blank">反馈页面</a><</p><br><p style="text-indent: 2em;">如果您是第一次使用，推荐到<a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer" target="_blank"> 详情页 </a>查看脚本介绍。</p></div>',
  upgrade_body:
    "<h3>（重要）关于排序功能</h3>&nbsp&nbsp首先感谢各位的使用，由于最近比较忙，抱歉现在才做出回应。如果各位最近使用过排序功能，可能或多或少都遇到过搜索结果为 0 的问题，下面简单说一下原因和后续的应对方案。<br>&nbsp&nbsp脚本的原理是获取指定页面内所有作品的收藏量，再进行排序。Pixiv 最近对短时间内获取作品信息进行了次数限制，表现为所有请求返回错误，导致显示 0 个作品。以排序三页为例，由于没有批量接口，脚本会向 Pixiv 请求多达 180 个作品的收藏量数据，这对一般限制每分钟访问 30~60 次的请求限制来说非常多了，所以也希望大家能够理解 Pixiv 的做法，同时不要将页数设置得太大。<br>&nbsp&nbsp至于应对方案，目前有以下几种：<ul><li>1.遵循接口限制，可能排序一页要花费一分钟。</li><li>2.使用第三方服务，目前看来也没有服务能够提供批量，或者能顶得住这么多请求的。</li><li>3.用服务器提供收藏量的短时间缓存，并遵循接口限制，成本和风险很高。</li><li>禁用脚本的排序功能。</li></ul>&nbsp&nbsp最后再次感谢大家的使用，如果对上述问题有好的建议，欢迎在 GreasyFork/Github 上提出。最后的最后，这个版本目前可以正常使用排序功能，如果后面突然无法正常使用或者关闭了排序功能，也希望各位能够理解。",
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
  sort_getWorks: "正在获取第%1/%2页作品",
  sort_getBookmarkCount: "获取收藏数：%1/%2",
  sort_getPublicFollowing: "获取公开关注画师",
  sort_getPrivateFollowing: "获取私有关注画师",
  sort_filtering: "过滤%1收藏量低于%2的作品",
  sort_filteringHideFavorite: "已收藏和",
  sort_fullSizeThumb: "全尺寸缩略图（搜索页、用户页）",
  // 小说排序
  nsort_getWorks: "正在获取第1%/2%页作品",
  nsort_sorting: "正在按收藏量排序",
  nsort_hideFav: "排序时隐藏已收藏的作品",
  nsort_hideFollowed: "排序时隐藏已关注作者作品",
  text_sort: "排序",
};

// translate by google
Texts[Lang.en_US] = {
  install_title: "Welcome to PixivPreviewer v",
  install_body:
    '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><p style="text-indent: 2em;">Feedback questions and suggestions are welcome! ><a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback" target="_blank">Feedback Page</a><</p><br><p style="text-indent: 2em;">If you are using it for the first time, it is recommended to go to the<a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer" target="_blank"> Details Page </a>to see the script introduction.</p></div>',
  upgrade_body:
    "<h3>(Important) About the sorting function</h3>&nbsp&nbspFirst of all, thank you for using it. I'm very busy recently, so I'm sorry to respond now. If you have used the sorting function recently, you may have encountered the problem that the search result is 0 more or less. Let me briefly explain the reasons and follow-up solutions. <br>&nbsp&nbsp The principle of the script is to obtain the collections of all works in the specified page, and then sort them. Pixiv recently limited the number of times to obtain work information in a short period of time, which showed that all requests returned errors, resulting in the display of 0 works. Taking sorting three pages as an example, since there is no batch interface, the script will request the collection data of up to 180 works from Pixiv, which is very much for the general limit of 30~60 visits per minute, so I hope You can understand Pixiv's approach, and don't make the page count too large. <br>&nbsp&nbsp As for the solutions, there are currently the following: <ul><li>1. Following the interface restrictions, it may take a minute to sort a page. </li><li>2. Using third-party services, it seems that there is no service that can provide batches, or can withstand so many requests. </li><li>3. It is costly and risky to use the server to provide a short-term cache of collections and follow interface restrictions. </li><li>Disable sorting of scripts. </li></ul>&nbsp&nbsp Finally, thank you again for your use. If you have good suggestions for the above problems, you are welcome to put forward them on GreasyFork/Github. Finally, the sorting function can be used normally in this version. If the sorting function suddenly cannot be used normally or the sorting function is turned off, I hope you can understand.",
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
  install_title: "Добро пожаловать в PixivPreviewer v",
  install_body:
    '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><p style="text-indent: 2em;">Вопросы и предложения приветствуются! ><a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback" target="_blank">Страница обратной связи</a><</p><br><p style="text-indent: 2em;">Если вы используете это впервые, рекомендуется перейти к<a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer" target="_blank"> Странице подробностей </a>, чтобы посмотреть введение в скрипт.</p></div>',
  upgrade_body: Texts[Lang.en_US].upgrade_body,
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
  install_title: "Welcome to PixivPreviewer v",
  install_body:
    '<div style="position: absolute;left: 50%;top: 30%;font-size: 20px; color: white;transform:translate(-50%,0);"><p style="text-indent: 2em;"ご意見や提案は大歓迎です! ><a style="color: green;" href="https://greasyfork.org/ja/scripts/30766-pixiv-previewer/feedback" target="_blank">フィードバックページ</a><</p><br><p style="text-indent: 2em;">初めて使う場合は、<a style="color: green;" href="https://greasyfork.org/ja/scripts/30766-pixiv-previewer" target="_blank"> 詳細ページ </a>でスクリプトの紹介を見ることをお勧めします。</p></div>',
  upgrade_body:
    "<h3>(注意！) 並べ替え機能について</h3>&nbsp&nbspご利用いただきありがとうございます。最近はとても忙しく、返信が遅れてしまい申し訳ありません。最近並べ替え機能を使っている場合、検索結果が0になることがあるかもしれません。その理由と対策を簡単に説明させていただきます。 <br>&nbsp&nbsp このスクリプトは、指定されたページ内のすべての作品のコレクションを取得し、それらを並べ替えるのものです。最近、Pixivは短時間に作品情報を取得する回数を制限し、すべてのリクエストがエラーを返すことがあり、検索結果が0件と表示されることがあります。例えば、3ページを並べ替える場合、スクリプトは最大180件の作品のコレクションデータをPixivからリクエストすることになりますが、一般的には30〜60回/分の制限があるため、Pixivの仕様を理解していただき、これを回避するため一気にソートするページの値をを大きくしないでください。  <br>&nbsp&nbsp 解決策として、現在以下のような方法を考えています：<ul><li>1. インターフェイスの制限に従って、1ページのソートに1分ほどかかることがあります。</li><li>2. サードパーティのサービスを利用するものの、バッチ処理ができるサービスがないようですし、それだけのリクエストに耐えられるものもなさそうです。</li><li>3. サーバーを使ってコレクションの短期キャッシュを提供し、インターフェイスの制限に従うことは、コストがかかる上にリスクも伴います。</li><li>スクリプトのソート機能を無効にする。</li></ul>&nbsp&nbsp 最後に、改めてご利用いただきありがとうございます。上記の問題について良い提案があれば、GreasyFork/Githubでお気軽に提案してください。最後に、このバージョンではソート機能が正常に使用できます。ただし、ソート機能が突然正常に使用できなくなったり、ソート機能がオフになった場合は、ご理解いただけると幸いです。",
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
