# 「世间万物」技术架构文档

版本：v2.0  
日期：2026-05-27

## 1. 技术目标

本项目以 GitHub Pages 托管静态站点为目标，不依赖后端服务。所有学习内容、书籍数据、搜索索引均以静态 JSON 方式发布，前端在浏览器中加载并渲染。

技术目标：

- 路由稳定。
- 数据可校验。
- 内容可独立维护。
- 搜索可离线运行。
- 发布可自动验收。
- GitHub Pages 部署可重复、可回滚。

## 2. 技术栈

推荐保持当前技术栈：

- React
- TypeScript
- Vite
- Tailwind CSS
- HashRouter
- localStorage
- 静态 JSON
- GitHub Pages

## 3. 目录结构

推荐结构：

```plain
wanwuzhi/
  src/
    components/
    data/
    pages/
    utils/
    App.tsx
    main.tsx
  public/
    content/
    data/
    qr/
    chapter-01.jpg
    ...
  scripts/
    validate-data.mjs
    generate-search-index.mjs
    audit-dist.mjs
    audit-live.mjs
  docs/
  dist/
  package.json
  vite.config.ts
```

## 4. 路由架构

必须使用 HashRouter，以适配 GitHub Pages。

标准路由：

```plain
/
/explore
/domain/:id
/domain/:id/stage/:stageKey
/dashboard
/roadmap
/search
/admin
```

顶部导航必须使用：

```plain
#/
#/explore
#/roadmap
#/dashboard
```

禁止继续使用：

```plain
#/learning-path
#/my-learning
```

## 5. Base 路径

Vite 必须配置：

```ts
export default defineConfig({
  base: "/wanwuzhi/"
});
```

所有静态资源路径必须能在 GitHub Pages 子路径下工作：

```plain
/wanwuzhi/content/1/beginner.json
/wanwuzhi/data/books.json
/wanwuzhi/qr/store-qr.png
```

## 6. 数据加载架构

### 6.1 领域主数据

前端启动后加载：

```plain
/wanwuzhi/data/chapters.json
/wanwuzhi/data/domains.json
/wanwuzhi/data/stages.json
```

所有页面使用 `domains.json` 作为领域标题和篇章关系的唯一来源。

### 6.2 内容加载

阶段页通过 URL 参数加载：

```plain
/wanwuzhi/content/{domainId}/{stageKey}.json
```

加载后必须做运行时一致性检查：

- JSON `domainId` 等于路由 `id`。
- JSON `stageKey` 等于路由 `stageKey`。
- JSON `domainTitle` 等于 `domains.json` 同 ID 标题。

如果不一致，不应静默渲染，应显示明确错误并记录日志。

### 6.3 书籍加载

统一加载：

```plain
/wanwuzhi/data/books.json
```

领域详情页过滤：

```ts
book.domainId === currentDomainId
```

阶段页过滤：

```ts
book.domainId === currentDomainId && book.stageKey === currentStageKey
```

## 7. localStorage 规范

所有 key 必须使用 `wanwuzhi_` 前缀。

```plain
wanwuzhi_favorites
wanwuzhi_understood_{domainId}_{stageKey}_{kpId}
wanwuzhi_notes_{domainId}_{stageKey}
wanwuzhi_admin_auth
```

规则：

- 收藏按领域 ID 存储。
- 理解状态按知识点 ID 存储。
- 笔记按领域阶段存储。
- 不在 localStorage 存储敏感数据。

## 8. 搜索架构

搜索页加载：

```plain
/wanwuzhi/content/search-index.json
```

索引必须由脚本自动生成，不允许人工维护。

搜索流程：

1. 页面加载索引。
2. 用户输入关键词。
3. 对 `domainTitle`、`chapterTitle`、`kpTitle`、`kpSummary`、`content`、`keywords` 做本地匹配。
4. 返回结果。
5. 点击进入 `#/domain/{domainId}/stage/{stageKey}`。

## 9. 脚本体系

必须建设以下脚本。

### 9.1 validate-data.mjs

用途：校验主数据、内容 JSON、书籍数据。

检查：

- 100 领域。
- 300 内容文件。
- schema 完整。
- 领域标题一致。
- 阶段 key 合法。
- 书籍 ID 合法。

失败时退出码必须为非 0。

### 9.2 generate-search-index.mjs

用途：从 300 份内容 JSON 生成 `content/search-index.json`。

流程：

1. 读取 `domains.json`。
2. 遍历 300 份内容 JSON。
3. 提取知识点。
4. 生成索引。
5. 写入 `public/content/search-index.json`。

### 9.3 audit-dist.mjs

用途：构建后检查 `dist` 目录。

检查：

- `index.html` 存在。
- JS/CSS 存在。
- 300 内容 JSON 存在。
- 搜索索引存在。
- 书籍数据存在。
- 二维码存在。

### 9.4 audit-live.mjs

用途：部署后检查 GitHub Pages。

检查：

- 首页可访问。
- 关键资源可访问。
- 300 阶段路由可访问。
- 页面不空白。
- 页面不显示“暂无该阶段的学习内容”。

## 10. 构建流程

推荐 package scripts：

```json
{
  "scripts": {
    "validate:data": "node scripts/validate-data.mjs",
    "generate:search": "node scripts/generate-search-index.mjs",
    "build": "vite build",
    "audit:dist": "node scripts/audit-dist.mjs",
    "audit:live": "node scripts/audit-live.mjs"
  }
}
```

发布前必须按顺序运行：

```bash
npm run validate:data
npm run generate:search
npm run build
npm run audit:dist
```

## 11. 错误处理

阶段页内容加载失败时：

- 显示错误状态。
- 显示当前请求路径。
- 提供返回领域详情页按钮。
- 不要显示错误领域内容。

内容错配时：

- 阻止渲染。
- 显示“内容数据与当前领域不匹配”。
- 在开发环境输出详细日志。

## 12. 性能要求

- 300 份内容按需加载，不应首页一次性加载全部正文。
- 搜索索引可以一次性加载，但应控制字段长度。
- 图片资源需要压缩。
- 二维码保持清晰，不应过度压缩。

