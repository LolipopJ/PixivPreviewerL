import type { Messages } from "./zh";

export default {
  install_title: "Pixiv Previewer L v%1에 오신 것을 환영합니다",
  upgrade_body:
    "<p>이 스크립트는 개발자의 사용 방식에 맞춰 %1를 수정한 버전입니다. 원본 스크립트에 대한 의견이나 제안은 %2 또는 %3을 통해 보내 주세요.</p><p>이 스크립트의 변경 사항은 %4에서 확인할 수 있습니다.</p>",
  upgrade_feedback: "Greasy Fork 피드백 페이지",
  upgrade_issue: "GitHub 이슈",
  upgrade_versions: "버전 기록",
  close: "닫기",
  setting_clearFollowingCache: "캐시 지우기",
  setting_clearFollowingCacheHelp:
    "작품 상세 정보, 페이지별 이미지 정보, 우고이라 프레임, 태그 정보가 캐시되어 있습니다. 캐시를 지우면 다음에 필요할 때 다시 가져옵니다.\n\n캐시를 지울까요?",
  setting_followingCacheCleared:
    "캐시를 지웠습니다. 페이지를 새로고침해 주세요.",
  setting_clearCacheFailed:
    "일부 캐시를 지우지 못했습니다. 잠시 후 다시 시도해 주세요.",
  cache_usage: "캐시 사용량",
  cache_usageHelp:
    "작품 상세 정보 %1개 · 페이지별 이미지 정보 %2개 · 우고이라 프레임 %3개(%4) · 태그 번역 %5개",

  label_sort: "작품 정렬",
  label_sorting: "작품 정렬 중",
  label_nextPage: "다음 페이지로 이동",
  label_hideFav: "북마크한 작품 숨기기",
  sort_failed: "작품을 정렬하지 못했습니다",
  sort_listMissing: "정렬할 작품 목록을 찾을 수 없습니다.",
  sort_listAmbiguous: "작품 목록이 %1개 있어 정렬 대상을 확인할 수 없습니다.",
  sort_nextPageNotReady: "다음 페이지의 작품 목록을 불러오지 못했습니다.",
  sort_emptyWorksPage:
    "Pixiv가 %1페이지의 빈 작품 목록을 반환하여 정렬을 중단했습니다.",
  sort_invalidWorksResponse:
    "Pixiv의 작품 목록 데이터 형식이 올바르지 않습니다.",
  sort_reportIssue: "GitHub 이슈 페이지에서 문제 신고",
  sort_rateLimited: "Pixiv 요청 제한(HTTP 429)",
  sort_rateLimitHelp:
    "일부 정렬 요청이 제한되었습니다. 재시도를 기다리거나 정렬을 중단할 수 있습니다.",
  sort_rateLimitRetry: "%1번째 재시도 중입니다.",
  sort_abort: "정렬 중단",
  sort_bookmark: "작품 북마크",
  sort_removeBookmark: "북마크 해제",
  sort_bookmarkFailed: "북마크를 변경하지 못했습니다",
  sort_bookmarkSignIn: "작품을 북마크하려면 Pixiv에 로그인하세요.",
  sort_bookmarkUnconfirmed: "Pixiv가 북마크 ID를 반환하지 않았습니다.",
  sort_getUserWorks: "이 사용자의 작품을 불러오는 중…",
  sort_getWorks: "%1페이지의 작품을 불러오는 중…",
  sort_retryWorks: "%1페이지의 작품을 다시 불러오는 중(%2번째 재시도)…",
  sort_getDetails: "작품 상세 정보를 불러오는 중(%1/%2)…",
  sort_filtering: "작품 필터링 중…",
  sort_sorting: "필터링된 작품을 정렬 중…",
  preview_original: "원본",
  preview_ugoira: "우고이라",
  artwork_aiGenerated: "AI 생성",
  artwork_aiAssisted: "AI 보조",

  download_title: "다운로드 기록",
  download_close: "다운로드 기록 닫기",
  download_clearCompleted: "완료된 기록 지우기",
  download_clearCompletedHelp: "완료된 다운로드 기록 지우기",
  download_retryFailed: "실패한 다운로드 모두 다시 시도",
  download_moreActions: "추가 작업",
  download_ignoreRetryable: "재시도 대기 기록 모두 지우기",
  download_ignoreRetryableHelp: "실패하거나 중단된 다운로드 기록 모두 삭제",
  download_list: "이미지 다운로드 목록",
  download_empty:
    "다운로드 기록이 없습니다. 미리보기에서 ‘원본’을 눌러 다운로드하세요.",
  download_summary: "다운로드 중 %1개 · 완료 %2개 · 재시도 대기 %3개",
  download_progress: "%1 다운로드 진행률",
  download_abort: "%1 다운로드 중지",
  download_retry: "%1 다운로드 다시 시도",
  download_remove: "%1 기록 삭제",
  download_downloading: "다운로드 중",
  download_downloadingHere: "다운로드 중 %1",
  download_downloadingElsewhere: "다른 탭에서 다운로드 중 %1",
  download_completed: "다운로드 완료",
  download_interrupted:
    "다운로드가 중단되었습니다. 다시 시도 버튼을 눌러 다운로드하세요.",
  download_failed: "다운로드 실패: %1",
  download_errorNetwork: "네트워크 오류",
  download_errorTimeout: "다운로드 시간이 초과되었습니다",
  download_errorCanceled: "다운로드가 취소되었습니다",

  tag_details: "태그 상세 정보",
  tag_openPreview: "미리 본 작품을 새 탭에서 열기",
  tag_adding: "추가 중…",
  tag_addFailed: "태그를 추가하지 못했습니다. 눌러서 다시 시도하세요.",
  tag_add: "로컬 태그에 추가",
  tag_total: "일러스트·만화 작품 수 %1개",
  tag_totalAdded: "일러스트·만화 작품 수 %1개(%2개 증가)",
  tag_totalRemoved: "일러스트·만화 작품 수 %1개(%2개 감소)",
  tag_loadingDetails: "태그 상세 정보를 불러오는 중…",
  tag_noDescription: "태그 설명이 없습니다",
  tag_thumbnail: "%1 썸네일",
  tag_loadFailed:
    "태그 상세 정보를 불러오지 못했습니다. 잠시 후 태그에 마우스를 다시 올려 주세요.",
  tag_manage: "로컬 태그 관리",
  tag_autoSort: "자동 정렬(방문 횟수가 많은 순)",
  tag_empty:
    "로컬 태그가 없습니다. 태그에 마우스를 올리고 ‘로컬 태그에 추가’를 선택하세요.",
  tag_visits: "방문 %1회",
  tag_dragSort: "드래그하여 순서 변경",
  tag_reorder: "%1 순서 변경",
  tag_labelPlaceholder: "기억하기 쉬운 이름 입력",
  tag_label: "%1 표시 이름",
  tag_saveLabel: "표시 이름 저장",
  tag_moveUp: "위로 이동",
  tag_moveDown: "아래로 이동",
  tag_moveUpNamed: "%1 위로 이동",
  tag_moveDownNamed: "%1 아래로 이동",
  tag_remove: "%1 삭제",

  settings_title: "설정",
  settings_save: "저장",
  settings_restoreDefault: "기본값으로 되돌리기",
  settings_revertToPrevious: "변경 전으로 되돌리기",
  settings_restoreField: "%1 기본값으로 되돌리기",
  settings_revertField: "%1 변경 전으로 되돌리기",
  settings_restoreAll: "모든 설정을 기본값으로 되돌리기",
  settings_confirmDiscard:
    "저장하지 않은 변경 사항이 있습니다. 변경 사항을 버리고 닫을까요?",
  settings_saveSuccess: "설정을 저장하고 적용했습니다.",
  settings_saveFailed: "설정을 저장하지 못했습니다(%1)",
  settings_saveStorageError:
    "로컬 저장소에 쓰지 못해 설정이 변경되지 않았습니다.",
  settings_validationFailed: "%1 값을 확인해 주세요(%2)",

  settings_group_general: "일반 설정",
  settings_group_preview: "작품 미리보기",
  settings_group_sort: "작품 정렬",
  settings_group_localTags: "로컬 태그",
  settings_advancedToggle: "고급 설정",
  settings_group_cache: "캐시",
  settings_group_download: "다운로드 관리",
  settings_group_network: "네트워크",
  settings_group_scheduling: "내부 작업 스케줄링",

  settings_unit_ms: "밀리초",
  settings_unit_s: "초",
  settings_unit_hour: "시간",
  settings_unit_day: "일",
  settings_unit_pages: "페이지",
  settings_unit_bookmarks: "북마크",
  settings_unit_images: "장",
  settings_unit_entries: "항목",
  settings_unit_works: "작품",
  settings_unit_mib: "MiB",
  settings_unit_bytes: "바이트",
  settings_unit_times: "회",

  settings_field_language_label: "표시 언어",
  settings_field_language_desc:
    "스크립트 인터페이스의 표시 언어입니다. 기본값은 페이지 언어를 따르며 지원하지 않는 언어는 영어로 표시됩니다.",
  settings_option_languageAuto: "페이지 언어 따르기",

  settings_field_enablePreview_label: "작품 미리보기 사용",
  settings_field_enablePreview_desc:
    "끄면 작품과 우고이라 미리보기가 표시되지 않습니다.",
  settings_field_enableAnimePreview_label: "우고이라 미리보기",
  settings_field_enableAnimePreview_desc:
    "작품 미리보기를 켠 경우에만 사용할 수 있습니다.",
  settings_field_previewDelay_label: "마우스 오버 대기 시간",
  settings_field_previewDelay_desc:
    "이미지에 마우스를 올린 후 미리보기가 표시되기까지 기다리는 시간입니다.",
  settings_field_linkBlank_label: "작품을 새 탭에서 열기",
  settings_field_linkBlank_desc:
    "작품 링크에만 적용되며 작가와 태그 링크에는 영향을 주지 않습니다.",
  settings_field_previewHoldMs_label: "한 손 미리보기 길게 누르기 시간",
  settings_field_previewHoldMs_desc:
    "마우스 버튼을 이 시간 동안 누르면 한 손 미리보기 모드가 켜집니다.",
  settings_field_previewLoadingOverlayDelayMs_label:
    "페이지 로딩 오버레이 대기 시간",
  settings_field_previewLoadingOverlayDelayMs_desc:
    "페이지를 바꿀 때 이미지 로딩이 끝나지 않았다면 이 시간 후에 흐림 효과를 표시합니다.",
  settings_field_previewDownloadNoticeMs_label: "다운로드 완료 알림 표시 시간",
  settings_field_previewDownloadNoticeMs_desc:
    "원본 다운로드 후 미리보기 버튼에 완료 상태를 표시하는 시간입니다.",

  settings_field_pageCount_label: "한 번에 정렬할 페이지 수",
  settings_field_pageCount_desc:
    "페이지 수를 줄이면 픽시브 요청 제한에 걸릴 가능성이 낮아집니다.",
  settings_field_favFilter_label: "최소 북마크 수",
  settings_field_favFilter_desc:
    "정렬 결과에서 북마크 수가 이 값 이상인 작품만 표시합니다.",
  settings_field_orderType_label: "정렬 기준",
  settings_field_orderType_desc: "정렬 결과에 작품을 표시할 순서입니다.",
  settings_option_orderByBookmark: "북마크 수순",
  settings_option_orderByDate: "게시일순",
  settings_field_aiFilter_label: "AI 생성 작품 숨기기",
  settings_field_aiFilter_desc: "정렬 결과에서 AI 생성 작품을 제외합니다.",
  settings_field_aiAssistedFilter_label: "AI 보조 작품 숨기기",
  settings_field_aiAssistedFilter_desc:
    "정렬 결과에서 AI 보조 작품을 제외합니다.",
  settings_field_hideFavorite_label: "북마크한 작품 숨기기",
  settings_field_hideFavorite_desc: "정렬 결과에서 북마크한 작품을 제외합니다.",
  settings_field_hideByTag_label: "태그 필터 사용",
  settings_field_hideByTag_desc:
    "정렬 결과에서 지정한 태그가 있는 작품을 제외합니다.",
  settings_field_hideByTagList_label: "제외할 태그",
  settings_field_hideByTagList_placeholder: "태그를 쉼표(,)로 구분해 입력",
  settings_field_hideByTagList_desc:
    "태그 필터를 켰을 때 적용됩니다. 대소문자와 태그 앞뒤의 공백은 무시합니다.",

  settings_field_enableLocalTags_label: "로컬 태그 사용",
  settings_field_enableLocalTags_desc:
    "끄면 로컬 태그 인터페이스가 숨겨지고 집계가 중지됩니다. 저장한 태그는 유지됩니다.",
  settings_field_localTagPopoverShowDelayMs_label:
    "태그 상세 창 열기 대기 시간",
  settings_field_localTagPopoverShowDelayMs_desc:
    "태그에 마우스를 올리거나 포커스를 둔 후 상세 창이 열리기까지 기다리는 시간입니다.",
  settings_field_localTagPopoverHideDelayMs_label:
    "태그 상세 창 닫기 대기 시간",
  settings_field_localTagPopoverHideDelayMs_desc:
    "태그나 상세 창에서 마우스를 벗긴 후 창이 닫히기까지 기다리는 시간입니다.",

  settings_field_previewPreloadCount_label: "미리보기 미리 로드 범위",
  settings_field_previewPreloadCount_desc:
    "현재 페이지를 포함해 미리 불러올 이미지 수입니다. 디코딩된 이미지 캐시 한도는 이 값의 두 배입니다.",
  settings_field_previewCacheMaxEntries_label: "미리보기 메모리 캐시 용량",
  settings_field_previewCacheMaxEntries_desc:
    "미리보기 페이지 URL과 우고이라 메타데이터를 메모리에 캐시할 때 각각 적용할 최대 항목 수입니다.",
  settings_field_previewDetailsMaxStaleMs_label:
    "미리보기 상세 정보 캐시 추가 사용 시간",
  settings_field_previewDetailsMaxStaleMs_desc:
    "‘변경 가능한 작품 정보의 캐시 유효 기간’이 지난 후에도 캐시를 사용할 수 있는 추가 시간입니다.",
  settings_field_illustrationMutableCacheTtlMs_label:
    "변경 가능한 작품 정보의 캐시 유효 기간",
  settings_field_illustrationMutableCacheTtlMs_desc:
    "북마크 수나 북마크 여부처럼 바뀔 수 있는 정보를 캐시에 보관하는 기간입니다.",
  settings_field_illustrationStaticCacheTtlMs_label:
    "고정 작품 정보의 캐시 유효 기간",
  settings_field_illustrationStaticCacheTtlMs_desc:
    "제목, 태그, 페이지 수 등의 정보를 캐시에 보관하는 기간입니다.",
  settings_field_illustrationCacheMaxEntries_label: "작품 상세 정보 캐시 용량",
  settings_field_illustrationCacheMaxEntries_desc:
    "IndexedDB에 보관할 작품 상세 정보의 최대 항목 수입니다.",
  settings_field_newIllustrationNoCacheMs_label: "새 작품 캐시 시작 대기 시간",
  settings_field_newIllustrationNoCacheMs_desc:
    "게시 후 이 시간이 지나지 않은 작품의 상세 정보는 캐시하지 않습니다.",
  settings_field_illustPagesCacheTtlMs_label:
    "페이지별 이미지 정보의 캐시 유효 기간",
  settings_field_illustPagesCacheTtlMs_desc:
    "페이지별 이미지 URL을 IndexedDB에 캐시하는 기간입니다.",
  settings_field_illustPagesCacheMaxEntries_label:
    "페이지별 이미지 정보 캐시 용량",
  settings_field_illustPagesCacheMaxEntries_desc:
    "IndexedDB에 보관할 페이지별 이미지 정보의 최대 항목 수입니다.",
  settings_field_userIllustrationsCacheTtlMs_label:
    "사용자 작품 목록의 캐시 유효 기간",
  settings_field_userIllustrationsCacheTtlMs_desc:
    "사용자의 작품 목록을 세션 저장소에 캐시하는 기간입니다.",
  settings_field_ugoiraCacheTtlMs_label: "우고이라 프레임 캐시 유효 기간",
  settings_field_ugoiraCacheTtlMs_desc:
    "우고이라 프레임을 IndexedDB에 캐시하는 기간입니다.",
  settings_field_ugoiraCacheMaxEntries_label:
    "우고이라 프레임 캐시 작품 수 한도",
  settings_field_ugoiraCacheMaxEntries_desc:
    "IndexedDB에 프레임을 캐시할 우고이라 작품의 최대 수입니다.",
  settings_field_ugoiraCacheMaxBytes_label: "우고이라 프레임 캐시 크기 한도",
  settings_field_ugoiraCacheMaxBytes_desc:
    "IndexedDB에 저장하는 우고이라 프레임의 최대 용량입니다. 바이트로 환산한 값은 양의 정수여야 합니다.",
  settings_field_localTagMetadataCacheTtlMs_label:
    "로컬 태그 상세 정보의 캐시 유효 기간",
  settings_field_localTagMetadataCacheTtlMs_desc:
    "로컬 태그 설명과 썸네일을 캐시하는 기간입니다.",
  settings_field_tagTranslationCacheTtlMs_label: "태그 번역 캐시 유효 기간",
  settings_field_tagTranslationCacheTtlMs_desc:
    "태그의 중국어 번역을 캐시하는 기간입니다.",
  settings_field_tagTranslationCacheMaxEntries_label: "태그 번역 캐시 용량",
  settings_field_tagTranslationCacheMaxEntries_desc:
    "최소 2개입니다. 용량을 초과하면 용량의 절반(소수점 이하 버림)만큼 오래된 항목부터 제거합니다.",

  settings_field_completedDownloadsMaxEntries_label:
    "완료된 다운로드 기록 한도",
  settings_field_completedDownloadsMaxEntries_desc:
    "기록을 저장하거나 갱신할 때 한도를 초과한 오래된 완료 기록을 제거합니다.",
  settings_field_retryableDownloadsMaxEntries_label:
    "재시도 가능한 다운로드 기록 한도",
  settings_field_retryableDownloadsMaxEntries_desc:
    "기록을 저장하거나 갱신할 때 한도를 초과한 오래된 실패·중단 기록을 제거합니다.",
  settings_field_downloadProgressPersistMs_label: "다운로드 진행률 저장 간격",
  settings_field_downloadProgressPersistMs_desc:
    "진행률을 공유 저장소에 저장하는 최소 간격입니다. 하트비트 간격 이하여야 합니다.",
  settings_field_downloadHeartbeatMs_label: "다운로드 하트비트 간격",
  settings_field_downloadHeartbeatMs_desc:
    "활성 다운로드 상태를 알리고 중단 여부를 확인하는 간격입니다. 중단 판정 시간보다 짧아야 합니다.",
  settings_field_downloadOwnerTimeoutMs_label: "다운로드 중단 판정 시간",
  settings_field_downloadOwnerTimeoutMs_desc:
    "이 시간 동안 상태가 갱신되지 않으면 다운로드를 중단된 것으로 처리합니다. 하트비트 간격보다 길어야 합니다.",

  settings_field_requestRetryIntervalMs_label: "요청 재시도 간격",
  settings_field_requestRetryIntervalMs_desc:
    "재시도 사이에 기다리는 시간입니다(최소 1초).",
  settings_field_requestMaxAttempts_label: "최대 요청 시도 횟수",
  settings_field_requestMaxAttempts_desc:
    "최초 요청을 포함합니다. 비워 두거나 ‘무제한’을 입력하면 계속 재시도합니다.",
  settings_field_requestMaxAttempts_placeholder: "비워 두면 무제한",
  settings_unlimited: "무제한",
  settings_field_tagRequestTimeoutMs_label: "태그 요청 제한 시간",
  settings_field_tagRequestTimeoutMs_desc:
    "태그 상세 정보나 번역을 가져오는 각 요청의 제한 시간입니다.",
  settings_field_ugoiraChunkBytes_label: "우고이라 다운로드 청크 크기",
  settings_field_ugoiraChunkBytes_desc:
    "프레임이 캐시에 없을 때 우고이라 압축 파일을 나누어 내려받는 단위입니다(최소 65,536바이트).",
  settings_field_ugoiraTrailerBytes_label: "우고이라 ZIP 끝부분 스캔 크기",
  settings_field_ugoiraTrailerBytes_desc:
    "우고이라 ZIP의 중앙 디렉터리를 찾기 위해 끝부분에서 읽는 길이입니다(최소 22바이트).",

  settings_field_databaseOpenTimeoutMs_label: "데이터베이스 열기 제한 시간",
  settings_field_databaseOpenTimeoutMs_desc:
    "IndexedDB 연결이 열리기까지 기다리는 최대 시간입니다.",
  settings_field_domProbeIntervalMs_label: "DOM 확인 간격",
  settings_field_domProbeIntervalMs_desc:
    "비동기로 로드되는 페이지 요소를 확인하는 간격입니다.",
  settings_field_domProbeMaxAttempts_label: "최대 DOM 확인 횟수",
  settings_field_domProbeMaxAttempts_desc:
    "첫 확인을 포함한 최대 확인 횟수입니다.",
  settings_field_toolbarProbeIntervalMs_label: "도구 모음 확인 간격",
  settings_field_toolbarProbeIntervalMs_desc:
    "픽시브 도구 모음이 표시되었는지 확인하는 간격입니다.",
  settings_field_toolbarProbeMaxAttempts_label: "최대 도구 모음 확인 횟수",
  settings_field_toolbarProbeMaxAttempts_desc:
    "픽시브 도구 모음을 확인하는 최대 횟수입니다.",
  settings_field_localTagRenderDebounceMs_label:
    "로컬 태그 인터페이스 새로고침 대기 시간",
  settings_field_localTagRenderDebounceMs_desc:
    "DOM 변경이 멈춘 후 로컬 태그 인터페이스를 새로고침하기까지 기다리는 시간입니다.",
  settings_field_localTagPersistDelayMs_label: "로컬 태그 저장 대기 시간",
  settings_field_localTagPersistDelayMs_desc:
    "태그 변경 사항을 모아서 저장하기 전까지 기다리는 시간입니다. 이 설정을 바꿔도 저장 대기 중인 변경 사항은 유지됩니다.",
  settings_field_cacheCleanupIdleTimeoutMs_label:
    "유휴 시 캐시 정리 최대 대기 시간",
  settings_field_cacheCleanupIdleTimeoutMs_desc:
    "영구 캐시 정리를 위한 브라우저 유휴 콜백을 기다리는 최대 시간입니다.",

  settings_err_required: "값을 입력해 주세요.",
  settings_err_number: "유효한 유한수를 입력해 주세요.",
  settings_err_integer: "정수를 입력해 주세요.",
  settings_err_positive: "0보다 커야 합니다.",
  settings_err_nonNegative: "0 이상이어야 합니다.",
  settings_err_min: "%1 이상이어야 합니다.",
  settings_err_option: "올바른 옵션을 선택해 주세요.",
  settings_err_progressExceedsHeartbeat:
    "다운로드 하트비트 간격 이하여야 합니다.",
  settings_err_timeoutNotGreaterThanHeartbeat:
    "다운로드 하트비트 간격보다 길어야 합니다.",
} satisfies Messages;
