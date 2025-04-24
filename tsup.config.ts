import svg from "esbuild-plugin-svg";
import { defineConfig } from "tsup";

import packageJson from "./package.json";

export default defineConfig({
  entry: ["src/index.ts"],
  target: ["chrome107"],
  minify: false,
  splitting: false,
  clean: true,
  platform: "browser",
  esbuildPlugins: [svg()],
  env: {
    VERSION: packageJson.version,
    BUG_REPORT_PAGE: packageJson.bugs.url,
  },
  banner: {
    js: `// ==UserScript==
// @name                Pixiv Previewer L
// @namespace           ${packageJson.homepage}
// @version             ${packageJson.version}-${new Date().toLocaleDateString()}
// @description         ${packageJson.description}
// @author              ${packageJson.author}
// @license             ${packageJson.license}
// @supportURL          ${packageJson.homepage}
// @match               *://www.pixiv.net/*
// @grant               GM_getValue
// @grant               GM_setValue
// @grant               GM_registerMenuCommand
// @grant               GM_unregisterMenuCommand
// @grant               GM.xmlHttpRequest
// @icon                https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=32&url=https://www.pixiv.net
// @icon64              https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=https://www.pixiv.net
// @require             https://update.greasyfork.org/scripts/515994/1478507/gh_2215_make_GM_xhr_more_parallel_again.js
// @require             http://code.jquery.com/jquery-3.7.1.min.js
// @run-at              document-end
// ==/UserScript==`,
  },
});
