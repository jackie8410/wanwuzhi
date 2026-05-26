# 「世间万物」GitHub 部署与更新流程

版本：v2.0  
日期：2026-05-27  
线上地址：https://jackie8410.github.io/wanwuzhi/

## 1. 部署目标

本项目使用 GitHub Pages 托管静态站点。部署目标是保证以下资源在线上稳定可访问：

```plain
https://jackie8410.github.io/wanwuzhi/
https://jackie8410.github.io/wanwuzhi/assets/*.js
https://jackie8410.github.io/wanwuzhi/assets/*.css
https://jackie8410.github.io/wanwuzhi/content/{domainId}/{stageKey}.json
https://jackie8410.github.io/wanwuzhi/content/search-index.json
https://jackie8410.github.io/wanwuzhi/data/books.json
https://jackie8410.github.io/wanwuzhi/qr/store-qr.png
```

## 2. 部署前置条件

发布前必须确认：

- 100 个领域主数据已完成。
- 300 份内容 JSON 已完成结构校验。
- `books.json` 已按 `domainId + stageKey` 绑定。
- `search-index.json` 已重新生成。
- 前端路由已修复。
- 构建产物已通过本地 dist 审计。

## 3. Vite 配置

`vite.config.ts` 必须使用：

```ts
export default defineConfig({
  base: "/wanwuzhi/"
});
```

原因：

- GitHub Pages 项目站点部署在 `/wanwuzhi/` 子路径。
- 如果 base 错误，JS、CSS、图片、JSON 会出现 404 或路径错位。

## 4. 推荐 package scripts

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

## 5. 标准发布流程

在源码仓库中执行：

```bash
npm install
npm run validate:data
npm run generate:search
npm run build
npm run audit:dist
```

全部通过后，将 `dist` 目录内容发布到 GitHub Pages 对应分支或仓库根目录。

如果当前 GitHub Pages 使用仓库根目录发布：

```bash
git rm -rf .
cp -r dist/* .
git add -A
git commit -m "deploy: update wanwuzhi site"
git push origin main
```

如果使用 `gh-pages` 分支，推荐使用自动部署脚本或 GitHub Actions，不建议手工复制。

## 6. GitHub Pages 设置

GitHub 仓库设置：

```plain
Settings -> Pages
Source: Deploy from a branch
Branch: main
Folder: /root
```

或：

```plain
Branch: gh-pages
Folder: /root
```

必须与实际部署策略保持一致。

## 7. GitHub Actions 推荐方案

推荐后续改为 GitHub Actions 自动部署，避免手工复制 dist。

示例流程：

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run validate:data
      - run: npm run generate:search
      - run: npm run build
      - run: npm run audit:dist
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## 8. 部署后检查

部署完成后运行：

```bash
npm run audit:live
```

必须检查：

- 首页可访问。
- 资源无 404。
- 300 个阶段页可访问。
- 阶段页不空白。
- 阶段页不显示“暂无该阶段的学习内容”。
- 阶段页标题与内容一致。
- 搜索页可用。
- 二维码可加载。

## 9. 手工抽检 URL

每次发布后至少手工检查：

```plain
https://jackie8410.github.io/wanwuzhi/#/
https://jackie8410.github.io/wanwuzhi/#/explore
https://jackie8410.github.io/wanwuzhi/#/domain/1
https://jackie8410.github.io/wanwuzhi/#/domain/1/stage/beginner
https://jackie8410.github.io/wanwuzhi/#/domain/50/stage/intermediate
https://jackie8410.github.io/wanwuzhi/#/domain/100/stage/advanced
https://jackie8410.github.io/wanwuzhi/#/dashboard
https://jackie8410.github.io/wanwuzhi/#/roadmap
https://jackie8410.github.io/wanwuzhi/#/search
https://jackie8410.github.io/wanwuzhi/#/admin
```

## 10. 回滚方法

如果发布后发现 P0 问题：

1. 立即记录问题 URL 和错误表现。
2. 在 GitHub 仓库找到上一版正常 commit。
3. 回滚部署分支到上一版。
4. 重新触发 Pages 部署。
5. 修复问题后重新走完整发布流程。

手工回滚示例：

```bash
git revert <bad_commit_hash>
git push origin main
```

禁止使用不可追踪的本地覆盖方式直接修线上文件。

## 11. 发布记录模板

每次发布应记录：

```plain
发布日期：
发布版本：
提交 hash：
发布人：

数据校验：PASS / FAIL
搜索索引生成：PASS / FAIL
构建：PASS / FAIL
dist 审计：PASS / FAIL
线上审计：PASS / FAIL

核心变更：
1.
2.
3.

已知问题：
1.
2.

回滚 commit：
```

## 12. 当前项目的部署修正重点

针对当前线上版本，部署前必须先解决：

- 顶部导航错误路由：`learning-path`、`my-learning`。
- 领域与内容 JSON 错配。
- `books.json` 缺少 `domainId + stageKey` 绑定。
- 搜索输入后不返回结果。
- 内容 JSON schema 不统一。
- 61-100 号领域模板化内容。

这些问题未修复前，不应发布为正式 100% 需求版。

