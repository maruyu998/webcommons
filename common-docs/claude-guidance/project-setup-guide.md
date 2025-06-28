# Claude Code プロジェクト初期設定ガイド

新規プロジェクトでClaude Codeを効果的に活用するための初期設定手順とベストプラクティスを説明します。

## 1. プロジェクト構造の設定

### ディレクトリ構造

```
project/
├── docs/                   # Claude Code用ドキュメント
│   ├── session-continuity.md
│   ├── session_progress.md
│   ├── sessions/
│   ├── decisions/
│   ├── issues/
│   └── notes/
├── CLAUDE.md               # プロジェクト固有の指示
├── server/                 # バックエンド
├── client/                 # フロントエンド
├── share/                  # 共有リソース
└── webcommons/             # 共通ライブラリ
```

### 必須ファイルの作成

**1. CLAUDE.md**
```bash
cp /app/webcommons/common-docs/templates/CLAUDE.md.template ./CLAUDE.md
# プロジェクト固有の情報に編集
```

**2. session-continuity.md**
```bash
cp /app/webcommons/common-docs/claude-guidance/session-continuity.md ./docs/
```

**3. session_progress.md**
```bash
cp /app/webcommons/common-docs/templates/session_progress.md.template ./docs/session_progress.md
```

## 2. 開発環境の準備

### TypeScript設定

**tsconfig.json パスエイリアス設定:**
```json
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

### パッケージ設定

**package.json 推奨スクリプト（auth実装例）:**
```json
{
  "scripts": {
    "dev": "npm run server:dev & npm run client:dev", # または concurrently要インストール
    "build": "npm run server:build && npm run client:build",
    "server:dev": "nodemon server/src/index.ts",
    "server:build": "tsc -p server/tsconfig.json",
    "client:dev": "webpack serve --config client/webpack.config.js --mode development",
    "client:build": "webpack --config client/webpack.config.js --mode production",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

### webcommons統合

**webcommonsの追加:**
```bash
# package.jsonに依存関係追加
git clone git@github.com:maruyu998/webcommons.git
```

## 3. Claude Code連携設定

### .claude-ignore設定

**不要なファイルの除外:**
```
# .claude-ignore
node_modules/
build/
dist/
coverage/
*.log
.env.local
.env.production
docs/sessions/
docs/tmp/
```

### Git設定

**重要ファイルの追跡:**
```bash
# 追跡対象
git add CLAUDE.md
git add docs/session-continuity.md
git add docs/session_progress.md

# 除外対象（.gitignore）
docs/sessions/
docs/tmp/
```

## 4. 初期テンプレートの設定

### API構造テンプレート

**server/src/api/ の基本構造:**
```
api/
├── web_public/     # 認証不要（/pub/*）
├── web_secure/     # セッション認証（/sec/*）
└── external/       # APIキー認証（/api/*）
```

### 型定義テンプレート

**share/types/ の基本構造:**
```typescript
// share/types/user.ts
export const UserIdSchema = z.string().brand<"UserId">();
export type UserIdType = z.infer<typeof UserIdSchema>;

export const UserSchema = z.object({
  userId: UserIdSchema,
  userName: UserNameSchema,
  email: z.string().email(),
  createdTime: z.date(),
  updatedTime: z.date(),
});
export type UserType = z.infer<typeof UserSchema>;
```

## 5. 開発ワークフロー設定

### セッション管理設定

**docs/session_progress.md の初期化:**
```markdown
# プロジェクト進捗管理

## 現在の状況
- プロジェクト開始: YYYY-MM-DD
- 最新セッション: [未実施]

## 主要コンポーネント
- [ ] 認証システム
- [ ] API設計
- [ ] フロントエンド基盤
- [ ] データベース設計

## 技術的決定事項
（未定）

## 既知の課題
（なし）
```

### タスク管理設定

**開発タスクの分類:**
- **Phase 1**: 基盤設定（認証、API基本構造）
- **Phase 2**: 主要機能実装
- **Phase 3**: UI/UX改善
- **Phase 4**: テスト・最適化

## 6. 品質管理設定

### ESLint設定

**.eslintrc.js:**
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
  },
};
```

### テスト設定

**jest.config.js（要作成）:**
```javascript
// 注意: authプロジェクトではJest設定ファイルが未作成
// 以下は推奨設定例
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // React用
  moduleNameMapping: {
    '^@share/(.*)$': '<rootDir>/share/$1',
    '^@client/(.*)$': '<rootDir>/client/src/$1',
    '^@server/(.*)$': '<rootDir>/server/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
```

## 7. 運用準備

### Docker設定

**docker-compose.dev.yml（要作成）:**
```yaml
# 注意: authプロジェクトでは開発用Docker設定が未作成
# 以下は推奨設定例
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: dev
      MONGO_INITDB_ROOT_PASSWORD: password

  app:
    build:
      dockerfile: Dockerfile.dev  # 要作成
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    depends_on:
      - mongodb
```

### 環境変数テンプレート

**.env.example（auth実装パターン）:**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/project_name

# Server  
PORT=3000
SERVICE_DOMAIN=https://localhost:3000    # https://で始まる必要があります
CLIENT_PUBLIC_PATH=./build/public        # ビルドされたクライアントファイルパス
RUN_MODE=development                     # development/production/test

# Application specific
ADMIN_USER_NAME=admin                    # 初期管理者ユーザー名  
ADMIN_PASSWORD=admin_password            # 初期管理者パスワード

# Security
SESSION_SECRET=your_session_secret_here
JWT_SECRET=your_jwt_secret_here

# External services (if needed)
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
```

## 8. 最初のセッション準備

### 確認事項チェックリスト

- [ ] CLAUDE.md が適切に設定されている
- [ ] docs/ ディレクトリ構造が作成されている
- [ ] TypeScript パスエイリアスが設定されている
- [ ] 基本的なnpmスクリプトが設定されている
- [ ] webcommons が正しく統合されている
- [ ] 開発環境（DB等）が起動できる

### 初回セッション実行内容

1. **基本動作確認**
   ```bash
   npm install
   npm run dev
   ```

2. **Claude Codeとの接続確認**
   - セッション継続機能のテスト
   - コードベース理解の確認
   - 基本的なCRUD操作実装

3. **開発フロー確立**
   - Git commitパターンの確認(git flow)
   - テスト実行パターンの確認
   - デバッグ手順の確認

この初期設定により、Claude Codeとの効果的な協働開発環境が整います。