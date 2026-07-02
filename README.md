# TaskFlow AI

## アプリ概要

TaskFlow AI は、チームでプロジェクト、タスク、コメントを管理できる Web アプリです。

現在はバックエンド MVP を優先して開発しており、Rails API による認証、チーム管理、プロジェクト管理、タスク管理、コメント、担当タスク一覧、カンバン用 API まで実装済みです。フロントエンドはバックエンド MVP 完成後に React SPA として実装する予定です。

## 技術スタック

### Backend

- Ruby on Rails API
- PostgreSQL
- devise
- devise-jwt
- dotenv-rails
- RSpec
- FactoryBot
- Faker
- RuboCop
- Brakeman

### Frontend

今後実装予定です。

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios

## ディレクトリ構成

```text
.
├── AGENTS.md
├── README.md
├── docs
│   ├── requirements.md
│   ├── database_design.md
│   ├── api_design.md
│   ├── implementation_plan.md
│   └── frontend_design.md
└── backend
    └── Rails API application
```

## 実装済み機能

- devise-jwt による JWT 認証
- ユーザー登録
- ログイン
- ログアウト
- ログインユーザー取得
- チーム作成、一覧、詳細、更新、削除
- チームメンバー一覧、追加、権限変更、削除
- プロジェクト作成、一覧、詳細、更新、削除
- タスク作成、一覧、詳細、更新、削除
- タスクの担当者、ステータス、優先度、期限管理
- コメント一覧、作成
- 自分の担当タスク一覧 API
- カンバン API
- 共通エラーレスポンス
- RSpec による model / request spec
- RuboCop による静的解析
- Brakeman によるセキュリティチェック

## 主要モデル

- User
- Team
- TeamMember
- Project
- Task
- Comment

## 認証方式

認証は devise-jwt を使った Bearer Token 方式です。セッション Cookie 認証は使用しません。

認証が必要な API では、以下の形式で JWT を送信します。

```text
Authorization: Bearer <JWT>
```

ユーザー登録とログイン時は、JWT を `Authorization` レスポンスヘッダーと JSON body の `token` の両方で返します。

ログアウト時はログインユーザーの `jti` を更新し、既存 JWT を失効させます。JWT 秘密鍵は `TASKFLOW_AI_JWT_SECRET_KEY` 環境変数から読み込みます。

## セキュリティ・認可方針

- 認証が必要な API では必ず `authenticate_user!` を使用する
- `current_user` を基準にデータ取得と認可を行う
- Team / Project / Task / Comment は、ログインユーザーが所属する Team 経由で取得する
- 他チームのリソースは存在していても `404 Not Found` を返す
- 所属チーム内で role 権限が不足する場合は `403 Forbidden` を返す
- 未ログイン、JWT なし、JWT 不正の場合は `401 Unauthorized` を返す
- バリデーションエラーは `422 Unprocessable Entity` を返す
- Strong Parameters で許可した属性のみ受け取る
- `created_by_id` や `user_id` をクライアントから信用せず、サーバー側で `current_user` を設定する
- Task の assignee は対象 Project の Team に所属している User のみに限定する
- パスワード、`encrypted_password`、`jti` などの秘密情報は API レスポンスに含めない
- DB 側にも NOT NULL、外部キー、unique index、CHECK 制約を設定する

## TeamMember role

TeamMember の role は以下の 3 種類です。

| role | 概要 |
| --- | --- |
| owner | チーム削除、メンバー管理、role 変更ができる最上位権限 |
| admin | メンバー追加と、Project / Task / Comment 管理ができる |
| member | Team / Project / Task の閲覧、Task 管理、Comment 作成ができる |

role 変更は owner のみ可能です。owner 自身の role 変更、owner への変更、owner の削除はできません。

## API一覧

ベースパスは `/api/v1` です。

### 認証 API

| Method | Path | 説明 |
| --- | --- | --- |
| POST | `/api/v1/auth/sign_up` | ユーザー登録 |
| POST | `/api/v1/auth/sign_in` | ログイン |
| DELETE | `/api/v1/auth/sign_out` | ログアウト |
| GET | `/api/v1/auth/me` | ログインユーザー取得 |

### Team API

| Method | Path | 説明 |
| --- | --- | --- |
| GET | `/api/v1/teams` | 所属チーム一覧 |
| POST | `/api/v1/teams` | チーム作成 |
| GET | `/api/v1/teams/:id` | チーム詳細 |
| PATCH | `/api/v1/teams/:id` | チーム更新 |
| DELETE | `/api/v1/teams/:id` | チーム削除 |

### TeamMember API

| Method | Path | 説明 |
| --- | --- | --- |
| GET | `/api/v1/teams/:team_id/members` | メンバー一覧 |
| POST | `/api/v1/teams/:team_id/members` | メンバー追加 |
| PATCH | `/api/v1/teams/:team_id/members/:id` | メンバー権限変更 |
| DELETE | `/api/v1/teams/:team_id/members/:id` | メンバー削除 |

MVP では招待メールは実装せず、登録済みユーザーを email で検索して追加します。

### Project API

| Method | Path | 説明 |
| --- | --- | --- |
| GET | `/api/v1/teams/:team_id/projects` | プロジェクト一覧 |
| POST | `/api/v1/teams/:team_id/projects` | プロジェクト作成 |
| GET | `/api/v1/projects/:id` | プロジェクト詳細 |
| PATCH | `/api/v1/projects/:id` | プロジェクト更新 |
| DELETE | `/api/v1/projects/:id` | プロジェクト削除 |

