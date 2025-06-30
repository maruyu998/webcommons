# プロジェクトアーキテクチャガイド

## 🏗 概要

このドキュメントは、maruyu-webcommonsで構築されたアプリケーションの標準アーキテクチャと規約について説明します。

## 📁 ディレクトリ構造

```
project/
├── client/              # Reactフロントエンド
│   ├── src/
│   │   ├── components/  # Reactコンポーネント
│   │   ├── contexts/    # Reactコンテキスト
│   │   ├── data/        # APIクライアント関数
│   │   ├── types/       # TypeScript型定義
│   │   └── utils/       # ユーティリティ関数
│   ├── tsconfig.json
│   └── webpack.config.ts
├── server/              # Expressバックエンド
│   ├── src/
│   │   ├── api/         # APIルートハンドラー
│   │   ├── mongoose/    # MongoDBモデル
│   │   ├── process/     # ビジネスロジック
│   │   └── types/       # サーバーサイド型
│   ├── tsconfig.json
│   └── esbuild.config.ts
├── share/               # クライアント/サーバー間共有
│   ├── protocol/        # APIリクエスト/レスポンススキーマ
│   └── types/           # 共有型定義
├── addon/               # モジュラー拡張（オプション）
│   └── domains/         # ドメイン固有の機能
└── webcommons/          # 共有ライブラリ（gitサブモジュール）
```

## 🛡 APIルート分類

### `/sec` - セキュアルート
**目的**: セッション検証が必要な認証済みユーザー操作

**特徴**:
- ユーザー認証が必要
- `requireSignin` ミドルウェアで保護
- `response.locals.userInfo` へのアクセスが可能

**構造例**:
```
/sec/apsh/calendar       # カレンダー操作
/sec/apsh/calevent      # カレンダーイベント操作
/sec/settings/apiauth   # API認証設定
```

**使用方法**:
```typescript
// サーバー
router.get('/calendar/list', [
  requireSignin,
  requireQueryZod(RequestQuerySchema)
], asyncHandler(async (req, res) => {
  const { userId } = res.locals.userInfo as UserInfoType;
  const queryData = res.locals.query as RequestQueryType;
  // 認証済みリクエストの処理
}));

// クライアント
const calendars = await getPacket({ 
  url: new URL('/sec/apsh/calendar/list', window.location.href),
  queryData,
  querySchema: RequestQuerySchema,
  responseSchema: ResponseObjectSchema
});
```

### `/api` - パブリックAPIルート
**目的**: 外部連携用のパブリックエンドポイント

**特徴**:
- 認証不要
- レート制限が適用される場合あり
- パブリックドキュメントが利用可能

**構造例**:
```
/api/v1/public/status    # パブリックステータスエンドポイント
/api/v1/webhook/github   # Webhookハンドラー
```

### `/pub` - パブリックルート
**目的**: パブリックコンテンツとユーティリティ

**特徴**:
- 認証不要
- 静的コンテンツまたはユーティリティエンドポイント
- ヘルスチェック、ドキュメントなどでよく使用される

**構造例**:
```
/pub/health             # ヘルスチェック
/pub/docs              # パブリックドキュメント
```

## 📡 プロトコル設計パターン

### ファイル構造
```
share/protocol/{feature}/{action}.ts
```

**例**:
- `share/protocol/calendar/fetchList.ts`
- `share/protocol/calevent/createItem.ts`
- `share/protocol/setting/updateCredential.ts`

### プロトコルテンプレート
```typescript
// share/protocol/calendar/fetchList.ts
import { z } from "zod";
import { CalendarType } from "../../types/calendar";

export const RequestQuerySchema = z.object({
  status: z.enum(["active", "inactive"]).optional(),
  limit: z.number().min(1).max(100).default(20)
});

export const RequestBodySchema = z.undefined(); // GETリクエスト用

export const ResponseObjectSchema = z.object({
  calendars: z.array(CalendarType),
  total: z.number()
});

export type RequestQueryType = z.infer<typeof RequestQuerySchema>;
export type RequestBodyType = z.infer<typeof RequestBodySchema>;
export type ResponseObjectType = z.infer<typeof ResponseObjectSchema>;
```

### スキーマパターン

**データなしリクエストの場合**:
```typescript
export const RequestQuerySchema = z.undefined();
export const RequestBodySchema = z.undefined();
```

**ページネーション対応レスポンスの場合**:
```typescript
export const ResponseObjectSchema = z.object({
  items: z.array(ItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    hasMore: z.boolean()
  })
});
```

**リスト操作の場合**:
```typescript
export const RequestQuerySchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  calendarIdList: z.array(z.string()).optional()
});
```

## 🗄 Mongooseでのデータベースパターン

### モデル構造
```
server/src/mongoose/{EntityName}Model.ts
```

