# AGENTS.md

PixivPreviewerL is a Tampermonkey userscript for `www.pixiv.net` (artwork preview, sorting, original-image downloads, local tags). It is a personal fork of Ocrosoft/PixivPreviewer; scope and non-goals (no novels, few settings, Chrome ≥ 107 only) are defined in [README.md](README.md). Do not add features that contradict them.

## Repository layout

```
src/
  index.ts        Entry: page-type detection (`Pages`), toolbar, menu commands, feature boot
  constants/      Defaults, cache TTLs/limits, DOM ids, event names (`g_` prefix for globals)
  enums/          PageType, IllustSortOrder, LogLevel, ...
  features/       User-facing features: preview, sort, downloads, hide-favorites, local-tags
  services/       Pixiv API requests, cache, downloads, bookmarks, tags
  databases/      IndexedDB connection and cache tables (illustration, ugoira)
  utils/          DOM, logger, settings (GM storage), throttle/debounce, ugoira player
  i18n/           Userscript UI strings by locale (`Texts`)
  icons/          SVG sources, inlined at build time (`rollup-plugin-svg`)
  types/          Shared types; `svg.d.ts` for SVG imports
tsdown.config.ts  Build config and the userscript metadata block (`banner`)
dist/             Built `pixiv-previewer-l.user.js`; tracked in Git
docs/             README images only
```

## Commands

```sh
pnpm install
pnpm run build              # tsdown → dist/pixiv-previewer-l.user.js
pnpm run lint               # eslint src --fix (rewrites files)
pnpm run prettier           # prettier . --write (rewrites files)
pnpm exec tsc --noEmit      # type check; no script and no test suite exist
```

There are no automated tests. Verify behavior by building and loading `dist/pixiv-previewer-l.user.js` in Tampermonkey on pixiv.net; say so explicitly when a change was not exercised in a browser.

## Build and release

- `dist/pixiv-previewer-l.user.js` is committed. Rebuild it only for a release or when the user asks; never hand-edit it.
- A release is one `release x.y.z` commit that bumps `package.json` `version`, rebuilds `dist/`, and updates README/lockfile as needed. The version drives the metadata `@version` and the upgrade dialog (`g_version`), so do not bump it otherwise.
- In the release commit, move the shipped entries from `Unreleased` into a `## [x.y.z] - YYYY-MM-DD` section. Keep `Unreleased` at the top and update the version comparison links in [CHANGELOG.md](CHANGELOG.md).
- Tampermonkey metadata lives only in the `banner` of [tsdown.config.ts](tsdown.config.ts). Add a `@grant` there for every new `GM_*`/`GM.*` API, and a `@require` for every new CDN library. Keep `@match` limited to `www.pixiv.net`.
- Build target is `chrome107`, output format is `cjs`, `minify: false`. Do not use syntax or APIs newer than that.
- `process.env.VERSION` and `process.env.BUG_REPORT_PAGE` are injected by tsdown `env`; declare new build-time values there.

## Conventions

- TypeScript `strict`, ESM, `verbatimModuleSyntax`: use `import type` for type-only imports. Local imports have no file extension.
- Imports/exports are sorted by `simple-import-sort`; Prettier uses double quotes, semicolons, `trailingComma: "es5"`, 2 spaces. Files use LF (`.gitattributes`). Run `pnpm run lint` on touched files before finishing.
- jQuery (`$`) is a `@require`d global and is used for DOM work in `src/`; match the surrounding file instead of mixing styles within one function.
- Network requests go through `services/request.ts` (`GM.xmlHttpRequest` with a Pixiv `referer`); `src/` does not use `fetch`, so do not introduce it.
- **Pixiv rate limits are the main risk.** Pixiv blocks aggressive clients. Reuse the cache and `requestWithRetry`; never add unbounded parallel requests, polling, or retry loops without a delay.
- **Cache changes:** TTLs, entry limits, and storage locations are listed in the README table. Update constants in `src/constants/index.ts` and the README table together. Changing an IndexedDB schema requires bumping `INDEX_DB_VERSION` in `databases/connection.ts`; an upgrade drops and recreates the cache tables, so update that version comment.
- **Settings:** add defaults to `g_defaultSettings` and the `GlobalSettings` type together; settings persist with `GM_setValue`, so keep stored keys backward compatible.
- **Multi-tab state** (download records, local tags) is shared through GM storage and `GM_addValueChangeListener`; keep writes idempotent.
- Pixiv markup and internal APIs change without notice. Prefer stable selectors, tolerate missing elements, and log through `iLog` (`utils/logger.ts`) rather than `console` directly.
- Keep userscript UI strings in `src/i18n`. Follow the Pixiv page language by default (configurable via the `language` setting) and fall back to English for unsupported locales. Match the surrounding language in comments and JSDoc.
- Keep `//#region` blocks and `g_` global naming in `src/index.ts` as they are; do not reorder unrelated code.
- Comments explain non-obvious behavior or Pixiv quirks, not control flow.
- Commit messages use Conventional Commits (`feat(scope):`, `fix:`, `perf:`, `chore:`, `docs:`) plus `release x.y.z`. Split unrelated changes.

## Docs

- Update both the English [README.md](README.md) and the Chinese [README.zh.md](README.zh.md) when a feature, setting, cache policy, or compatibility statement changes.
- Record every completed code change under `Unreleased` in [CHANGELOG.md](CHANGELOG.md) before handing off the work. Use the appropriate [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) category and summarize the impact for users or maintainers. Update an existing entry when it already covers the change.

## Secrets

The project has no credentials, and the script must never read, store, or send Pixiv cookies or tokens beyond the requests the page already makes. Do not commit `.serena/cache` or `.serena/project.local.yml` (already ignored).
