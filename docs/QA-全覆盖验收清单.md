# 「世间万物」全覆盖验收清单

版本：v2.0  
日期：2026-05-27

## 1. 验收原则

任何发布到 GitHub Pages 的版本都必须先通过本清单。人工目测只能作为补充，不能替代数据与路由自动校验。

验收结论只有三种：

- `PASS`：可发布。
- `BLOCKED`：存在 P0/P1 问题，不可发布。
- `CONDITIONAL`：只存在 P2/P3 问题，可由负责人确认后发布。

## 2. P0 阻断项

出现任意一项即不可发布：

- 首页无法打开。
- JS/CSS 主资源 404。
- 100 个领域卡片不足。
- 300 个阶段 JSON 缺失。
- 任一阶段页面空白。
- 任一阶段页面显示“暂无该阶段的学习内容”。
- 任一阶段页面 H1 与内容 JSON `domainTitle` 不一致。
- 任一阶段页面加载到其他领域内容。
- 搜索页无法打开。
- 顶部导航存在无效路由。
- 全局微信小店二维码无法加载。

## 3. 数据验收

### 3.1 chapters.json

- [ ] 文件存在。
- [ ] 恰好 10 条。
- [ ] `chapterId` 为 1-10 且唯一。
- [ ] `chapterTitle` 全部非空。
- [ ] 每条有 `chapterNo`。
- [ ] 每条有 `description`。

### 3.2 domains.json

- [ ] 文件存在。
- [ ] 恰好 100 条。
- [ ] `domainId` 为 1-100 且唯一。
- [ ] 每个 `chapterId` 恰好对应 10 个领域。
- [ ] `domainTitle` 全部非空。
- [ ] `description` 全部非空。
- [ ] `keywords` 全部为数组。

### 3.3 stages.json

- [ ] 文件存在。
- [ ] 恰好 3 条。
- [ ] 只包含 `beginner`、`intermediate`、`advanced`。
- [ ] 不出现 `master`。
- [ ] 不出现 `expert`。

### 3.4 300 份内容 JSON

对 `domainId=1..100` 与 `stageKey=beginner/intermediate/advanced` 全量检查：

- [ ] 文件存在。
- [ ] JSON 可解析。
- [ ] `schemaVersion` 存在。
- [ ] `domainId` 与路径一致。
- [ ] `stageKey` 与文件名一致。
- [ ] `domainTitle` 与 `domains.json` 一致。
- [ ] `chapterId` 与 `domains.json` 一致。
- [ ] `stageLabel` 与 `stages.json` 一致。
- [ ] `title` 等于 `{domainTitle} · {stageLabel}`。
- [ ] `intro` 非空。
- [ ] `knowledgePoints` 为 5-8 条。
- [ ] `exercises` 为 3-5 条。
- [ ] `resources` 为 3-6 条。

### 3.5 知识点

对全部知识点检查：

- [ ] `id` 非空且唯一。
- [ ] `title` 非空。
- [ ] `summary` 非空。
- [ ] `content` 非空。
- [ ] `examples` 至少 1 条。
- [ ] `keyTakeaways` 至少 3 条。
- [ ] 不出现 `TODO`。
- [ ] 不出现 `待补充`。
- [ ] 不出现明显乱码。

### 3.6 练习

对全部练习检查：

- [ ] `id` 非空且唯一。
- [ ] `type` 为允许值。
- [ ] `question` 非空。
- [ ] `answer` 非空。
- [ ] 题目与当前领域主题相关。

### 3.7 书籍数据

对 `books.json` 检查：

- [ ] 文件存在。
- [ ] 每条 `bookId` 非空且唯一。
- [ ] 每条 `domainId` 指向存在领域。
- [ ] 每条 `stageKey` 为合法阶段。
- [ ] 每条 `title` 非空。
- [ ] 每条 `description` 非空。
- [ ] `purchaseType=url` 时 `purchaseUrl` 非空。
- [ ] `purchaseType=book_qrcode` 时 `purchaseQrCode` 非空。
- [ ] `purchaseType=store_qrcode` 时 `purchaseQrCode` 为 `/wanwuzhi/qr/store-qr.png`。

## 4. 页面验收

### 4.1 首页

