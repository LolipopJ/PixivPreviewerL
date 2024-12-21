# Pixiv Previewer (LolipopJ Edition)

请前往 <a href="https://greasyfork.org/zh-CN/scripts/30766">Greasyfork</a> 查看。

## 开发

安装项目依赖：

```bash
yarn
```

修复或添加脚本功能，编辑 `src/pixiv-previewer.ts` 文件。

修改 Tampermonkey 的元数据，编辑 `tsup.config.ts` 中的 `banner` 配置。

修复质量或格式问题：

```bash
yarn lint     # 修复源码质量与格式问题
yarn prettier # 修复其它代码的格式问题
```

打包为可发布文件 `dist/pixiv-previewer.js`：

```bash
yarn build
```
