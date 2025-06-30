# シリアライゼーション

## 概要

maruyu-webcommonsライブラリとの互換性を保つためのパケット形式対応とデータ変換について説明します。

## maruyu-webcommons パケット形式

### パケット構造

```typescript
interface Packet {
  v: number;    // バージョン（通常は2）
  d: {
    t: string;  // データタイプ（'o' = object）
    d: any;     // 実際のデータ
  };
}
```

### 使用例

```typescript
// 送信データ
const data = { id: "123", name: "example" };

// パケット形式
const packet = {
  v: 2,
  d: {
    t: 'o',
    d: data
  }
};

// JSON文字列化
const serialized = JSON.stringify(packet);
```

## シリアライゼーション実装 (utils/serialization.ts)

### クエリパラメータのシリアライゼーション

```typescript
/**
 * クエリパラメータをmaruyu-webcommons形式にシリアライズ
 */
export function serializeQuery(data: any): string {
  const packet = {
    v: 2, // version
    d: {
      t: 'o', // type: object
      d: data
    }
  };
  return encodeURIComponent(JSON.stringify(packet));
}

// 使用例
const query = { limit: 10, offset: 0 };
const queryString = serializeQuery(query);
// 結果: URLエンコードされたJSON文字列
```

### リクエストボディのシリアライゼーション

```typescript
/**
 * リクエストボディをmaruyu-webcommons形式にシリアライズ
 */
export function serializeBody(data: any): string {
  const packet = {
    v: 2, // version
    d: {
      t: 'o', // type: object
      d: data
    }
  };
  
  // maruyu-webcommonsは { packet: "..." } 形式を期待
  return JSON.stringify({ packet: JSON.stringify(packet) });
}

// 使用例
const requestData = { title: "New Resource", priority: "high" };
const body = serializeBody(requestData);
// 結果: {"packet":"{\"v\":2,\"d\":{\"t\":\"o\",\"d\":{...}}}"}
```

## デシリアライゼーション

### 日付フィールドの変換

```typescript
/**
 * 指定されたフィールドの日付文字列をDateオブジェクトに変換
 */
export function deserializeDates<T extends Record<string, any>>(
  obj: T,
  dateFields: string[]
): T {
  const result = { ...obj };
  
  for (const field of dateFields) {
    if (field.includes('.')) {
      // ネストしたフィールド（例: "status.updatedTime"）
      const parts = field.split('.');
      let current: any = result;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]]) {
          current = current[parts[i]];
        } else {
          break;
        }
      }
      
      const lastPart = parts[parts.length - 1];
      if (current && current[lastPart]) {
        current[lastPart] = new Date(current[lastPart]);
      }
    } else {
      // トップレベルフィールド
      if ((result as any)[field]) {
        (result as any)[field] = new Date((result as any)[field]);
      }
    }
  }
  
  return result;
}
```

### リソース別デシリアライゼーション

```typescript
/**
 * リソースAPIレスポンスの日付変換
 */
export function deserializeResource(raw: any): any {
  return deserializeDates(raw, [
    'startTime',
    'endTime', 
    'status.updatedTime',
    'snoozeTime',
    'updatedTime'
  ]);
}

/**
 * 別リソースの日付変換
 */
export function deserializeOtherResource(raw: any): any {
  return deserializeDates(raw, [
    'startTime',
    'endTime',
    'status.updatedTime',
    'updatedTime'
  ]);
}
```

## 日付処理のベストプラクティス

### 日付範囲の検証

```typescript
/**
 * 日付範囲の妥当性を検証
 */
export function validateDateRange(startTime?: Date, endTime?: Date): void {
  if (startTime && endTime && startTime >= endTime) {
    throw new Error('startTime must be before endTime');
  }
}
```

### API用日付フォーマット

```typescript
/**
 * DateオブジェクトをAPI送信用文字列に変換
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString();
}

// 使用例
const date = new Date();
const formatted = formatDateForAPI(date);
// 結果: "2024-01-01T00:00:00.000Z"
```

### タイムゾーン考慮

```typescript
/**
 * ローカル日付をUTCに変換
 */
export function toUTC(date: Date): Date {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
}

/**
 * UTC日付をローカルに変換
 */
export function fromUTC(utcDate: Date): Date {
  return new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000));
}
```

## エラーハンドリング

### シリアライゼーションエラー

```typescript
/**
 * 安全なJSON変換
 */
export function safeSerialize(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    throw new ValidationError(`Failed to serialize data: ${error.message}`);
  }
}

/**
 * 安全なJSON解析
 */
export function safeDeserialize<T>(json: string): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    throw new ValidationError(`Failed to parse JSON: ${error.message}`);
  }
}
```

### 循環参照の処理

```typescript
/**
 * 循環参照対応のシリアライゼーション
 */
export function serializeWithCircularReference(data: any): string {
  const seen = new WeakSet();
  
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  });
}
```

## パフォーマンス最適化

### 大量データの処理

```typescript
/**
 * ストリーミング対応のデシリアライゼーション
 */
export function deserializeStream<T>(
  stream: ReadableStream<T>,
  deserializer: (item: any) => T
): ReadableStream<T> {
  return new ReadableStream({
    start(controller) {
      const reader = stream.getReader();
      
      function pump(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          
          try {
            const deserialized = deserializer(value);
            controller.enqueue(deserialized);
          } catch (error) {
            controller.error(error);
            return;
          }
          
          return pump();
        });
      }
      
      return pump();
    }
  });
}
```

### キャッシュ機構

```typescript
/**
 * デシリアライゼーション結果のキャッシュ
 */
const deserializationCache = new Map<string, any>();

export function cachedDeserialize<T>(
  data: any, 
  deserializer: (data: any) => T,
  cacheKey?: string
): T {
  const key = cacheKey || JSON.stringify(data);
  
  if (deserializationCache.has(key)) {
    return deserializationCache.get(key);
  }
  
  const result = deserializer(data);
  deserializationCache.set(key, result);
  
  return result;
}
```

## テスト支援

### シリアライゼーションのテストユーティリティ

```typescript
/**
 * シリアライゼーション結果の検証
 */
export function validateSerialization(
  original: any, 
  serialized: string,
  deserializer: (data: any) => any
): boolean {
  try {
    const parsed = JSON.parse(serialized);
    const deserialized = deserializer(parsed);
    
    // 深い等価性チェック（日付などを考慮）
    return deepEqual(original, deserialized);
  } catch {
    return false;
  }
}

/**
 * 深い等価性チェック
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  return keysA.every(key => deepEqual(a[key], b[key]));
}
```