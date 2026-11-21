import type { Messages } from "./zh";

export default {
  install_title: "Bienvenue dans Pixiv Previewer L v%1",
  upgrade_body:
    "<p>Ce script est basé sur %1 et adapté aux besoins du développeur. Partagez vos suggestions pour le script original sur sa %2 ou en ouvrant une %3.</p><p>Consultez les nouveautés dans l'%4 de ce script.</p>",
  upgrade_feedback: "page de retours Greasy Fork",
  upgrade_issue: "issue GitHub",
  upgrade_versions: "historique des versions",
  close: "Fermer",
  setting_clearFollowingCache: "Vider le cache",
  setting_clearFollowingCacheHelp:
    "Les détails des œuvres, pages d'images, images ugoira et informations sur les tags sont mis en cache localement. Après suppression, ils seront rechargés si nécessaire.\n\nVider le cache ?",
  setting_followingCacheCleared: "Cache vidé. Veuillez recharger la page.",
  setting_clearCacheFailed:
    "Certaines données en cache n'ont pas pu être supprimées. Réessayez plus tard.",
  cache_usage: "Utilisation du cache",
  cache_usageHelp:
    "Détails d'œuvres : %1 · Pages d'images : %2 · Images ugoira : %3 (%4) · Traductions de tags : %5",

  label_sort: "Trier les œuvres",
  label_sorting: "Tri des œuvres en cours",
  label_nextPage: "Page suivante",
  label_hideFav: "Masquer les œuvres en favoris",
  sort_failed: "Impossible de trier les œuvres",
  sort_listMissing: "La liste d’œuvres à trier est introuvable.",
  sort_listAmbiguous:
    "%1 listes d’œuvres ont été trouvées. La liste à trier est ambiguë.",
  sort_nextPageNotReady:
    "La liste d’œuvres de la page suivante ne s’est pas chargée complètement.",
  sort_emptyWorksPage:
    "Pixiv a renvoyé une liste d’œuvres vide pour la page %1. Le tri a été arrêté.",
  sort_invalidWorksResponse:
    "Pixiv a renvoyé les données de la liste d’œuvres dans un format inattendu.",
  sort_reportIssue: "Signaler le problème sur GitHub",
  sort_rateLimited: "Limite de requêtes Pixiv (HTTP 429)",
  sort_rateLimitHelp:
    "Pixiv a limité certaines requêtes de tri. Vous pouvez attendre les nouvelles tentatives ou arrêter le tri.",
  sort_rateLimitRetry: "Nouvelle tentative n° %1 en cours.",
  sort_abort: "Arrêter le tri",
  sort_bookmark: "Ajouter l’œuvre aux favoris",
  sort_removeBookmark: "Retirer des favoris",
  sort_bookmarkFailed: "Impossible de modifier le favori",
  sort_bookmarkSignIn:
    "Connectez-vous à Pixiv pour ajouter des œuvres aux favoris.",
  sort_bookmarkUnconfirmed: "Pixiv n’a renvoyé aucun identifiant de favori.",
  sort_getUserWorks: "Chargement des œuvres de cet utilisateur…",
  sort_getWorks: "Chargement des œuvres de la page %1…",
  sort_retryWorks: "Nouvelle tentative pour la page %1 (essai %2)…",
  sort_getDetails: "Chargement des détails (%1/%2)…",
  sort_filtering: "Filtrage des œuvres…",
  sort_sorting: "Tri des résultats…",
  preview_original: "Original",
  preview_ugoira: "Ugoira",
  artwork_aiGenerated: "Généré par IA",
  artwork_aiAssisted: "Assisté par IA",

  download_title: "Historique des téléchargements",
  download_close: "Fermer l'historique des téléchargements",
  download_clearCompleted: "Effacer les terminés",
  download_clearCompletedHelp:
    "Effacer les enregistrements de téléchargements terminés",
  download_retryFailed: "Réessayer les échecs",
  download_moreActions: "Plus d'actions",
  download_ignoreRetryable: "Ignorer toutes les reprises",
  download_ignoreRetryableHelp:
    "Supprimer tous les téléchargements échoués ou interrompus",
  download_list: "Téléchargements d'images",
  download_empty:
    "Aucun téléchargement pour le moment. Sélectionnez « Original » dans l'aperçu pour démarrer.",
  download_summary: "%1 en cours · %2 terminé(s) · %3 en attente",
  download_progress: "Progression du téléchargement pour %1",
  download_abort: "Arrêter le téléchargement de %1",
  download_retry: "Réessayer le téléchargement de %1",
  download_remove: "Supprimer l'entrée pour %1",
  download_downloading: "Téléchargement",
  download_downloadingHere: "Téléchargement %1",
  download_downloadingElsewhere: "Téléchargement dans un autre onglet %1",
  download_completed: "Téléchargé",
  download_interrupted:
    "Téléchargement interrompu. Cliquez sur Réessayer pour relancer.",
  download_failed: "Échec du téléchargement : %1",
  download_errorNetwork: "Erreur réseau",
  download_errorTimeout: "Délai de téléchargement dépassé",
  download_errorCanceled: "Téléchargement annulé",

  tag_details: "Détails du tag",
  tag_openPreview: "Ouvrir l'œuvre prévisualisée dans un nouvel onglet",
  tag_adding: "Ajout en cours…",
  tag_addFailed: "Impossible d'ajouter le tag. Cliquez pour réessayer.",
  tag_add: "Ajouter aux tags locaux",
  tag_total: "Total illustrations et mangas : %1",
  tag_totalAdded: "Total illustrations et mangas : %1 (+%2)",
  tag_totalRemoved: "Total illustrations et mangas : %1 (-%2)",
  tag_loadingDetails: "Chargement des détails du tag…",
  tag_noDescription: "Aucune description pour ce tag",
  tag_thumbnail: "Miniature pour %1",
  tag_loadFailed:
    "Impossible de charger les détails du tag. Survolez à nouveau le tag pour réessayer.",
  tag_manage: "Gérer les tags locaux",
  tag_autoSort: "Tri automatique (les plus visités d'abord)",
  tag_empty:
    "Aucun tag local. Survolez un tag et cliquez sur « Ajouter aux tags locaux ».",
  tag_visits: "Visites : %1",
  tag_dragSort: "Glisser pour réorganiser",
  tag_reorder: "Réorganiser %1",
  tag_labelPlaceholder: "Saisir un surnom",
  tag_label: "Nom affiché pour %1",
  tag_saveLabel: "Enregistrer le surnom",
  tag_moveUp: "Monter",
  tag_moveDown: "Descendre",
  tag_moveUpNamed: "Monter %1",
  tag_moveDownNamed: "Descendre %1",
  tag_remove: "Supprimer %1",

  settings_title: "Paramètres",
  settings_save: "Enregistrer",
  settings_restoreDefault: "Par défaut",
  settings_revertToPrevious: "Annuler la modification",
  settings_restoreField: "Rétablir la valeur par défaut de %1",
  settings_revertField: "Annuler les modifications de %1",
  settings_restoreAll: "Tout réinitialiser",
  settings_confirmDiscard:
    "Vous avez des modifications non enregistrées. Fermer et les ignorer ?",
  settings_saveSuccess: "Paramètres enregistrés et appliqués.",
  settings_saveFailed: "Impossible d'enregistrer les paramètres (%1)",
  settings_saveStorageError:
    "Impossible d'écrire dans le stockage local. Vos paramètres sont inchangés.",
  settings_validationFailed: "Vérifiez la valeur de %1 (%2)",

  settings_group_general: "Général",
  settings_group_preview: "Aperçu des œuvres",
  settings_group_sort: "Tri des œuvres",
  settings_group_localTags: "Tags locaux",
  settings_advancedToggle: "Paramètres avancés",
  settings_group_cache: "Cache",
  settings_group_download: "Téléchargements",
  settings_group_network: "Réseau",
  settings_group_scheduling: "Planification",

  settings_unit_ms: "ms",
  settings_unit_s: "s",
  settings_unit_hour: "h",
  settings_unit_day: "jours",
  settings_unit_pages: "pages",
  settings_unit_bookmarks: "favoris",
  settings_unit_images: "images",
  settings_unit_entries: "entrées",
  settings_unit_works: "œuvres",
  settings_unit_mib: "MiB",
  settings_unit_bytes: "octets",
  settings_unit_times: "essais",

  settings_field_language_label: "Langue",
  settings_field_language_desc:
    "Langue d'affichage de l'interface du script. Suit la langue de la page par défaut avec repli sur l'anglais.",
  settings_option_languageAuto: "Suivre la langue de la page",

  settings_field_enablePreview_label: "Activer l'aperçu des œuvres",
  settings_field_enablePreview_desc:
    "Une fois désactivé, les aperçus d'œuvres et d'ugoira n'apparaissent plus.",
  settings_field_enableAnimePreview_label: "Aperçu des ugoira",
  settings_field_enableAnimePreview_desc:
    "Nécessite que l'aperçu des œuvres soit activé.",
  settings_field_previewDelay_label: "Délai au survol",
  settings_field_previewDelay_desc:
    "Temps d'attente après le survol d'une image avant d'afficher l'aperçu.",
  settings_field_linkBlank_label: "Ouvrir les œuvres dans un nouvel onglet",
  settings_field_linkBlank_desc:
    "S'applique aux liens d'œuvres. Les liens d'artistes et de tags ne sont pas modifiés.",
  settings_field_previewHoldMs_label: "Durée d'appui pour l'aperçu à une main",
  settings_field_previewHoldMs_desc:
    "Maintenir le bouton de la souris aussi longtemps pour passer en mode aperçu à une main.",
  settings_field_previewLoadingOverlayDelayMs_label:
    "Délai de l'écran de chargement de page",
  settings_field_previewLoadingOverlayDelayMs_desc:
    "Attente avant d'afficher un voile flouté si l'image suivante charge encore.",
  settings_field_previewDownloadNoticeMs_label:
    "Durée de confirmation du téléchargement",
  settings_field_previewDownloadNoticeMs_desc:
    "Durée d'affichage de la confirmation sur le bouton d'aperçu avant sa réinitialisation.",

  settings_field_pageCount_label: "Pages par tri",
  settings_field_pageCount_desc:
    "Moins de pages réduit le risque d'atteindre les limites de requêtes de Pixiv.",
  settings_field_favFilter_label: "Minimum de favoris",
  settings_field_favFilter_desc:
    "N'afficher dans les résultats triés que les œuvres ayant au moins ce nombre de favoris.",
  settings_field_orderType_label: "Trier par",
  settings_field_orderType_desc:
    "Détermine l'ordre des œuvres dans les résultats triés.",
  settings_option_orderByBookmark: "Nombre de favoris",
  settings_option_orderByDate: "Date de publication",
  settings_field_aiFilter_label: "Masquer les œuvres générées par IA",
  settings_field_aiFilter_desc:
    "Exclure les œuvres générées par IA des résultats triés.",
  settings_field_aiAssistedFilter_label: "Masquer les œuvres assistées par IA",
  settings_field_aiAssistedFilter_desc:
    "Exclure les œuvres assistées par IA des résultats triés.",
  settings_field_hideFavorite_label: "Masquer les œuvres en favoris",
  settings_field_hideFavorite_desc:
    "Exclure des résultats triés les œuvres déjà ajoutées aux favoris.",
  settings_field_hideByTag_label: "Activer le filtrage par tag",
  settings_field_hideByTag_desc:
    "Exclure des résultats triés les œuvres portant les tags indiqués.",
  settings_field_hideByTagList_label: "Tags exclus",
  settings_field_hideByTagList_placeholder:
    "Entrez les tags séparés par des virgules (,)",
  settings_field_hideByTagList_desc:
    "S'applique lorsque le filtrage par tag est activé. La casse et les espaces autour sont ignorés.",

  settings_field_enableLocalTags_label: "Activer les tags locaux",
  settings_field_enableLocalTags_desc:
    "La désactivation masque les contrôles de tags locaux et suspend le suivi. Vos tags enregistrés sont conservés.",
  settings_field_localTagPopoverShowDelayMs_label:
    "Délai d'ouverture des détails de tag",
  settings_field_localTagPopoverShowDelayMs_desc:
    "Attente après le survol ou le focus d'un tag avant d'afficher ses détails.",
  settings_field_localTagPopoverHideDelayMs_label:
    "Délai de fermeture des détails de tag",
  settings_field_localTagPopoverHideDelayMs_desc:
    "Attente après avoir quitté le tag ou ses détails avant de fermer l'infobulle.",

  settings_field_previewPreloadCount_label: "Fenêtre de préchargement d'aperçu",
  settings_field_previewPreloadCount_desc:
    "Nombre d'images à précharger, page actuelle incluse. Le cache d'images décodées stocke jusqu'au double.",
  settings_field_previewCacheMaxEntries_label:
    "Capacité du cache d'aperçu en mémoire",
  settings_field_previewCacheMaxEntries_desc:
    "Nombre maximal d'entrées en mémoire chacun pour les URL de pages d'aperçu et les métadonnées ugoira.",
  settings_field_previewDetailsMaxStaleMs_label:
    "Délai supplémentaire de réutilisation des détails",
  settings_field_previewDetailsMaxStaleMs_desc:
    "Temps supplémentaire au-delà de la durée de cache des détails évolutifs d'une œuvre.",
  settings_field_illustrationMutableCacheTtlMs_label:
    "Durée du cache des détails évolutifs",
  settings_field_illustrationMutableCacheTtlMs_desc:
    "Durée de mise en cache des données évolutives comme le nombre et l'état de favoris.",
  settings_field_illustrationStaticCacheTtlMs_label:
    "Durée du cache des détails statiques",
  settings_field_illustrationStaticCacheTtlMs_desc:
    "Durée de mise en cache des informations comme le titre, les tags et le nombre de pages.",
  settings_field_illustrationCacheMaxEntries_label:
    "Capacité du cache des détails d'œuvres",
  settings_field_illustrationCacheMaxEntries_desc:
    "Nombre maximal d'entrées de détails d'œuvres dans IndexedDB.",
  settings_field_newIllustrationNoCacheMs_label:
    "Délai avant mise en cache des nouvelles œuvres",
  settings_field_newIllustrationNoCacheMs_desc:
    "Ne pas mettre en cache les détails des œuvres publiées dans cette fenêtre temporelle.",
  settings_field_illustPagesCacheTtlMs_label:
    "Durée du cache des pages d'images",
  settings_field_illustPagesCacheTtlMs_desc:
    "Durée de mise en cache des URL de pages d'images dans IndexedDB.",
  settings_field_illustPagesCacheMaxEntries_label:
    "Capacité du cache des pages d'images",
  settings_field_illustPagesCacheMaxEntries_desc:
    "Nombre maximal d'entrées de pages d'images dans IndexedDB.",
  settings_field_userIllustrationsCacheTtlMs_label:
    "Durée du cache des listes d'œuvres utilisateur",
  settings_field_userIllustrationsCacheTtlMs_desc:
    "Durée de mise en cache des listes d'œuvres des utilisateurs dans Session Storage.",
  settings_field_ugoiraCacheTtlMs_label: "Durée du cache des images ugoira",
  settings_field_ugoiraCacheTtlMs_desc:
    "Durée de mise en cache des images ugoira dans IndexedDB.",
  settings_field_ugoiraCacheMaxEntries_label:
    "Capacité du cache d'images ugoira",
  settings_field_ugoiraCacheMaxEntries_desc:
    "Nombre maximal d'œuvres dont les images sont en cache dans IndexedDB.",
  settings_field_ugoiraCacheMaxBytes_label:
    "Limite de taille du cache d'images ugoira",
  settings_field_ugoiraCacheMaxBytes_desc:
    "Espace maximal pour les images ugoira dans IndexedDB (doit correspondre à un entier positif en octets).",
  settings_field_localTagMetadataCacheTtlMs_label:
    "Durée du cache des détails de tags locaux",
  settings_field_localTagMetadataCacheTtlMs_desc:
    "Durée de mise en cache des descriptions et miniatures des tags locaux.",
  settings_field_tagTranslationCacheTtlMs_label:
    "Durée du cache des traductions de tags",
  settings_field_tagTranslationCacheTtlMs_desc:
    "Durée de mise en cache des traductions chinoises des tags.",
  settings_field_tagTranslationCacheMaxEntries_label:
    "Capacité du cache des traductions de tags",
  settings_field_tagTranslationCacheMaxEntries_desc:
    "Au moins 2 entrées. Une fois plein, supprime les plus anciennes jusqu'à la moitié de la capacité (arrondi en dessous).",

  settings_field_completedDownloadsMaxEntries_label:
    "Limite de téléchargements terminés",
  settings_field_completedDownloadsMaxEntries_desc:
    "Lors de l'écriture ou mise à jour, supprime les anciens téléchargements terminés dépassant cette limite.",
  settings_field_retryableDownloadsMaxEntries_label:
    "Limite de téléchargements réessayables",
  settings_field_retryableDownloadsMaxEntries_desc:
    "Lors de l'écriture ou mise à jour, supprime les anciens échecs ou interruptions dépassant cette limite.",
  settings_field_downloadProgressPersistMs_label:
    "Intervalle d'enregistrement de progression",
  settings_field_downloadProgressPersistMs_desc:
    "Intervalle minimal entre deux sauvegardes de progression dans le stockage partagé (au plus l'intervalle de signal).",
  settings_field_downloadHeartbeatMs_label:
    "Intervalle de signal de téléchargement",
  settings_field_downloadHeartbeatMs_desc:
    "Fréquence de signalement des téléchargements actifs et de détection des coupures (inférieur au délai d'expiration).",
  settings_field_downloadOwnerTimeoutMs_label:
    "Délai d'expiration d'interruption",
  settings_field_downloadOwnerTimeoutMs_desc:
    "Marquer un téléchargement comme interrompu s'il n'a pas été mis à jour depuis ce délai (supérieur au signal).",

  settings_field_requestRetryIntervalMs_label:
    "Intervalle entre tentatives de requête",
  settings_field_requestRetryIntervalMs_desc:
    "Attente entre les tentatives (au moins 1 seconde).",
  settings_field_requestMaxAttempts_label: "Nombre maximal de tentatives",
  settings_field_requestMaxAttempts_desc:
    "Inclut la première tentative. Laissez vide ou saisissez « Illimité » pour continuer à réessayer.",
  settings_field_requestMaxAttempts_placeholder: "Laisser vide si illimité",
  settings_unlimited: "Illimité",
  settings_field_tagRequestTimeoutMs_label:
    "Délai d'expiration des requêtes de tag",
  settings_field_tagRequestTimeoutMs_desc:
    "Délai maximal pour chaque requête de détails ou de traduction de tag.",
  settings_field_ugoiraChunkBytes_label: "Taille de bloc ugoira",
  settings_field_ugoiraChunkBytes_desc:
    "Taille des blocs lors du téléchargement d'une archive ugoira hors cache (au moins 65 536 octets).",
  settings_field_ugoiraTrailerBytes_label: "Taille de lecture fin ZIP ugoira",
  settings_field_ugoiraTrailerBytes_desc:
    "Volume lu depuis la fin d'un ZIP ugoira pour trouver le répertoire central (au moins 22 octets).",

  settings_field_databaseOpenTimeoutMs_label:
    "Délai d'ouverture de base de données",
  settings_field_databaseOpenTimeoutMs_desc:
    "Attente maximale pour l'ouverture d'une connexion IndexedDB.",
  settings_field_domProbeIntervalMs_label: "Intervalle de vérification DOM",
  settings_field_domProbeIntervalMs_desc:
    "Délai entre les vérifications d'éléments de page chargés de manière asynchrone.",
  settings_field_domProbeMaxAttempts_label:
    "Nombre maximal de vérifications DOM",
  settings_field_domProbeMaxAttempts_desc:
    "Nombre maximal de vérifications, première incluse.",
  settings_field_toolbarProbeIntervalMs_label:
    "Intervalle de vérification de barre d'outils",
  settings_field_toolbarProbeIntervalMs_desc:
    "Délai entre les vérifications d'apparition de la barre d'outils Pixiv.",
  settings_field_toolbarProbeMaxAttempts_label:
    "Vérifications maximales de barre d'outils",
  settings_field_toolbarProbeMaxAttempts_desc:
    "Nombre maximal de vérifications de la barre d'outils Pixiv.",
  settings_field_localTagRenderDebounceMs_label:
    "Délai de rafraîchissement UI des tags locaux",
  settings_field_localTagRenderDebounceMs_desc:
    "Attendre la stabilisation du DOM avant de rafraîchir les contrôles des tags locaux.",
  settings_field_localTagPersistDelayMs_label:
    "Délai d'enregistrement des tags locaux",
  settings_field_localTagPersistDelayMs_desc:
    "Attente avant d'enregistrer les modifications groupées ; changer ce délai conserve la file en attente.",
  settings_field_cacheCleanupIdleTimeoutMs_label:
    "Attente max pour le nettoyage en veille",
  settings_field_cacheCleanupIdleTimeoutMs_desc:
    "Attente maximale d'un rappel d'inactivité du navigateur pour nettoyer les caches persistants.",

  settings_err_required: "Saisissez une valeur.",
  settings_err_number: "Saisissez un nombre fini valide.",
  settings_err_integer: "Saisissez un nombre entier.",
  settings_err_positive: "Doit être supérieur à 0.",
  settings_err_nonNegative: "Doit être supérieur ou égal à 0.",
  settings_err_min: "Doit être d'au moins %1.",
  settings_err_option: "Choisissez une option valide.",
  settings_err_progressExceedsHeartbeat:
    "Ne doit pas dépasser l'intervalle de signal de téléchargement.",
  settings_err_timeoutNotGreaterThanHeartbeat:
    "Doit être supérieur à l'intervalle de signal de téléchargement.",
} satisfies Messages;
