import type { Messages } from "./zh";

export default {
  install_title: "Добро пожаловать в Pixiv Previewer L v%1",
  upgrade_body:
    "<p>Этот скрипт основан на %1 и доработан под нужды разработчика. Пожелания по оригинальному скрипту можно оставить на %2 или в %3.</p><p>Список изменений этого скрипта доступен в %4.</p>",
  upgrade_feedback: "странице отзывов Greasy Fork",
  upgrade_issue: "задачах GitHub",
  upgrade_versions: "истории версий",
  close: "Закрыть",
  setting_clearFollowingCache: "Очистить кэш",
  setting_clearFollowingCacheHelp:
    "Детали работ, страницы изображений, кадры угоира и данные тегов сохранены локально. После очистки они будут загружены заново при следующем обращении.\n\nОчистить кэш?",
  setting_followingCacheCleared: "Кэш очищен. Обновите страницу.",
  setting_clearCacheFailed:
    "Не удалось очистить часть кэша. Повторите попытку позже.",
  cache_usage: "Использование кэша",
  cache_usageHelp:
    "Детали работ: %1 · Страницы изображений: %2 · Кадры угоира: %3 (%4) · Переводы тегов: %5",

  label_sort: "Сортировать работы",
  label_sorting: "Сортировка работ",
  label_nextPage: "На следующую страницу",
  label_hideFav: "Скрыть работы в закладках",
  sort_getUserWorks: "Загрузка работ автора…",
  sort_getWorks: "Загрузка работ на странице %1…",
  sort_retryWorks: "Повторная загрузка страницы %1 (попытка %2)…",
  sort_getDetails: "Загрузка сведений о работе (%1/%2)…",
  sort_filtering: "Фильтрация работ…",
  sort_sorting: "Сортировка результатов…",
  preview_original: "Оригинал",
  preview_ugoira: "Угоира",
  artwork_aiGenerated: "Создано ИИ",
  artwork_aiAssisted: "Помощь ИИ",

  download_title: "История загрузок",
  download_close: "Закрыть историю загрузок",
  download_clearCompleted: "Очистить завершённые",
  download_clearCompletedHelp: "Удалить записи о завершённых загрузках",
  download_retryFailed: "Повторить неудачные",
  download_moreActions: "Другие действия",
  download_ignoreRetryable: "Скрыть все ожидающие повтора",
  download_ignoreRetryableHelp:
    "Удалить все записи о неудачных и прерванных загрузках",
  download_list: "Список загрузок изображений",
  download_empty:
    "Загрузок пока нет. Нажмите «Оригинал» в предпросмотре, чтобы начать загрузку.",
  download_summary: "Загружается: %1 · Завершено: %2 · Ожидают повтора: %3",
  download_progress: "Прогресс загрузки %1",
  download_abort: "Остановить загрузку %1",
  download_retry: "Повторить загрузку %1",
  download_remove: "Удалить запись %1",
  download_downloading: "Загрузка",
  download_downloadingHere: "Загрузка %1",
  download_downloadingElsewhere: "Загрузка в другой вкладке %1",
  download_completed: "Скачано",
  download_interrupted:
    "Загрузка прервана. Нажмите «Повторить», чтобы скачать снова.",
  download_failed: "Ошибка загрузки: %1",
  download_errorNetwork: "Ошибка сети",
  download_errorTimeout: "Превышено время ожидания",
  download_errorCanceled: "Загрузка отменена",

  tag_details: "Сведения о теге",
  tag_openPreview: "Открыть работу из предпросмотра в новой вкладке",
  tag_adding: "Добавление…",
  tag_addFailed: "Не удалось добавить тег. Нажмите для повтора.",
  tag_add: "Добавить в локальные теги",
  tag_total: "Всего иллюстраций и манги: %1",
  tag_totalAdded: "Всего иллюстраций и манги: %1 (+%2)",
  tag_totalRemoved: "Всего иллюстраций и манги: %1 (-%2)",
  tag_loadingDetails: "Загрузка сведений о теге…",
  tag_noDescription: "Описание тега отсутствует",
  tag_thumbnail: "Миниатюра для %1",
  tag_loadFailed:
    "Не удалось загрузить сведения о теге. Наведите на тег снова для повтора.",
  tag_manage: "Локальные теги",
  tag_autoSort: "Автосортировка (сначала часто посещаемые)",
  tag_empty:
    "Локальных тегов пока нет. Наведите на любой тег и нажмите «Добавить в локальные теги».",
  tag_visits: "Посещений: %1",
  tag_dragSort: "Перетащите для изменения порядка",
  tag_reorder: "Изменить порядок: %1",
  tag_labelPlaceholder: "Введите понятную заметку",
  tag_label: "Отображаемое имя для %1",
  tag_saveLabel: "Сохранить",
  tag_moveUp: "Вверх",
  tag_moveDown: "Вниз",
  tag_moveUpNamed: "Переместить %1 вверх",
  tag_moveDownNamed: "Переместить %1 вниз",
  tag_remove: "Удалить %1",

  settings_title: "Настройки",
  settings_save: "Сохранить",
  settings_restoreDefault: "По умолчанию",
  settings_revertToPrevious: "Отменить изменение",
  settings_restoreField: "Сбросить «%1» по умолчанию",
  settings_revertField: "Отменить изменения для «%1»",
  settings_restoreAll: "Сбросить всё",
  settings_confirmDiscard:
    "Есть несохранённые изменения. Закрыть и отменить их?",
  settings_saveSuccess: "Настройки сохранены и применены.",
  settings_saveFailed: "Не удалось сохранить настройки (%1)",
  settings_saveStorageError:
    "Не удалось записать в локальное хранилище. Настройки не изменены.",
  settings_validationFailed: "Проверьте значение «%1» (%2)",

  settings_group_general: "Основные",
  settings_group_preview: "Предпросмотр работ",
  settings_group_sort: "Сортировка работ",
  settings_group_localTags: "Локальные теги",
  settings_advancedToggle: "Расширенные настройки",
  settings_group_cache: "Кэш",
  settings_group_download: "Загрузки",
  settings_group_network: "Сеть",
  settings_group_scheduling: "Планирование",

  settings_unit_ms: "мс",
  settings_unit_s: "с",
  settings_unit_hour: "ч",
  settings_unit_day: "дн.",
  settings_unit_pages: "стр.",
  settings_unit_bookmarks: "закл.",
  settings_unit_images: "изобр.",
  settings_unit_entries: "зап.",
  settings_unit_works: "работ",
  settings_unit_mib: "МиБ",
  settings_unit_bytes: "байт",
  settings_unit_times: "попыт.",

  settings_field_language_label: "Язык интерфейса",
  settings_field_language_desc:
    "Язык интерфейса скрипта. По умолчанию следует языку страницы с откатом на английский.",
  settings_option_languageAuto: "Как на странице",

  settings_field_enablePreview_label: "Включить предпросмотр работ",
  settings_field_enablePreview_desc:
    "Если выключено, предпросмотр иллюстраций и угоира не отображается.",
  settings_field_enableAnimePreview_label: "Предпросмотр угоира",
  settings_field_enableAnimePreview_desc:
    "Работает только при включённом предпросмотре работ.",
  settings_field_previewDelay_label: "Задержка при наведении",
  settings_field_previewDelay_desc:
    "Время ожидания после наведения на изображение до показа предпросмотра.",
  settings_field_linkBlank_label: "Открывать работы в новой вкладке",
  settings_field_linkBlank_desc:
    "Применяется только к ссылкам на работы; ссылки на авторов и теги не затрагиваются.",
  settings_field_previewHoldMs_label: "Удержание для режима одной рукой",
  settings_field_previewHoldMs_desc:
    "Длительность зажатия кнопки мыши для фиксации предпросмотра одной рукой.",
  settings_field_previewLoadingOverlayDelayMs_label:
    "Задержка индикатора загрузки страницы",
  settings_field_previewLoadingOverlayDelayMs_desc:
    "Ожидание перед показом размытого наложения, если следующее изображение ещё загружается.",
  settings_field_previewDownloadNoticeMs_label:
    "Длительность уведомления о загрузке",
  settings_field_previewDownloadNoticeMs_desc:
    "Как долго кнопка в предпросмотре показывает статус завершения перед сбросом.",

  settings_field_pageCount_label: "Страниц за сортировку",
  settings_field_pageCount_desc:
    "Меньшее число страниц снижает риск срабатывания ограничений запросов Pixiv.",
  settings_field_favFilter_label: "Минимум закладок",
  settings_field_favFilter_desc:
    "Показывать в отсортированных результатах работы с числом закладок не ниже указанного.",
  settings_field_orderType_label: "Порядок сортировки",
  settings_field_orderType_desc:
    "Определяет порядок отображения отсортированных работ.",
  settings_option_orderByBookmark: "По закладкам",
  settings_option_orderByDate: "По дате публикации",
  settings_field_aiFilter_label: "Скрывать работы ИИ",
  settings_field_aiFilter_desc:
    "Исключать работы, сгенерированные ИИ, из результатов сортировки.",
  settings_field_aiAssistedFilter_label: "Скрывать работы с помощью ИИ",
  settings_field_aiAssistedFilter_desc:
    "Исключать работы, созданные при участии ИИ, из результатов сортировки.",
  settings_field_hideFavorite_label: "Скрывать добавленные в закладки",
  settings_field_hideFavorite_desc:
    "Исключать работы из ваших закладок из результатов сортировки.",
  settings_field_hideByTag_label: "Фильтрация по тегам",
  settings_field_hideByTag_desc:
    "Исключать работы с указанными тегами из результатов сортировки.",
  settings_field_hideByTagList_label: "Исключённые теги",
  settings_field_hideByTagList_placeholder: "Введите теги через запятую (,)",
  settings_field_hideByTagList_desc:
    "Действует при включённой фильтрации по тегам. Регистр и пробелы по краям игнорируются.",

  settings_field_enableLocalTags_label: "Включить локальные теги",
  settings_field_enableLocalTags_desc:
    "Отключение скрывает элементы локальных тегов и приостанавливает учёт. Сохранённые теги сохраняются.",
  settings_field_localTagPopoverShowDelayMs_label:
    "Задержка показа сведений о теге",
  settings_field_localTagPopoverShowDelayMs_desc:
    "Ожидание после наведения или фокуса на теге перед открытием всплывающей карточки.",
  settings_field_localTagPopoverHideDelayMs_label:
    "Задержка скрытия сведений о теге",
  settings_field_localTagPopoverHideDelayMs_desc:
    "Ожидание после ухода курсора с тега или карточки перед её закрытием.",

  settings_field_previewPreloadCount_label: "Окно предзагрузки предпросмотра",
  settings_field_previewPreloadCount_desc:
    "Число предзагружаемых изображений, включая текущую страницу. Кэш декодированных изображений вмещает вдвое больше.",
  settings_field_previewCacheMaxEntries_label:
    "Ёмкость кэша предпросмотра в памяти",
  settings_field_previewCacheMaxEntries_desc:
    "Максимум записей в памяти отдельно для URL страниц предпросмотра и метаданных угоира.",
  settings_field_previewDetailsMaxStaleMs_label:
    "Доп. время использования кэша деталей",
  settings_field_previewDetailsMaxStaleMs_desc:
    "Дополнительное время сверх срока хранения изменяемых деталей работы.",
  settings_field_illustrationMutableCacheTtlMs_label:
    "Срок кэша изменяемых деталей работы",
  settings_field_illustrationMutableCacheTtlMs_desc:
    "Срок хранения изменяемых данных, таких как число закладок и статус.",
  settings_field_illustrationStaticCacheTtlMs_label:
    "Срок кэша статических деталей работы",
  settings_field_illustrationStaticCacheTtlMs_desc:
    "Срок хранения таких данных, как название, теги и число страниц.",
  settings_field_illustrationCacheMaxEntries_label:
    "Ёмкость кэша деталей работ",
  settings_field_illustrationCacheMaxEntries_desc:
    "Максимум записей деталей работ в IndexedDB.",
  settings_field_newIllustrationNoCacheMs_label:
    "Окно без кэша для новых работ",
  settings_field_newIllustrationNoCacheMs_desc:
    "Не кэшировать детали работ, опубликованных в пределах этого времени.",
  settings_field_illustPagesCacheTtlMs_label: "Срок кэша страниц изображений",
  settings_field_illustPagesCacheTtlMs_desc:
    "Срок хранения URL страниц изображений в IndexedDB.",
  settings_field_illustPagesCacheMaxEntries_label:
    "Ёмкость кэша страниц изображений",
  settings_field_illustPagesCacheMaxEntries_desc:
    "Максимум записей страниц изображений в IndexedDB.",
  settings_field_userIllustrationsCacheTtlMs_label:
    "Срок кэша списка работ автора",
  settings_field_userIllustrationsCacheTtlMs_desc:
    "Срок хранения списков работ пользователей в Session Storage.",
  settings_field_ugoiraCacheTtlMs_label: "Срок кэша кадров угоира",
  settings_field_ugoiraCacheTtlMs_desc:
    "Срок хранения кадров угоира в IndexedDB.",
  settings_field_ugoiraCacheMaxEntries_label:
    "Лимит работ в кэше кадров угоира",
  settings_field_ugoiraCacheMaxEntries_desc:
    "Максимум работ угоира, кадры которых хранятся в IndexedDB.",
  settings_field_ugoiraCacheMaxBytes_label: "Лимит объёма кэша кадров угоира",
  settings_field_ugoiraCacheMaxBytes_desc:
    "Максимальный объём кадров угоира в IndexedDB (в байтах должно быть целым положительным числом).",
  settings_field_localTagMetadataCacheTtlMs_label:
    "Срок кэша сведений о локальных тегах",
  settings_field_localTagMetadataCacheTtlMs_desc:
    "Срок хранения описаний и миниатюр локальных тегов.",
  settings_field_tagTranslationCacheTtlMs_label: "Срок кэша переводов тегов",
  settings_field_tagTranslationCacheTtlMs_desc:
    "Срок хранения китайских переводов тегов.",
  settings_field_tagTranslationCacheMaxEntries_label:
    "Ёмкость кэша переводов тегов",
  settings_field_tagTranslationCacheMaxEntries_desc:
    "Не менее 2 записей. При переполнении удаляются самые старые до половины ёмкости (с округлением вниз).",

  settings_field_completedDownloadsMaxEntries_label:
    "Лимит завершённых загрузок",
  settings_field_completedDownloadsMaxEntries_desc:
    "При записи или обновлении удаляет старые завершённые записи сверх лимита.",
  settings_field_retryableDownloadsMaxEntries_label:
    "Лимит загрузок для повтора",
  settings_field_retryableDownloadsMaxEntries_desc:
    "При записи или обновлении удаляет старые ошибочные и прерванные записи сверх лимита.",
  settings_field_downloadProgressPersistMs_label:
    "Интервал сохранения прогресса",
  settings_field_downloadProgressPersistMs_desc:
    "Минимальный интервал записи прогресса в общее хранилище (не больше интервала пульса).",
  settings_field_downloadHeartbeatMs_label: "Интервал пульса загрузки",
  settings_field_downloadHeartbeatMs_desc:
    "Частота подтверждения активности загрузок и проверки обрывов (меньше таймаута обрыва).",
  settings_field_downloadOwnerTimeoutMs_label: "Таймаут обрыва загрузки",
  settings_field_downloadOwnerTimeoutMs_desc:
    "Считать загрузку прерванной, если статус не обновлялся дольше этого времени (больше интервала пульса).",

  settings_field_requestRetryIntervalMs_label: "Интервал повтора запроса",
  settings_field_requestRetryIntervalMs_desc:
    "Ожидание между попытками (минимум 1 секунда).",
  settings_field_requestMaxAttempts_label: "Максимум попыток запроса",
  settings_field_requestMaxAttempts_desc:
    "Включая первую попытку. Оставьте пустым или введите «Без ограничений» для постоянных повторов.",
  settings_field_requestMaxAttempts_placeholder: "Пусто — без ограничений",
  settings_unlimited: "Без ограничений",
  settings_field_tagRequestTimeoutMs_label: "Таймаут запроса тега",
  settings_field_tagRequestTimeoutMs_desc:
    "Таймаут каждого запроса сведений о теге или его перевода.",
  settings_field_ugoiraChunkBytes_label: "Размер чанка загрузки угоира",
  settings_field_ugoiraChunkBytes_desc:
    "Размер фрагмента при загрузке архива угоира без кэша кадров (минимум 65 536 байт).",
  settings_field_ugoiraTrailerBytes_label: "Размер чтения конца ZIP угоира",
  settings_field_ugoiraTrailerBytes_desc:
    "Объём чтения с конца ZIP угоира для поиска центрального каталога (минимум 22 байта).",

  settings_field_databaseOpenTimeoutMs_label: "Таймаут открытия базы данных",
  settings_field_databaseOpenTimeoutMs_desc:
    "Максимальное время ожидания открытия соединения IndexedDB.",
  settings_field_domProbeIntervalMs_label: "Интервал проверки DOM",
  settings_field_domProbeIntervalMs_desc:
    "Пауза между проверками асинхронно загружаемых элементов страницы.",
  settings_field_domProbeMaxAttempts_label: "Максимум проверок DOM",
  settings_field_domProbeMaxAttempts_desc:
    "Максимальное число проверок, включая первую.",
  settings_field_toolbarProbeIntervalMs_label:
    "Интервал проверки панели инструментов",
  settings_field_toolbarProbeIntervalMs_desc:
    "Пауза между проверками появления встроенной панели Pixiv.",
  settings_field_toolbarProbeMaxAttempts_label:
    "Максимум проверок панели инструментов",
  settings_field_toolbarProbeMaxAttempts_desc:
    "Максимальное число проверок встроенной панели Pixiv.",
  settings_field_localTagRenderDebounceMs_label:
    "Задержка обновления UI локальных тегов",
  settings_field_localTagRenderDebounceMs_desc:
    "Ожидание стабилизации DOM перед обновлением элементов локальных тегов.",
  settings_field_localTagPersistDelayMs_label:
    "Задержка сохранения локальных тегов",
  settings_field_localTagPersistDelayMs_desc:
    "Задержка перед пакетным сохранением правок тегов; изменение не теряет ожидающие записи.",
  settings_field_cacheCleanupIdleTimeoutMs_label:
    "Макс. ожидание фоновой очистки кэша",
  settings_field_cacheCleanupIdleTimeoutMs_desc:
    "Максимальное время ожидания простоя браузера для очистки постоянного кэша.",

  settings_err_required: "Введите значение.",
  settings_err_number: "Введите корректное конечное число.",
  settings_err_integer: "Введите целое число.",
  settings_err_positive: "Должно быть больше 0.",
  settings_err_nonNegative: "Не может быть меньше 0.",
  settings_err_min: "Не может быть меньше %1.",
  settings_err_option: "Выберите допустимый вариант.",
  settings_err_progressExceedsHeartbeat:
    "Не должно превышать интервал пульса загрузки.",
  settings_err_timeoutNotGreaterThanHeartbeat:
    "Должно быть больше интервала пульса загрузки.",
} satisfies Messages;
