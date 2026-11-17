# runtime-settings Specification

## Purpose

定义功能设置和底层可调数值的有效范围、默认行为及持久化约定，让预览、排序、本地标签、下载与缓存能够在保存后采用一致的配置，同时保留用户数据，避免通过刷新页面或兼容旧配置路径实现配置更新。

## Requirements

### Requirement: Preview and artwork download settings

作品预览 SHALL 提供整个预览功能总开关（默认开启）、动图预览（开启）、悬停延迟（300 ms）、新标签页打开作品（开启）、长按固定预览时间（300 ms）、翻页加载遮罩延迟（120 ms）和下载成功提示时长（3 秒）。动图预览 SHALL 受总开关约束。

#### Scenario: Enable preview after starting disabled

- **WHEN** 页面加载时预览关闭，用户随后保存开启预览
- **THEN** 下一次悬停 SHALL 能触发预览，无需刷新或重新导航

#### Scenario: Disable an active preview

- **WHEN** 正在显示预览或等待悬停计时，用户保存关闭预览
- **THEN** 系统 SHALL 关闭预览并取消待触发计时，且不得中断已经发起的作品原图下载

#### Scenario: Apply a changed hover delay

- **WHEN** 用户保存新的悬停延迟
- **THEN** 待触发的旧悬停计时 SHALL 被取消，下一次悬停 SHALL 使用新延迟

#### Scenario: Turn off forced new-tab navigation

- **WHEN** 用户关闭新标签页打开作品并保存
- **THEN** 脚本 SHALL 不再强制其处理的作品链接在新标签页打开，并撤销此前由脚本增加的相关链接行为，不影响作者和标签链接

### Requirement: Sorting settings retain their scope

作品排序 SHALL 提供排序页数（2）、最低收藏数（500）、排序依据（收藏数）、过滤 AI 生成（关闭）、过滤 AI 辅助（关闭）、过滤已收藏（开启）、启用标签过滤（关闭）和排除标签列表（空）。过滤项 SHALL 仅作用于脚本排序过程，且不得改变页面工具栏独立的隐藏已收藏操作的语义。

#### Scenario: Save while a sort is running

- **WHEN** 用户在排序进行中保存新的页数、排序依据或过滤条件
- **THEN** 当前排序 SHALL 使用开始时的完整配置，下一次手动排序 SHALL 使用新配置，且保存不得自动发起新的作品请求或重排当前结果

#### Scenario: Independent AI filters

- **WHEN** 用户只开启 AI 辅助过滤并保存
- **THEN** 下一次排序 SHALL 应用 AI 辅助标签过滤，且不得同时将 AI 生成过滤设置为开启

#### Scenario: Disable tag filtering while retaining its list

- **WHEN** 用户填写排除标签列表后关闭标签过滤并保存
- **THEN** 列表 SHALL 被保留，且下一次排序 SHALL 不通过该列表过滤作品，除非用户重新启用标签过滤

### Requirement: Local tag settings apply without refresh

本地标签 SHALL 提供管理功能开关（默认开启）和浮层显示/关闭延迟（200/180 ms）。保存开关后相关入口、浮层、管理面板及交互 SHALL 立即启停，且不得删除已有本地标签、重复记录访问或重复处理一次搜索响应。

#### Scenario: Enable local tags after starting disabled

- **WHEN** 页面加载时本地标签关闭，用户保存开启本地标签
- **THEN** 当前页面的适用入口及后续搜索统计 SHALL 可用，无需刷新，不补发过去的搜索请求

#### Scenario: Toggle local tags repeatedly

- **WHEN** 用户连续保存关闭、开启、关闭、开启本地标签
- **THEN** 当前功能 SHALL 保持一套有效交互，且一次访问、一次搜索响应或一次用户操作不得被重复计数或重复执行

#### Scenario: Disable during a pending search response

- **WHEN** 标签搜索已发起但尚未返回，用户保存关闭本地标签
- **THEN** 响应返回后 SHALL 不再因本地标签功能写入搜索统计，且已有标签数据 SHALL 保留

### Requirement: Advanced cache configuration

高级设置 SHALL 提供预览预加载数量、预览内部缓存容量、预览详情额外陈旧容忍时间、详情及分页缓存有效期和容量、新作品免缓存窗口、用户作品列表缓存有效期、动图帧有效期/数量/空间上限、标签详情与翻译有效期及翻译容量。初始默认值 SHALL 保持本变更前的有效策略，具体默认值由本变更设计清单列明。

#### Scenario: Change a cache lifetime

- **WHEN** 用户保存更短的缓存有效期后再次访问此前缓存的数据
- **THEN** 系统 SHALL 按新有效期判断缓存是否可用，且保存本身不得主动重新请求该数据

#### Scenario: Reduce cache capacity

- **WHEN** 用户保存小于现有占用的新缓存上限
- **THEN** 内存缓存 SHALL 按新上限淘汰，持久化缓存 SHALL 安排按新策略清理，不需要刷新或数据库结构升级

### Requirement: Advanced download coordination configuration

高级设置 SHALL 提供已完成及可重试记录上限（各 200 条）、进度持久化间隔（1 秒）、心跳间隔（15 秒）和失联判定时间（180 秒）。进度持久化间隔 SHALL 不大于心跳间隔，失联判定时间 SHALL 大于心跳间隔。

#### Scenario: Apply record retention without aborting a download

- **WHEN** 用户保存更小的下载记录保留上限，随后发生记录写入或更新
- **THEN** 系统 SHALL 按新上限淘汰旧的对应终态记录，不删除活动下载记录，不中断活动下载

#### Scenario: Change download timing

- **WHEN** 用户保存新的有效心跳、失联判定及进度持久化间隔
- **THEN** 后续心跳、状态判定和进度写入 SHALL 使用新值，且不得新增重复心跳循环或重复发起同一下载