### モデルテンプレート
```typescript
// server/src/mongoose/CalendarModel.ts
import mongoose from 'mongoose';
import { CalendarType } from '../../types/calendar';

const CalendarSchema = new mongoose.Schema<CalendarType>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  calendarSource: { type: String, required: true },
  permissions: [{ type: String, enum: ['readList', 'readItem', 'create', 'update', 'delete'] }],
  style: {
    display: { type: String, enum: ['showInList', 'hideInList'] },
    color: { type: String, match: /^#[0-9A-F]{6}$/i }
  },
  data: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'calendars'
});

// 効率的なクエリのための複合インデックス
CalendarSchema.index({ userId: 1, calendarSource: 1 });
CalendarSchema.index({ userId: 1, 'style.display': 1 });

export const CalendarModel = mongoose.model<CalendarType>('Calendar', CalendarSchema);
```

### 一般的なクエリパターン
```typescript
// ユーザースコープ付き検索
const calendars = await CalendarModel.find({ 
  userId,
  'style.display': 'showInList' 
});

// Upsertパターン
const calendar = await CalendarModel.findOneAndUpdate(
  { userId, calendarSource, uniqueKeyInSource },
  { $set: updateData },
  { upsert: true, new: true }
);

// 複雑なクエリのための集約
const pipeline = [
  { $match: { userId } },
  { $lookup: { from: 'calevents', localField: '_id', foreignField: 'calendarId', as: 'events' } },
  { $addFields: { eventCount: { $size: '$events' } } }
];
const results = await CalendarModel.aggregate(pipeline);
```

## 🔄 データフローパターン

### クライアント → サーバーフロー
```typescript
// 1. クライアントデータ関数
// client/src/data/calendar.ts
export async function fetchCalendarList(queryData: RequestQueryType): Promise<ResponseObjectType> {
  const url = new URL('/sec/apsh/calendar/list', window.location.href);
  const querySchema = RequestQuerySchema;
  const responseSchema = ResponseObjectSchema;
  
  return await getPacket({ url, queryData, querySchema, responseSchema });
}

// 2. サーバールートハンドラー
// server/src/api/web_secure/apsh/calendar.ts
router.get('/list', [
  requireSignin,
  requireQueryZod(RequestQuerySchema)
], asyncHandler(async (req, res) => {
  const { userId } = res.locals.userInfo as UserInfoType;
  const queryData = res.locals.query as RequestQueryType;
  
  const calendars = await fetchCalendarList({ userId, ...queryData });
  sendData(res, { calendars });
}));

// 3. ビジネスロジック
// server/src/process/calendar.ts
export async function fetchCalendarList({ userId, status, limit }: FetchParams) {
  const query: any = { userId };
  if (status) query['style.display'] = status === 'active' ? 'showInList' : 'hideInList';
  
  return await CalendarModel.find(query).limit(limit);
}
```

## 🧩 アドオンシステム（オプション）

### 構造
```
addon/
├── client/             # クライアントサイドアドオンエントリ
├── server/             # サーバーサイドアドオンエントリ
└── domains/            # ドメイン固有の実装
    └── {domain}/
        ├── client/     # Reactコンポーネントとデータ
        ├── server/     # APIルートとビジネスロジック
        └── share/      # 共有プロトコルと型
```

### ドメイン例
```
addon/domains/calendar.google.com/
├── client/
│   ├── data/           # APIクライアント関数
│   ├── pages/          # Reactコンポーネント
│   └── types/          # クライアントサイド型
├── server/
│   ├── process/        # ビジネスロジック
│   ├── router/         # Expressルート
│   └── types/          # サーバーサイド型
└── share/
    ├── protocol/       # リクエスト/レスポンススキーマ
    └── types/          # 共有型
```

## 🛠 開発ワークフロー

### 1. プロトコル定義
```bash
# プロトコルファイル作成
touch share/protocol/calendar/createItem.ts
```

### 2. 型定義
```bash
# 共有型作成
touch share/types/calendar.ts
```

### 3. サーバー実装
```bash
# モデル作成
touch server/src/mongoose/CalendarModel.ts
# ビジネスロジック作成
touch server/src/process/calendar.ts
# ルートハンドラー作成
touch server/src/api/web_secure/apsh/calendar.ts
```

### 4. クライアント実装
```bash
# データ関数作成
touch client/src/data/calendar.ts
# コンポーネント作成
touch client/src/components/calendar/CalendarList.tsx
```

### 5. テスト
```bash
npm run server:build  # サーバーTypeScriptチェック
npm run client:build  # クライアントTypeScriptチェック
npm run dev          # 統合テスト
```

## ✅ ベストプラクティス

1. **リクエスト/レスポンス検証にはZodスキーマを必ず使用**
2. **セキュリティのため、すべてのデータベースクエリをuserIdでスコープ**
3. **TypeScriptを厳密に使用** - `any`型は使用禁止
4. **命名規約を一貫して遵守**
5. **webcommonsユーティリティで適切なHTTPステータスコードを使用**
6. **try/catchブロックで適切なエラーハンドリングを実装**
7. **型安全性のためパケットベースの通信を使用**
8. **認証レベルでルートを構造化** (/sec, /api, /pub)

---

*このドキュメントは、すべてのmaruyu-webcommonsベースのアプリケーションの土台として機能します。*