# Mongoose モデル定義パターン

`server/src/mongoose/` でのMongoDBモデル定義における標準的なパターンと作法を説明します。

## 基本構造

### ファイル構成

```
server/src/mongoose/
├── Resource.ts        # メインリソース（適切な名前に変更）
├── Category.ts        # カテゴリ情報
├── Tag.ts            # タグ情報
└── RelationData.ts   # 関連データ
```

### 基本パターン

```typescript
// server/src/mongoose/Resource.ts（適切な名前に変更）
import mongoose from 'mongoose';
import { ResourceIdType, ResourceNameType, ResourceStatusList, ResourceStatusType } from '@share/types/resource';
import { UserIdType } from 'maruyu-webcommons/commons';

// 1. MongoDB専用の型定義
export type ResourceMongoType = {
  resourceId: ResourceIdType,
  resourceName: ResourceNameType,
  description?: string,
  userId: UserIdType,
  status: ResourceStatusType,
  category?: string,
  tags?: string[],
  createdTime: Date,
  updatedTime: Date
}

// 2. Mongoose モデル定義
export const ResourceModel = mongoose.model<ResourceMongoType>('resource',
  new mongoose.Schema<ResourceMongoType>({
    resourceId: {
      type: String,
      required: true,
      unique: true
    },
    resourceName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
    },
    userId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ResourceStatusList,
      required: true,
      default: "active"
    },
    category: {
      type: String
    },
    tags: [{
      type: String
    }]
  }, { 
    timestamps: {
      createdAt: 'createdTime',
      updatedAt: 'updatedTime'
    }
  })
)
```

## 効率的なクエリパターン

### .lean() と .exec() の使用指針

**基本原則:**
```typescript
// 読み取り専用操作 → .lean() を使用
const resource = await ResourceModel.findOne({resourceId}).lean().exec();

// Mongoose document機能が必要 → .lean() 使用しない
const resource = await ResourceModel.findOne({resourceId}).exec();

// すべてのクエリ → .exec() で明示的Promise化
```

**使用パターン:**

1. **存在チェックのみ**
```typescript
// ✅ 推奨: lean()でオーバーヘッド削減
const exists = await ResourceModel.findOne({resourceId}).lean().exec();
if (!exists) throw new Error('Resource not found');
```

2. **読み取り専用データ取得**
```typescript
// ✅ 推奨: APIレスポンス用データ
const resources = await ResourceModel.find(query).lean().exec();
return { resources };
```

3. **Mongoose機能が必要な場合**
```typescript
// ✅ 推奨: save(), populate() 等を使用
const resource = await ResourceModel.findOne({resourceId}).exec();
resource.status = 'updated';
await resource.save();
```

**パフォーマンス考慮:**
- `.lean()`: Mongooseドキュメントオーバーヘッド回避
- 大量データ取得時は特に効果的
- 単純な存在チェックでもメモリ使用量削減

**一貫性のためのルール:**
1. 読み取り専用操作: `.lean()` を使用
2. Mongoose document機能が必要: `.lean()` を使用しない
3. すべてのクエリ: `.exec()` を使用してPromiseを明示的に返す

## 命名規約

### 型とモデル名

- **型名**: `{対象}MongoType`
- **モデル名**: `{対象}Model`
- **コレクション名**: 小文字単数形 (例: `'resource'`, `'user'`)

### フィールド命名

- MongoDB固有フィールドとビジネスロジック上の名前を区別
- 関連エンティティは `{対象}Id` 形式 (例: `userId`, `categoryId`)

## 型定義パターン

### 共有型の活用

```typescript
// 共有型から必要な型をインポート
import { 
  ResourceIdType, 
  ResourceNameType, 
  ResourceStatusType,
  ResourceStatusList 
} from '@share/types/resource';

// MongoDB固有の構造に合わせて型定義
export type ResourceMongoType = {
  // 共有型を使用
  resourceId: ResourceIdType,
  resourceName: ResourceNameType,
  
  // MongoDB固有のフィールド
  userId: UserIdType,           // 正規化された関連
  categoryId?: string,           // オプショナルな関連
  
  // タイムスタンプ
  createdTime: Date,
  updatedTime: Date
}
```

### 関連データの表現

```typescript
// 1対多の関係 - 参照による正規化
export type ResourceMongoType = {
  userId: UserIdType,  // User への参照
  categoryId?: string,  // Category への参照
  // ...
}

// 埋め込みドキュメントパターン
export type TaskMongoType = {
  resourceId: ResourceIdType,
  userId: UserIdType,
  taskData: {
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high',
    dueDate?: Date
  },
  // ...
}
```