- [ ] 可访问 `#/`。
- [ ] 展示“世间万物”。
- [ ] 展示 Slogan“探索知识的边界，从入门到精通”。
- [ ] 展示 100 知识领域。
- [ ] 展示 300 学习内容。
- [ ] 展示 10 大篇章。
- [ ] CTA 进入 `#/explore`。

### 4.2 探索页

- [ ] 可访问 `#/explore`。
- [ ] 展示 100 个领域。
- [ ] 篇章筛选可用。
- [ ] 搜索过滤可用。
- [ ] 领域卡片进入 `#/domain/{domainId}`。

### 4.3 领域详情页

抽检并最终全量检查 `#/domain/1` 到 `#/domain/100`：

- [ ] 页面不空白。
- [ ] H1 与 `domains.json` 对应标题一致。
- [ ] 展示篇章信息。
- [ ] 展示三阶段学习路径。
- [ ] 三阶段按钮链接正确。
- [ ] 展示该领域推荐书籍。
- [ ] 微信小店二维码入口存在。

### 4.4 阶段学习页

全量检查 300 个阶段页：

- [ ] 页面不空白。
- [ ] 不显示“暂无该阶段的学习内容”。
- [ ] H1 与 `{domainTitle} · {stageLabel}` 一致。
- [ ] 面包屑存在。
- [ ] 阶段导言存在。
- [ ] 学习内容清单存在。
- [ ] 知识模块数量 5-8。
- [ ] 每个模块可展开/收起。
- [ ] 每个模块有“我已理解”按钮。
- [ ] 理解状态写入 `localStorage`。
- [ ] 练习数量 3-5。
- [ ] 练习答案可查看/收起。
- [ ] 推荐书目存在。
- [ ] 微信小店入口存在。
- [ ] 二维码图片加载成功。
- [ ] 学习笔记可输入。
- [ ] 学习笔记刷新后保留。
- [ ] 上一阶段/下一阶段链接正确。

### 4.5 个人面板

- [ ] 可访问 `#/dashboard`。
- [ ] 顶部“我的学习”导航进入 `#/dashboard`。
- [ ] 展示学习统计。
- [ ] 展示环形进度。
- [ ] 展示五级成就徽章。
- [ ] 徽章名称正确。
- [ ] 展示学习足迹。

### 4.6 成长路线

- [ ] 可访问 `#/roadmap`。
- [ ] 顶部“学习路线”导航进入 `#/roadmap`。
- [ ] 展示五阶成长地图。
- [ ] 展示逐阶详解。
- [ ] 展示十篇章旅程导航。

### 4.7 搜索页

- [ ] 可访问 `#/search`。
- [ ] 搜索索引加载成功。
- [ ] 输入“哲学”返回结果。
- [ ] 输入“心理”返回结果。
- [ ] 输入任一领域名称返回结果。
- [ ] 点击结果进入正确阶段页面。
- [ ] 搜索结果不出现空标题。

### 4.8 管理后台

- [ ] 可访问 `#/admin`。
- [ ] 未登录时显示密码输入。
- [ ] 正确密码进入后台。
- [ ] 后台统计数据与实际数据一致。
- [ ] 返回网站按钮可用。

## 5. GitHub Pages 验收

线上地址：

```plain
https://jackie8410.github.io/wanwuzhi/
```

检查：

- [ ] `index.html` 可访问。
- [ ] JS bundle 可访问。
- [ ] CSS bundle 可访问。
- [ ] `/wanwuzhi/content/1/beginner.json` 可访问。
- [ ] `/wanwuzhi/content/100/advanced.json` 可访问。
- [ ] `/wanwuzhi/content/search-index.json` 可访问。
- [ ] `/wanwuzhi/data/books.json` 可访问。
- [ ] `/wanwuzhi/qr/store-qr.png` 可访问。

## 6. 发布结论模板

```plain
发布版本：
检查日期：
检查人：

数据验收：PASS / BLOCKED / CONDITIONAL
页面验收：PASS / BLOCKED / CONDITIONAL
搜索验收：PASS / BLOCKED / CONDITIONAL
销售二维码验收：PASS / BLOCKED / CONDITIONAL
GitHub Pages 验收：PASS / BLOCKED / CONDITIONAL

阻断问题：
1.
2.
3.

可延后问题：
1.
2.

最终结论：PASS / BLOCKED / CONDITIONAL
```

