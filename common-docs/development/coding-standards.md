# Coding Standards

## ES Modules 使用原則

**重要**: このプロジェクトでは一貫してES Modules形式を使用します。CommonJS形式（require/module.exports）は使用しないでください。

### ✅ 正しい ES Modules 記法

```typescript
// ✅ Good - ES Modules
import express from 'express';
import * as path from 'path';
import { someFunction } from './utils';

export default function myFunction() {
  // implementation
}

export const myConstant = 'value';
```

```typescript
// ✅ Good - Config files
import type { Config } from 'tailwindcss';

const config: Config = {
  // configuration
};

export default config;
```

### ❌ 避けるべき CommonJS 記法

```javascript
// ❌ Bad - CommonJS (使用禁止)
const express = require('express');
const path = require('path');

module.exports = {
  // configuration
};
```

### 設定ファイルでの注意事項

- **tailwind.config.ts**: ES Modules形式で記述
- **postcss.config.ts**: ES Modules形式で記述  
- **webpack.config.ts**: ES Modules形式で記述
- **TypeScript設定**: すべてES Modules対応

### 理由

1. **一貫性**: プロジェクト全体でモジュール形式を統一
2. **型安全性**: TypeScriptとの親和性
3. **モダン**: ES2015+標準に準拠
4. **ツール対応**: 最新のビルドツールとの互換性

この原則は必ず守ってください。