### Task API

| Method | Path | 説明 |
| --- | --- | --- |
| GET | `/api/v1/projects/:project_id/tasks` | タスク一覧 |
| POST | `/api/v1/projects/:project_id/tasks` | タスク作成 |
| GET | `/api/v1/tasks/:id` | タスク詳細 |
| PATCH | `/api/v1/tasks/:id` | タスク更新 |
| DELETE | `/api/v1/tasks/:id` | タスク削除 |

Task の `status` は `todo`、`in_progress`、`review`、`done` です。`priority` は `low`、`medium`、`high` です。

Task レスポンスの `assignee` / `created_by` は `id` と `name` のみに限定します。

### Comment API

| Method | Path | 説明 |
| --- | --- | --- |
| GET | `/api/v1/tasks/:task_id/comments` | コメント一覧 |
| POST | `/api/v1/tasks/:task_id/comments` | コメント作成 |

MVP では Comment 編集 API と削除 API は実装していません。

### My Tasks API

| Method | Path | 説明 |
| --- | --- | --- |
| GET | `/api/v1/my/tasks` | 自分の担当タスク一覧 |

`status`、`priority`、`due_on_from`、`due_on_to` で絞り込みできます。

### Kanban API

| Method | Path | 説明 |
| --- | --- | --- |
| GET | `/api/v1/projects/:project_id/kanban` | Project 内の Task をステータス別に取得 |

`todo`、`in_progress`、`review`、`done` の各カラムを必ず返します。

## 共通エラーレスポンス

エラー時は以下の形式に統一します。

```json
{
  "error": {
    "code": "validation_error",
    "message": "入力内容に誤りがあります",
    "details": ["Title can't be blank"]
  }
}
```

主なステータスコードは以下です。

| Status | 用途 |
| --- | --- |
| 400 | 必須パラメータ不足など |
| 401 | 未ログイン、JWT なし、JWT 不正 |
| 403 | 所属チーム内で role 権限が不足 |
| 404 | 存在しない、またはアクセスできない他チームのリソース |
| 422 | バリデーションエラー |

## セットアップ手順

### 1. リポジトリへ移動

```powershell
cd D:/RubyProjects/teamtaskapp/backend
```

### 2. Gem をインストール

```powershell
bundle install
```

### 3. 環境変数を設定

development / test 環境では `dotenv-rails` により `backend/.env` が自動で読み込まれます。

`backend/.env.example` をコピーして `backend/.env` を作成し、ローカル環境の値を設定してください。

```env
TASKFLOW_AI_DATABASE_USERNAME=postgres
TASKFLOW_AI_DATABASE_PASSWORD=your_password_here
TASKFLOW_AI_DATABASE_HOST=localhost
TASKFLOW_AI_JWT_SECRET_KEY=your_jwt_secret_key_here
```

`.env` は秘密情報を含むため Git 管理対象にしません。本番環境では `.env` に依存せず、実行環境の環境変数を使用します。

PowerShell で一時的に設定する場合は以下です。

```powershell
$env:TASKFLOW_AI_DATABASE_USERNAME="postgres"
$env:TASKFLOW_AI_DATABASE_PASSWORD="自分のPostgreSQLパスワード"
$env:TASKFLOW_AI_DATABASE_HOST="localhost"
$env:TASKFLOW_AI_JWT_SECRET_KEY="任意の長いランダム文字列"
```

### 4. DB 作成とマイグレーション

```powershell
ruby bin\rails db:create
ruby bin\rails db:migrate
```

test DB も準備する場合は以下です。

```powershell
ruby bin\rails db:create RAILS_ENV=test
ruby bin\rails db:migrate RAILS_ENV=test
```

### 5. Rails サーバー起動

```powershell
ruby bin\rails server
```

デフォルトでは以下で起動します。

```text
http://localhost:3000
```

ヘルスチェック:

```text
GET /up
```

## テスト・品質チェック

RSpec:

```powershell
bundle exec rspec
```

RuboCop:

```powershell
bundle exec rubocop
```

Brakeman:

```powershell
bundle exec brakeman
```

バックエンド修正後は、基本的に以下をすべて実行します。

```powershell
bundle exec rspec
bundle exec rubocop
bundle exec brakeman
```

## 設計ドキュメント

- [要件定義](docs/requirements.md)
- [データベース設計](docs/database_design.md)
- [API 設計](docs/api_design.md)
- [実装計画](docs/implementation_plan.md)
- [フロントエンド設計](docs/frontend_design.md)

## 今後の実装予定

### Frontend

バックエンド MVP 完成後に React SPA を実装します。

- React + TypeScript + Vite
- Tailwind CSS
- Axios による API 通信
- JWT を使った認証状態管理
- Team / Project / Task / Comment 管理画面
- カンバン UI
- 自分の担当タスク一覧画面

### AI Features

MVP 完成後に以下の AI 機能を検討します。

- タスク説明からサブタスクを自動生成
- チーム全体の進捗要約
- 今日やるべきタスクの提案
- 期限切れ、遅延リスクのあるタスクの抽出
- コメント履歴の要約
- プロジェクトの進行状況レポート生成
