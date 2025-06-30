# テストとデバッグ

## 概要

SDK開発における効果的なテスト戦略とデバッグ手法について説明します。

## テスト戦略

### テストピラミッド

```
┌─────────────────┐
│ E2E Tests       │ ← 少数の包括的テスト
├─────────────────┤
│ Integration     │ ← API統合テスト
│ Tests           │
├─────────────────┤
│ Unit Tests      │ ← 多数の単体テスト
└─────────────────┘
```

### 単体テスト

```typescript
// tests/utils/serialization.test.ts
import { describe, expect, test } from 'vitest';
import { serializeQuery, deserializeDates } from '../../src/utils/serialization';

describe('serialization utilities', () => {
  test('serializeQuery creates valid packet format', () => {
    const data = { id: '123', name: 'test' };
    const result = serializeQuery(data);
    
    const decoded = decodeURIComponent(result);
    const parsed = JSON.parse(decoded);
    
    expect(parsed).toEqual({
      v: 2,
      d: {
        t: 'o',
        d: data
      }
    });
  });

  test('deserializeDates converts string dates to Date objects', () => {
    const input = {
      id: '123',
      startTime: '2024-01-01T00:00:00.000Z',
      endTime: '2024-12-31T23:59:59.999Z',
      status: {
        updatedTime: '2024-06-15T12:00:00.000Z'
      }
    };

    const result = deserializeDates(input, ['startTime', 'endTime', 'status.updatedTime']);

    expect(result.startTime).toBeInstanceOf(Date);
    expect(result.endTime).toBeInstanceOf(Date);
    expect(result.status.updatedTime).toBeInstanceOf(Date);
    expect(result.startTime.getTime()).toBe(new Date('2024-01-01T00:00:00.000Z').getTime());
  });
});
```

### HTTPクライアントのテスト

```typescript
// tests/utils/http.test.ts
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { HttpClient } from '../../src/utils/http';
import { ValidationError, AuthenticationError } from '../../src/types/common';

// fetch のモック
global.fetch = vi.fn();

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient({
      baseURL: 'https://api.example.com',
      apiKey: 'test-key'
    });
    vi.clearAllMocks();
  });

  test('successful GET request', async () => {
    const mockResponse = { data: 'test' };
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await client.request('/test');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/v2/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key',
          'Content-Type': 'application/json'
        })
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('handles 401 authentication error', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Invalid API key' })
    });

    await expect(client.request('/test')).rejects.toThrow(AuthenticationError);
  });

  test('retries on network error', async () => {
    (fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'success' })
      });

    const result = await client.request('/test');

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: 'success' });
  });
});
```

### APIクライアントのテスト

```typescript
// tests/resources/resource.test.ts
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { ResourceAPI } from '../../src/resources/resource';
import { HttpClient } from '../../src/utils/http';

vi.mock('../../src/utils/http');

describe('ResourceAPI', () => {
  let api: ResourceAPI;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      request: vi.fn()
    } as any;
    
    api = new ResourceAPI(mockHttpClient);
  });

  test('list method calls correct endpoint', async () => {
    const mockResponse = {
      resourceList: [
        {
          id: '1',
          title: 'Test Resource',
          startTime: '2024-01-01T00:00:00.000Z',
          endTime: '2024-12-31T23:59:59.999Z'
        }
      ]
    };

    mockHttpClient.request.mockResolvedValue(mockResponse);

    const result = await api.list({ limit: 10 });

    expect(mockHttpClient.request).toHaveBeenCalledWith(
      expect.stringContaining('/resource/basic/list?packet=')
    );
    expect(result).toHaveLength(1);
    expect(result[0].startTime).toBeInstanceOf(Date);
  });

  test('create method validates required fields', async () => {
    const invalidData = {
      title: '',
      description: 'test',
      priority: 'high' as const,
      startTime: new Date(),
      endTime: new Date()
    };

    await expect(api.create(invalidData)).rejects.toThrow(ValidationError);
  });
});
```

## 統合テスト

### 実際のAPI呼び出しテスト

```typescript
// tests/integration/api.test.ts
import { describe, expect, test, beforeAll } from 'vitest';
import { APIClient } from '../../src/client';

describe('API Integration Tests', () => {
  let client: APIClient;

  beforeAll(() => {
    client = new APIClient({
      baseURL: process.env.TEST_API_URL || 'http://localhost:3000',
      apiKey: process.env.TEST_API_KEY || 'test-key'
    });
  });

  test('can connect to API', async () => {
    const isConnected = await client.testConnection();
    expect(isConnected).toBe(true);
  });

  test('CRUD operations work correctly', async () => {
    // Create
    const createData = {
      title: 'Integration Test Resource',
      description: 'Created by integration test',
      priority: 'medium' as const,
      startTime: new Date('2024-01-01'),
      endTime: new Date('2024-12-31')
    };

    const created = await client.resource.create(createData);
    expect(created.id).toBeDefined();
    expect(created.title).toBe(createData.title);

    // Read
    const fetched = await client.resource.get(created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe(createData.title);

    // Update
    const updateData = {
      id: created.id,
      title: 'Updated Title'
    };

    const updated = await client.resource.update(updateData);
    expect(updated.title).toBe('Updated Title');

    // Delete
    const deleteResult = await client.resource.delete(created.id);
    expect(deleteResult).toBe(true);
  });
});
```

