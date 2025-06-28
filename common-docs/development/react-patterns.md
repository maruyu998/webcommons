# React フロントエンド開発パターン

webcommons を使用したReactアプリケーション開発における標準的なパターンとベストプラクティスを説明します。

## プロジェクト構造

### 基本的なディレクトリ構造

```
client/
├── public/                 # 静的ファイル
├── src/
│   ├── components/         # 再利用可能なコンポーネント
│   │   ├── common/         # 汎用コンポーネント
│   │   ├── forms/          # フォーム関連
│   │   └── layout/         # レイアウト関連
│   ├── pages/              # ページコンポーネント
│   │   ├── auth/           # 認証関連ページ
│   │   ├── dashboard/      # ダッシュボード
│   │   └── settings/       # 設定ページ
│   ├── contexts/           # Context API
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/              # カスタムフック
│   │   ├── useAuth.ts
│   │   └── useApi.ts
│   ├── data/               # API クライアント関数
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   └── index.ts
│   ├── types/              # フロントエンド固有の型
│   │   ├── api.ts
│   │   └── ui.ts
│   ├── utils/              # ユーティリティ関数
│   │   ├── validation.ts
│   │   └── formatting.ts
│   ├── styles/             # スタイル定義
│   │   ├── globals.css
│   │   └── components.css
│   ├── App.tsx
│   ├── index.tsx           # エントリーポイント（auth実使用）
│   └── react-app-env.d.ts  # React型定義（auth実使用）
├── package.json
├── tsconfig.json
├── webpack.config.ts       # Webpack設定（auth実使用）
└── tailwind.config.ts      # Tailwind設定（auth実使用）
```

## コンポーネント設計パターン

### 1. 基本コンポーネント構造

```typescript
// components/common/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onClick,
  children 
}: ButtonProps) {
  const baseClasses = 'rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

### 2. フォームコンポーネントパターン

```typescript
// components/forms/ResourceForm.tsx（auth実装パターン）
import { FormEvent } from 'react';
import { CreateResourceBodyType } from '@share/protocol/resources';
import { ResourceNameInputRegex } from '@share/validations/resource'; // 適切な検証パターン

interface ResourceFormProps {
  onSubmit: (data: CreateResourceBodyType) => Promise<void>;
  loading?: boolean;
}

