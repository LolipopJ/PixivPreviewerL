import { defineConfig } from 'tsup'
import packageJson from './package.json'

export default defineConfig({
  entry: ['src/pixiv-previewer.ts'],
  target: ['chrome58', 'edge16', 'firefox57', 'safari11'],
  splitting: false,
  clean: true,
  banner: {
    js: `// ==UserScript==
// @name                Pixiv Previewer (LolipopJ Edition)
// @namespace           ${packageJson.homepage}
// @version             ${packageJson.version}-${new Date().toLocaleDateString()}
// @description         ${packageJson.description}
// @description:zh-CN   原项目：https://github.com/Ocrosoft/PixivPreviewer。显示预览图（支持单图，多图，动图）；动图压缩包下载；搜索页按热门度（收藏数）排序并显示收藏数。
// @description:ja      元のプロジェクト: https://github.com/Ocrosoft/PixivPreviewer。プレビュー画像の表示（単一画像、複数画像、動画のサポート）; アニメーションのダウンロード（.zip）; お気に入りの数で検索ページをソートします（そして表示します）。 最新の検索ページ用に更新されました。
// @description:zh_TW   原項目：https://github.com/Ocrosoft/PixivPreviewer。顯示預覽圖像（支持單幅圖像，多幅圖像，運動圖像）； 下載動畫（.zip）; 按收藏夾數對搜索頁進行排序（並顯示）。 已為最新的搜索頁面適配。
// @author              ${packageJson.author}
// @match               *://www.pixiv.net/*
// @grant               unsafeWindow
// @grant               GM.xmlHttpRequest
// @grant               GM_xmlhttpRequest
// @license             ${packageJson.license}
// @icon                https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=32&url=https://www.pixiv.net
// @icon64              https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=https://www.pixiv.net
// @require             https://raw.githubusercontent.com/Tampermonkey/utils/refs/heads/main/requires/gh_2215_make_GM_xhr_more_parallel_again.js
// ==/UserScript==`,
  },
})
