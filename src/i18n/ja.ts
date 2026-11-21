import type { Messages } from "./zh";

export default {
  install_title: "Pixiv Previewer L v%1 へようこそ",
  upgrade_body:
    "<p>このスクリプトは、開発者自身の使い方に合わせて %1 を改変したものです。元のスクリプトへのご意見やご提案は %2 または %3 からお寄せください。</p><p>このスクリプトの更新内容は %4 をご覧ください。</p>",
  upgrade_feedback: "Greasy Fork のフィードバックページ",
  upgrade_issue: "GitHub の Issue",
  upgrade_versions: "バージョン履歴",
  close: "閉じる",
  setting_clearFollowingCache: "キャッシュを削除",
  setting_clearFollowingCacheHelp:
    "作品詳細、各ページの画像情報、うごイラのフレーム、タグ情報をキャッシュしています。削除すると、次回のアクセス時に再取得します。\n\nキャッシュを削除しますか？",
  setting_followingCacheCleared:
    "キャッシュを削除しました。ページを再読み込みしてください。",
  setting_clearCacheFailed:
    "一部のキャッシュを削除できませんでした。しばらくしてから再試行してください。",
  cache_usage: "キャッシュ使用状況",
  cache_usageHelp:
    "作品詳細 %1 件 · ページ画像情報 %2 件 · うごイラフレーム %3 件（%4）· タグ翻訳 %5 件",

  label_sort: "作品を並べ替え",
  label_sorting: "作品を並べ替え中",
  label_nextPage: "次のページへ",
  label_hideFav: "ブックマーク済みの作品を非表示",
  sort_failed: "作品を並べ替えられませんでした",
  sort_listMissing: "並べ替え対象の作品一覧が見つかりませんでした。",
  sort_listAmbiguous:
    "作品一覧が %1 件見つかったため、並べ替え対象を特定できません。",
  sort_reportIssue: "GitHub の Issue ページで報告",
  sort_getUserWorks: "このユーザーの作品を取得中…",
  sort_getWorks: "%1 ページ目の作品を取得中…",
  sort_retryWorks: "%1 ページ目の作品を再取得中（%2 回目）…",
  sort_getDetails: "作品詳細を取得中（%1/%2）…",
  sort_filtering: "作品を絞り込み中…",
  sort_sorting: "絞り込んだ作品を並べ替え中…",
  preview_original: "原寸画像",
  preview_ugoira: "うごイラ",
  artwork_aiGenerated: "AI生成",
  artwork_aiAssisted: "AI補助",

  download_title: "ダウンロード履歴",
  download_close: "ダウンロード履歴を閉じる",
  download_clearCompleted: "完了した履歴を消去",
  download_clearCompletedHelp: "完了したダウンロードの履歴を消去",
  download_retryFailed: "失敗したダウンロードをすべて再試行",
  download_moreActions: "その他の操作",
  download_ignoreRetryable: "再試行待ちの履歴をすべて消去",
  download_ignoreRetryableHelp: "失敗・中断したダウンロードの履歴をすべて消去",
  download_list: "画像ダウンロード一覧",
  download_empty:
    "ダウンロード履歴はありません。プレビューの「原寸画像」からダウンロードできます。",
  download_summary: "ダウンロード中 %1 件 · 完了 %2 件 · 再試行待ち %3 件",
  download_progress: "%1 のダウンロード進捗",
  download_abort: "%1 のダウンロードを中止",
  download_retry: "%1 のダウンロードを再試行",
  download_remove: "%1 の履歴を削除",
  download_downloading: "ダウンロード中",
  download_downloadingHere: "ダウンロード中 %1",
  download_downloadingElsewhere: "別のタブでダウンロード中 %1",
  download_completed: "ダウンロード済み",
  download_interrupted:
    "ダウンロードが中断されました。再試行ボタンでもう一度ダウンロードできます。",
  download_failed: "ダウンロードに失敗しました（%1）",
  download_errorNetwork: "ネットワークエラー",
  download_errorTimeout: "ダウンロードがタイムアウトしました",
  download_errorCanceled: "ダウンロードがキャンセルされました",

  tag_details: "タグ詳細",
  tag_openPreview: "プレビュー中の作品を新しいタブで開く",
  tag_adding: "追加中…",
  tag_addFailed: "タグを追加できませんでした。クリックして再試行してください。",
  tag_add: "ローカルタグに追加",
  tag_total: "イラスト・マンガの合計 %1 件",
  tag_totalAdded: "イラスト・マンガの合計 %1 件（%2 件増加）",
  tag_totalRemoved: "イラスト・マンガの合計 %1 件（%2 件減少）",
  tag_loadingDetails: "タグ詳細を読み込み中…",
  tag_noDescription: "タグの説明はありません",
  tag_thumbnail: "%1 のサムネイル",
  tag_loadFailed:
    "タグ詳細を読み込めませんでした。しばらくしてから、タグにもう一度カーソルを合わせてください。",
  tag_manage: "ローカルタグの管理",
  tag_autoSort: "自動で並べ替え（アクセス回数が多い順）",
  tag_empty:
    "ローカルタグはまだありません。タグにカーソルを合わせて「ローカルタグに追加」を選んでください。",
  tag_visits: "アクセス %1 回",
  tag_dragSort: "ドラッグして並べ替え",
  tag_reorder: "%1 の順序を変更",
  tag_labelPlaceholder: "覚えやすい名前を入力",
  tag_label: "%1 の表示名",
  tag_saveLabel: "表示名を保存",
  tag_moveUp: "上に移動",
  tag_moveDown: "下に移動",
  tag_moveUpNamed: "%1 を上に移動",
  tag_moveDownNamed: "%1 を下に移動",
  tag_remove: "%1 を削除",

  settings_title: "設定",
  settings_save: "保存",
  settings_restoreDefault: "初期値に戻す",
  settings_revertToPrevious: "変更前に戻す",
  settings_restoreField: "%1 を初期値に戻す",
  settings_revertField: "%1 を変更前に戻す",
  settings_restoreAll: "すべて初期値に戻す",
  settings_confirmDiscard: "未保存の変更があります。変更を破棄して閉じますか？",
  settings_saveSuccess: "設定を保存して反映しました。",
  settings_saveFailed: "設定を保存できませんでした（%1）",
  settings_saveStorageError:
    "ローカルストレージに書き込めなかったため、設定は変更されていません。",
  settings_validationFailed: "%1 の値を確認してください（%2）",

  settings_group_general: "一般設定",
  settings_group_preview: "作品プレビュー",
  settings_group_sort: "作品の並べ替え",
  settings_group_localTags: "ローカルタグ",
  settings_advancedToggle: "詳細設定",
  settings_group_cache: "キャッシュ",
  settings_group_download: "ダウンロード管理",
  settings_group_network: "ネットワーク",
  settings_group_scheduling: "内部処理のスケジュール",

  settings_unit_ms: "ミリ秒",
  settings_unit_s: "秒",
  settings_unit_hour: "時間",
  settings_unit_day: "日",
  settings_unit_pages: "ページ",
  settings_unit_bookmarks: "ブックマーク",
  settings_unit_images: "枚",
  settings_unit_entries: "件",
  settings_unit_works: "作品",
  settings_unit_mib: "MiB",
  settings_unit_bytes: "バイト",
  settings_unit_times: "回",

  settings_field_language_label: "表示言語",
  settings_field_language_desc:
    "スクリプト UI の表示言語です。初期設定ではページの言語に従い、未対応の言語では英語を使用します。",
  settings_option_languageAuto: "ページの言語に従う",

  settings_field_enablePreview_label: "作品プレビューを有効にする",
  settings_field_enablePreview_desc:
    "オフにすると、作品とうごイラのプレビューが表示されなくなります。",
  settings_field_enableAnimePreview_label: "うごイラをプレビュー",
  settings_field_enableAnimePreview_desc:
    "作品プレビューが有効なときに使えます。",
  settings_field_previewDelay_label: "ホバー時の待ち時間",
  settings_field_previewDelay_desc:
    "画像にカーソルを合わせてからプレビューが表示されるまでの時間です。",
  settings_field_linkBlank_label: "作品を新しいタブで開く",
  settings_field_linkBlank_desc:
    "作品リンクだけに適用されます。作者とタグのリンクには影響しません。",
  settings_field_previewHoldMs_label: "片手プレビューの長押し時間",
  settings_field_previewHoldMs_desc:
    "マウスボタンを押し続けて片手プレビューモードに入るまでの時間です。",
  settings_field_previewLoadingOverlayDelayMs_label:
    "ページ読み込みオーバーレイの待ち時間",
  settings_field_previewLoadingOverlayDelayMs_desc:
    "ページを切り替えたとき、画像の読み込みが終わっていなければ、指定時間の後にぼかしを表示します。",
  settings_field_previewDownloadNoticeMs_label: "ダウンロード完了表示の時間",
  settings_field_previewDownloadNoticeMs_desc:
    "原寸画像をダウンロードした後、プレビューボタンに完了と表示する時間です。",

  settings_field_pageCount_label: "並べ替えの対象ページ数",
  settings_field_pageCount_desc:
    "ページ数を少なくすると、pixiv のアクセス制限にかかりにくくなります。",
  settings_field_favFilter_label: "ブックマーク数の下限",
  settings_field_favFilter_desc:
    "並べ替え後、このブックマーク数以上の作品を表示します。",
  settings_field_orderType_label: "並べ替え順",
  settings_field_orderType_desc: "並べ替え後に作品を表示する順序です。",
  settings_option_orderByBookmark: "ブックマーク数順",
  settings_option_orderByDate: "投稿日順",
  settings_field_aiFilter_label: "AI生成作品を除外",
  settings_field_aiFilter_desc: "並べ替えの結果から AI生成作品を除外します。",
  settings_field_aiAssistedFilter_label: "AI補助作品を除外",
  settings_field_aiAssistedFilter_desc:
    "並べ替えの結果から AI補助作品を除外します。",
  settings_field_hideFavorite_label: "ブックマーク済みの作品を除外",
  settings_field_hideFavorite_desc:
    "並べ替えの結果からブックマーク済みの作品を除外します。",
  settings_field_hideByTag_label: "タグでの絞り込みを有効にする",
  settings_field_hideByTag_desc:
    "並べ替えの結果から指定したタグの付いた作品を除外します。",
  settings_field_hideByTagList_label: "除外するタグ",
  settings_field_hideByTagList_placeholder:
    "タグを半角カンマ（,）で区切って入力",
  settings_field_hideByTagList_desc:
    "タグでの絞り込みを有効にすると適用されます。タグの前後の空白と大文字・小文字の違いは無視されます。",

  settings_field_enableLocalTags_label: "ローカルタグを有効にする",
  settings_field_enableLocalTags_desc:
    "オフにするとローカルタグの操作部分が非表示になり、集計を停止します。保存済みのタグは保持されます。",
  settings_field_localTagPopoverShowDelayMs_label: "タグ詳細を開くまでの時間",
  settings_field_localTagPopoverShowDelayMs_desc:
    "タグにカーソルを合わせるかフォーカスしてから詳細が表示されるまでの時間です。",
  settings_field_localTagPopoverHideDelayMs_label: "タグ詳細を閉じるまでの時間",
  settings_field_localTagPopoverHideDelayMs_desc:
    "タグまたは詳細のポップアップからカーソルを外してから、ポップアップが閉じるまでの時間です。",

  settings_field_previewPreloadCount_label: "プレビューの先読み枚数",
  settings_field_previewPreloadCount_desc:
    "現在のページを含む先読み枚数です。デコード済み画像のキャッシュ上限はこの枚数の 2 倍です。",
  settings_field_previewCacheMaxEntries_label:
    "プレビューのメモリキャッシュ容量",
  settings_field_previewCacheMaxEntries_desc:
    "プレビューのページ URL と、うごイラのメタデータをメモリにキャッシュする最大件数です。それぞれに適用されます。",
  settings_field_previewDetailsMaxStaleMs_label:
    "プレビュー詳細キャッシュの追加利用時間",
  settings_field_previewDetailsMaxStaleMs_desc:
    "「変化する作品詳細のキャッシュ有効期間」を超えて再利用できる時間です。",
  settings_field_illustrationMutableCacheTtlMs_label:
    "変化する作品詳細のキャッシュ有効期間",
  settings_field_illustrationMutableCacheTtlMs_desc:
    "ブックマーク数や登録状態など、変化する情報の有効期間です。",
  settings_field_illustrationStaticCacheTtlMs_label:
    "固定の作品詳細のキャッシュ有効期間",
  settings_field_illustrationStaticCacheTtlMs_desc:
    "タイトル、タグ、ページ数などの情報をキャッシュする期間です。",
  settings_field_illustrationCacheMaxEntries_label: "作品詳細のキャッシュ容量",
  settings_field_illustrationCacheMaxEntries_desc:
    "IndexedDB に保存する作品詳細の最大件数です。",
  settings_field_newIllustrationNoCacheMs_label:
    "新着作品をキャッシュするまでの時間",
  settings_field_newIllustrationNoCacheMs_desc:
    "投稿から指定時間が経過するまで、その作品の詳細をキャッシュしません。",
  settings_field_illustPagesCacheTtlMs_label:
    "ページ画像情報のキャッシュ有効期間",
  settings_field_illustPagesCacheTtlMs_desc:
    "各ページの画像 URL を IndexedDB にキャッシュする期間です。",
  settings_field_illustPagesCacheMaxEntries_label:
    "ページ画像情報のキャッシュ容量",
  settings_field_illustPagesCacheMaxEntries_desc:
    "IndexedDB に保存するページ画像情報の最大件数です。",
  settings_field_userIllustrationsCacheTtlMs_label:
    "ユーザーの作品一覧のキャッシュ有効期間",
  settings_field_userIllustrationsCacheTtlMs_desc:
    "ユーザーの作品一覧をセッションストレージにキャッシュする期間です。",
  settings_field_ugoiraCacheTtlMs_label: "うごイラフレームのキャッシュ有効期間",
  settings_field_ugoiraCacheTtlMs_desc:
    "うごイラのフレームを IndexedDB にキャッシュする期間です。",
  settings_field_ugoiraCacheMaxEntries_label:
    "うごイラフレームのキャッシュ作品数上限",
  settings_field_ugoiraCacheMaxEntries_desc:
    "フレームを IndexedDB に保存するうごイラの最大作品数です。",
  settings_field_ugoiraCacheMaxBytes_label:
    "うごイラフレームのキャッシュサイズ上限",
  settings_field_ugoiraCacheMaxBytes_desc:
    "IndexedDB に保存するうごイラフレームの合計容量です。バイト換算で正の整数になる値を指定してください。",
  settings_field_localTagMetadataCacheTtlMs_label:
    "ローカルタグ詳細のキャッシュ有効期間",
  settings_field_localTagMetadataCacheTtlMs_desc:
    "ローカルタグの説明とサムネイルをキャッシュする期間です。",
  settings_field_tagTranslationCacheTtlMs_label: "タグ翻訳のキャッシュ有効期間",
  settings_field_tagTranslationCacheTtlMs_desc:
    "タグの中国語訳をキャッシュする期間です。",
  settings_field_tagTranslationCacheMaxEntries_label:
    "タグ翻訳のキャッシュ容量",
  settings_field_tagTranslationCacheMaxEntries_desc:
    "最低 2 件です。上限を超えると、容量の半分（端数切り捨て）の件数を古い順に削除します。",

  settings_field_completedDownloadsMaxEntries_label:
    "完了したダウンロード履歴の上限",
  settings_field_completedDownloadsMaxEntries_desc:
    "履歴を保存または更新するとき、上限を超えた分の古い完了履歴を削除します。",
  settings_field_retryableDownloadsMaxEntries_label:
    "再試行できるダウンロード履歴の上限",
  settings_field_retryableDownloadsMaxEntries_desc:
    "履歴を保存または更新するとき、上限を超えた分の古い失敗・中断履歴を削除します。",
  settings_field_downloadProgressPersistMs_label: "ダウンロード進捗の保存間隔",
  settings_field_downloadProgressPersistMs_desc:
    "進捗を共有ストレージに保存する最短間隔です。ハートビート間隔以下にしてください。",
  settings_field_downloadHeartbeatMs_label: "ダウンロードのハートビート間隔",
  settings_field_downloadHeartbeatMs_desc:
    "実行中のダウンロードを確認し、中断を検知する間隔です。中断判定時間より短くしてください。",
  settings_field_downloadOwnerTimeoutMs_label: "ダウンロードの中断判定時間",
  settings_field_downloadOwnerTimeoutMs_desc:
    "この時間に更新がなければ、ダウンロードを中断とみなします。ハートビート間隔より長くしてください。",

  settings_field_requestRetryIntervalMs_label: "リクエストの再試行間隔",
  settings_field_requestRetryIntervalMs_desc:
    "再試行のたびに待機する時間です（最短 1 秒）。",
  settings_field_requestMaxAttempts_label: "リクエストの最大試行回数",
  settings_field_requestMaxAttempts_desc:
    "最初のリクエストを含みます。空欄または「無制限」で、回数を制限せずに再試行します。",
  settings_field_requestMaxAttempts_placeholder: "空欄で無制限",
  settings_unlimited: "無制限",
  settings_field_tagRequestTimeoutMs_label: "タグ情報リクエストのタイムアウト",
  settings_field_tagRequestTimeoutMs_desc:
    "タグ詳細や翻訳を取得する各リクエストのタイムアウトです。",
  settings_field_ugoiraChunkBytes_label: "うごイラのダウンロード分割サイズ",
  settings_field_ugoiraChunkBytes_desc:
    "フレームがキャッシュされていない場合に、うごイラの ZIP を分割ダウンロードするサイズです（最小 65,536 バイト）。",
  settings_field_ugoiraTrailerBytes_label: "うごイラ ZIP 末尾の読み取りサイズ",
  settings_field_ugoiraTrailerBytes_desc:
    "うごイラ ZIP の中央ディレクトリを探す際に末尾から読み取る長さです（最小 22 バイト）。",

  settings_field_databaseOpenTimeoutMs_label: "データベース接続のタイムアウト",
  settings_field_databaseOpenTimeoutMs_desc:
    "IndexedDB への接続が開くまで待つ最大時間です。",
  settings_field_domProbeIntervalMs_label: "DOM の確認間隔",
  settings_field_domProbeIntervalMs_desc:
    "非同期で表示されるページ要素を確認する間隔です。",
  settings_field_domProbeMaxAttempts_label: "DOM の最大確認回数",
  settings_field_domProbeMaxAttempts_desc: "最初の確認を含めた最大回数です。",
  settings_field_toolbarProbeIntervalMs_label: "ツールバーの確認間隔",
  settings_field_toolbarProbeIntervalMs_desc:
    "pixiv のツールバーが表示されたか確認する間隔です。",
  settings_field_toolbarProbeMaxAttempts_label: "ツールバーの最大確認回数",
  settings_field_toolbarProbeMaxAttempts_desc:
    "pixiv のツールバーを確認する最大回数です。",
  settings_field_localTagRenderDebounceMs_label:
    "ローカルタグ表示の更新待ち時間",
  settings_field_localTagRenderDebounceMs_desc:
    "DOM の変更が落ち着いてからローカルタグの操作部分を更新するまでの待ち時間です。",
  settings_field_localTagPersistDelayMs_label:
    "ローカルタグを保存するまでの時間",
  settings_field_localTagPersistDelayMs_desc:
    "タグの編集をまとめて保存するまでの待ち時間です。この値を変えても保存待ちの編集は保持されます。",
  settings_field_cacheCleanupIdleTimeoutMs_label:
    "アイドル時のキャッシュ整理までの最大待ち時間",
  settings_field_cacheCleanupIdleTimeoutMs_desc:
    "永続キャッシュを整理するために、ブラウザーのアイドルコールバックを待つ最大時間です。",

  settings_err_required: "値を入力してください。",
  settings_err_number: "有限の数値を入力してください。",
  settings_err_integer: "整数を入力してください。",
  settings_err_positive: "0 より大きい値を入力してください。",
  settings_err_nonNegative: "0 以上の値を入力してください。",
  settings_err_min: "%1 以上にしてください。",
  settings_err_option: "有効な項目を選択してください。",
  settings_err_progressExceedsHeartbeat:
    "ダウンロードのハートビート間隔以下にしてください。",
  settings_err_timeoutNotGreaterThanHeartbeat:
    "ダウンロードのハートビート間隔より長くしてください。",
} satisfies Messages;