## モック戦略

### APIサーバーのモック

```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const server = setupServer(
  rest.get('https://api.example.com/api/v2/resource/basic/list', (req, res, ctx) => {
    const packet = req.url.searchParams.get('packet');
    if (!packet) {
      return res(ctx.status(400), ctx.json({ error: 'Missing packet parameter' }));
    }

    return res(
      ctx.json({
        resourceList: [
          {
            id: '1',
            title: 'Mock Resource',
            description: 'Generated by mock server',
            priority: 'high',
            startTime: '2024-01-01T00:00:00.000Z',
            endTime: '2024-12-31T23:59:59.999Z',
            status: {
              label: 'active',
              note: '',
              updatedTime: '2024-06-15T12:00:00.000Z'
            },
            style: {
              customColor: null
            },
            updatedTime: '2024-06-15T12:00:00.000Z'
          }
        ]
      })
    );
  }),

  rest.post('https://api.example.com/api/v2/resource/basic/item', (req, res, ctx) => {
    return res(
      ctx.json({
        resource: {
          id: 'new-id',
          ...(req.body as any),
          updatedTime: new Date().toISOString()
        }
      })
    );
  })
);
```

### テストセットアップ

```typescript
// tests/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## デバッグ手法

### ログ機能の実装

```typescript
// src/utils/logger.ts
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.WARN) {
    this.level = level;
  }

  error(message: string, data?: any): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[SDK ERROR] ${message}`, data);
    }
  }

  warn(message: string, data?: any): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[SDK WARN] ${message}`, data);
    }
  }

  info(message: string, data?: any): void {
    if (this.level >= LogLevel.INFO) {
      console.info(`[SDK INFO] ${message}`, data);
    }
  }

  debug(message: string, data?: any): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`[SDK DEBUG] ${message}`, data);
    }
  }
}

// デフォルトロガー
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN
);
```

### リクエスト/レスポンスの詳細ログ

```typescript
// src/utils/http.ts（抜粋）
import { logger } from './logger';

export class HttpClient {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.config.baseURL}/api/v2${endpoint}`;
    
    logger.debug('HTTP Request', {
      method: options.method || 'GET',
      url,
      headers: this.sanitizeHeaders(requestOptions.headers),
      body: options.body ? JSON.parse(options.body) : undefined
    });

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      logger.debug('HTTP Response', {
        status: response.status,
        statusText: response.statusText,
        data
      });

      return data as T;
    } catch (error) {
      logger.error('HTTP Request Failed', {
        url,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = '***';
    }
    return sanitized;
  }
}
```

## テスト環境構築

### vitest設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts']
    }
  }
});
```

### package.jsonスクリプト

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:integration": "vitest --config vitest.integration.config.ts"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "msw": "^2.0.0"
  }
}
```

## パフォーマンステスト

### レスポンス時間測定

```typescript
// tests/performance/response-time.test.ts
import { describe, test, expect } from 'vitest';
import { APIClient } from '../../src/client';

describe('Performance Tests', () => {
  test('list API responds within acceptable time', async () => {
    const client = new APIClient({
      baseURL: 'http://localhost:3000',
      apiKey: 'test-key'
    });

    const startTime = Date.now();
    await client.resource.list({ limit: 100 });
    const endTime = Date.now();

    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(2000); // 2秒以内
  });

  test('handles concurrent requests', async () => {
    const client = new APIClient({
      baseURL: 'http://localhost:3000',
      apiKey: 'test-key'
    });

    const promises = Array.from({ length: 10 }, () => 
      client.resource.list({ limit: 10 })
    );

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();

    expect(results).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(5000); // 5秒以内
  });
});
```

## デバッグツール

### SDK使用状況の監視

```typescript
// src/utils/usage-tracker.ts
export class UsageTracker {
  private static instance: UsageTracker;
  private events: Array<{ timestamp: Date; method: string; duration: number }> = [];

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  track(method: string, duration: number): void {
    this.events.push({
      timestamp: new Date(),
      method,
      duration
    });

    // 最新100件のみ保持
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  getStats(): { avgDuration: number; totalCalls: number; methodCounts: Record<string, number> } {
    const totalCalls = this.events.length;
    const avgDuration = this.events.reduce((sum, event) => sum + event.duration, 0) / totalCalls;
    
    const methodCounts = this.events.reduce((counts, event) => {
      counts[event.method] = (counts[event.method] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return { avgDuration, totalCalls, methodCounts };
  }
}
```

### デバッグ用便利メソッド

```typescript
// src/client.ts（抜粋）
export class APIClient {
  // ... existing code ...

  /**
   * デバッグ情報の取得
   */
  getDebugInfo(): any {
    return {
      version: APIClient.getVersion(),
      config: {
        baseURL: this.httpClient.config.baseURL,
        timeout: this.httpClient.config.timeout,
        retries: this.httpClient.config.retries
      },
      usage: UsageTracker.getInstance().getStats()
    };
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<any> {
    const start = Date.now();
    
    try {
      await this.testConnection();
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime: duration,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}
```