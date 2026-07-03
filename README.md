# TaskFlow AI

## アプリ概要

TaskFlow AI は、チームでプロジェクト、タスク、コメントを管理できる Web アプリです。

Rails API と React SPA で構成され、現在は MVP として認証、Team、Project、Task、Comment、Kanban、自分のタスク一覧の主要機能を実装済みです。将来的には、タスクの自動分解、進捗要約、今日やるべきタスクの提案などの AI 機能を追加する予定です。

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

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router
- oxlint

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
├── backend
│   └── Rails API application
└── frontend
    └── React SPA application
```

## 実装済み機能

### Backend API

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
- 自分が作成したタスク一覧 API
- カンバン API
- 共通エラーレスポンス
- RSpec による model / request spec
- RuboCop による静的解析
- Brakeman によるセキュリティチェック

### Frontend

- ログイン、ユーザー登録、ログアウト、認証状態の復元
- 認証済み画面用の共通レイアウト
- ダッシュボード
- チーム一覧、チーム作成
- チーム詳細、メンバー一覧、メンバー追加、プロジェクト一覧、プロジェクト作成
- 所属チーム横断のプロジェクト一覧
- プロジェクト詳細
- カンバン列からのタスク作成
- カンバン表示
- TaskCard クリックによるタスク詳細表示
- タスク編集
- ステータス、優先度、期限、担当者の更新
- コメント一覧、コメント作成
- 作成したタスク画面
- 作成したタスクの status / priority / due_on_from / due_on_to 絞り込み
- ローディング、エラー、空状態、送信中状態
- API レスポンスの非同期競合対策

## 後回しにしている主な項目

- チーム更新、削除 UI
- チームメンバー権限変更、削除 UI
- プロジェクト更新、削除 UI
- タスク削除 UI
- コメント編集、削除
- カンバンのドラッグアンドドロップ
- 通知、横断検索、アクティビティ履歴
- AI 機能

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

ユーザー登録とログイン時は、JWT を `Authorization` レスポンスヘッダーと JSON body の `token` の両方で返します。フロントエンドでは token を保存し、Axios の共通クライアントから Authorization ヘッダーに付与します。

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

## API 一覧

ベースパスは `/api/v1` です。

| 領域 | Method / Path | 説明 |
| --- | --- | --- |
| Auth | `POST /api/v1/auth/sign_up` | ユーザー登録 |
| Auth | `POST /api/v1/auth/sign_in` | ログイン |
| Auth | `DELETE /api/v1/auth/sign_out` | ログアウト |
| Auth | `GET /api/v1/auth/me` | ログインユーザー取得 |
| Team | `GET /api/v1/teams` | 所属チーム一覧 |
| Team | `POST /api/v1/teams` | チーム作成 |
| Team | `GET /api/v1/teams/:id` | チーム詳細 |
| Team | `PATCH /api/v1/teams/:id` | チーム更新 |
| Team | `DELETE /api/v1/teams/:id` | チーム削除 |
| TeamMember | `GET /api/v1/teams/:team_id/members` | メンバー一覧 |
| TeamMember | `POST /api/v1/teams/:team_id/members` | メンバー追加 |
| TeamMember | `PATCH /api/v1/teams/:team_id/members/:id` | メンバー権限変更 |
| TeamMember | `DELETE /api/v1/teams/:team_id/members/:id` | メンバー削除 |
| Project | `GET /api/v1/teams/:team_id/projects` | プロジェクト一覧 |
| Project | `POST /api/v1/teams/:team_id/projects` | プロジェクト作成 |
| Project | `GET /api/v1/projects/:id` | プロジェクト詳細 |
| Project | `PATCH /api/v1/projects/:id` | プロジェクト更新 |
| Project | `DELETE /api/v1/projects/:id` | プロジェクト削除 |
| Task | `GET /api/v1/projects/:project_id/tasks` | タスク一覧 |
| Task | `POST /api/v1/projects/:project_id/tasks` | タスク作成 |
| Task | `GET /api/v1/tasks/:id` | タスク詳細 |
| Task | `PATCH /api/v1/tasks/:id` | タスク更新 |
| Task | `DELETE /api/v1/tasks/:id` | タスク削除 |
| Comment | `GET /api/v1/tasks/:task_id/comments` | コメント一覧 |
| Comment | `POST /api/v1/tasks/:task_id/comments` | コメント作成 |
| My | `GET /api/v1/my/tasks` | 自分の担当タスク一覧 |
| My | `GET /api/v1/my/created_tasks` | 自分が作成したタスク一覧 |
| Kanban | `GET /api/v1/projects/:project_id/kanban` | Project 内の Task をステータス別に取得 |

Task の `status` は `todo`、`in_progress`、`review`、`done` です。`priority` は `low`、`medium`、`high` です。

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

### Backend

```powershell
cd D:/RubyProjects/teamtaskapp/backend
bundle install
```

development / test 環境では `dotenv-rails` により `backend/.env` が自動で読み込まれます。

`backend/.env.example` をコピーして `backend/.env` を作成し、ローカル環境の値を設定してください。

```env
TASKFLOW_AI_DATABASE_USERNAME=postgres
TASKFLOW_AI_DATABASE_PASSWORD=your_password_here
TASKFLOW_AI_DATABASE_HOST=localhost
TASKFLOW_AI_JWT_SECRET_KEY=your_jwt_secret_key_here
```

DB を作成し、マイグレーションを実行します。

```powershell
ruby bin\rails db:create
ruby bin\rails db:migrate
```

test DB も準備する場合は以下です。

```powershell
ruby bin\rails db:create RAILS_ENV=test
ruby bin\rails db:migrate RAILS_ENV=test
```

Rails サーバーを起動します。

```powershell
ruby bin\rails server
```

デフォルトでは `http://localhost:3000` で起動します。

### Frontend

```powershell
cd D:/RubyProjects/teamtaskapp/frontend
npm install
```

フロントエンド開発サーバーを起動します。

```powershell
npm.cmd run dev
```

Vite のデフォルトでは `http://localhost:5173` で起動します。API クライアントは Rails API の `/api/v1` を呼び出します。

## 確認コマンド

### Backend

```powershell
cd D:/RubyProjects/teamtaskapp/backend
bundle exec rspec
bundle exec rubocop
bundle exec brakeman
```

### Frontend

```powershell
cd D:/RubyProjects/teamtaskapp/frontend
npm.cmd run build
npm.cmd run lint
```

## 設計ドキュメント

- [要件定義](docs/requirements.md)
- [データベース設計](docs/database_design.md)
- [API 設計](docs/api_design.md)
- [実装計画](docs/implementation_plan.md)
- [フロントエンド設計](docs/frontend_design.md)

## 今後の実装予定

- 未実装 UI の補完
- カンバンのドラッグアンドドロップ
- コメント編集、削除
- 通知、検索、アクティビティ履歴
- AI 機能
