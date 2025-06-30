# プロジェクト構造

## 推奨ディレクトリ構造

```
sdk/
├── package.json              # パッケージ設定
├── tsconfig.json            # TypeScript設定
├── esbuild.config.ts        # ビルド設定
├── README.md                # SDK使用説明書
├── EXAMPLES.md              # 使用例集
├── dist/                    # ビルド成果物
│   ├── index.js            # CommonJS版
│   ├── index.mjs           # ESM版
│   ├── index.d.ts          # 型定義
│   └── index.d.ts.map      # 型定義マップ
├── src/                     # ソースコード
│   ├── index.ts            # メインエントリーポイント
│   ├── client.ts           # メインクライアント
│   ├── types/              # 型定義
│   │   ├── common.ts       # 共通型
│   │   ├── resource1.ts    # リソース1型
│   │   ├── resource2.ts    # リソース2型
│   │   └── resource3.ts    # リソース3型
│   ├── resources/          # リソース別API
│   │   ├── resource1.ts    # リソース1API
│   │   ├── resource2.ts    # リソース2API
│   │   └── resource3.ts    # リソース3API
│   └── utils/              # ユーティリティ
│       ├── http.ts         # HTTP通信
│       └── serialization.ts # データ変換
└── test-sdk-usage/         # テスト用ディレクトリ
    ├── package.json
    └── test.js
```

## 設定ファイル

### package.json

```json
{
  "name": "@your-org/api-sdk",
  "version": "1.0.0",
  "description": "TypeScript SDK for Your API",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsx esbuild.config.ts",
    "dev": "tsx esbuild.config.ts --watch",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "keywords": ["api", "sdk", "typescript"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/cross-fetch": "^4.0.0",
    "esbuild": "^0.19.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "cross-fetch": "^4.0.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test-sdk-usage"]
}
```

### esbuild.config.ts

```typescript
import { build } from 'esbuild';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const outDir = 'dist';

const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node' as const,
  target: 'node16',
  external: ['cross-fetch'],
  tsconfig: 'tsconfig.json',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
};

async function buildAll() {
  // CommonJS版
  await build({
    ...sharedConfig,
    format: 'cjs',
    outfile: `${outDir}/index.js`,
  });

  // ESM版
  await build({
    ...sharedConfig,
    format: 'esm',
    outfile: `${outDir}/index.mjs`,
  });
}
```

## ファイル別詳細

### src/index.ts（エントリーポイント）

```typescript
// メインクライアント
export { APIClient } from './client';

// 型定義のエクスポート
export type { SDKConfig } from './types/common';
export type { Resource1, Resource1ListQuery } from './types/resource1';

// エラークラス
export { SDKError, ValidationError } from './types/common';

// ユーティリティ関数
export { createClient } from './client';

// バージョン情報
export const VERSION = '1.0.0';
```

### src/client.ts（メインクライアント）

```typescript
import { HttpClient } from './utils/http';
import { Resource1API } from './resources/resource1';
import { SDKConfig } from './types/common';

export class APIClient {
  private httpClient: HttpClient;
  public readonly resource1: Resource1API;

  constructor(config: SDKConfig) {
    this.validateConfig(config);
    this.httpClient = new HttpClient(config);
    this.resource1 = new Resource1API(this.httpClient);
  }

  private validateConfig(config: SDKConfig): void {
    // 設定検証ロジック
  }
}

export function createClient(config: SDKConfig): APIClient {
  return new APIClient(config);
}
```

## 依存関係管理

### 必須依存関係

- `cross-fetch`: クロスプラットフォームHTTPクライアント
- `typescript`: 型定義とビルド
- `esbuild`: 高速バンドラー

### 開発依存関係

- `tsx`: TypeScriptファイル実行
- `@types/node`: Node.js型定義
- `@types/cross-fetch`: cross-fetch型定義

## ビルド成果物

### CommonJS版 (index.js)
- Node.js環境での使用
- require()でのインポート対応

### ESM版 (index.mjs)  
- モダンブラウザでの使用
- import文での読み込み対応

### 型定義 (index.d.ts)
- TypeScriptでの開発支援
- IDEでの自動補完

## 開発ワークフロー

1. **開発時**: `npm run dev` でwatch モード
2. **型チェック**: `npm run type-check` で型検証
3. **ビルド**: `npm run build` で成果物生成
4. **クリーン**: `npm run clean` で成果物削除

## ベストプラクティス

### ディレクトリ命名
- `types/`: 型定義専用
- `resources/`: リソース別API実装
- `utils/`: ユーティリティ関数

### ファイル命名
- kebab-case推奨
- 機能単位での分割
- 循環参照の回避

### エクスポート戦略
- 名前付きエクスポート推奨
- デフォルトエクスポートは最小限
- 型定義の明示的エクスポート