# APIクライアント実装

## 概要

HTTP通信を担当するクライアントとリソース別APIクライアントの実装パターンについて説明します。

## HTTPクライアント (utils/http.ts)

### 基本構造

```typescript
import fetch from 'cross-fetch';
import { SDKConfig, RequestOptions, SDKError } from '../types/common';

export class HttpClient {
  private config: SDKConfig;

  constructor(config: SDKConfig) {
    this.config = config;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}/api/v2${endpoint}`;
    
    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': this.config.userAgent || 'api-sdk/1.0.0',
        ...options.headers,
      },
      signal: this.createTimeoutSignal(
        options.timeout || this.config.timeout || 10000
      ),
    };

    return this.executeWithRetry(url, requestOptions, options);
  }
}
```

### リトライ機構

```typescript
private async executeWithRetry<T>(
  url: string, 
  requestOptions: RequestInit,
  options: RequestOptions
): Promise<T> {
  let lastError: Error;
  const maxRetries = options.retries ?? this.config.retries ?? 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return await response.json() as T;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries || !this.isRetryableError(error)) {
        break;
      }

      // 指数バックオフ
      await this.delay(Math.pow(2, attempt) * 1000);
    }
  }

  throw lastError!;
}

private isRetryableError(error: any): boolean {
  // ネットワークエラー、タイムアウト、5xxエラーのみリトライ
  if (error.name === 'AbortError') return true;
  if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
  if (error instanceof SDKError && error.statusCode && error.statusCode >= 500) return true;
  
  return false;
}
```

### エラーハンドリング

```typescript
private async handleErrorResponse(response: Response): Promise<never> {
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  
  try {
    const errorData = await response.json();
    if (errorData.error) {
      errorMessage = errorData.error;
    }
  } catch {
    // JSON解析失敗時はデフォルトメッセージを使用
  }

  switch (response.status) {
    case 401:
      throw new AuthenticationError(errorMessage);
    case 404:
      throw new NotFoundError(errorMessage);
    default:
      throw new SDKError(errorMessage, response.status);
  }
}
```

### タイムアウト制御

```typescript
private createTimeoutSignal(timeout: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller.signal;
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## リソースAPIクライアント

### 基本パターン (resources/resource.ts)

```typescript
import { HttpClient } from '../utils/http';
import { serializeQuery, serializeBody, deserializeResource } from '../utils/serialization';
import {
  Resource,
  ResourceListQuery,
  CreateResourceRequest,
  UpdateResourceRequest,
  ResourceListResponse,
  ResourceItemResponse,
  ResourceMutationResponse,
  ResourceDeleteResponse
} from '../types/resource';

export class ResourceAPI {
  constructor(private httpClient: HttpClient) {}

  /**
   * リソース一覧取得
   */
  async list(query: ResourceListQuery = {}): Promise<Resource[]> {
    this.validateListQuery(query);
    
    const queryString = serializeQuery(query);
    const response = await this.httpClient.request<ResourceListResponse>(
      `/resource/basic/list?packet=${queryString}`
    );
    
    return response.resourceList.map(deserializeResource);
  }

  /**
   * リソース詳細取得
   */
  async get(id: string): Promise<Resource> {
    if (!id) {
      throw new ValidationError('Resource ID is required');
    }

    const queryString = serializeQuery({ id });
    const response = await this.httpClient.request<ResourceItemResponse>(
      `/resource/basic/item?packet=${queryString}`
    );
    
    return deserializeResource(response.resource);
  }

  /**
   * リソース作成
   */
  async create(data: CreateResourceRequest): Promise<Resource> {
    this.validateCreateRequest(data);
    
    const body = serializeBody(data);
    const response = await this.httpClient.request<ResourceMutationResponse>(
      '/resource/basic/item',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      }
    );
    
    return deserializeResource(response.resource);
  }

  /**
   * リソース更新
   */
  async update(data: UpdateResourceRequest): Promise<Resource> {
    this.validateUpdateRequest(data);
    
    const body = serializeBody(data);
    const response = await this.httpClient.request<ResourceMutationResponse>(
      '/resource/basic/item',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body
      }
    );
    
    return deserializeResource(response.resource);
  }

  /**
   * リソース削除
   */
  async delete(id: string): Promise<boolean> {
    if (!id) {
      throw new ValidationError('Resource ID is required');
    }

    const body = serializeBody({ id });
    const response = await this.httpClient.request<ResourceDeleteResponse>(
      '/resource/basic/item',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body
      }
    );
    
    return response.success;
  }
}
```

### 便利メソッドの追加

```typescript
export class ResourceAPI {
  // 基本CRUD操作は上記と同じ

  /**
   * 子リソース取得
   */
  async getChildren(parentId: string): Promise<Resource[]> {
    return this.list({ parentResourceId: parentId });
  }

  /**
   * 優先度別取得
   */
  async getByPriority(priority: Priority): Promise<Resource[]> {
    return this.list({ priority });
  }

  /**
   * 日付範囲での取得
   */
  async getByDateRange(startTime: Date, endTime: Date): Promise<Resource[]> {
    return this.list({ startTime, endTime });
  }

  /**
   * タグ検索
   */
  async getByTags(tags: string[]): Promise<Resource[]> {
    return this.list({ tags });
  }
}
```

### バリデーション実装

```typescript
/**
 * 一覧取得クエリのバリデーション
 */
private validateListQuery(query: ResourceListQuery): void {
  if (query.startTime || query.endTime) {
    validateDateRange(query.startTime, query.endTime);
  }
  
  if (query.limit !== undefined && (query.limit <= 0 || query.limit > 1000)) {
    throw new ValidationError('limit must be between 1 and 1000');
  }
  
  if (query.offset !== undefined && query.offset < 0) {
    throw new ValidationError('offset must be non-negative');
  }
  
  if (query.tags && query.tags.length === 0) {
    throw new ValidationError('tags array cannot be empty when provided');
  }
}

/**
 * 作成リクエストのバリデーション
 */
private validateCreateRequest(data: CreateResourceRequest): void {
  if (!data.title || data.title.trim().length === 0) {
    throw new ValidationError('title is required', 'title');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    throw new ValidationError('description is required', 'description');
  }
  
  if (!data.startTime) {
    throw new ValidationError('startTime is required', 'startTime');
  }
  
  if (!data.endTime) {
    throw new ValidationError('endTime is required', 'endTime');
  }
  
  validateDateRange(data.startTime, data.endTime);
  
  if (!['low', 'medium', 'high'].includes(data.priority)) {
    throw new ValidationError('priority must be low, medium, or high', 'priority');
  }
}
```

## メインクライアント (client.ts)

### 統合クライアント

```typescript
import { HttpClient } from './utils/http';
import { ResourceAPI } from './resources/resource';
import { SDKConfig, ValidationError } from './types/common';

export class APIClient {
  private httpClient: HttpClient;

  public readonly resource: ResourceAPI;
  // 他のリソースAPIもここに追加

  constructor(config: SDKConfig) {
    this.validateConfig(config);
    
    this.httpClient = new HttpClient(config);
    
    // リソースクライアントの初期化
    this.resource = new ResourceAPI(this.httpClient);
  }

  /**
   * 設定バリデーション
   */
  private validateConfig(config: SDKConfig): void {
    if (!config.baseURL) {
      throw new ValidationError('baseURL is required');
    }

    if (!config.apiKey) {
      throw new ValidationError('apiKey is required');
    }

    try {
      new URL(config.baseURL);
    } catch {
      throw new ValidationError('baseURL must be a valid URL');
    }

    if (config.timeout !== undefined && (config.timeout <= 0 || config.timeout > 300000)) {
      throw new ValidationError('timeout must be between 1 and 300000 milliseconds');
    }

    if (config.retries !== undefined && (config.retries < 0 || config.retries > 10)) {
      throw new ValidationError('retries must be between 0 and 10');
    }
  }

  /**
   * 接続テスト
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.resource.list({ limit: 1 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * SDKバージョン取得
   */
  static getVersion(): string {
    return '1.0.0';
  }
}

/**
 * ファクトリー関数
 */
export function createClient(config: SDKConfig): APIClient {
  return new APIClient(config);
}
```

## 実装のベストプラクティス

### 1. エラーハンドリング
- 明確なエラーメッセージ
- 適切なエラータイプの使い分け
- スタックトレースの保持

### 2. 型安全性
- ジェネリック型の活用
- レスポンス型の厳密な定義
- ランタイムバリデーション

### 3. パフォーマンス
- 適切なタイムアウト設定
- 効率的なリトライロジック
- HTTPキープアライブの活用

### 4. 開発者体験
- 一貫性のあるメソッド命名
- 直感的なAPI設計
- 豊富な便利メソッド

### 5. テスタビリティ
- 依存性注入の活用
- モック可能な設計
- 単体テスト対応