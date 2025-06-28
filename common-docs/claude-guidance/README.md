# Claude Code 開発ガイド

Claude Code (claude.ai/code) を使用した効率的な開発ワークフローとベストプラクティスを説明します。

## ドキュメント一覧

### セッション管理
- **[session-continuity.md](./session-continuity.md)** - 記憶術システムによるセッション継続とコンテキスト保持

### タスク・プロジェクト管理
- **[task-management-system.md](./task-management-system.md)** - user-requests.mdを使用した効率的な指示・進捗管理システム
- **[workflow-patterns.md](./workflow-patterns.md)** - タスク管理、コードレビュー、デバッグパターン
- **[project-setup-guide.md](./project-setup-guide.md)** - 新規プロジェクトでのClaude Code活用方法

### 開発規約・ドキュメント
- **[code-conventions.md](./code-conventions.md)** - Claude Code向けコーディング規約とImport順序
- **[documentation-patterns.md](./documentation-patterns.md)** - プロジェクトドキュメント管理とセッション記録パターン

## 対象読者

### プロジェクト開始時
- 新しいプロジェクトでClaude Codeを効果的に活用したい開発者
- セッション管理とコンテキスト保持の仕組みを理解したい開発者

### 継続開発時
- 複数セッションにわたる開発タスクを効率的に管理したい開発者
- Claude Codeとの協働でコード品質を向上させたい開発者

## 使用場面

### 新規プロジェクト立ち上げ
1. `project-setup-guide.md` で初期設定を実施
2. `session-continuity.md` でドキュメント構造を構築

### 日常的な開発作業
1. `task-management-system.md` でタスク管理システムを活用
2. `workflow-patterns.md` で効率的な作業手順を確認
3. `code-conventions.md` でコード品質を維持

### セッション切り替え時
1. `session-continuity.md` の記憶術システムを活用
2. 前回の作業内容を確実に継続

## 重要な原則

1. **コンテキスト保持**: セッション間での情報継続性を重視
2. **段階的改善**: 小さな改善を積み重ねる開発スタイル
3. **文書化習慣**: 決定事項と変更理由の明確な記録
4. **協働効率**: Claude Codeとの効果的な協働パターン

## 関連リソース

- [webcommons 開発ガイド](../development/) - 技術的な開発パターン
- [テンプレート集](../templates/) - プロジェクト初期設定用テンプレート