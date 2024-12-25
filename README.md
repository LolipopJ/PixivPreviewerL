# Pixiv Previewer (LolipopJ Edition)

> 原项目：[Ocrosoft/PixivPreviewer](https://github.com/Ocrosoft/PixivPreviewer)，原插件页面：[Pixiv Previewer](https://greasyfork.org/zh-CN/scripts/30766)

插件页面：~~[Pixiv Previewer (LolipopJ Edition)](https://greasyfork.org/zh-CN/scripts/)~~（暂未上架）。推荐与插件 [Pixiv Plus](https://greasyfork.org/en/scripts/34153) 一起使用。

## 兼容性

`Chrome >= 107`

## 开发

安装项目依赖：

```bash
yarn
```

修复或添加脚本功能，编辑 `src/` 目录里的文件。

修改 Tampermonkey 的元数据，编辑 `tsup.config.ts` 中的 `banner` 配置。

修复质量或格式问题：

```bash
yarn lint     # 修复源码质量与格式问题
yarn prettier # 修复代码的格式问题
```

打包为可发布文件 `dist/index.js`：

```bash
yarn build
```
