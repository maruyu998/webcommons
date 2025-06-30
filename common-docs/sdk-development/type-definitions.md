# 型定義システム

## 概要

TypeScript SDKにおける効果的な型定義の設計と管理方法について説明します。

## 基本型構造

### 共通型 (types/common.ts)

```typescript
// 基本的な列挙型
export type Priority = 'low' | 'medium' | 'high';

// 共通インターフェース
export interface StatusInfo {
  label: string;
  note: string;
  updatedTime: Date;
}

export interface Style {
  customColor: string | null;
}

// API設定型
export interface SDKConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

// HTTPリクエスト型
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// ページネーション型
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

// 日付範囲型
export interface DateRange {
  startTime?: Date;
  endTime?: Date;
}

// エラークラス
export class SDKError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'SDKError';
  }
}
```

## リソース別型定義

### リソース型の設計パターン

```typescript
// メインエンティティ型
export interface Resource {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: StatusInfo;
  style: Style;
  startTime: Date;
  endTime: Date;
  updatedTime: Date;
}

// クエリ型（検索・フィルタリング）
export interface ResourceListQuery extends PaginationOptions, DateRange {
  priority?: Priority;
  search?: string;
  tags?: string[];
  status?: string;
}

// 作成リクエスト型
export interface CreateResourceRequest {
  title: string;
  description: string;
  priority: Priority;
  startTime: Date;
  endTime: Date;
  tags?: string[];
  parentId?: string;
}

// 更新リクエスト型
export interface UpdateResourceRequest {
  id: string;
  title?: string;
  description?: string;
  priority?: Priority;
  startTime?: Date;
  endTime?: Date;
  tags?: string[];
}

// レスポンス型
export interface ResourceListResponse {
  resourceList: Resource[];
  totalCount: number;
  hasMore: boolean;
}

export interface ResourceItemResponse {
  resource: Resource;
}

export interface ResourceMutationResponse {
  resource: Resource;
  success: boolean;
}

export interface ResourceDeleteResponse {
  success: boolean;
  deletedId: string;
}
```

## 型の変換と検証

### 日付型の扱い

```typescript
// APIレスポンス（JSON）では文字列
interface ResourceRaw {
  id: string;
  title: string;
  startTime: string;  // ISO string
  endTime: string;    // ISO string
  updatedTime: string; // ISO string
}

// SDK内部では Date オブジェクト
interface Resource {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  updatedTime: Date;
}

// 変換関数
function deserializeResource(raw: ResourceRaw): Resource {
  return {
    ...raw,
    startTime: new Date(raw.startTime),
    endTime: new Date(raw.endTime),
    updatedTime: new Date(raw.updatedTime)
  };
}
```

### オプショナル型の活用

```typescript
// 厳密な作成リクエスト
interface CreateResourceRequest {
  title: string;          // 必須
  description: string;    // 必須
  priority: Priority;     // 必須
  startTime: Date;        // 必須
  endTime: Date;          // 必須
  tags?: string[];        // オプション
}

// 柔軟な更新リクエスト
interface UpdateResourceRequest {
  id: string;             // 必須（識別子）
  title?: string;         // 部分更新可能
  description?: string;   // 部分更新可能
  priority?: Priority;    // 部分更新可能
  // 以下同様
}
```

## バリデーション戦略

### ランタイムバリデーション

```typescript
// バリデーション関数
function validateCreateRequest(data: CreateResourceRequest): void {
  if (!data.title || data.title.trim().length === 0) {
    throw new ValidationError('title is required', 'title');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    throw new ValidationError('description is required', 'description');
  }
  
  if (data.startTime >= data.endTime) {
    throw new ValidationError('startTime must be before endTime');
  }
  
  if (!['low', 'medium', 'high'].includes(data.priority)) {
    throw new ValidationError('priority must be low, medium, or high', 'priority');
  }
}
```

### 型ガード関数

```typescript
// 型ガード関数
function isValidPriority(value: any): value is Priority {
  return typeof value === 'string' && 
         ['low', 'medium', 'high'].includes(value);
}

function isDateRange(obj: any): obj is DateRange {
  return typeof obj === 'object' &&
         (obj.startTime === undefined || obj.startTime instanceof Date) &&
         (obj.endTime === undefined || obj.endTime instanceof Date);
}
```

## ユーティリティ型

### 便利な型の定義

```typescript
// 部分更新用のユーティリティ型
export type PartialUpdate<T> = Partial<T> & { id: string };

// APIエラーレスポンス型
export interface APIErrorResponse {
  error: string;
  details?: string;
  field?: string;
  statusCode: number;
}

// 成功レスポンス型
export interface APISuccessResponse<T> {
  success: true;
  data: T;
}

// 統合レスポンス型
export type APIResponse<T> = APISuccessResponse<T> | APIErrorResponse;
```

### ジェネリック型の活用

```typescript
// リスト用ジェネリック型
export interface ListResponse<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  nextOffset?: number;
}

// CRUD操作用ジェネリック型
export interface CRUDResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 使用例
type ResourceListResponse = ListResponse<Resource>;
type ResourceCreateResponse = CRUDResponse<Resource>;
```

## 型定義のベストプラクティス

### 1. 一貫性の保持
- 命名規則の統一（PascalCase for interfaces）
- プロパティ名の一貫性
- オプショナル型の統一ルール

### 2. 拡張性の考慮
- 基底インターフェースの設計
- 継承による型の拡張
- ジェネリック型の適切な使用

### 3. ドキュメント化
- TSDocコメントの追加
- 使用例の記載
- 型の意図の明確化

```typescript
/**
 * リソース作成のためのリクエストデータ
 * 
 * @example
 * ```typescript
 * const request: CreateResourceRequest = {
 *   title: 'My Resource',
 *   description: 'Resource description',
 *   priority: 'high',
 *   startTime: new Date('2024-01-01'),
 *   endTime: new Date('2024-12-31')
 * };
 * ```
 */
export interface CreateResourceRequest {
  /** リソースのタイトル（必須） */
  title: string;
  /** リソースの詳細説明（必須） */
  description: string;
  /** 優先度レベル */
  priority: Priority;
  /** 開始日時 */
  startTime: Date;
  /** 終了日時 */
  endTime: Date;
  /** 関連タグ（オプション） */
  tags?: string[];
}
```

### 4. 型安全性の強化
- strictモードの使用
- unknown型の適切な使用
- 型アサーションの最小化

### 5. パフォーマンス考慮
- 重い型計算の回避
- 循環参照の防止
- 適切な型分割