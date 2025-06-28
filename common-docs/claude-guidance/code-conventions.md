# Claude Code 向けコーディング規約

Claude Code との協働を効率化するためのコーディング規約とコメント作法を説明します。

## Import順序ガイドライン

### 基本ルール

Importは以下の順序で記述し、各グループ間に空行を入れる：

1. **Node.js組み込みモジュール**
   ```typescript
   import crypto from 'crypto';
   import path from 'path';
   ```

2. **外部パッケージ（npm）**
   ```typescript
   import express from 'express';
   import { z } from 'zod';
   ```

3. **内部共有モジュール（@share）**
   ```typescript
   import { UserIdType } from '@share/types/user';
   import { ResourceStatusType } from '@share/types/resource';
   ```

4. **内部共通ユーティリティ（webcommons）**
   ```typescript
   import env from 'maruyu-webcommons/node/env';
   import { saveSession } from 'maruyu-webcommons/node/express';
   ```

5. **プロジェクト内部モジュール（相対パス）**
   ```typescript
   import { ResourceModel } from '../mongoose/Resource';
   import { resourceService } from './resourceService';
   ```

### 同一グループ内の順序
- アルファベット順を基本とする
- デフォルトエクスポートを先に、名前付きエクスポートを後に
- 同じパッケージからの複数importは1行にまとめる

### 良い例
```typescript
// Node.js組み込み
import crypto from 'crypto';
import path from 'path';

// 外部パッケージ
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

// 内部共有モジュール
import { ResourceIdType, ResourceNameType } from '@share/types/resource';
import { UserIdType } from '@share/types/user';

// webcommons
import env, { parseDuration } from 'maruyu-webcommons/node/env';
import { asyncHandler, sendError } from 'maruyu-webcommons/node/express';

// プロジェクト内部
import { ResourceModel } from '../mongoose/Resource';
import { UserModel } from '../mongoose/User';
```

### 特殊ケース

**dotenv**: `import 'dotenv/config';` は最初に記述（副作用のあるimport）

**CSS/静的ファイル**: クライアントサイドでCSSなどをimportする場合は、最後のグループに配置

## 基本原則

### 1. 自己文書化コード
Claude Codeが理解しやすいよう、コード自体が説明になるように記述：

```typescript
// 良い例: 関数名と引数で動作が理解できる
export async function createUserWithEmailVerification(
  userData: CreateUserData
): Promise<UserWithVerificationStatus> {
  // 実装
}

// 悪い例: 動作が不明確
export async function process(data: any): Promise<any> {
  // 実装
}
```

### 2. 型安全性の徹底
すべての関数・変数に明示的な型定義：

```typescript
// 良い例: 明確な型定義
interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: Date;
  assigneeId: UserIdType;
}

export async function createTask(
  request: CreateTaskRequest
): Promise<TaskType> {
  // 実装
}

// 悪い例: any型の使用
export async function createTask(request: any): Promise<any> {
  // 実装
}
```

## ファイル・ディレクトリ構造規約

### 1. 明確な命名規則

**ファイル命名:**
- API ハンドラー: `{動詞}{対象}.ts` (例: `createUser.ts`, `fetchTasks.ts`)
- 型定義: `{対象}.ts` (例: `user.ts`, `task.ts`)
- サービス: `{対象}Service.ts` (例: `userService.ts`)

**ディレクトリ命名:**
- 機能別: `users/`, `tasks/`, `auth/`
- 層別: `api/`, `services/`, `models/`

### 2. ファイル内構造

**標準的なファイル構造:**
```typescript
// 1. 外部ライブラリのインポート
import express from 'express';
import { z } from 'zod';

// 2. 内部モジュールのインポート（パスエイリアス使用）
import { UserModel } from '@server/mongoose/User';
import { CreateUserBodySchema } from '@share/protocol/users';

// 3. 型定義
export interface CreateUserServiceData {
  email: string;
  password: string;
}

// 4. メイン実装
export async function createUser(
  data: CreateUserServiceData
): Promise<UserType> {
  // 実装
}

// 5. ヘルパー関数（必要に応じて）
function validateUserData(data: CreateUserServiceData): boolean {
  // 実装
}
```

## コメント作法

### 1. 戦略的コメント
**目的・理由を説明するコメント:**

```typescript
// OAuth 2.0 PKCE フローのため、code_verifier をセッションに保存
// セキュリティ上、ブラウザには送信しない
req.session.codeVerifier = generateCodeVerifier();

// レート制限: 同一IPから1分間に5回まで
const rateLimitKey = `auth_attempt_${req.ip}`;
```

### 2. 設計決定の記録
**アーキテクチャ上の決定を記録:**

