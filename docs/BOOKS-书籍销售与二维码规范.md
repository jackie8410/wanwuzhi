# 「世间万物」书籍销售与二维码规范

版本：v2.0  
日期：2026-05-27

## 1. 目标

书籍销售系统的目标是把学习内容自然连接到购买场景。用户在领域详情页和阶段学习页看到推荐书单后，可以通过链接或二维码进入购买路径。

当前优先策略：

- 使用统一微信小店二维码作为全局销售入口。
- 后续可逐步补充单本书二维码或外部购买链接。

## 2. 展示位置

### 2.1 领域详情页

展示当前领域全部推荐书目。

匹配规则：

```plain
book.domainId == currentDomainId
```

### 2.2 阶段学习页

展示当前领域当前阶段推荐书目。

匹配规则：

```plain
book.domainId == currentDomainId
book.stageKey == currentStageKey
```

### 2.3 小店橱窗

阶段学习页底部必须展示“万物知识商店”入口，点击后显示统一微信小店二维码。

## 3. books.json 规范

```json
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
```

## 4. purchaseType 状态

### 4.1 url

条件：

```plain
purchaseType = "url"
purchaseUrl 非空
```

按钮：

```plain
前往购买
```

行为：

- 新标签页打开 `purchaseUrl`。

### 4.2 book_qrcode

条件：

```plain
purchaseType = "book_qrcode"
purchaseQrCode 非空
```

按钮：

```plain
微信扫码购买
```

行为：

- 弹出 Dialog。
- 展示单本书二维码。

### 4.3 store_qrcode

条件：

```plain
purchaseType = "store_qrcode"
purchaseQrCode = "/wanwuzhi/qr/store-qr.png"
```

按钮：

```plain
微信小店
```

行为：

- 弹出 Dialog。
- 展示统一微信小店二维码。

### 4.4 pending

条件：

```plain
purchaseType = "pending"
```

按钮/文案：

```plain
购买链接待补充
```

行为：

- 不跳转。
- 不弹窗。

## 5. 二维码资源规范

统一小店二维码：

```plain
public/qr/store-qr.png
```

部署路径：

```plain
/wanwuzhi/qr/store-qr.png
```

单本书二维码建议路径：

```plain
public/qr/books/{bookId}.png
```

部署路径：

```plain
/wanwuzhi/qr/books/{bookId}.png
```

图片要求：

- PNG 格式。
- 正方形。
- 清晰可扫码。
- 建议边长不低于 600px。

## 6. 书籍维护规则

每个阶段建议 3 本书：

- 1 本入门或核心书。
- 1 本进阶或案例书。
- 1 本扩展或实践资源。

每个领域三阶段合计建议 9 本书。若资源不足，可先使用 3-6 本覆盖全领域，但必须通过 `domainId` 绑定。

维护顺序：

1. 补齐 `domainId`。
2. 补齐 `stageKey`。
3. 补齐书名、作者、描述。
4. 设置 `purchaseType=store_qrcode`。
5. 后续再替换为单书二维码或购买链接。

## 7. 禁止事项

- 禁止使用 `ExplorationDomain` 作为唯一匹配字段。
- 禁止大量书籍 `domainId` 为空。
- 禁止全部购买字段为空但仍显示“前往购买”。
- 禁止二维码路径指向不存在文件。
- 禁止书单与当前领域无关。

## 8. 验收

领域详情页：

- 显示当前领域书目。
- 不显示其他领域书目。
- 书目按 `priority` 排序。
- 二维码入口可打开。

阶段学习页：

- 显示当前阶段书目。
- 购买按钮状态正确。
- 二维码图片能加载。

数据层：

- `books.json` 每条有 `bookId`。
- `domainId` 全部有效。
- `stageKey` 全部合法。
- `purchaseType` 全部合法。

