# プロトコル定義規約

`share/protocol/` ディレクトリでのAPI仕様定義における標準的な作法とパターンを説明します。

## ディレクトリ構造

```
share/protocol/
├── resources/      # リソース管理API（適切な名前に変更）
│   ├── index.ts
│   ├── fetchResourceList.ts
│   ├── fetchResource.ts
│   ├── createResource.ts
│   ├── updateResource.ts
│   └── deleteResource.ts
```

## 命名規約

### ファイル命名

REST API の動詞に基づいた命名：

- `fetchXxxList.ts` - GET リクエスト (一覧取得)
- `fetchXxx.ts` - GET リクエスト (単体取得)
- `createXxx.ts` - POST リクエスト
- `updateXxx.ts` - PUT リクエスト
- `deleteXxx.ts` - DELETE リクエスト

**注意**: `Xxx`の部分は実際のリソース名に置き換えてください（例: `fetchTask.ts`, `fetchTaskList.ts`, `createEvent.ts`）

### スキーマ・型命名

各プロトコルファイルで以下を定義：

```typescript
// GET エンドポイントの場合
export const RequestQuerySchema = z.object({ /* ... */ });
export type RequestQueryType = z.infer<typeof RequestQuerySchema>;

// POST/PUT エンドポイントの場合
export const RequestBodySchema = z.object({ /* ... */ });
export type RequestBodyType = z.infer<typeof RequestBodySchema>;

// 全エンドポイント共通
export const ResponseObjectSchema = z.object({ /* ... */ });
export type ResponseObjectType = z.infer<typeof ResponseObjectSchema>;
```

### index.ts でのエクスポート

各ディレクトリの `index.ts` で統一的にエクスポート：

```typescript
// share/protocol/resources/index.ts（適切な名前に変更）

// GET /resources - 一覧取得
export { ResponseObjectSchema as FetchResourceListResponseSchema } from "./fetchResourceList";
export type { ResponseObjectType as FetchResourceListResponseType } from "./fetchResourceList";

// GET /resources/:id - 単体取得
export { 
  RequestQuerySchema as FetchResourceQuerySchema, 
  ResponseObjectSchema as FetchResourceResponseSchema 
} from "./fetchResource";
export type { 
  RequestQueryType as FetchResourceQueryType, 
  ResponseObjectType as FetchResourceResponseType 
} from "./fetchResource";

// POST /resources
export { 
  RequestBodySchema as CreateResourceBodySchema, 
  ResponseObjectSchema as CreateResourceResponseSchema 
} from "./createResource";
export type { 
  RequestBodyType as CreateResourceBodyType, 
  ResponseObjectType as CreateResourceResponseType 
} from "./createResource";
```

**エクスポート命名規則:**
- Request Body: `{動詞}{対象}BodySchema`, `{動詞}{対象}BodyType`
- Request Query: `{動詞}{対象}QuerySchema`, `{動詞}{対象}QueryType`
- Response: `{動詞}{対象}ResponseSchema`, `{動詞}{対象}ResponseType`

## プロトコルファイル構造

### ファイル配置ルール

プロトコルファイルは `/share/protocol/{endpoint}/{action}.ts` に配置：

```
share/protocol/
├── resources/          # リソース管理API
│   ├── fetchResources.ts    # GET /resources
│   ├── fetchResource.ts     # GET /resources/:id
│   ├── createResource.ts    # POST /resources
│   ├── updateResource.ts    # PUT /resources/:id
│   └── deleteResource.ts    # DELETE /resources/:id
```

### ファイル命名規則

RESTful APIの動詞に基づいた命名：

- `fetchXxxList.ts` または `fetchXxxs.ts` - GET リスト取得
- `fetchXxx.ts` - GET 単一アイテム取得
- `createXxx.ts` - POST 作成
- `updateXxx.ts` - PUT 更新
- `deleteXxx.ts` - DELETE 削除

### 標準的なファイル内容構造

各プロトコルファイルは以下の要素をexport：

```typescript
// リクエストボディ用（POST/PUTの場合）
export const RequestBodySchema = z.object({
  field1: SomeSchema,
  field2: z.string(),
  // ...
});
export type RequestBodyType = z.infer<typeof RequestBodySchema>;

// リクエストクエリ用（GETの場合）
export const RequestQuerySchema = z.object({
  param1: SomeSchema.optional(),
  // ...
});
export type RequestQueryType = z.infer<typeof RequestQuerySchema>;

// レスポンス用
export const ResponseObjectSchema = z.object({
  data: SomeSchema,
  // ...
});
export type ResponseObjectType = z.infer<typeof ResponseObjectSchema>;
```