## スキーマ定義パターン

### 基本フィールド定義

```typescript
new mongoose.Schema<ResourceMongoType>({
  // 必須・ユニーク
  resourceId: {
    type: String,
    required: true,
    unique: true
  },
  
  // 必須・制約付き
  resourceName: {
    type: String,
    required: true,
    trim: true,         // 前後空白除去
    maxlength: 100      // 最大長制限
  },
  
  // 列挙型
  status: {
    type: String,
    enum: ResourceStatusList,
    required: true,
    default: "active"
  },
  
  // オプショナル
  category: {
    type: String
    // required: false (デフォルト)
  },
  
  // 配列
  tags: [{
    type: String,
    maxlength: 50
  }],
  
  // 埋め込みオブジェクト
  metadata: {
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }
})
```

### インデックス定義

```typescript
new mongoose.Schema<ResourceMongoType>({
  // ...フィールド定義
}, {
  // タイムスタンプ自動管理
  timestamps: {
    createdAt: 'createdTime',
    updatedAt: 'updatedTime'
  },
  
  // インデックス定義
  indexes: [
    { userId: 1 },                        // 単一フィールド
    { status: 1, createdTime: -1 },        // 複合インデックス
    { resourceName: "text" }               // テキストインデックス
  ]
})
```

## 特殊なパターン

### TTL (Time To Live) インデックス

一定時間後に自動削除されるドキュメント用：

```typescript
// server/src/mongoose/Session.ts
export const SessionModel = mongoose.model<SessionMongoType>('session',
  new mongoose.Schema<SessionMongoType>({
    sessionId: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0  // TTLインデックス設定
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    }
    // ...
  })
)
```

### 仮想フィールド

計算プロパティやポピュレーション用：

```typescript
const ResourceSchema = new mongoose.Schema<ResourceMongoType>({
  // ...フィールド定義
});

// 仮想フィールド定義
ResourceSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// ポピュレーション用仮想フィールド
ResourceSchema.virtual('owner', {
  ref: 'user',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});
```

## バリデーション

### カスタムバリデーター

```typescript
new mongoose.Schema<ResourceMongoType>({
  resourceName: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return v.length >= 3;  // 最小長チェック
      },
      message: 'Resource name must be at least 3 characters'
    }
  },
  
  email: {
    type: String,
    validate: {
      validator: async function(v: string) {
        // 非同期バリデーション（重複チェック等）
        const existing = await ResourceModel.findOne({ 
          email: v, 
          _id: { $ne: this._id } 
        });
        return !existing;
      },
      message: 'Email already exists'
    }
  }
})
```

## 使用例

### モデルの基本操作

```typescript
// server/src/services/resources.ts
import { ResourceModel, ResourceMongoType } from '@server/mongoose/Resource';

// 作成
export async function createResource(data: CreateResourceData): Promise<ResourceType> {
  const mongoDoc = new ResourceModel({
    resourceId: generateResourceId(),
    resourceName: data.resourceName,
    description: data.description,
    userId: data.userId,
    status: 'active'
  });
  
  const saved = await mongoDoc.save();
  return convertToResourceType(saved);
}

// 検索
export async function findResourcesByOwner(userId: UserIdType): Promise<ResourceType[]> {
  const docs = await ResourceModel.find({ userId }).sort({ createdTime: -1 });
  return docs.map(convertToResourceType);
}

// 更新
export async function updateResource(resourceId: ResourceIdType, updates: Partial<ResourceMongoType>): Promise<ResourceType | null> {
  const updated = await ResourceModel.findOneAndUpdate(
    { resourceId },
    { $set: updates, updatedTime: new Date() },
    { new: true }
  );
  return updated ? convertToResourceType(updated) : null;
}
```

### 型変換パターン

```typescript
// MongoDB型 → ビジネス型への変換
function convertToResourceType(doc: ResourceMongoType): ResourceType {
  return {
    resourceId: doc.resourceId,
    resourceName: doc.resourceName,
    description: doc.description,
    user: {
      userId: doc.userId,
      userName: "..." // 必要に応じてポピュレート
    },
    status: doc.status,
    category: doc.category,
    tags: doc.tags || [],
    createdTime: doc.createdTime,
    updatedTime: doc.updatedTime
  };
}
```

## セキュリティ考慮事項


### インジェクション対策

```typescript
// クエリパラメータの適切な型付け
export async function findResource(resourceId: ResourceIdType): Promise<ResourceMongoType | null> {
  // ResourceIdType により型安全性確保
  return await ResourceModel.findOne({ resourceId });
}
```

この規約に従うことで、型安全で保守性の高いデータベース操作が可能になります。