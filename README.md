# PixivPreviewerL / Pixiv Previewer (LolipopJ Edition)

> 原项目：[Ocrosoft/PixivPreviewer](https://github.com/Ocrosoft/PixivPreviewer)，原插件页面：[Pixiv Previewer](https://greasyfork.org/zh-CN/scripts/30766)

我是 Pixiv 中度仓鼠症，Ocrosoft/PixivPreviewer 带给我很大的效率提升，是我的浏览器的必备插件之一，因而我 Fork 了该项目并进行了简易的 TypeScript 工程化改造，并彻底按照**自己的喜好**对此项目进行开发维护。由于我的自以为是，相比原项目，此项目里的插件有如下退化：

- **不支持小说相关内容。** 我不使用 Pixiv 浏览小说，所以不会对小说相关内容进行开发与维护。
- **较少的可配置项。** 我自己用不着的配置项也不会进行开发维护，将直接删除。
- **更低的浏览器兼容性。** 构建产物目标为 `Chrome >= 107`，不保证较低版本 Chrome 以及其他浏览器的兼容性。
- **不添加多语言支持。** 中文优先，没有对其他语言的支持计划。

那么有什么进化呢？大抵只是基于现代前端工程化体系开发与重构，可维护性和性能会稍微好一点吧。

## 兼容性

`Chrome >= 107`（2022.10.25）；较低版本 Chrome 以及其他浏览器的兼容性未测试。

## 安装

如果您想获取跟我一样的体验，那么请看插件页面 ~~[PixivPreviewerL](https://greasyfork.org/zh-CN/scripts/)~~（暂未上架）。或者直接在 Tampermonkey 上导入已经打包好的插件代码：[`dist/index.js`](./dist/index.js)。

[Pixiv Plus](https://greasyfork.org/en/scripts/34153) 是另一个我在浏览器上的必备插件，在兼容它的同时，对此插件的维护开发也将避免做与它重复的工作。您可以放心地同时启用这两个插件。

## 开发中的功能

- [ ] 作品预览功能
  - [x] Refactor：鼠标悬浮作品显示预览窗口，兼容所有页面
  - [ ] Feature: 预览窗口添加显示当前作品的收藏量等关键信息
- [ ] 作品排序功能
  - [ ] Feature：功能覆盖页面
    - [x] 标签搜索
      - [x] 顶部：<https://www.pixiv.net/tags/%E5%A4%A9%E7%AB%A5%E3%82%A2%E3%83%AA%E3%82%B9/artworks>
      - [x] 插画：<https://www.pixiv.net/tags/%E5%A4%A9%E7%AB%A5%E3%82%A2%E3%83%AA%E3%82%B9/illustrations>
      - [x] 漫画：<https://www.pixiv.net/tags/%E5%A4%A9%E7%AB%A5%E3%82%A2%E3%83%AA%E3%82%B9/manga>
    - [ ] 关注用户的新作品
      - [ ] 全部：<https://www.pixiv.net/bookmark_new_illust.php>
      - [ ] 限制级：<https://www.pixiv.net/bookmark_new_illust_r18.php>
    - [ ] 用户主页
      - [ ] 发表的插画 / 漫画：<https://www.pixiv.net/users/333556/artworks>
      - [ ] 发表的插画：<https://www.pixiv.net/users/333556/illustrations>
      - [ ] 发表的漫画：<https://www.pixiv.net/users/49906039/manga>
      - [ ] 收藏的插画 / 漫画：<https://www.pixiv.net/users/17435436/bookmarks/artworks>
    - [ ] 发现作品：<https://www.pixiv.net/discovery>
    - [ ] 新作品：
      - [ ] 全部：<https://www.pixiv.net/new_illust.php>
      - [ ] 限制级：<https://www.pixiv.net/new_illust_r18.php>
  - [x] Feature：支持按发布日期排序（过滤收藏数小于指定的作品）
  - [x] Feature：对 AI 生成作品和 AI 加笔作品显示特殊标记
  - [x] Feature：支持过滤 AI 加笔作品
  - [ ] Feature：对收藏快速增长的作品显示特殊标记
  - [x] Feature：请求失败自动重试
  - [ ] Perf：排序的结果分批展示，滚动到底部时渲染后续内容
- [x] 其它能力
  - [x] 迁移设置到 Tampermonkey 面板

## 开发

安装项目依赖：

```bash
yarn
```

开发与维护插件，可编辑 `src/` 目录里的源码；修改 Tampermonkey 的元数据，可编辑 `tsup.config.ts` 中的 `banner` 配置。

查找并修复质量或格式问题：

```bash
yarn lint     # 修复代码质量与格式问题
yarn prettier # 修复代码的格式问题
```

打包为可发布文件 `dist/index.js`：

```bash
yarn build
yarn build --watch # 持续构建产物
```
