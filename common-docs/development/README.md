# webcommons 開発ガイド

webcommons ライブラリを使用したアプリケーション開発における標準的なパターンとベストプラクティスを説明します。

## ドキュメント一覧

### アーキテクチャ・設計
- **[architecture-patterns.md](./architecture-patterns.md)** - 3層API設計、認証パターン、型定義規約
- **[refactoring-guide.md](./refactoring-guide.md)** - 既存アプリケーションのwebcommons移行ガイド

### フロントエンド
- **[react-patterns.md](./react-patterns.md)** - React/TypeScript開発パターン、コンポーネント設計、状態管理

### データベース
- **[mongoose-patterns.md](./mongoose-patterns.md)** - Mongoose モデル定義パターンとベストプラクティス

### API設計
- **[protocol-conventions.md](./protocol-conventions.md)** - プロトコル定義規約とZodスキーマパターン

### ライブラリ・ユーティリティ
- **[oauth-library.md](./oauth-library.md)** - OAuth 2.0クライアントライブラリの使用方法

## 使用場面

### 新規プロジェクト開始時
1. `architecture-patterns.md` でプロジェクト構造を確認
2. `protocol-conventions.md` でAPI設計方針を決定
3. `mongoose-patterns.md` でデータベース設計を計画
4. `react-patterns.md` でフロントエンド設計を確認
5. [claude-guidance/](../claude-guidance/) でプロジェクト初期設定を実施

### フロントエンド開発時
1. `react-patterns.md` でコンポーネント設計パターンを確認
2. `protocol-conventions.md` でAPIクライアント実装を参照
3. `architecture-patterns.md` で認証フローを理解

### 既存プロジェクトの移行時
1. `refactoring-guide.md` で移行手順を確認
2. 段階的にwebcommonsパターンに移行

### OAuth認証実装時
1. `oauth-library.md` でライブラリの使用方法を確認
2. セキュリティ要件を満たした実装を行う

## 重要な注意点

すべてのサンプルコードでは汎用的な例として「Resource」という名前を使用していますが、実際のアプリケーションでは適切な名前（User、Task、Product等）に置き換えてください。

## 関連リソース

- [Claude Code 開発ガイド](../claude-guidance/) - Claude Code を使用した開発ワークフロー
- [テンプレート集](../templates/) - プロジェクト初期設定用テンプレート