## プロトコル定義パターン

### 基本構造

```typescript
// share/protocol/resources/createResource.ts（適切な名前に変更）
import { z } from "zod";
import { ResourceNameSchema } from "@share/types/resource";

// リクエストボディスキーマ
export const RequestBodySchema = z.object({
  resourceName: ResourceNameSchema,
  description: z.string().optional(),
  category: z.string().optional(),
});
export type RequestBodyType = z.infer<typeof RequestBodySchema>;

// レスポンススキーマ
export const ResponseObjectSchema = z.object({
  resourceId: z.string(),
  resourceName: z.string(),
  status: z.string(),
});
export type ResponseObjectType = z.infer<typeof ResponseObjectSchema>;
```

### クエリパラメータが必要な場合

```typescript
// share/protocol/resources/fetchResource.ts（適切な名前に変更）
export const RequestQuerySchema = z.object({
  includeDetails: z.boolean().optional(),
  format: z.enum(["summary", "full"]).optional(),
});
export type RequestQueryType = z.infer<typeof RequestQuerySchema>;
```

## 型の再利用パターン

### 共有型からの継承

```typescript
// share/types/resource.ts の型を再利用
import { ResourceSchema } from "@share/types/resource";

export const ResponseObjectSchema = ResourceSchema.pick({
  resourceId: true,
  resourceName: true,
  status: true,
  category: true,
});
```

### 部分的な型の利用

```typescript
// 一部フィールドのみ更新可能にする
export const RequestBodySchema = ResourceSchema.partial().pick({
  resourceName: true,
  description: true,
  category: true,
});
```

## バリデーション規約

### 入力値検証

```typescript
export const RequestBodySchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  resourceName: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  description: z.string().max(500, "説明は500文字以内で入力してください"),
});
```

### オプショナルフィールド

```typescript
export const RequestBodySchema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  withDefault: z.string().default("default-value"),
});
```

## レスポンス形式

### 成功レスポンス

```typescript
// 単体データ
export const ResponseObjectSchema = z.object({
  userId: UserIdSchema,
  userName: UserNameSchema,
  createdTime: z.date(),
});

// 配列データ
export const ResponseObjectSchema = z.array(ResourceSchema);

// ページネーション
export const ResponseObjectSchema = z.object({
  items: z.array(ResourceSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
```

### エラーレスポンス

webcommons の標準エラー形式を使用：

```typescript
// エラーレスポンスは webcommons で統一されているため、
// プロトコル定義では成功時のスキーマのみ定義
```

## 使用例

### サーバーサイドでの利用

```typescript
// server/src/api/web_secure/resources/index.ts（適切な名前に変更）
import { CreateResourceBodySchema, CreateResourceResponseSchema } from "@share/protocol/resources";

router.post('/', asyncHandler(async (req, res) => {
  const validatedBody = CreateResourceBodySchema.parse(req.body);
  const result = await createResource(validatedBody);
  const validatedResponse = CreateResourceResponseSchema.parse(result);
  sendData(res, validatedResponse);
}));
```

### クライアントサイドでの利用

```typescript
// client/src/data/resources.ts（適切な名前に変更）
import { postPacket } from 'maruyu-webcommons/commons/utils/fetch';
import { CreateResourceBodyType, CreateResourceBodySchema, CreateResourceResponseType, CreateResourceResponseSchema } from "@share/protocol/resources";

export async function createResource(bodyData: CreateResourceBodyType): Promise<CreateResourceResponseType> {
  const url = new URL('/sec/resources', location.origin);
  const bodySchema = CreateResourceBodySchema;
  const responseSchema = CreateResourceResponseSchema;
  return await postPacket({ url, bodyData, bodySchema, responseSchema });
}
```

## 注意事項

1. **型安全性の確保**: 全てのAPI I/O で Zod スキーマを使用
2. **命名の一貫性**: 規約に従った命名で可読性を向上
3. **バリデーションの統一**: サーバー・クライアント間で同じスキーマを共有
4. **エラーハンドリング**: webcommons の標準エラー形式を遵守
5. **ドキュメント性**: スキーマ自体がAPI仕様書として機能

この規約に従うことで、型安全で保守性の高いAPI仕様定義が可能になります。