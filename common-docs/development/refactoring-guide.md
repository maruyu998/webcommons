# リファクタリングガイド

このドキュメントは、既存のWebアプリケーションをモダンなアーキテクチャにリファクタリングするための包括的なガイドです。authアプリで実装されたパターンを参考にしていますが、各アプリケーションの目的と要件に応じて適切に調整してください。

## 概要

モダンなWebアプリケーションアーキテクチャの主要な特徴：

1. **モノレポ構造** - client/、server/、share/の明確な分離
2. **階層的API設計** - アプリケーションの要件に応じたAPI層の設計
3. **型安全性の強化** - Zodスキーマとbranded typesの活用
4. **webcommonsの統合** - 共通ユーティリティライブラリの活用
5. **モダンなビルドシステム** - WebpackとESBuildの最適化

**重要**: 以下の例はあくまで参考です。認証サーバー、カレンダーアプリ、タスク管理システムなど、各アプリケーションの特性に応じて適切なアーキテクチャを選択してください。

**注意**: このガイドでは汎用的な例として「Resource」という名前を使用していますが、実際のアプリケーションでは適切な名前に置き換えてください。例：
- カレンダーアプリ → Event, Calendar, Appointment
- タスク管理 → Task, Project, Todo
- 在庫管理 → Product, Inventory, Stock
- ブログ → Article, Post, Comment

## リファクタリング手順

### フェーズ1: プロジェクト構造の再編成

#### 1.1 ディレクトリ構造の確立

既存のプロジェクトを以下の構造に再編成：

```bash
# 移行前の一般的な構造
project/
├── src/
├── public/
├── config/
└── utils/

# 移行後の構造
project/
├── server/             # バックエンドコード
│   ├── src/
│   ├── tsconfig.json
│   └── esbuild.config.ts
├── client/             # フロントエンドコード
│   ├── src/
│   ├── public/
│   ├── tsconfig.json
│   └── webpack.config.ts
├── share/              # 共有リソース
│   ├── protocol/       # API仕様定義
│   ├── types/          # 共有型定義
│   └── utils/          # 共有ユーティリティ
├── webcommons/         # 共通ライブラリ（別のgitリポジトリによる管理）
├── package.json        # ルートパッケージ
└── tsconfig.json       # ルート設定
```

#### 1.2 package.json の設定

```json
{
  "name": "your-app-name",
  "version": "4.0.0", // 適切なversion管理
  "scripts": {
    "client:build": "NODE_OPTIONS='-r esbuild-register' webpack --config client/webpack.config.ts",
    "server:build": "tsc -p server/tsconfig.json && tsx server/esbuild.config.ts",
    "build": "npm run client:build && npm run server:build",
    "dev": "ts-node --transpile-only server/src/index.ts",
    "start": "node build/index.js",
    "dep:update": "npm-check-updates -u && npm install"
  },
  "dependencies": {
    "maruyu-webcommons": "file:webcommons",
    // その他の依存関係
  }
}
```

### フェーズ2: TypeScript設定の統一

#### 2.1 ルートtsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./build",
    "rootDir": "./",
    "paths": {
      "@share/*": ["./share/*"]
    }
  },
  "exclude": ["node_modules", "build", "client", "webcommons"]
}
```

#### 2.2 サーバーtsconfig.json

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "../build",
    "paths": {
      "@share/*": ["../share/*"],
      "@server/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "../share/**/*"]
}
```

#### 2.3 クライアントtsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["DOM", "ESNext"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@share/*": ["../share/*"],
      "@client/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "../share/**/*"]
}
```

### フェーズ3: API層の再設計

#### 3.1 3層API構造の実装

```typescript
// server/src/index.ts
import express from 'express';
import { webPublicRouter } from './api/web_public';
import { webSecureRouter } from './api/web_secure';
import { externalApiRouter } from './api/external';
import { requireSignin, requireAuthorization } from './utils/middleware';

const app = express();

// 3層API構造
app.use('/pub', webPublicRouter);                          // 認証不要
app.use('/sec', requireSignin, webSecureRouter);           // セッション認証
app.use('/api', requireAuthorization, externalApiRouter);  // Bearer Token認証
```

#### 3.2 ルーター構造の標準化

```typescript
// server/src/api/web_secure/index.ts
import { Router } from 'express';
import clientsRouter from './clients';
import usersRouter from './users';

const router = Router();

router.use('/clients', clientsRouter);
router.use('/users', usersRouter);

export { router as webSecureRouter };
```

#### 3.3 RESTfulエンドポイントの実装

```typescript
// server/src/api/web_secure/resources/index.ts（リソース名は適宜変更）
import { Router } from 'express';
import { asyncHandler } from '@server/utils/asyncHandler';
import { CreateResourceBodySchema } from '@share/protocol/resources';
import { createResource } from '@server/services/resources';
import { sendData } from 'maruyu-webcommons/node';

const router = Router();

// GET /sec/resources
router.get('/', asyncHandler(async (req, res) => {
  const resources = await fetchResources(req.user.userId);
  sendData(res, resources);
}));

