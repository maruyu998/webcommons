# ビルドとパッケージング

## 概要

esbuildを使用したSDKの効率的なビルド設定とパッケージング戦略について説明します。

## esbuild設定 (esbuild.config.ts)

### 基本設定

```typescript
import { build } from 'esbuild';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const outDir = 'dist';

// 共通ビルド設定
const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node' as const,
  target: 'node16',
  external: ['cross-fetch'],           // 外部依存関係
  tsconfig: 'tsconfig.json',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
};
```

### マルチフォーマット出力

```typescript
async function buildAll() {
  try {
    console.log('Building SDK...');

    // CommonJS版の生成
    await build({
      ...sharedConfig,
      format: 'cjs',
      outfile: `${outDir}/index.js`,
    });

    // ESM版の生成
    await build({
      ...sharedConfig,
      format: 'esm',
      outfile: `${outDir}/index.mjs`,
    });

    console.log('✅ SDK built successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}
```

### TypeScript宣言ファイル生成

```typescript
async function generateTypes() {
  try {
    console.log('Generating TypeScript declarations...');
    
    const { execSync } = await import('child_process');
    execSync('npx tsc --declaration --declarationMap --emitDeclarationOnly --outDir dist', {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    console.log('✅ TypeScript declarations generated!');
  } catch (error) {
    console.error('❌ TypeScript declaration generation failed:', error);
    process.exit(1);
  }
}
```

### 開発モード（Watch）

```typescript
if (process.argv.includes('--watch')) {
  console.log('👀 Watching for changes...');
  
  build({
    ...sharedConfig,
    format: 'cjs',
    outfile: `${outDir}/index.js`,
    watch: {
      onRebuild(error, result) {
        if (error) {
          console.error('❌ Watch build failed:', error);
        } else {
          console.log('✅ Rebuilt successfully');
        }
      },
    },
  });
} else {
  main().catch(console.error);
}
```

## パッケージ設定最適化

### package.json の exports フィールド

```json
{
  "name": "@your-org/api-sdk",
  "version": "1.0.0",
  "description": "TypeScript SDK for Your API",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "EXAMPLES.md"
  ]
}
```

### Tree-shaking対応

```json
{
  "sideEffects": false,
  "engines": {
    "node": ">=16.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

## ビルド最適化

### バンドルサイズの最小化

```typescript
// esbuild設定での最適化
const optimizedConfig = {
  ...sharedConfig,
  
  // Dead code elimination
  treeShaking: true,
  
  // 不要なコードの除去
  drop: ['console', 'debugger'],
  
  // 変数名の短縮化
  minifyIdentifiers: true,
  minifySyntax: true,
  minifyWhitespace: true,
  
  // ターゲット環境の最適化
  target: ['es2020', 'chrome80', 'firefox80', 'safari14'],
};
```

### 外部依存関係の管理

```typescript
const externalDependencies = [
  'cross-fetch',      // HTTP クライアント
  'node:*',           // Node.js 内蔵モジュール
  /^@types\//,        // 型定義パッケージ
];

const buildConfig = {
  ...sharedConfig,
  external: externalDependencies,
};
```

## 品質チェック

### TypeScript型チェック

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch"
  }
}
```

### Linting

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0"
  }
}
```

### バンドルサイズ分析

```typescript
// バンドルサイズ分析プラグイン
import { analyzeMetafile } from 'esbuild';

async function analyzeBuild() {
  const result = await build({
    ...sharedConfig,
    metafile: true,
  });

  const analysis = await analyzeMetafile(result.metafile);
  console.log(analysis);
}
```

## 開発ワークフロー

### 自動化されたビルドスクリプト

```typescript
// scripts/build.ts
async function main() {
  // 1. クリーンアップ
  await cleanDistDirectory();
  
  // 2. 型チェック
  await typeCheck();
  
  // 3. ビルド
  await buildAll();
  
  // 4. 型定義生成
  await generateTypes();
  
  // 5. バンドルサイズチェック
  await checkBundleSize();
  
  console.log('\n🎉 Build completed successfully!');
}

async function cleanDistDirectory() {
  const { rm } = await import('fs/promises');
  try {
    await rm('dist', { recursive: true, force: true });
    console.log('🧹 Cleaned dist directory');
  } catch {
    // ディレクトリが存在しない場合は無視
  }
}

async function typeCheck() {
  const { execSync } = await import('child_process');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ Type check passed');
  } catch {
    console.error('❌ Type check failed');
    process.exit(1);
  }
}
```

### CI/CD統合

```yaml
# .github/workflows/build.yml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Type check
      run: npm run type-check
      
    - name: Lint
      run: npm run lint
      
    - name: Build
      run: npm run build
      
    - name: Test build output
      run: node -e "require('./dist/index.js')"
```

## デバッグ設定

### ソースマップ生成

```typescript
const debugConfig = {
  ...sharedConfig,
  sourcemap: 'inline',    // インラインソースマップ
  minify: false,          // デバッグ時は圧縮無効
  keepNames: true,        // 関数名を保持
};
```

### 開発用ビルド

```json
{
  "scripts": {
    "build:dev": "tsx esbuild.config.ts --dev",
    "build:prod": "NODE_ENV=production tsx esbuild.config.ts",
    "watch": "tsx esbuild.config.ts --watch"
  }
}
```

## パフォーマンス監視

### ビルド時間の測定

```typescript
async function measureBuildTime() {
  const startTime = Date.now();
  
  await buildAll();
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`⏱️  Build completed in ${duration}ms`);
}
```

### ファイルサイズのレポート

```typescript
import { stat } from 'fs/promises';

async function reportFileSizes() {
  const files = ['dist/index.js', 'dist/index.mjs', 'dist/index.d.ts'];
  
  for (const file of files) {
    try {
      const stats = await stat(file);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`📦 ${file}: ${sizeKB} KB`);
    } catch {
      console.log(`❌ ${file}: not found`);
    }
  }
}
```

## 配布前チェック

### パッケージ内容の検証

```bash
# パッケージ内容確認
npm pack --dry-run

# 実際のパッケージング
npm pack

# パッケージ内容詳細
tar -tzf your-api-sdk-1.0.0.tgz
```

### インストールテスト

```typescript
// test-installation.js
const fs = require('fs');
const { execSync } = require('child_process');

// テスト用ディレクトリ作成
fs.mkdirSync('test-install', { recursive: true });
process.chdir('test-install');

// package.json作成
fs.writeFileSync('package.json', JSON.stringify({
  name: 'test-installation',
  version: '1.0.0'
}, null, 2));

// パッケージインストール
execSync('npm install ../your-api-sdk-1.0.0.tgz', { stdio: 'inherit' });

// インポートテスト
const sdk = require('@your-org/api-sdk');
console.log('✅ SDK imported successfully');
console.log('Version:', sdk.VERSION);
```