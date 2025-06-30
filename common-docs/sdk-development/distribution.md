# 配布と公開

## 概要

SDKのパッケージング、バージョン管理、npm レジストリへの公開手順について説明します。

## パッケージング戦略

### セマンティックバージョニング

```
MAJOR.MINOR.PATCH

MAJOR: 破壊的変更（API の非互換変更）
MINOR: 機能追加（後方互換性あり）
PATCH: バグ修正（後方互換性あり）
```

### バージョン管理

```json
{
  "version": "1.2.3",
  "scripts": {
    "version:patch": "npm version patch",
    "version:minor": "npm version minor", 
    "version:major": "npm version major",
    "version:prerelease": "npm version prerelease --preid=beta"
  }
}
```

## npm公開

### 公開前チェックリスト

```bash
# 1. ビルド成果物の確認
npm run build
ls -la dist/

# 2. パッケージ内容の確認
npm pack --dry-run

# 3. 型定義の確認
npx tsc --noEmit

# 4. Linting
npm run lint

# 5. テスト実行（存在する場合）
npm test
```

### npm レジストリ公開

```bash
# npm にログイン
npm login

# パッケージ公開
npm publish

# スコープ付きパッケージの場合
npm publish --access public
```

### package.json 公開設定

```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "files": [
    "dist",
    "README.md",
    "EXAMPLES.md",
    "CHANGELOG.md"
  ]
}
```

## プライベートレジストリ

### Verdaccio設定

```bash
# Verdaccio インストール
npm install -g verdaccio

# 設定ファイル作成
mkdir ~/.config/verdaccio
cat > ~/.config/verdaccio/config.yaml << EOF
storage: ./storage
auth:
  htpasswd:
    file: ./htpasswd
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  '@your-org/*':
    access: \$all
    publish: \$authenticated
    unpublish: \$authenticated
  '**':
    access: \$all
    publish: \$authenticated
    unpublish: \$authenticated
    proxy: npmjs
EOF

# Verdaccio 起動
verdaccio
```

### プライベートレジストリへの公開

```bash
# レジストリURL設定
npm config set registry http://localhost:4873

# または .npmrc ファイルで設定
echo "registry=http://localhost:4873" > .npmrc

# ユーザー登録
npm adduser --registry http://localhost:4873

# パッケージ公開
npm publish --registry http://localhost:4873
```

### スコープ別レジストリ設定

```bash
# 特定スコープのみプライベートレジストリを使用
npm config set @your-org:registry http://localhost:4873

# .npmrc での設定
echo "@your-org:registry=http://localhost:4873" >> .npmrc
```

## GitHub Packages

### GitHub Packages 設定

```json
{
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/your-api-sdk.git"
  }
}
```

### GitHub Token設定

```bash
# GitHub Personal Access Token を作成
# Settings > Developer settings > Personal access tokens

# .npmrc に追加
echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN" >> ~/.npmrc
```

### GitHub Actions での自動公開

```yaml
# .github/workflows/publish.yml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        registry-url: 'https://npm.pkg.github.com'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Publish to GitHub Packages
      run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Docker レジストリ

### Dockerfile作成

```dockerfile
FROM node:18-alpine

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./
COPY dist/ ./dist/
COPY README.md ./

# SDK をグローバルインストール
RUN npm install -g .

# 使用例
CMD ["node", "-e", "const sdk = require('@your-org/api-sdk'); console.log(sdk.VERSION);"]
```

### Docker Hub公開

```bash
# Docker イメージビルド
docker build -t your-org/api-sdk:1.0.0 .

# Docker Hub にプッシュ
docker push your-org/api-sdk:1.0.0
```

## バージョン管理戦略

### Git タグ自動化

```json
{
  "scripts": {
    "preversion": "npm run build && npm run type-check",
    "version": "git add -A",
    "postversion": "git push && git push --tags && npm publish"
  }
}
```

### CHANGELOG自動生成

```bash
# conventional-changelog インストール
npm install -D conventional-changelog-cli

# package.json に追加
{
  "scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}

# 使用
npm run changelog
```

### リリースノート

```markdown
# CHANGELOG.md

## [1.2.0] - 2024-01-15

### Added
- 新しい認証方式のサポート
- バッチAPI機能の追加

### Changed  
- エラーメッセージの改善
- HTTPタイムアウトのデフォルト値変更

### Fixed
- 日付範囲バリデーションのバグ修正
- TypeScript型定義の不整合修正

### Deprecated
- 旧認証方式（v2.0で削除予定）
```

## 配布チャネル

### CDN配布

```html
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@your-org/api-sdk@1.0.0/dist/index.min.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@your-org/api-sdk@1.0.0/dist/index.min.js"></script>
```

### TypeScript定義配布

```json
{
  "types": "dist/index.d.ts",
  "typesVersions": {
    "*": {
      "*": ["dist/*"]
    }
  }
}
```

## 使用統計とフィードバック

### ダウンロード数監視

```bash
# npm統計確認
npm info @your-org/api-sdk

# オンライン統計
# https://npmjs.com/package/@your-org/api-sdk
```

### ユーザーフィードバック収集

```json
{
  "bugs": {
    "url": "https://github.com/your-org/api-sdk/issues"
  },
  "homepage": "https://github.com/your-org/api-sdk#readme"
}
```

## 配布後のメンテナンス

### セキュリティ監査

```bash
# パッケージの脆弱性チェック
npm audit

# 自動修正
npm audit fix
```

### 依存関係の更新

```bash
# 古い依存関係チェック
npm outdated

# 依存関係更新
npm update

# major バージョン更新
npx npm-check-updates -u
```

### 廃止プロセス

```json
{
  "deprecated": "This package has been deprecated. Use @your-org/new-api-sdk instead."
}
```

```bash
# パッケージ廃止
npm deprecate @your-org/api-sdk@1.0.0 "Use @your-org/new-api-sdk instead"

# パッケージ削除（72時間以内のみ）
npm unpublish @your-org/api-sdk@1.0.0
```

## 配布のベストプラクティス

### 1. リリース前テスト
- 複数環境でのテスト
- 実際のインストール確認
- 型定義の動作確認

### 2. ドキュメント充実
- README.md の完整性
- API ドキュメント
- 移行ガイド

### 3. 後方互換性
- 破壊的変更の慎重な検討
- 廃止予告期間の設定
- 移行パスの提供

### 4. コミュニティ対応
- Issue への迅速な対応
- Pull Request のレビュー
- リリースノートの詳細化