// POST /sec/resources
router.post('/', asyncHandler(async (req, res) => {
  const validatedBody = CreateResourceBodySchema.parse(req.body);
  const result = await createResource(validatedBody);
  sendData(res, result);
}));

export default router;
```

### フェーズ4: 型システムの構築

#### 4.1 共有型定義の作成

```typescript
// share/types/resource.ts（アプリケーションに応じた型定義）
import { z } from 'zod';
import { UserIdSchema } from 'maruyu-webcommons/commons/types/user';

// アプリケーション固有の型定義
export const ResourceNameSchema = z.string().min(1).max(100);
export type ResourceNameType = z.infer<typeof ResourceNameSchema>;

export const ResourceSchema = z.object({
  resourceId: z.string(),
  resourceName: ResourceNameSchema,
  ownerId: UserIdSchema,  // webcommonsの共通型を利用
  description: z.string().optional(),
  createdTime: z.date(),
  updatedTime: z.date()
});
export type ResourceType = z.infer<typeof ResourceSchema>;
```

#### 4.2 プロトコル定義の作成

```typescript
// share/protocol/resources/createResource.ts
import { z } from 'zod';
import { ResourceNameSchema } from '@share/types/resource';

export const RequestBodySchema = z.object({
  resourceName: ResourceNameSchema,
  description: z.string().optional(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    category: z.string().optional()
  }).optional()
});
export type RequestBodyType = z.infer<typeof RequestBodySchema>;

export const ResponseObjectSchema = z.object({
  resourceId: z.string(),
  resourceName: ResourceNameSchema,
  createdTime: z.date() // ISO形式の日付文字列
});
export type ResponseObjectType = z.infer<typeof ResponseObjectSchema>;
```

### フェーズ5: データベース層の移行

#### 5.1 Mongooseモデルの定義

```typescript
// server/src/mongoose/Resource.ts（アプリケーションに応じたモデル）
import mongoose from 'mongoose';
import { UserIdType } from 'maruyu-webcommons/commons/types/user';
import { ResourceNameType } from '@share/types/resource';

export type ResourceMongoType = {
  resourceId: string;
  resourceName: ResourceNameType;
  userId: UserIdType;
  description?: string;
  metadata?: {
    tags?: string[];
    category?: string;
  };
  createdTime: Date;
  updatedTime: Date;
}

export const ResourceModel = mongoose.model<ResourceMongoType>('resource',
  new mongoose.Schema<ResourceMongoType>({
    resourceId: { type: String, required: true, unique: true },
    resourceName: { type: String, required: true },
    userId: { type: String, required: true },
    description: { type: String },
    metadata: {
      tags: [{ type: String }],
      category: { type: String }
    }
  }, {
    timestamps: {
      createdAt: 'createdTime',
      updatedAt: 'updatedTime'
    }
  })
);
```

### フェーズ6: サービス層の実装

#### 6.1 ビジネスロジックの分離

```typescript
// server/src/services/resources.ts
import { ResourceModel } from '@server/mongoose/Resource';
import { CreateResourceBodyType } from '@share/protocol/resources';
import { ResourceType } from '@share/types/resource';
import { UserIdType } from 'maruyu-webcommons/commons/types/user';
import { generateId } from 'maruyu-webcommons/commons';

// リソースの作成
export async function createResource(
  userId: UserIdType,
  data: CreateResourceBodyType
): Promise<ResourceType> {
  const resource = await ResourceModel.create({
    resourceId: generateId(),
    resourceName: data.resourceName,
    userId,
    description: data.description,
    metadata: data.metadata
  });
  
  return convertToResourceType(resource);
}

// リソースの取得
export async function fetchResources(
  userId: UserIdType
): Promise<ResourceType[]> {
  const resources = await ResourceModel.find({ userId })
    .sort({ createdTime: -1 });
  
  return resources.map(convertToResourceType);
}

// MongoDB型からビジネス型への変換
function convertToResourceType(doc: any): ResourceType {
  return {
    resourceId: doc.resourceId,
    resourceName: doc.resourceName,
    ownerId: doc.userId,
    description: doc.description,
    createdTime: doc.createdTime,
    updatedTime: doc.updatedTime
  };
}
```

### フェーズ7: フロントエンドの移行

#### 7.1 データ層の実装

```typescript
// client/src/data/resources.ts
import { 
  CreateResourceBodyType, 
  CreateResourceResponseType,
  FetchResourcesResponseType 
} from '@share/protocol/resources';
import { getPacket, postPacket, putPacket, deletePacket } from 'maruyu-webcommons/commons/utils/fetch';

// リソースの作成
export async function createResource(bodyData: CreateResourceBodyType): Promise<CreateResourceResponseType> {
  const url = new URL('/sec/resources', location.origin);
  const bodySchema = CreateResourceBodySchema;
  const responseSchema = CreateResourceResponseSchema;
  return await postPacket({ url, bodyData, bodySchema, responseSchema });
}

