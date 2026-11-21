# Changelog

This file records notable changes to PixivPreviewerL. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and version headings use [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For versions 1.9.0 and earlier, see the [Greasy Fork version history](https://greasyfork.org/scripts/533844-pixiv-previewer-l/versions).

## [Unreleased]

### Added

- Show a stop button when Pixiv rate-limits sorting and debounce warnings from parallel requests.
- Add bookmark hearts to sorted artwork thumbnails for adding and removing bookmarks. The icons have a transparent background and align with the bottom of the bookmark count.

### Changed

- Automatically sort the next page after its artwork list renders.
- Show the retry attempt number in the sorting rate-limit warning.

### Fixed

- Show sorting and next-page controls only on supported Pixiv routes, and update them during navigation.
- Report sorting failures in a bottom-right notice with a link to GitHub Issues, and log artwork-list problems before sorting.
- Stop sorting and preserve the original list when Pixiv returns an invalid response or an unexpectedly empty artwork page.

## [1.10.1] - 2026-11-21

### Changed

- Updated the upgrade notice to link to the project changelog on GitHub.

### Fixed

- Improved artwork preview responsiveness during downloads and reduced the time to open large download histories.

## [1.10.0] - 2026-11-19

This section covers the `1.10.0-20261119` userscript on Greasy Fork, including the locale additions published after the Git tag.

### Added

- Added English, Japanese, Korean, Traditional Chinese, Russian, German, and French interface translations alongside Simplified Chinese.
- Added a **Language** setting for manual selection. By default, the script follows the Pixiv page language and falls back to English for unsupported languages.
- Added an English README alongside the Chinese README.

### Changed

- Updated the userscript listing with localized feature descriptions and declared Chrome 107+ compatibility in the script metadata.
- Localized download history timestamps and common error messages.

### Fixed

- Fixed missing local tag controls on English, Japanese, and Korean Pixiv tag pages.

[unreleased]: https://github.com/LolipopJ/PixivPreviewerL/compare/1.10.1...master
[1.10.1]: https://github.com/LolipopJ/PixivPreviewerL/compare/1.10.0...1.10.1
[1.10.0]: https://github.com/LolipopJ/PixivPreviewerL/compare/1.9.0...1.10.0
