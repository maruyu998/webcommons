# TailwindCSS v4 統合ガイド

## webcommonsとTailwindCSS v4の統合

webcommonsコンポーネント（特にtoast）をTailwindCSS v4プロジェクトで使用する際の重要な設定方法。

### 必須設定

#### 1. CSS内での@configディレクティブ

**重要**: TailwindCSS v4では、webcommonsのような外部ディレクトリのクラスを検出するために、CSS内で明示的に設定ファイルを指定する必要があります。

```css
/* client/src/global.css */
@import "tailwindcss";
@config "../tailwind.config.ts";
```

#### 2. tailwind.config.tsでのcontent設定

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "../webcommons/react/**/*.{js,ts,jsx,tsx}",  // webcommonsを明示的に指定
    "../node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
    "../node_modules/@material-tailwind/react/**/*.{js,ts,jsx,tsx}",
  ],
  // ... その他の設定
};

export default config;
```

#### 3. PostCSS設定

```typescript
/* postcss.config.ts */
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
  ],
}
```

### 動作確認

正しく設定されている場合：

1. **CSSファイルサイズが増加**: ビルド後のCSSにwebcommonsのクラスが含まれる
2. **toastの色が正常表示**: `bg-blue-50`, `bg-green-50`, `bg-red-50`, `bg-amber-50`, `bg-slate-50`などのクラスが適用される
3. **ボーダー色も適用**: `border-blue-200`, `border-green-200`などが正常に機能

### トラブルシューティング

#### 問題: toastの背景が白い、文字が黒い

**原因**: TailwindCSS v4がwebcommonsディレクトリを認識していない

**解決策**:
1. `@config "../tailwind.config.ts";`をCSS内に追加
2. `tailwind.config.ts`のcontentにwebcommonsパスを追加
3. キャッシュクリアしてリビルド

#### 問題: 一部のスタイルのみ適用されない

**原因**: 動的クラス名の検出問題

**確認方法**:
```bash
# ビルド後のCSSで必要なクラスが含まれているか確認
grep -E "bg-(blue|green|red|amber|slate)-50" build/public/*.css
```

### 重要な注意点

1. **ES Modules形式を維持**: webcommonsは常にES Modules形式で記述すること
2. **@configは相対パス**: CSS内の@configディレクティブは相対パスで指定
3. **ビルドキャッシュ**: 設定変更後はWebpackキャッシュを削除することを推奨

### 対応バージョン

- TailwindCSS: v4.x
- @tailwindcss/postcss: 最新版
- webpack: 5.x
- PostCSS: 8.x

この設定により、webcommonsコンポーネントとTailwindCSS v4の完全な統合が可能になります。