// リソース一覧の取得
export async function fetchResources(): Promise<FetchResourcesResponseType> {
  const url = new URL('/sec/resources', location.origin);
  const responseSchema = FetchResourcesResponseSchema;
  return await getPacket({ url, responseSchema });
}

// 特定リソースの取得
export async function fetchResourceById(resourceId: string): Promise<FetchResourceResponseType> {
  const url = new URL(`/sec/resources/${resourceId}`, location.origin);
  const responseSchema = FetchResourceResponseSchema;
  return await getPacket({ url, responseSchema });
}

// リソースの更新
export async function updateResource(resourceId: string, bodyData: UpdateResourceBodyType): Promise<UpdateResourceResponseType> {
  const url = new URL(`/sec/resources/${resourceId}`, location.origin);
  const bodySchema = UpdateResourceBodySchema;
  const responseSchema = UpdateResourceResponseSchema;
  return await putPacket({ url, bodyData, bodySchema, responseSchema });
}

// リソースの削除
export async function deleteResource(resourceId: string): Promise<DeleteResourceResponseType> {
  const url = new URL(`/sec/resources/${resourceId}`, location.origin);
  const responseSchema = DeleteResourceResponseSchema;
  return await deletePacket({ url, responseSchema });
}
```

#### 7.2 グローバル状態管理の実装

```typescript
// client/src/contexts/AppContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ResourceType } from '@share/types/resource';
import { fetchResources as fetchResourcesApi } from '@client/data/resources';
import { useWebcommonsToast } from 'maruyu-webcommons/react';

interface AppContextType {
  resources: ResourceType[];
  loading: boolean;
  error: string | null;
  refreshResources: () => Promise<void>;
  addResource: (resource: ResourceType) => void;
  updateResource: (resourceId: string, updates: Partial<ResourceType>) => void;
  deleteResource: (resourceId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [resources, setResources] = useState<ResourceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useWebcommonsToast();
  
  // リソース一覧の取得
  const refreshResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResourcesApi();
      setResources(data.resources);
    } catch (err) {
      setError('リソースの取得に失敗しました');
      toast.error('リソースの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  // リソースの追加
  const addResource = useCallback((resource: ResourceType) => {
    setResources(prev => [resource, ...prev]);
  }, []);
  
  // リソースの更新
  const updateResource = useCallback((resourceId: string, updates: Partial<ResourceType>) => {
    setResources(prev => prev.map(r => 
      r.resourceId === resourceId ? { ...r, ...updates } : r
    ));
  }, []);
  
  // リソースの削除
  const deleteResource = useCallback((resourceId: string) => {
    setResources(prev => prev.filter(r => r.resourceId !== resourceId));
  }, []);
  
  return (
    <AppContext.Provider value={{
      resources,
      loading,
      error,
      refreshResources,
      addResource,
      updateResource,
      deleteResource
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

### フェーズ8: ビルドシステムの設定

#### 8.1 Webpack設定（クライアント）

```typescript
// client/webpack.config.ts
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration } from 'webpack';

const config: Configuration = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, '../build/public'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@share': path.resolve(__dirname, '../share'),
      '@client': path.resolve(__dirname, './src')
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ]
};

export default config;
```

#### 8.2 ESBuild設定（サーバー）

```typescript
// server/esbuild.config.ts
import { build } from 'esbuild';

build({
  entryPoints: ['./build/server/src/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: './build/index.js',
  external: ['mongoose', 'express'],  // 必要に応じて外部パッケージを追加
  minify: true
}).catch(() => process.exit(1));
```

## 移行時の注意点

### 1. 段階的な移行

- 一度に全てを移行せず、モジュールごとに段階的に移行
- 既存のAPIとの互換性を保ちながら新しいAPIを追加
- テストを書きながら移行を進める

### 2. 型安全性の確保

- any型の使用を避ける
- Zodスキーマで全ての入出力を検証
- branded typesで型の混同を防ぐ

### 3. セキュリティ

- 認証・認可の適切な実装
- 入力値検証の徹底
- 環境変数による設定管理

### 4. パフォーマンス

- 適切なインデックスの設定
- N+1問題の回避
- キャッシュの活用

### 5. 開発体験

- ホットリロードの設定
- TypeScriptの厳密な設定
- VS Codeの設定共有

## チェックリスト

リファクタリング完了時に以下を確認：

- [ ] モノレポ構造への移行完了
- [ ] 3層API構造の実装
- [ ] TypeScriptパスエイリアスの設定
- [ ] 全てのAPIにZodスキーマ定義
- [ ] Mongooseモデルへの移行
- [ ] サービス層の実装
- [ ] フロントエンドのデータ層実装
- [ ] ビルドシステムの設定
- [ ] 開発用スクリプトの整備
- [ ] 環境変数の整理
- [ ] ドキュメントの更新

このガイドに従うことで、保守性・拡張性・型安全性に優れたモダンなWebアプリケーションへのリファクタリングが可能になります。