```typescript
/**
 * User型とUserMongoType を分離する理由:
 * - フロントエンド向けには機密情報を除外
 * - MongoDB固有のフィールド（ObjectId等）を隠蔽
 * - API仕様の安定性を確保
 */
export function convertToUserType(doc: UserMongoType): UserType {
  // 実装
}
```

### 3. TODO・FIXME の活用
**将来の改善点を明記:**

```typescript
// TODO: バッチ処理での効率化を検討
// FIXME: 同時実行時の競合状態を解決
// SECURITY: パスワード強度チェックを強化
```

## API設計規約

### 1. RESTful 設計

**一貫したエンドポイント設計:**
```typescript
// 良い例: RESTfulなパターン
GET    /api/users          // 一覧取得
GET    /api/users/:id      // 詳細取得
POST   /api/users          // 新規作成
PUT    /api/users/:id      // 更新
DELETE /api/users/:id      // 削除

// 悪い例: 不一致なパターン
GET    /api/getUserList
POST   /api/createNewUser
PUT    /api/modifyUser/:id
```

### 2. エラーハンドリング

**統一されたエラー形式:**
```typescript
// webcommons の標準エラー形式を使用
import { sendError } from 'maruyu-webcommons/node';

export const createUser = asyncHandler(async (req, res) => {
  try {
    const validatedData = CreateUserBodySchema.parse(req.body);
    const user = await userService.createUser(validatedData);
    sendData(res, user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 'validation_error', 'Invalid input data', error.errors);
    }
    throw error; // 予期しないエラーは上位でキャッチ
  }
});
```

## データベース規約

### 1. Mongoose モデル

**一貫したモデル定義:**
```typescript
// 型定義と MongoDB モデルの分離
export type UserMongoType = {
  userId: UserIdType;
  email: string;
  passwordHash: string;
  createdTime: Date;
  updatedTime: Date;
}

// スキーマ定義での制約明記
export const UserModel = mongoose.model<UserMongoType>('user',
  new mongoose.Schema<UserMongoType>({
    userId: {
      type: String,
      required: true,
      unique: true,
      immutable: true  // 作成後変更不可
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,  // 自動で小文字に変換
      trim: true        // 前後空白除去
    }
    // ...
  }, {
    timestamps: {
      createdAt: 'createdTime',
      updatedAt: 'updatedTime'
    }
  })
);
```

### 2. クエリ最適化

**効率的なクエリパターン:**
```typescript
// 良い例: 必要なフィールドのみ取得
export async function findUserBasicInfo(userId: UserIdType): Promise<UserBasicInfo> {
  return await UserModel
    .findOne({ userId })
    .select('userId email displayName')  // 必要なフィールドのみ
    .lean();  // Mongoose オブジェクトではなくプレーンオブジェクト
}

// インデックスを活用したクエリ
export async function findActiveUsersByRole(role: UserRole): Promise<UserType[]> {
  return await UserModel
    .find({ 
      status: 'active',  // インデックス対象
      role: role 
    })
    .sort({ createdTime: -1 })
    .limit(100);
}
```

## テスト規約

### 1. テストファイル構造

**テストの命名と構造:**
```typescript
// __tests__/userService.test.ts
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange: テストデータ準備
      const userData = {
        email: 'test@example.com',
        password: 'validPassword123'
      };

      // Act: 実際の処理実行
      const result = await userService.createUser(userData);

      // Assert: 結果の検証
      expect(result.email).toBe(userData.email);
      expect(result.userId).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      // エラーケースのテスト
      const userData = {
        email: 'invalid-email',
        password: 'validPassword123'
      };

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

### 2. モック・スタブの使用

**外部依存の分離:**
```typescript
// メール送信などの外部サービスをモック
jest.mock('@server/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true)
}));

describe('User Registration', () => {
  it('should send verification email after user creation', async () => {
    const userData = { email: 'test@example.com', password: 'password' };
    
    await userService.createUser(userData);
    
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String)
    );
  });
});
```

## セキュリティ規約

### 1. 機密情報の取り扱い

**ログ出力での注意事項:**
```typescript
// 良い例: 機密情報を除外
console.log('User login attempt', { 
  userId: user.userId, 
  timestamp: new Date().toISOString() 
});

// 悪い例: パスワードなどの機密情報を含む
console.log('User data', user); // user.passwordHash が含まれる可能性
```

### 2. 入力値検証

**Zod スキーマでの厳密な検証:**
```typescript
export const CreateUserBodySchema = z.object({
  email: z.string()
    .email('Valid email address required')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must not exceed 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and number')
});
```

これらの規約に従うことで、Claude Code との協働効率が大幅に向上し、保守性の高いコードベースを構築できます。