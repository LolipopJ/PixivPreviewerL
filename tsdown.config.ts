// @ts-expect-error: no type define
import svg from "rollup-plugin-svg";
import { defineConfig } from "tsdown";

import packageJson from "./package.json" with { type: "json" };

const formatBuildDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

export default defineConfig({
  entry: ["src/index.ts"],
  inputOptions: {
    platform: "browser",
  },
  outputOptions: {
    entryFileNames: "pixiv-previewer-l.user.js",
  },
  target: ["chrome107"],
  minify: false,
  clean: true,
  plugins: [svg()],
  env: {
    VERSION: packageJson.version,
    BUG_REPORT_PAGE: packageJson.bugs.url,
  },
  banner: {
    js: `// ==UserScript==
// @name                Pixiv Previewer L
// @name:zh-CN          Pixiv Previewer L
// @name:zh-TW          Pixiv Previewer L
// @name:ja             Pixiv Previewer L
// @name:ko             Pixiv Previewer L
// @name:ru             Pixiv Previewer L
// @name:de             Pixiv Previewer L
// @name:fr             Pixiv Previewer L
// @namespace           ${packageJson.homepage}
// @version             ${packageJson.version}-${formatBuildDate()}
// @description         ${packageJson.description}
// @description:zh-CN   Pixiv 油猴脚本。鼠标悬停即可预览插画、漫画和动图。支持按收藏数排序、原图下载与进度追踪、隐藏已收藏作品和本地标签管理。
// @description:zh-TW   Pixiv 油猴腳本。滑鼠懸停即可預覽插畫、漫畫與動圖。支援依收藏數排序、原圖下載與進度追蹤、隱藏已收藏作品和本地標籤管理。
// @description:ja      pixiv ユーザースクリプト。ホバーでイラスト・マンガ・うごイラをプレビュー。ブックマーク数順の並べ替え、原寸画像のダウンロードと進捗管理、ブックマーク済み作品の非表示、ローカルタグ管理に対応。
// @description:ko      픽시브 유저스크립트. 마우스 오버로 일러스트·만화·우고이라를 미리보기. 북마크 수순 정렬, 원본 이미지 다운로드 및 진행률 추적, 북마크한 작품 숨기기, 로컬 태그 관리 지원.
// @description:ru      Пользовательский скрипт для Pixiv: предпросмотр иллюстраций, манги и угоира при наведении. Поддерживает сортировку по закладкам, скачивание оригиналов с отслеживанием прогресса, скрытие добавленных в закладки работ и локальное управление тегами.
// @description:de      Pixiv-Userscript für die Vorschau von Illustrationen, Manga und Ugoira beim Überfahren mit der Maus. Unterstützt Sortierung nach Lesezeichen, Original-Downloads mit Fortschrittsverfolgung, Ausblenden gespeicherter Werke und lokale Tag-Verwaltung.
// @description:fr      Script utilisateur Pixiv pour prévisualiser illustrations, mangas et ugoira au survol. Prend en charge le tri par favoris, le téléchargement d'images originales avec suivi de progression, le masquage des œuvres en favoris et la gestion locale des tags.
// @author              ${packageJson.author}
// @license             ${packageJson.license}
// @homepageURL         ${packageJson.homepage}
// @supportURL          ${packageJson.bugs.url}
// @compatible          chrome 107+
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
// ==/UserScript==`,
  },
  format: "cjs",
  dts: false,
});
