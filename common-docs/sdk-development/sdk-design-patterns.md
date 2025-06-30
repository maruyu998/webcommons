# SDK設計パターン

## 概要

効果的なSDKを設計するための基本原則とアーキテクチャパターンについて説明します。

## 基本設計原則

### 1. 型安全性の最優先
- すべてのAPI応答と要求に対してTypeScript型定義を提供
- ランタイムバリデーションによる早期エラー検出
- 開発者エクスペリエンスの向上

### 2. 独立性とポータビリティ
- 外部依存関係の最小化
- maruyu-webcommonsライブラリから独立したSDK
- 任意のNode.js/ブラウザ環境で動作

### 3. 一貫性のあるAPI設計
- 全リソースで共通のメソッド命名規則
- 予測可能なエラーハンドリング
- 統一されたレスポンス形式

## アーキテクチャパターン

### リソース指向アーキテクチャ

```typescript
// メインクライアント
class APIClient {
  public readonly resource1: Resource1API;
  public readonly resource2: Resource2API;
  public readonly resource3: Resource3API;
}

// リソース別クライアント
class Resource1API {
  async list(query?: ListQuery): Promise<ListResponse>
  async get(id: string): Promise<ItemResponse>
  async create(data: CreateRequest): Promise<MutationResponse>
  async update(data: UpdateRequest): Promise<MutationResponse>
  async delete(id: string): Promise<DeleteResponse>
}
```

### 階層化アーキテクチャ

```
┌─────────────────────────────┐
│ Client Layer                │ ← メインクライアント
├─────────────────────────────┤
│ Resource Layer              │ ← リソース別API
├─────────────────────────────┤
│ HTTP Layer                  │ ← HTTP通信
├─────────────────────────────┤
│ Serialization Layer        │ ← データ変換
├─────────────────────────────┤
│ Validation Layer            │ ← 型検証
└─────────────────────────────┘
```

## エラーハンドリング戦略

### 階層化エラークラス

```typescript
// 基底エラークラス
class SDKError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'SDKError';
  }
}

// 特定エラータイプ
class ValidationError extends SDKError
class AuthenticationError extends SDKError
class NotFoundError extends SDKError
```

### リトライ機構

- ネットワークエラー: 自動リトライ（指数バックオフ）
- 4xxエラー: リトライなし（クライアントエラー）
- 5xxエラー: 制限付きリトライ（サーバーエラー）

## 設定管理パターン

### 設定の階層化

```typescript
interface SDKConfig {
  baseURL: string;      // 必須
  apiKey: string;       // 必須
  timeout?: number;     // デフォルト: 10秒
  retries?: number;     // デフォルト: 3回
  userAgent?: string;   // デフォルト: 自動生成
}
```

### 設定の検証

- 必須パラメータのチェック
- URL形式の検証
- 数値範囲の検証

## パフォーマンス最適化

### HTTPクライアント最適化

- Keep-Alive接続の活用
- 適切なタイムアウト設定
- 効率的なリトライロジック

### バンドルサイズ最適化

- Tree-shakingに対応した構造
- 必要最小限の依存関係
- コード分割によるオンデマンドロード

## 開発者エクスペリエンス

### TypeScript統合

- 完全な型推論
- IDEでの自動補完
- コンパイル時エラー検出

### エラーメッセージ

- 明確で実行可能なエラーメッセージ
- 問題解決のためのヒント
- 適切なコンテキスト情報

### ドキュメント

- TypeDocによる自動生成
- 実用的な使用例
- トラブルシューティングガイド

## セキュリティ考慮事項

### 認証情報の管理

- APIキーの安全な保存
- 環境変数での設定推奨
- ログ出力での秘匿情報除外

### 入力検証

- クライアント側での事前検証
- SQLインジェクション対策
- XSS攻撃対策

### 通信セキュリティ

- HTTPS必須
- 適切なタイムアウト設定
- セキュアなUser-Agent