# 「世间万物」100%需求落地实施方法

版本：v2.0  
日期：2026-05-27

## 1. 实施总原则

当前项目不能通过简单补页面达到 100% 需求。正确实施顺序是：

1. 建立权威主数据。
2. 修复内容 ID 映射。
3. 统一 300 份 JSON schema。
4. 重写低质量内容。
5. 重建书籍销售数据。
6. 重新生成搜索索引。
7. 修复前端路由和加载逻辑。
8. 建立自动验收脚本。
9. 构建并部署 GitHub Pages。
10. 线上全覆盖审计。

## 2. 阶段一：建立权威主数据

### 2.1 新建数据文件

创建：

```plain
public/data/chapters.json
public/data/domains.json
public/data/stages.json
```

### 2.2 迁移领域数据

从当前前端硬编码的领域数据中提取 100 个领域，形成 `domains.json`。

必须确保：

- 领域 ID 与探索页显示一致。
- 第 100 号领域就是“宇宙观与人类未来”。
- 每篇章 10 个领域。

### 2.3 修改前端引用

前端页面统一从 `domains.json` 读取领域信息。

需要改造页面：

- `Home`
- `Explore`
- `DomainDetail`
- `StageDetail`
- `Dashboard`
- `Roadmap`
- `Search`
- `Admin`

## 3. 阶段二：修复内容 ID 映射

### 3.1 建立映射审计表

生成一张表：

```plain
domainId | domains.json title | content beginner title | content intermediate title | content advanced title | status
```

### 3.2 修复错配

对每个 `content/{id}` 目录：

- 如果内容属于另一个领域，移动到正确 ID。
- 如果找不到对应领域，标记为待重写。
- 如果当前领域没有内容，生成内容任务。

### 3.3 第一次校验

运行校验脚本，确保：

- 300 个阶段文件存在。
- 每份文件 `domainId` 与路径一致。
- 每份文件 `domainTitle` 与主数据一致。

## 4. 阶段三：统一 JSON schema

### 4.1 编写迁移脚本

脚本职责：

- 把 `domainName` 迁移为 `domainTitle`。
- 把 `chapterName` 迁移为 `chapterTitle`。
- 把 `stage` 迁移为 `stageKey`。
- 把 `resources.desc` 迁移为 `resources.description`。
- 补齐 `schemaVersion`。
- 生成标准 `title`。

### 4.2 迁移后人工复核

重点检查：

- `21-40` 号领域缺失元数据问题。
- `41-60` 号领域资源字段问题。
- `61-100` 号领域模板化问题。

## 5. 阶段四：内容质量重写

### 5.1 内容分级

对 300 份阶段内容评分：

```plain
5 = 可作为正式内容
4 = 基本合格
3 = 可用但需优化
2 = 模板化明显
1 = 错配或不可用
```

### 5.2 重写优先级

优先级：

1. 错配内容。
2. 低于 3 分内容。
3. `61-100` 号领域模板化内容。
4. 缺少案例和练习答案的内容。
5. 推荐资源无效的内容。

### 5.3 每份内容重写流程

1. 确认领域标题和阶段。
2. 写阶段导言。
3. 设计 5-8 个知识模块。
4. 为每个模块写正文、案例、要点、思考题。
5. 写 3-5 道练习和参考答案。
6. 写阶段任务。
7. 配推荐书目。
8. 运行 schema 校验。

## 6. 阶段五：重建书籍销售数据

### 6.1 转换 books.json

把旧字段：

```plain
ID
ExplorationDomain
LearningStage
```

迁移为：

```plain
bookId
domainId
stageKey
```

### 6.2 统一购买策略

初期所有可销售书籍可先统一设置：

```json
{
  "purchaseType": "store_qrcode",
  "purchaseQrCode": "/wanwuzhi/qr/store-qr.png"
}
```

后续再逐本补充：

- `url`
- `book_qrcode`

### 6.3 前端改造

领域详情页：

```ts
getBooksByDomain(domainId)
```

阶段学习页：

