# アーキテクチャパターン

webcommons を使ったアプリケーション開発における標準的なアーキテクチャパターンとコード作法について説明します。

## プロジェクト構成

### 基本的なディレクトリ構造

```
project/
├── server/             # Node.js/Express サーバー
│   ├── src/
│   │   ├── api/        # APIルーティング（3層構造）
│   │   ├── mongoose/   # Mongooseモデル定義
│   │   ├── services/   # ビジネスロジック
│   │   ├── types/      # サーバー固有の型定義
│   │   └── utils/      # ユーティリティ・ミドルウェア
├── client/             # React フロントエンド
│   └── src/
│       ├── data/       # API クライアント関数
│       ├── contexts/   # グローバル状態管理
│       └── pages/      # ページコンポーネント
├── share/              # サーバー・クライアント共有リソース
│   ├── protocol/       # API仕様定義（リクエスト・レスポンス）
│   ├── types/          # 共有型定義
│   └── utils/          # 共有ユーティリティ
└── webcommons/         # 共通ライブラリ
```

## API アーキテクチャ（3層構造）

### レイヤー設計原則

サーバーAPIは認証・認可レベルに応じて3層に分離されています：

#### 1. `/pub/*` - パブリック API レイヤー
- **認証不要**
- 公開情報へのアクセス
- `server/src/api/web_public/` に配置

#### 2. `/sec/*` - セキュア Web レイヤー
- **セッション認証必須（フロントエンド向け）**
- Web アプリケーション用の管理API
- `server/src/api/web_secure/` に配置

#### 3. `/api/*` - 外部API レイヤー
- APIキーによるアクセス
- 外部からのアクセスを想定したAPI
- `server/src/api/external/` に配置

### ルーティング構造

```typescript
// server/src/index.ts
app.use("/pub", pubRouter);                    // 認証不要
app.use("/api", requireAuthorization, apiRouter);  // Bearer Token認証
app.use("/sec", requireSignin, secRouter);         // セッション認証
```

## 型定義パターン

### 1. 共有型定義 (`share/types/`)

共通で使用される型定義を配置：

```typescript
// share/types/resource.ts（適切な名前に変更）
export const ResourceIdSchema = z.string().brand<"ResourceId">();
export type ResourceIdType = z.infer<typeof ResourceIdSchema>;

export const ResourceSchema = z.object({
  resourceId: ResourceIdSchema,
  resourceName: ResourceNameSchema,
  // ...アプリケーション固有のフィールド
});
export type ResourceType = z.infer<typeof ResourceSchema>;
```

**命名規則:**
- Schema: `XxxSchema`
- Type: `XxxType`
- Zod branded types を使用してtype safety を強化

### 2. プロトコル定義 (`share/protocol/`)

API仕様をリクエスト・レスポンス別に定義：

```typescript
// share/protocol/resources/index.ts（適切な名前に変更）
// GET /resources
export { ResponseObjectSchema as FetchResourcesResponseSchema } from "./fetchResources";
export type { ResponseObjectType as FetchResourcesResponseType } from "./fetchResources";

// POST /resources  
export { RequestBodySchema as CreateResourceBodySchema, ResponseObjectSchema as CreateResourceResponseSchema } from "./createResource";
export type { RequestBodyType as CreateResourceBodyType, ResponseObjectType as CreateResourceResponseType } from "./createResource";
```

**命名規則:**
- Request: `XxxRequestBodySchema`, `XxxRequestBodyType`
- Response: `XxxResponseObjectSchema`, `XxxResponseObjectType`
- Query: `XxxRequestQuerySchema`, `XxxRequestQueryType`

### 3. Mongoose モデル定義 (`server/src/mongoose/`)

データベーススキーマと型定義：

```typescript
// server/src/mongoose/Resource.ts（適切な名前に変更）
export type ResourceMongoType = {
  resourceId: ResourceIdType,
  resourceName: ResourceNameType,
  // ... MongoDB固有のフィールド
}

export const ResourceModel = mongoose.model<ResourceMongoType>('resource',
  new mongoose.Schema<ResourceMongoType>({
    resourceId: {
      type: String,
      required: true,
      unique: true
    },
    // ... スキーマ定義
  }, { 
    timestamps: {
      createdAt: 'createdTime',
      updatedAt: 'updatedTime'
    }
  })
)
```

**命名規則:**
- Type: `XxxMongoType`
- Model: `XxxModel`
- 共有型からMongo固有フィールドを継承・拡張

## サービス層パターン

### ビジネスロジック分離 (`server/src/services/`)

APIハンドラーからビジネスロジックを分離：

```typescript
// server/src/services/resources.ts（適切な名前に変更）
export async function createResource(data: CreateResourceData): Promise<ResourceType> {
  // ビジネスロジック実装
}

export async function fetchResources(userId: UserIdType): Promise<ResourceType[]> {
  // データアクセスロジック
}
```

## フロントエンド データ層パターン

### API クライアント関数 (`client/src/data/`)

サーバーAPIとの通信を担当：

```typescript
// client/src/data/resources.ts（適切な名前に変更）
import { getPacket, postPacket } from 'maruyu-webcommons/commons/utils/fetch';
import { 
  FetchResourcesResponseType, FetchResourcesResponseSchema,
  CreateResourceBodyType, CreateResourceBodySchema,
  CreateResourceResponseType, CreateResourceResponseSchema 
} from '@share/protocol/resources';

export async function fetchResources(): Promise<FetchResourcesResponseType> {
  const url = new URL('/sec/resources', location.origin);
  const responseSchema = FetchResourcesResponseSchema;
  return await getPacket({ url, responseSchema });
}

export async function createResource(bodyData: CreateResourceBodyType): Promise<CreateResourceResponseType> {
  const url = new URL('/sec/resources', location.origin);
  const bodySchema = CreateResourceBodySchema;
  const responseSchema = CreateResourceResponseSchema;
  return await postPacket({ url, bodyData, bodySchema, responseSchema });
}
```

## パス エイリアス設定

TypeScript での import を簡潔にするためのエイリアス：

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@share/*": ["../share/*"],
      "@server/*": ["./src/*"],
      "@client/*": ["./src/*"]
    }
  }
}
```

## 認証アーキテクチャ

### 認証方式の使い分け

1. **セッション認証** (`/sec/*`)
   - Web フロントエンド向け
   - `requireSignin` ミドルウェア使用

2. **Bearer Token認証** (`/api/*`)
   - 外部クライアント向け
   - `requireAuthorization` ミドルウェア使用

3. **認証不要** (`/pub/*`)
   - 公開API

## コード品質規則

### 型安全性
- 全ての API I/O で Zod スキーマによる検証
- branded types を使用した型レベルでの区別
- TypeScript strict mode 使用

### エラーハンドリング
- `asyncHandler` による統一的な例外処理
- webcommons の標準エラー形式使用

### セキュリティ
- 入力値検証の徹底
- 認証・認可の適切な分離
- シークレット情報のログ出力禁止

これらのパターンに従うことで、保守性・可読性・セキュリティを担保したアプリケーション開発が可能になります。