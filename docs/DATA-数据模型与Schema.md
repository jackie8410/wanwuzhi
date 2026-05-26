# 「世间万物」数据模型与 Schema

版本：v2.0  
日期：2026-05-27

## 1. 核心原则

所有业务数据必须以稳定 ID 关联，禁止再以中文标题作为唯一关联依据。

主键规则：

- `chapterId`：篇章 ID，范围 1-10。
- `domainId`：领域 ID，范围 1-100。
- `stageKey`：阶段 key，只允许 `beginner`、`intermediate`、`advanced`。
- `bookId`：书籍 ID，全站唯一。
- `kpId`：知识点 ID，在全站唯一。
- `exerciseId`：练习 ID，在全站唯一。

## 2. 文件结构

```plain
public/
  data/
    chapters.json
    domains.json
    stages.json
    books.json
  content/
    1/
      beginner.json
      intermediate.json
      advanced.json
    ...
    100/
      beginner.json
      intermediate.json
      advanced.json
    search-index.json
  qr/
    store-qr.png
```

## 3. chapters.json

```json
[
  {
    "chapterId": 1,
    "chapterNo": "第壹篇",
    "chapterTitle": "人性本质与精神世界",
    "description": "篇章说明",
    "coverImage": "/wanwuzhi/chapter-01.jpg",
    "sortOrder": 1
  }
]
```

校验规则：

- 必须恰好 10 条。
- `chapterId` 必须为 1-10 且唯一。
- `chapterTitle` 不得为空。
- `sortOrder` 必须为 1-10 且唯一。

## 4. domains.json

```json
[
  {
    "domainId": 100,
    "chapterId": 10,
    "domainTitle": "宇宙观与人类未来",
    "subtitle": "在宇宙尺度中理解人类处境与未来选择",
    "description": "领域说明",
    "difficulty": "advanced",
    "keywords": ["宇宙观", "人类未来", "科学哲学"],
    "coverImage": "/wanwuzhi/chapter-10.jpg",
    "sortOrder": 100
  }
]
```

校验规则：

- 必须恰好 100 条。
- `domainId` 必须为 1-100 且唯一。
- 每个 `chapterId` 必须恰好对应 10 个领域。
- `domainTitle` 是全站展示标题，必须与内容 JSON 保持完全一致。
- `sortOrder` 必须唯一。

## 5. stages.json

```json
[
  {
    "stageKey": "beginner",
    "stageLabel": "入门阶段",
    "shortLabel": "入门",
    "sortOrder": 1,
    "description": "建立基础概念、核心词汇和基本问题意识。"
  },
  {
    "stageKey": "intermediate",
    "stageLabel": "进阶阶段",
    "shortLabel": "进阶",
    "sortOrder": 2,
    "description": "建立模型、方法、实践路径和跨案例理解。"
  },
  {
    "stageKey": "advanced",
    "stageLabel": "专家阶段",
    "shortLabel": "专家",
    "sortOrder": 3,
    "description": "深入理论、前沿争议、综合应用和创造性输出。"
  }
]
```

校验规则：

- 必须恰好 3 条。
- `stageKey` 只允许 `beginner`、`intermediate`、`advanced`。
- 不允许出现 `master`、`expert` 等替代 key。

## 6. 内容 JSON

路径：

```plain
content/{domainId}/{stageKey}.json
```

完整 schema：

```json
{
  "schemaVersion": "2.0",
  "domainId": 100,
  "chapterId": 10,
  "domainTitle": "宇宙观与人类未来",
  "chapterTitle": "宇宙规律与哲学思辨",
  "stageKey": "intermediate",
  "stageLabel": "进阶阶段",
  "title": "宇宙观与人类未来 · 进阶阶段",
  "intro": "阶段导言，500-1000字。",
  "knowledgePoints": [],
  "exercises": [],
  "tasks": [],
  "resources": []
}
```

校验规则：