```ts
getBooksByDomainAndStage(domainId, stageKey)
```

不要再用领域中文名匹配。

## 7. 阶段六：搜索索引重建

### 7.1 删除旧索引

旧索引继承了错配内容，不可直接沿用。

### 7.2 生成新索引

从校验通过后的 300 份内容 JSON 生成：

```plain
public/content/search-index.json
```

### 7.3 修复搜索页

搜索页必须：

- 加载索引。
- 输入关键词后即时过滤。
- 展示结果。
- 点击结果进入正确阶段。

## 8. 阶段七：前端修复清单

### 8.1 路由修复

修复顶部导航：

```plain
学习路线 -> #/roadmap
我的学习 -> #/dashboard
```

### 8.2 内容加载器修复

`content-loader` 必须：

- 使用 `/wanwuzhi/content/{id}/{stageKey}.json`。
- 校验返回 JSON 与当前路由一致。
- 错配时显示错误，不渲染错误内容。

### 8.3 书籍加载器修复

`books-loader` 必须：

- 按 `domainId` 和 `stageKey` 匹配。
- 支持四种 `purchaseType`。
- 没有书籍时显示合理空状态。

### 8.4 阶段页修复

确保展示：

- 导言。
- 模块。
- 理解按钮。
- 练习答案。
- 书单。
- 小店二维码。
- 笔记。
- 阶段导航。

## 9. 阶段八：自动验收脚本

必须实现：

```plain
scripts/validate-data.mjs
scripts/generate-search-index.mjs
scripts/audit-dist.mjs
scripts/audit-live.mjs
```

最低脚本要求：

- 校验失败时退出码非 0。
- 输出问题文件路径。
- 输出问题类型。
- 输出修复建议。

## 10. 阶段九：构建部署

本地流程：

```bash
npm run validate:data
npm run generate:search
npm run build
npm run audit:dist
```

部署后：

```bash
npm run audit:live
```

## 11. 阶段十：验收与发布结论

发布前必须填写：

```plain
数据验收：
页面验收：
搜索验收：
书籍销售验收：
二维码验收：
GitHub Pages 验收：
最终结论：
```

只有所有 P0 项通过，才可以发布正式版本。

## 12. 推荐实施顺序表

| 顺序 | 工作 | 产出 | 是否阻断 |
|---:|---|---|---|
| 1 | 建立主数据 | chapters/domains/stages | 是 |
| 2 | 修复内容映射 | 300 JSON 标题一致 | 是 |
| 3 | 统一 schema | 标准内容结构 | 是 |
| 4 | 重建书籍数据 | 新 books.json | 是 |
| 5 | 生成搜索索引 | search-index.json | 是 |
| 6 | 修前端路由 | 无错误导航 | 是 |
| 7 | 修加载器 | 无错内容渲染 | 是 |
| 8 | 内容重写 | 可学习内容 | 是 |
| 9 | 自动验收 | scripts | 是 |
| 10 | GitHub 部署 | 线上正式版 | 是 |

## 13. 当前版本到 100% 版本的最短路径

最短路径如下：

1. 从当前探索页/前端领域数据提取 100 领域，生成 `domains.json`。
2. 编写内容审计脚本，列出 297 个错配阶段。
3. 先批量修复 `content/{id}` 的领域标题与 ID。
4. 对无法修复的阶段标记为重写。
5. 统一全部 JSON 字段。
6. 把 `books.json` 全部改为 `domainId + stageKey`。
7. 全部书籍临时使用 `store_qrcode`。
8. 重新生成搜索索引。
9. 修复顶部导航和搜索页。
10. 跑 300 阶段路由审计。
11. 构建并部署 GitHub Pages。

## 14. 不建议的做法

不要：

- 只修 `domain/100` 一个页面。
- 继续用中文领域名匹配书籍。
- 继续手工维护搜索索引。
- 继续允许内容 JSON schema 混用。
- 在未通过校验时直接复制 dist 到 GitHub。
- 把模板化内容当成正式学习内容。

