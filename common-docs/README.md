# webcommons共通ドキュメント

webcommonsライブラリを使用したアプリケーション開発とClaude Codeを活用した効率的な開発ワークフローのためのドキュメント集です。

## ディレクトリ構成

```
webcommons/common-docs/
├── README.md                       # このファイル
├── development/                    # webcommons開発ガイド
│   ├── README.md                   # 開発ガイド概要
│   ├── architecture-patterns.md   # アーキテクチャパターン
│   ├── react-patterns.md          # React/フロントエンド開発パターン
│   ├── mongoose-patterns.md       # Mongoose/データベースパターン
│   ├── protocol-conventions.md    # API仕様定義規約
│   ├── refactoring-guide.md       # webcommons移行ガイド
│   └── oauth-library.md           # OAuth 2.0ライブラリ
├── claude-guidance/                # Claude Code開発ガイド
│   ├── README.md                   # Claude Code開発ガイド概要
│   ├── session-continuity.md      # セッション継続システム（記憶術）
│   ├── task-management-system.md  # タスク管理システム（user-requests.md）
│   ├── unified-session-documentation.md # 統一セッション記録システム
│   ├── workflow-patterns.md       # 開発ワークフローパターン
│   ├── project-setup-guide.md     # プロジェクト初期設定ガイド
│   ├── code-conventions.md        # Claude Code向けコーディング規約・Import順序
│   └── documentation-patterns.md  # プロジェクトドキュメント管理パターン
└── templates/                      # プロジェクト初期設定テンプレート
    ├── CLAUDE.md.template          # プロジェクト用CLAUDE.mdテンプレート
    └── session_progress.md.template # セッション進捗管理テンプレート
```

## ドキュメント概要

### 🏗️ [development/](./development/) - webcommons開発ガイド

webcommonsライブラリを使用したアプリケーション開発における技術的なパターンとベストプラクティス：

- **アーキテクチャ設計** - 3層API構造、認証パターン、型定義規約
- **フロントエンド開発** - React/TypeScript、コンポーネント設計、状態管理
- **バックエンド開発** - Mongoose、プロトコル定義、OAuth実装
- **リファクタリング** - 既存アプリケーションのwebcommons移行

### 🤖 [claude-guidance/](./claude-guidance/) - Claude Code開発ガイド

Claude Code (claude.ai/code) を使用した効率的な開発ワークフローとコラボレーションパターン：

- **セッション管理** - 記憶術システムによるコンテキスト保持
- **開発ワークフロー** - タスク管理、コードレビュー、デバッグパターン
- **プロジェクト設定** - 新規プロジェクトでのClaude Code活用
- **コーディング規約** - Claude Code向けのコード作法・Import順序ガイドライン
- **ドキュメント管理** - プロジェクトドキュメントとセッション記録パターン
- **統一記録システム** - sessions/とtask-records/を統合した効率的記録方法

### 📝 [templates/](./templates/) - プロジェクトテンプレート

新規プロジェクト開始時に使用するテンプレートファイル集：

- **CLAUDE.md** - プロジェクト固有のClaude Code向け指示書
- **セッション進捗管理** - 開発進捗追跡テンプレート

## 使用場面別ガイド

### 🆕 新規プロジェクト開始時

1. **[claude-guidance/project-setup-guide.md](./claude-guidance/project-setup-guide.md)** でClaude Code環境を設定
2. **[development/architecture-patterns.md](./development/architecture-patterns.md)** でプロジェクト構造を決定
3. **[templates/](./templates/)** からテンプレートファイルをコピー・カスタマイズ

### 💻 日常的な開発作業

**フロントエンド開発時:**
- [development/react-patterns.md](./development/react-patterns.md) - コンポーネント設計
- [development/protocol-conventions.md](./development/protocol-conventions.md) - APIクライアント実装

**バックエンド開発時:**
- [development/mongoose-patterns.md](./development/mongoose-patterns.md) - データベース設計
- [development/architecture-patterns.md](./development/architecture-patterns.md) - API実装

### 🔧 既存プロジェクトの改善

- **[development/refactoring-guide.md](./development/refactoring-guide.md)** - webcommonsパターンへの移行
- **[claude-guidance/workflow-patterns.md](./claude-guidance/workflow-patterns.md)** - 開発効率化

### 🔐 認証機能実装

- **[development/oauth-library.md](./development/oauth-library.md)** - OAuth 2.0ライブラリ活用
- **[development/architecture-patterns.md](./development/architecture-patterns.md)** - 認証アーキテクチャ

## 利用対象

### 開発者
- **新規開発者**: webcommonsパターンの学習とプロジェクト参加
- **経験豊富な開発者**: ベストプラクティスの確認と知識共有
- **アーキテクト**: システム設計時の参考資料

### プロジェクトチーム
- **プロジェクト管理者**: 開発効率化とコードベース品質向上
- **テックリード**: チーム内でのパターン統一と知識共有
- **品質管理者**: コードレビューと品質基準策定

## 重要な原則

### 🎯 汎用性重視
- すべてのサンプルコードは「Resource」など汎用的な名前を使用
- 実際のプロジェクトでは適切な名前に置き換えて使用

### 📚 継続的改善
- 実際の開発経験に基づくパターン更新
- プロジェクト間での知見共有と蓄積

### 🤝 Claude Code協働
- Claude Codeとの効率的な協働を前提とした設計
- セッション継続性と情報共有の重視

## 貢献・更新

このドキュメント群は以下の場合に更新されます：

1. **新しいパターンの発見**: 実際の開発で有効なパターンが見つかった場合
2. **技術スタックの更新**: 使用技術の変更やアップデート
3. **Claude Code機能拡張**: Claude Codeの新機能に対応した手順追加
4. **フィードバック反映**: 実際の使用者からの改善提案

### 🔄 **自動知見統合システム**

**重要**: プロジェクト開発中に発見された汎用的な知見は、自動的にwebcommons/common-docsに統合されます。

**Claude Codeへの指示**:
- 開発中に他プロジェクトでも使える技術的知見を発見した場合
- 汎用的なベストプラクティスや問題解決パターンを見つけた場合
- → **自動的にcommon-docs/の適切な場所に追加・更新してください**

**対象となる知見**:
- 技術的な問題と解決策（例: Tailwind v4移行、Webpack最適化）
- 開発パターンとベストプラクティス
- ライブラリ・フレームワークの使用方法
- Claude Codeとの協働で発見された効率的手法

この仕組みにより、プロジェクト間での知見共有が自動化され、開発効率が継続的に向上します。

---

**開始方法**: 新規プロジェクトの場合は [claude-guidance/project-setup-guide.md](./claude-guidance/project-setup-guide.md) から始めてください。