# PixivPreviewerL / Pixiv Previewer (LolipopJ Edition)

> 原项目：[Ocrosoft/PixivPreviewer](https://github.com/Ocrosoft/PixivPreviewer)，原插件页面：[Pixiv Previewer](https://greasyfork.org/zh-CN/scripts/30766)

我是 Pixiv 中度仓鼠症，Ocrosoft/PixivPreviewer 带给我很大的效率提升，是我的浏览器的必备插件之一，因而我 Fork 了该项目并进行了简易的 TypeScript 工程化改造，并彻底按照**自己的喜好**对此项目进行开发维护。由于我的自以为是，相比原项目，此项目里的插件有如下退化：

- **不支持小说相关内容。** 我不使用 Pixiv 浏览小说，所以不会对小说相关内容进行开发与维护。
- **较少的可配置项。** 我自己用不着的配置项也不会进行开发维护，将直接删除。
- **更低的浏览器兼容性。** 构建产物目标为 `Chrome >= 107`，不保证较低版本 Chrome 以及其他浏览器的兼容性。
- **不完备的多语言支持。** 中文优先，没有对其他语言的支持计划。

那么有什么进化呢？大概可维护性和性能会稍微好一点……吧！

## 兼容性

`Chrome >= 107`（2022.10.25）；较低版本 Chrome 以及其他浏览器的兼容性未测试。

## 安装

如果您想获取跟我一样的体验，那么请看插件页面 ~~[PixivPreviewerL](https://greasyfork.org/zh-CN/scripts/)~~（暂未上架）。或者直接在 Tampermonkey 上导入已经打包好的插件代码：[`dist/index.js`](./dist/index.js)。

[Pixiv Plus](https://greasyfork.org/en/scripts/34153) 是另一个我在浏览器上的必备插件，在兼容它的同时，对此插件的维护开发也将避免做与它重复的工作。您可以放心地将此插件与它一起使用。

## 开发

安装项目依赖：

```bash
yarn
```

开发与维护插件代码，可编辑 `src/` 目录里的文件；修改 Tampermonkey 的元数据，可编辑 `tsup.config.ts` 中的 `banner` 配置。

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