export function ResourceForm({ onSubmit, loading }: ResourceFormProps) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data: CreateResourceBodyType = {
      resourceName: formData.get('resourceName') as string,
      description: formData.get('description') as string || undefined,
    };
    
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="resourceName" className="block text-sm font-medium text-gray-700">
          Resource Name
        </label>
        <input
          id="resourceName"
          name="resourceName"
          type="text"
          required
          pattern={ResourceNameInputRegex.source}
          title="Please enter a valid resource name"
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        loading={loading}
      >
        Submit
      </Button>
    </form>
  );
}
```

### 3. レイアウトコンポーネント

```typescript
// components/layout/PageLayout.tsx
interface PageLayoutProps {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageLayout({ title, actions, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {actions && <div className="flex space-x-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
```

## 状態管理パターン

### 1. Context API パターン

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { UserType } from '@share/types/user';

interface AuthState {
  user: UserType | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: UserType }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' };

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
} | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { user: action.payload, loading: false, error: null };
    case 'LOGIN_ERROR':
      return { user: null, loading: false, error: action.payload };
    case 'LOGOUT':
      return { user: null, loading: false, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: false,
    error: null
  });

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOADING' });
    try {
      const user = await authApi.login({ email, password });
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
    }
  };

  const logout = () => {
    authApi.logout();
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 2. カスタムフックパターン

```typescript
// hooks/useApi.ts
import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// 使用例
export function useResources() {
  const { data: resources, loading, error, execute, reset } = useApi<ResourceType[]>();

  const fetchResources = useCallback(() => {
    return execute(() => resourcesApi.fetchResources());
  }, [execute]);

  const createResource = useCallback(async (data: CreateResourceBodyType) => {
    await resourcesApi.createResource(data);
    // リストを再取得
    await fetchResources();
  }, [fetchResources]);

  return {
    resources,
    loading,
    error,
    fetchResources,
    createResource,
    reset
  };
}
```

## APIクライアント設計

### 1. 統一的なAPIクライアント

```typescript
// data/index.ts
import { getPacket, postPacket, putPacket, deletePacket } from 'maruyu-webcommons/commons/utils/fetch';
import { z } from 'zod';

// webcommons fetch ユーティリティを使用（auth実装例）

// 基本的なAPI通信関数
export async function fetchData<T>(endpoint: string, responseSchema: z.ZodSchema<T>): Promise<T> {
  const url = new URL(endpoint, location.origin);
  return await getPacket({ url, responseSchema })
    .catch(error => {
      console.error(error);
      throw error;
    });
}

export async function postData<TBody, TResponse>(
  endpoint: string, 
  bodyData: TBody, 
  bodySchema: z.ZodSchema<TBody>,
  responseSchema: z.ZodSchema<TResponse>
): Promise<TResponse> {
  const url = new URL(endpoint, location.origin);
  return await postPacket({ url, bodyData, bodySchema, responseSchema })
    .catch(error => {
      console.error(error);
      throw error;
    });
}
```

### 2. APIクライアント関数

```typescript
// data/resources.ts（適切な名前に変更）
import { getPacket, postPacket, putPacket, deletePacket } from 'maruyu-webcommons/commons/utils/fetch';
import { 
  FetchResourcesResponseType, FetchResourcesResponseSchema,
  CreateResourceBodyType, CreateResourceBodySchema,
  CreateResourceResponseType, CreateResourceResponseSchema,
  UpdateResourceBodyType, UpdateResourceBodySchema,
  UpdateResourceResponseType, UpdateResourceResponseSchema,
  DeleteResourceResponseType, DeleteResourceResponseSchema
} from '@share/protocol/resources';
import { ResourceIdType } from '@share/types/resource';

// 一覧取得
export async function fetchResources(): Promise<FetchResourcesResponseType> {
  const url = new URL('/sec/resources', location.origin);
  const responseSchema = FetchResourcesResponseSchema;
  return await getPacket({ url, responseSchema })
    .catch(error => {
      console.error(error);
      throw error;
    });
}

// 作成
export async function createResource(bodyData: CreateResourceBodyType): Promise<CreateResourceResponseType> {
  const url = new URL('/sec/resources', location.origin);
  const bodySchema = CreateResourceBodySchema;
  const responseSchema = CreateResourceResponseSchema;
  return await postPacket({ url, bodyData, bodySchema, responseSchema })
    .catch(error => {
      console.error(error);
      throw error;
    });
}

// 更新
export async function updateResource(resourceId: ResourceIdType, bodyData: UpdateResourceBodyType): Promise<UpdateResourceResponseType> {
  const url = new URL(`/sec/resources/${resourceId}`, location.origin);
  const bodySchema = UpdateResourceBodySchema;
  const responseSchema = UpdateResourceResponseSchema;
  return await putPacket({ url, bodyData, bodySchema, responseSchema })
    .catch(error => {
      console.error(error);
      throw error;
    });
}

// 削除
export async function deleteResource(resourceId: ResourceIdType): Promise<DeleteResourceResponseType> {
  const url = new URL(`/sec/resources/${resourceId}`, location.origin);
  const responseSchema = DeleteResourceResponseSchema;
  return await deletePacket({ url, responseSchema })
    .catch(error => {
      console.error(error);
      throw error;
    });
}
```

## ページコンポーネントパターン

### 1. リストページ

```typescript
// pages/resources/ResourceListPage.tsx（適切な名前に変更）
import { useEffect } from 'react';
import { useResources } from '@client/hooks/useResources';
import { PageLayout } from '@client/components/layout/PageLayout';
import { Button } from '@client/components/common/Button';

export function ResourceListPage() {
  const { resources, loading, error, fetchResources } = useResources();

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <PageLayout
      title="Resources"
      actions={
        <Button onClick={() => navigate('/resources/new')}>
          Add Resource
        </Button>
      }
    >
      <div className="grid gap-4">
        {resources?.map(resource => (
          <div key={resource.resourceId} className="p-4 border rounded">
            <h3 className="font-medium">{resource.resourceName}</h3>
            <p className="text-gray-600">{resource.description}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
```

### 2. フォームページ

```typescript
// pages/resources/CreateResourcePage.tsx（適切な名前に変更）
import { useNavigate } from 'react-router-dom';
import { useResources } from '@client/hooks/useResources';
import { PageLayout } from '@client/components/layout/PageLayout';
import { ResourceForm } from '@client/components/forms/ResourceForm';
import { CreateResourceBodyType } from '@share/protocol/resources';

export function CreateResourcePage() {
  const navigate = useNavigate();
  const { createResource, loading } = useResources();

  const handleSubmit = async (data: CreateResourceBodyType) => {
    await createResource(data);
    navigate('/resources');
  };

  return (
    <PageLayout title="Create Resource">
      <div className="max-w-md mx-auto">
        <ResourceForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </PageLayout>
  );
}
```

## ルーティングパターン

### 1. React Router設定

```typescript
// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@client/contexts/AuthContext';
import { LoginPage } from '@client/pages/auth/LoginPage';
import { ResourceListPage } from '@client/pages/resources/ResourceListPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  
  if (state.loading) return <div>Loading...</div>;
  if (!state.user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/resources" element={
            <ProtectedRoute>
              <ResourceListPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/resources" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

## スタイリングパターン

### 1. Tailwind CSS 設定

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
```

### 2. Tailwind CSS v4 移行時の注意点

**境界線の明示的な色指定**
```typescript
// ❌ v4では予想より濃い境界線になる
className="border"

// ✅ 明示的に色を指定する
className="border border-gray-200"
```

**CSS設定の変更**
```css
/* global.css */
@import "tailwindcss";  /* ✅ 正しい構文 */
/* @use "tailwindcss";     ❌ 構文エラー発生 */
```

**移行手順**
1. CDNリンクを削除
2. ローカルビルド設定に変更
3. 全ての`border`クラスに色を追加
4. プロダクションビルドでのCSS最適化確認

### 3. コンポーネントベーススタイリング

```typescript
// utils/styles.ts
export const buttonVariants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-500 hover:bg-red-600 text-white'
};

export const inputStyles = 'mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500';

// 境界線スタイル（v4対応）
export const borderStyles = {
  default: 'border border-gray-200',
  focus: 'border border-gray-300 focus:border-primary-500',
  error: 'border border-red-300 focus:border-red-500'
};
```

## テストパターン

### 1. コンポーネントテスト

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@client/components/common/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Loading...');
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 2. フックテスト

```typescript
// __tests__/hooks/useApi.test.ts
import { renderHook, act } from '@testing-library/react';
import { useApi } from '@client/hooks/useApi';

describe('useApi', () => {
  it('handles successful API call', async () => {
    const { result } = renderHook(() => useApi<string>());
    
    const mockApiCall = jest.fn().mockResolvedValue('success');
    
    await act(async () => {
      await result.current.execute(mockApiCall);
    });
    
    expect(result.current.data).toBe('success');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
```

これらのパターンに従うことで、保守性と拡張性の高いReactアプリケーションを構築できます。