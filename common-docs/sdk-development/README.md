# SDK Development Guide

このディレクトリでは、maruyu-webcommonsベースのAPIからSDKを作成するための包括的なガイドを提供しています。

## 目次

1. [SDK設計パターン](./sdk-design-patterns.md) - SDK設計の基本原則とアーキテクチャパターン
2. [プロジェクト構造](./project-structure.md) - SDKディレクトリ構造と設定ファイル
3. [型定義システム](./type-definitions.md) - TypeScript型定義の設計と管理
4. [APIクライアント実装](./api-client-implementation.md) - HTTPクライアントとリソースクライアントの実装
5. [シリアライゼーション](./serialization.md) - maruyu-webcommons互換のパケット形式対応
6. [ビルドとパッケージング](./build-and-packaging.md) - esbuildを使用したビルド設定
7. [配布と公開](./distribution.md) - npmレジストリへの公開手順
8. [テストとデバッグ](./testing-and-debugging.md) - SDK品質保証のベストプラクティス

## 概要

このガイドでは、maruyu-webcommonsライブラリを使用するAPIからスタンドアローンなSDKを作成する方法を解説します。作成されるSDKは：

- **型安全性**: TypeScriptによる完全な型定義
- **独立性**: maruyu-webcommonsに依存しない独立したパッケージ
- **互換性**: maruyu-webcommonsのパケット形式と完全互換
- **柔軟性**: CommonJS/ESMの両方に対応
- **拡張性**: リソース単位でのモジュラー設計

## クイックスタート

1. [プロジェクト構造](./project-structure.md)を参考にディレクトリを作成
2. [型定義システム](./type-definitions.md)に従って型を定義
3. [APIクライアント実装](./api-client-implementation.md)でクライアントを実装
4. [ビルドとパッケージング](./build-and-packaging.md)でビルド設定を構成
5. [配布と公開](./distribution.md)でパッケージを公開

各セクションは独立して読めるよう設計されており、必要な部分から始めることができます。