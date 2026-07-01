# TaskFlow AI

TaskFlow AI は、チームでプロジェクトやタスクを管理できる Web アプリです。

まずはバックエンド MVP を優先して開発します。UI 設計とフロントエンド実装は、バックエンドの主要機能が完成してから着手します。

## 現在の状態

このリポジトリはバックエンド Rails API アプリの初期生成段階です。`backend` ディレクトリに Rails API モードのアプリを作成済みです。

## MVP の範囲

MVP では、チーム単位でプロジェクトとタスクを管理できるバックエンド API を構築します。

主な機能は以下です。

- ユーザー登録
- ログイン
- ログアウト
- ログインユーザー取得
- チーム作成
- チーム一覧表示
- チーム詳細表示
- チームメンバー管理
- プロジェクト作成
- プロジェクト一覧表示
- プロジェクト詳細表示
- タスク作成
- タスク一覧表示
- タスク詳細表示
- タスク編集
- タスク削除
- タスクの担当者設定
- タスクのステータス管理
- タスクの優先度設定
- タスクの期限設定
- コメント作成
- コメント一覧表示
- カンバン表示
- 自分の担当タスク一覧

## 主要モデル

- User
- Team
- TeamMember
- Project
- Task
- Comment

## 重視する品質

TaskFlow AI では、以下を特に重視します。

- 認証
- 認可
- 他チームのデータにアクセスできないこと
- Strong Parameters
- before_action
- private メソッドによる整理
- DB 制約
- バリデーション
- RSpec
- RuboCop
- Brakeman
- 保守しやすいコード

## ドキュメント

- [要件定義](docs/requirements.md)
- [データベース設計](docs/database_design.md)
- [API 設計](docs/api_design.md)
- [実装計画](docs/implementation_plan.md)

## 開発方針

1. 設計ドキュメントを整備する
2. Rails アプリを作成する
3. 認証基盤を実装する
4. チーム単位の認可とデータ分離を実装する
5. プロジェクト、タスク、コメントの API を実装する
6. RSpec、RuboCop、Brakeman による品質確認を行う
7. バックエンド MVP 完成後に UI 設計とフロントエンド実装を開始する

## 実装前の注意

現時点では Rails API アプリの初期生成まで完了しています。Gem の追加、モデル・コントローラ・マイグレーションの作成、認証実装、API 実装はまだ行いません。

## ローカルDB設定

development / test 環境では `dotenv-rails` により `backend/.env` が自動で読み込まれます。`backend/.env.example` を参考に、ローカルの PostgreSQL 接続情報を `backend/.env` に設定してください。

```env
TASKFLOW_AI_DATABASE_USERNAME=postgres
TASKFLOW_AI_DATABASE_PASSWORD=自分のPostgreSQLパスワード
TASKFLOW_AI_DATABASE_HOST=localhost
```

PowerShell で一時的に環境変数を設定して実行することもできます。

```powershell
$env:TASKFLOW_AI_DATABASE_USERNAME="postgres"
$env:TASKFLOW_AI_DATABASE_PASSWORD="自分のPostgreSQLパスワード"
$env:TASKFLOW_AI_DATABASE_HOST="localhost"

cd D:/RubyProjects/teamtaskapp/backend
ruby bin\rails db:create
```

設定値のひな形は `backend/.env.example` を参照してください。実際の秘密情報を入れる `.env` は Git 管理対象にしません。本番環境では `.env` に依存せず、実行環境の環境変数で設定します。