### Requirement: Advanced network configuration

高级设置 SHALL 提供请求重试间隔（10 秒）、最大尝试次数（含首次，默认不限）、标签请求超时（10 秒）、动图下载分块大小（300000 字节）及尾部探测大小（30000 字节）。有限尝试次数 SHALL 为正整数，重试间隔 SHALL 不小于 1 秒，且配置不得增加并行请求或取消已有缓存复用。

#### Scenario: Apply changed request parameters

- **WHEN** 用户保存有效网络配置
- **THEN** 后续新请求 SHALL 使用新超时和尝试次数限制，后续重试等待 SHALL 使用新间隔；已发出的请求和已创建的动图播放器 SHALL 不因保存而重启

#### Scenario: Retry limit includes the initial attempt

- **WHEN** 用户设置最大尝试次数为 1 后发起一个失败请求
- **THEN** 系统 SHALL 总共尝试一次，并报告失败，不再发起第二次请求

#### Scenario: Reject aggressive retry timing

- **WHEN** 用户尝试保存小于 1 秒的重试间隔
- **THEN** 系统 SHALL 拒绝保存并说明最小间隔，当前网络配置 SHALL 保持不变

### Requirement: Advanced scheduling configuration

高级设置 SHALL 提供数据库打开超时（10 秒）、通用 DOM 探测间隔/次数（300 ms/10）、工具栏探测间隔/次数（200 ms/25）、标签界面更新防抖（100 ms）、本地标签延迟保存（500 ms）和空闲缓存清理最长等待（3 秒）。后续操作 SHALL 使用新值，且不得因修改配置新增持续轮询。

#### Scenario: Change scheduling defaults

- **WHEN** 用户保存新的探测、超时或防抖参数
- **THEN** 后续对应操作 SHALL 使用新参数，不取消已经发出的数据库操作，不重复挂载已有工具栏或标签入口

#### Scenario: Preserve pending local tag writes

- **WHEN** 本地标签有待保存数据，用户修改延迟保存时间或关闭本地标签
- **THEN** 系统 SHALL 保证待保存数据落盘，不得因取消或重建计时器而丢失修改

### Requirement: Exclude appearance, invariants and obsolete paths

配置 SHALL 不包含外观数值、颜色分档阈值、纯显示密度阈值、协议与格式常量、站点分页语义常量或仅供过时浏览器兼容分支使用的参数。图片解码缓存容量 SHALL 按预加载数量的两倍计算，翻译缓存淘汰目标 SHALL 按容量的一半计算，悬停内部计时 SHALL 由悬停延迟计算，不另设字段。

#### Scenario: Inspect available settings

- **WHEN** 用户展开全部配置
- **THEN** 系统 SHALL 不提供字号、边距、圆角、层级、收藏数颜色阈值、标签按钮图标切换阈值、HTTP 状态码、ZIP 格式偏移、分页规格或无效兼容参数的编辑项

#### Scenario: Recompute derived capacities

- **WHEN** 用户将预加载数量从 5 改为 3，将翻译缓存容量从 2000 改为 1200 并保存
- **THEN** 图片解码缓存容量 SHALL 自动变为 6，翻译缓存下一次淘汰的保留目标 SHALL 为 600，不出现独立的对应配置字段

### Requirement: Validate numeric and dependent values

计数及字节容量 SHALL 为正整数；持续有效期、超时、探测间隔及长按时间 SHALL 为正有限数值。预览/浮层/遮罩/提示延迟、防抖及延迟落盘 SHALL 允许 0；最低收藏数 SHALL 为非负整数。翻译缓存容量 SHALL 至少为 2，动图尾部探测 SHALL 至少容纳固定 ZIP 尾记录，动图下载分块 SHALL 至少为 64 KiB。

#### Scenario: Reject an invalid count

- **WHEN** 用户保存负数、非整数、空值或非有限的缓存数量
- **THEN** 系统 SHALL 拒绝保存，不静默替换成默认值

#### Scenario: Accept immediate hover

- **WHEN** 用户将悬停延迟设为 0 并保存
- **THEN** 后续悬停 SHALL 使用零等待语义，不回退到 300 ms

### Requirement: Persist current configuration without legacy paths

系统 SHALL 持久化完整的有效用户配置，并在后续页面加载时采用它；缺少当前字段时 SHALL 使用其默认值。内部版本元数据 SHALL 不作为用户字段。不得增加旧键别名、双读、配置版本迁移或旧菜单回退路径。

#### Scenario: Reload after saving

- **WHEN** 用户保存配置后正常打开另一个 Pixiv 页面
- **THEN** 新页面 SHALL 使用保存后的值，并为尚未存储的当前字段采用默认值

### Requirement: Synchronize settings across Pixiv tabs

一个标签页保存配置后，其他已打开的 Pixiv 标签页 SHALL 无需刷新地采用新有效配置。其他面板中未修改的字段 SHALL 跟随新配置；本地已修改或明确恢复默认的草稿字段 SHALL 保留，并在保存时与最新有效配置合并；同一字段以最后一次成功保存为准。

#### Scenario: Remote save preserves local draft changes

- **WHEN** A 标签页已修改悬停延迟但未保存，B 标签页保存新的最低收藏数
- **THEN** A 标签页的运行配置及未编辑的最低收藏数字段 SHALL 更新，悬停延迟草稿 SHALL 保留；A 随后保存不得覆盖 B 的最低收藏数

#### Scenario: Restore all defaults after a remote edit

- **WHEN** A 标签页执行全部恢复默认但未保存，B 标签页随后修改某个配置字段，A 再保存
- **THEN** A SHALL 明确保存全部用户字段的默认值，同时保留最新内部版本元数据和用户数据