- `domainId` 必须与目录名一致。
- `stageKey` 必须与文件名一致。
- `domainTitle` 必须与 `domains.json` 同 ID 标题一致。
- `chapterId` 必须与 `domains.json` 同 ID 篇章一致。
- `stageLabel` 必须与 `stages.json` 同 key 标签一致。
- `title` 必须等于 `{domainTitle} · {stageLabel}`。
- `intro` 建议 500-1000 字，最低不得少于 300 字。
- `knowledgePoints` 必须 5-8 条。
- `exercises` 必须 3-5 条。
- `resources` 必须 3-6 条。

## 7. knowledgePoints

```json
{
  "id": "kp-100-intermediate-01",
  "title": "宇宙尺度下的人类位置",
  "summary": "理解人类在宇宙尺度中的空间、时间与认知位置。",
  "content": "正文内容。",
  "examples": [
    "案例 1",
    "案例 2"
  ],
  "keyTakeaways": [
    "要点 1",
    "要点 2",
    "要点 3"
  ],
  "furtherThinking": [
    "思考题 1",
    "思考题 2"
  ]
}
```

校验规则：

- `id` 必须全站唯一。
- `title` 不得为空。
- `summary` 不得为空。
- `content` 不得为空。
- `keyTakeaways` 至少 3 条。
- 不允许内容只替换领域名而正文结构完全相同。

## 8. exercises

```json
{
  "id": "ex-100-intermediate-01",
  "type": "分析",
  "question": "请分析技术进步如何改变人类对宇宙未来的想象。",
  "answer": "参考答案。",
  "hint": "可以从科学发现、工程能力和价值选择三个角度展开。"
}
```

允许的 `type`：

- 理解
- 应用
- 分析
- 反思
- 创作

校验规则：

- `id` 必须全站唯一。
- `question` 不得为空。
- `answer` 不得为空。
- `type` 必须使用允许值。

## 9. resources

```json
{
  "id": "res-100-intermediate-01",
  "type": "book",
  "title": "书名或资源名",
  "author": "作者，可选",
  "description": "推荐理由",
  "url": "",
  "bookId": "B100-I-001"
}
```

校验规则：

- `description` 是唯一描述字段。
- 不允许只使用旧字段 `desc`。
- `type=book` 时建议绑定 `bookId`。
- 正式发布内容中，资源 URL 不应全部为 `#`。

## 10. books.json

```json
[
  {
    "bookId": "B100-I-001",
    "domainId": 100,
    "stageKey": "intermediate",
    "title": "书名",
    "author": "作者",
    "publisher": "出版社",
    "description": "推荐理由",
    "resourceType": "book",
    "purchaseType": "store_qrcode",
    "purchaseUrl": "",
    "purchaseQrCode": "/wanwuzhi/qr/store-qr.png",
    "priority": 1
  }
]
```

允许的 `purchaseType`：

- `url`
- `book_qrcode`
- `store_qrcode`
- `pending`

校验规则：

- `bookId` 必须唯一。
- `domainId` 必须存在于 `domains.json`。
- `stageKey` 必须存在于 `stages.json`。
- `title` 不得为空。
- `description` 不得为空。
- `purchaseType=url` 时 `purchaseUrl` 必须非空。
- `purchaseType=book_qrcode` 时 `purchaseQrCode` 必须非空。
- `purchaseType=store_qrcode` 时 `purchaseQrCode` 应为 `/wanwuzhi/qr/store-qr.png`。

## 11. search-index.json

`search-index.json` 必须由 300 份内容 JSON 自动生成，不允许手工维护。

```json
[
  {
    "domainId": 100,
    "domainTitle": "宇宙观与人类未来",
    "chapterId": 10,
    "chapterTitle": "宇宙规律与哲学思辨",
    "stageKey": "intermediate",
    "stageLabel": "进阶阶段",
    "kpId": "kp-100-intermediate-01",
    "kpTitle": "宇宙尺度下的人类位置",
    "kpSummary": "理解人类在宇宙尺度中的空间、时间与认知位置。",
    "content": "用于搜索的正文摘录。",
    "keywords": ["宇宙观", "人类未来"],
    "url": "/domain/100/stage/intermediate"
  }
]
```

校验规则：

- 索引条数必须等于全部 `knowledgePoints` 数量。
- 每条索引的 `domainId + stageKey + kpId` 必须能回溯到原内容。
- `url` 必须能进入正确阶段页面。
- 不允许空 `domainTitle`。

