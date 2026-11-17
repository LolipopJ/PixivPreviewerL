# settings-panel Specification

## Purpose

提供通过 Tampermonkey 打开的统一配置面板，让用户按功能查看并修改设置，在主动展开高级设置后调整底层参数，并通过明确的保存与恢复默认操作控制修改何时生效，避免编辑过程干扰当前浏览。

## Requirements

### Requirement: Tampermonkey settings entry

系统 SHALL 在所有脚本匹配的 Pixiv 页面提供一个名为“设置”的 Tampermonkey 配置入口。原有逐项切换、prompt 输入及立即重置全部设置的菜单入口 SHALL 被移除；已有缓存维护命令可以保留。

#### Scenario: Open settings without a toolbar

- **WHEN** 用户在没有脚本工具栏的 Pixiv 页面点击“设置”
- **THEN** 页面 SHALL 打开配置面板，且不依赖该页面支持作品排序或预览

#### Scenario: Reopen an already open panel

- **WHEN** 配置面板已打开且存在未保存修改，用户再次点击“设置”
- **THEN** 系统 SHALL 聚焦现有面板，保留草稿，且不创建重复面板

### Requirement: Bottom-right functional panel

配置面板 SHALL 固定显示在页面右下角，并在视口内滚动访问所有字段和底部操作。常用设置 SHALL 按“作品预览”（含作品下载）、“作品排序”、“本地标签”分组；界面文案 SHALL 为中文，字段 SHALL 显示清楚的单位和作用范围。

#### Scenario: Inspect functional settings

- **WHEN** 用户打开面板
- **THEN** 用户 SHALL 能在对应功能分组中找到预览及作品下载行为、排序及排序过滤、本地标签配置，并始终能访问保存、关闭和全部恢复默认操作

### Requirement: Advanced management disclosure

缓存、下载记录及协调、网络和内部调度的配置字段 SHALL 位于“高级设置”中。每次重新打开面板时高级设置 SHALL 默认隐藏，且仅在用户主动展开后显示。

#### Scenario: Open and expand advanced management

- **WHEN** 用户首次打开面板后点击“高级设置”
- **THEN** 底层配置字段 SHALL 从隐藏变为可访问，并按缓存、下载管理、网络、内部调度分类

#### Scenario: Collapse without losing edits

- **WHEN** 用户修改高级字段后折叠并重新展开高级设置
- **THEN** 尚未保存的高级字段草稿 SHALL 保持不变

### Requirement: Draft edits are isolated

打开面板 SHALL 基于当前有效配置创建草稿。修改草稿 SHALL 不改变持久化配置或当前功能行为；关闭面板 SHALL 放弃未保存修改。

#### Scenario: Edit without saving

- **WHEN** 用户修改预览延迟和排序页数但没有保存
- **THEN** 预览与下一次排序 SHALL 继续使用此前有效配置

#### Scenario: Close and reopen

- **WHEN** 用户关闭含未保存修改的面板后重新打开
- **THEN** 字段 SHALL 显示当前有效配置，而非已放弃的草稿

### Requirement: Restore one setting

每个用户配置字段 SHALL 提供单独恢复默认值的操作。操作 SHALL 只修改该字段的草稿，不改变其他草稿字段，且仍需保存后才生效。

#### Scenario: Restore one numeric field

- **WHEN** 用户在多个字段已修改的情况下恢复“悬停延迟”的默认值
- **THEN** 该字段草稿 SHALL 变为 300 ms，其他草稿修改 SHALL 保持，运行中的设置 SHALL 尚未改变

### Requirement: Restore all settings

“全部恢复默认” SHALL 将所有用户配置字段的草稿恢复为默认值，包括隐藏的高级字段。该操作 SHALL 不清空本地标签、下载记录或缓存，且 SHALL 不修改内部版本元数据；新配置保存后仍按正常保留策略管理缓存及记录。

#### Scenario: Restore hidden advanced values

- **WHEN** 用户在高级设置折叠时点击“全部恢复默认”
- **THEN** 所有用户配置字段的草稿 SHALL 恢复默认，且持久化配置和用户数据 SHALL 保持不变，直到用户明确保存配置

#### Scenario: Save restored defaults

- **WHEN** 用户保存全部恢复默认后的草稿
- **THEN** 系统 SHALL 应用默认配置，不调用清空本地标签、下载记录或全部缓存的维护操作，也不重新触发版本更新提示

### Requirement: Validate the complete draft

保存前系统 SHALL 校验常用和高级字段的完整候选配置。无效值或字段间关系冲突 SHALL 阻止整个保存，并定位到有中文说明的对应字段；不得仅保存有效的部分字段。

#### Scenario: Invalid hidden advanced field

- **WHEN** 高级设置中的失联判定时间不大于下载心跳间隔，用户折叠高级设置后点击保存
- **THEN** 系统 SHALL 拒绝保存，展开高级设置并定位错误，且有效配置 SHALL 保持不变

#### Scenario: Zero bookmark threshold is valid

- **WHEN** 用户将最低收藏数设为 0 并保存，其余字段有效
- **THEN** 系统 SHALL 保存 0，不得将其替换为默认的 500

### Requirement: Save and report its outcome

有效草稿 SHALL 通过一次完整配置写入完成保存，然后通知当前页面应用新配置。成功后面板 SHALL 保持打开，草稿与有效配置对齐并提示保存成功；写入失败 SHALL 保留草稿，显示失败信息且不提示成功。

#### Scenario: Successful save without navigation

- **WHEN** 用户保存有效配置
- **THEN** 系统 SHALL 持久化并应用新配置，保持当前页面地址、滚动位置及面板，不触发页面刷新

#### Scenario: Storage write fails

- **WHEN** 持久化配置写入失败
- **THEN** 系统 SHALL 保留可编辑草稿和此前有效配置，显示中文错误，允许用户再次保存

### Requirement: Accessible configuration controls

字段 SHALL 具有可识别的中文标签，分组与展开操作 SHALL 可通过键盘访问。焦点位于面板内时，用户 SHALL 能通过关闭按钮或 Escape 关闭面板；面板外的页面交互 SHALL 保持可用。

#### Scenario: Keyboard editing and closing

- **WHEN** 用户仅使用键盘展开高级设置、编辑字段并按 Escape
- **THEN** 操作 SHALL 可完成，面板 SHALL 关闭并放弃未保存修改，焦点 SHALL 返回可用的页面位置
