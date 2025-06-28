# OAuth ライブラリ（webcommons/node/utils/oauth）

このドキュメントは、webcommons/node/utils/oauth.tsで提供されるOAuth 2.0クライアントライブラリの使用方法とセキュリティ機能について説明します。

## 概要

このライブラリは、OAuth 2.0認証サーバーとの連携を簡単に実装するためのユーティリティです。PKCE（Proof Key for Code Exchange）やセッション管理などのセキュリティ機能を含んでいます。

## 主要機能

### 1. OAuth 2.0認証フロー
- 認証エンドポイントへのリダイレクト
- 認証コードの交換とトークン取得
- アクセストークンの自動リフレッシュ

### 2. セキュリティ機能
- **PKCE（Proof Key for Code Exchange）**: 認証コード横取り攻撃を防止
- **State パラメータ**: CSRF攻撃を防ぐためのランダムな状態値
- **セッション管理**: 安全なセッションデータの保存と再生成

### 3. ユーザー情報管理
- アクセストークンを使用したユーザー情報の取得
- ユーザー情報のキャッシュ機能

## 使用方法

### 環境変数の設定

```env
CLIENT_ID=your_oauth_client_id
CLIENT_SECRET=your_oauth_client_secret
OAUTH_DOMAIN=https://your-oauth-server.com
SERVICE_DOMAIN=https://your-app.com
OAUTH_CALLBACK_PATH=/oauth/callback
OAUTH_TOKEN_PATH=/oauth/token
OAUTH_AUTHORIZE_PATH=/oauth/authorize
OAUTH_USER_INFO_PATH=/api/user
USER_INFO_KEEP_DURATION=1h
AUTH_SESSION_KEEP_DURATION=10m
```

### 基本的な使用例

```typescript
import { redirectIfNotSignedIn, processCallbackThenRedirect, signout } from 'maruyu-webcommons/node/utils/oauth';

// 認証が必要なルートを保護
app.use('/protected', redirectIfNotSignedIn);

// OAuth コールバックの処理
app.get('/oauth/callback', processCallbackThenRedirect);

// サインアウト
app.post('/oauth/signout', signout);
```

### ユーザー情報の取得

```typescript
import { getUserInfo } from 'maruyu-webcommons/node/utils/oauth';

app.get('/api/me', async (req, res) => {
  try {
    const userInfo = await getUserInfo(req);
    res.json(userInfo);
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});
```

## セキュリティ考慮事項

### 1. PKCE（Proof Key for Code Exchange）
- 認証フロー開始時にcode_verifierとcode_challengeを生成
- 認証コード交換時にcode_verifierで検証
- 認証コード横取り攻撃を防止

### 2. State パラメータ
- 各認証リクエストに一意のランダムな値を設定
- CSRF攻撃を防ぐ
- セッションに保存し、コールバック時に検証

### 3. セッション管理
- 認証情報は暗号化されたセッションに保存
- トークン取得後にセッションIDを再生成
- サインアウト時にセッションデータを適切にクリア

### 4. トークン管理
- アクセストークンの有効期限を自動チェック
- 期限切れ時に自動でリフレッシュトークンを使用
- リフレッシュ失敗時は再認証を要求

## API リファレンス

### ミドルウェア

#### `redirectIfNotSignedIn(req, res, next)`
認証が必要なルートを保護します。未認証の場合、OAuth認証画面にリダイレクトします。

#### `addCors(req, res, next)`
OAuth認証サーバーとの通信に必要なCORSヘッダーを設定します。

### エンドポイント関数

#### `redirectToSignin(req, res)`
OAuth認証エンドポイントにリダイレクトします。

#### `processCallbackThenRedirect(req, res)`
OAuth認証コールバックを処理し、トークンを取得後に元のページにリダイレクトします。

#### `signout(req, res)`
セッションからトークンとユーザー情報をクリアします。

#### `refreshUserInfo(req, res)`
ユーザー情報を強制的に再取得します。

### ユーティリティ関数

#### `getUserInfo(req, willReload?)`
現在のユーザー情報を取得します。キャッシュされた情報があればそれを返し、期限切れまたは強制リロード時は再取得します。

#### `getData(req, reload?)`
ユーザーの追加データを取得します。

## 注意事項

1. このライブラリはExpressセッションに依存しています
2. OAuth認証サーバーがPKCEをサポートしている必要があります
3. セッションストレージは本番環境では永続化ストレージ（Redis等）を使用してください
4. HTTPS環境での使用を強く推奨します