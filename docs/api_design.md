# TaskFlow AI API 設計

## 基本方針

MVP ではバックエンド API を優先して実装します。UI とフロントエンドは、主要 API が完成してから設計します。

API は Rails での実装を想定し、認証、認可、Strong Parameters、before_action による整理を重視します。

Rails は API モードで構築し、DB は PostgreSQL を使用します。フロントエンドはバックエンド MVP 完成後に React SPA として実装します。

## 共通仕様

### ベースパス

```text
/api/v1
```

### 形式

- リクエスト: JSON
- レスポンス: JSON
- 認証: devise-jwt による Bearer Token 認証
- 認証ヘッダー: `Authorization: Bearer <JWT>`
- セッション Cookie 認証は使用しない
- 認証が必要な API では Authorization ヘッダーの JWT を検証し、current_user を基準にデータ取得と認可を行う
- React SPA で扱いやすいように、認証成功時の JWT は `Authorization` レスポンスヘッダーに加えて JSON body の `token` にも含める
- devise-jwt は JWT 検証基盤として使用し、MVP ではアプリ側で手動発行した JWT を返す
- ログアウト時はログインユーザーの `jti` を更新し、既存 JWT を失効させる

### 共通レスポンス

成功時はリソースごとの JSON を返します。

エラー時は以下の形式を基本とします。

```json
{
  "error": {
    "code": "unauthorized",
    "message": "ログインしてください"
  }
}
```

認可エラーは以下の形式を基本とします。

```json
{
  "error": {
    "code": "forbidden",
    "message": "この操作を行う権限がありません"
  }
}
```

Not Found は以下の形式を基本とします。

```json
{
  "error": {
    "code": "not_found",
    "message": "リソースが見つかりません"
  }
}
```

バリデーションエラーは以下の形式を基本とします。

```json
{
  "error": {
    "code": "validation_error",
    "message": "入力内容に誤りがあります",
    "details": ["Email has already been taken"]
  }
}
```

必須パラメータ不足は以下の形式を基本とします。

```json
{
  "error": {
    "code": "parameter_missing",
    "message": "必要なパラメータが不足しています"
  }
}
```

### 主な HTTP ステータス

| ステータス | 用途 |
| --- | --- |
| 200 | 取得・更新成功 |
| 201 | 作成成功 |
| 204 | 削除・ログアウト成功 |
| 400 | 不正なリクエスト |
| 401 | 未ログイン、JWT なし、JWT 不正 |
| 403 | 所属チーム内のリソースに対して role 権限が足りない |
| 404 | 存在しないリソース、またはログインユーザーが所属していない他チームのリソース |
| 422 | バリデーションエラー |

## before_action 方針

認証が必要なコントローラでは、以下のような before_action を使います。

```ruby
before_action :authenticate_user!
before_action :set_team
before_action :authorize_team_member!
before_action :set_project
before_action :set_task
```

親リソースを先に取得し、子リソースは親リソースからスコープして取得します。

```ruby
@team = current_user.teams.find(params[:team_id] || params[:id])
@project = Project.joins(:team).merge(current_user.teams).find(params[:project_id])
@task = Task.joins(project: :team).merge(current_user.teams).find(params[:task_id] || params[:id])
```

### ルーティング・パラメータ方針

- チーム単体の詳細・更新・削除は `/api/v1/teams/:id` を使用する
- チーム配下のリソースでは親 ID として `:team_id` を使用する
- プロジェクト配下のタスクでは `:project_id` を使用する
- タスク配下のコメントでは `:task_id` を使用する
- 他チームのリソースは current_user の所属チームからスコープして取得し、見つからない場合は 404 を返す

## Strong Parameters 方針

コントローラごとに private メソッドとして許可パラメータを定義します。

例:

```ruby
def task_params
  params.require(:task).permit(
    :title,
    :description,
    :status,
    :priority,
    :due_on,
    :assignee_id
  )
end
```

## 認証 API

### ユーザー登録

```text
POST /api/v1/auth/sign_up
```

リクエスト:

```json
{
  "user": {
    "name": "Yamada Taro",
    "email": "taro@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }
}
```

レスポンス:

Authorization レスポンスヘッダーと JSON body の `token` で JWT を返します。

```text
Authorization: Bearer <JWT>
```

```json
{
  "user": {
    "id": 1,
    "name": "Yamada Taro",
    "email": "taro@example.com"
  },
  "token": "<JWT>"
}
```

### ログイン

```text
POST /api/v1/auth/sign_in
```

リクエスト:

```json
{
  "user": {
    "email": "taro@example.com",
    "password": "password123"
  }
}
```

レスポンス:

Authorization レスポンスヘッダーと JSON body の `token` で JWT を返します。

```text
Authorization: Bearer <JWT>
```

```json
{
  "user": {
    "id": 1,
    "name": "Yamada Taro",
    "email": "taro@example.com"
  },
  "token": "<JWT>"
}
```

### ログアウト

```text
DELETE /api/v1/auth/sign_out
```

Authorization ヘッダー:

```text
Authorization: Bearer <JWT>
```

レスポンス:

```text
204 No Content
```

MVP では logout 時にログインユーザーの `jti` を更新し、ログアウト済み JWT を無効化する方針とします。

### ログインユーザー取得

```text
GET /api/v1/auth/me
```

レスポンス:

```json
{
  "user": {
    "id": 1,
    "name": "Yamada Taro",
    "email": "taro@example.com"
  }
}
```

## チーム API

### チーム作成

```text
POST /api/v1/teams
```

リクエスト:

```json
{
  "team": {
    "name": "Product Team",
    "description": "TaskFlow AI development team"
  }
}
```

レスポンス:

```json
{
  "team": {
    "id": 1,
    "name": "Product Team",
    "description": "TaskFlow AI development team",
    "current_user_role": "owner"
  }
}
```

### チーム一覧

```text
GET /api/v1/teams
```

レスポンス:

```json
{
  "teams": [
    {
      "id": 1,
      "name": "Product Team",
      "description": "TaskFlow AI development team",
      "current_user_role": "owner"
    }
  ]
}
```

### チーム詳細

```text
GET /api/v1/teams/:id
```

レスポンス:

```json
{
  "team": {
    "id": 1,
    "name": "Product Team",
    "description": "TaskFlow AI development team",
    "current_user_role": "owner"
  }
}
```

### チーム更新

```text
PATCH /api/v1/teams/:id
```

owner のみ実行できます。

リクエスト:

```json
{
  "team": {
    "name": "Product Platform Team",
    "description": "TaskFlow AI backend and platform team"
  }
}
```

### チーム削除

```text
DELETE /api/v1/teams/:id
```

owner のみ実行できます。

レスポンス:

```text
204 No Content
```

## チームメンバー API

### メンバー一覧

```text
GET /api/v1/teams/:team_id/members
```

レスポンス:

```json
{
  "members": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "name": "Yamada Taro",
        "email": "taro@example.com"
      },
      "role": "owner",
      "joined_at": "2026-07-01T00:00:00Z"
    }
  ]
}
```

### メンバー追加

```text
POST /api/v1/teams/:team_id/members
```

owner または admin のみ実行できます。

リクエスト:

```json
{
  "member": {
    "email": "hanako@example.com",
    "role": "member"
  }
}
```

レスポンス:

```json
{
  "member": {
    "id": 2,
    "user": {
      "id": 2,
      "name": "Sato Hanako",
      "email": "hanako@example.com"
    },
    "role": "member"
  }
}
```

### メンバー権限変更

```text
PATCH /api/v1/teams/:team_id/members/:id
```

owner のみ実行できます。admin は owner の削除、owner の降格、owner への変更はできません。

リクエスト:

```json
{
  "member": {
    "role": "admin"
  }
}
```

### メンバー削除

```text
DELETE /api/v1/teams/:team_id/members/:id
```

owner または admin のみ実行できます。ただし admin は owner を削除できません。削除されたメンバーが担当していた対象チーム内のタスクは削除せず、assignee_id を null にします。

レスポンス:

```text
204 No Content
```

## プロジェクト API

### プロジェクト作成

```text
POST /api/v1/teams/:team_id/projects
```

リクエスト:

```json
{
  "project": {
    "name": "MVP Backend",
    "description": "Build backend MVP"
  }
}
```

### プロジェクト一覧

```text
GET /api/v1/teams/:team_id/projects
```

レスポンス:

```json
{
  "projects": [
    {
      "id": 1,
      "team_id": 1,
      "name": "MVP Backend",
      "description": "Build backend MVP",
      "status": "active"
    }
  ]
}
```

### プロジェクト詳細

```text
GET /api/v1/projects/:id
```

レスポンス:

```json
{
  "project": {
    "id": 1,
    "team_id": 1,
    "name": "MVP Backend",
    "description": "Build backend MVP",
    "status": "active"
  }
}
```

### プロジェクト更新

```text
PATCH /api/v1/projects/:id
```

リクエスト:

```json
{
  "project": {
    "name": "MVP Backend Phase 2",
    "description": "Build backend MVP and prepare task APIs",
    "status": "archived"
  }
}
```

### プロジェクト削除

```text
DELETE /api/v1/projects/:id
```

レスポンス:

```text
204 No Content
```

## タスク API

### タスク作成

```text
POST /api/v1/projects/:project_id/tasks
```

リクエスト:

```json
{
  "task": {
    "title": "Create authentication API",
    "description": "Implement signup, login, logout, and me endpoint",
    "status": "todo",
    "priority": "high",
    "due_on": "2026-07-15",
    "assignee_id": 2
  }
}
```

### タスク一覧

```text
GET /api/v1/projects/:project_id/tasks
```

クエリパラメータ:

| パラメータ | 説明 |
| --- | --- |
| status | ステータスで絞り込み |
| priority | 優先度で絞り込み |
| assignee_id | 担当者で絞り込み |
| due_on_from | 期限の開始日 |
| due_on_to | 期限の終了日 |

レスポンス:

```json
{
  "tasks": [
    {
      "id": 1,
      "project_id": 1,
      "title": "Create authentication API",
      "description": "Implement signup, login, logout, and me endpoint",
      "status": "todo",
      "priority": "high",
      "due_on": "2026-07-15",
      "assignee": {
        "id": 2,
        "name": "Sato Hanako"
      }
    }
  ]
}
```

### タスク詳細

```text
GET /api/v1/tasks/:id
```

### タスク編集

```text
PATCH /api/v1/tasks/:id
```

リクエスト:

```json
{
  "task": {
    "title": "Create session authentication API",
    "status": "in_progress",
    "priority": "high",
    "due_on": "2026-07-10",
    "assignee_id": 2
  }
}
```

### タスク削除

```text
DELETE /api/v1/tasks/:id
```

Task 削除時は、紐づく Comment も削除します。Rails 実装では `dependent: :destroy` を使用します。

レスポンス:

```text
204 No Content
```

## コメント API

### コメント作成

```text
POST /api/v1/tasks/:task_id/comments
```

リクエスト:

```json
{
  "comment": {
    "body": "Authentication API is ready for review."
  }
}
```

### コメント一覧

```text
GET /api/v1/tasks/:task_id/comments
```

レスポンス:

```json
{
  "comments": [
    {
      "id": 1,
      "body": "Authentication API is ready for review.",
      "user": {
        "id": 1,
        "name": "Yamada Taro"
      },
      "created_at": "2026-07-01T00:00:00Z"
    }
  ]
}
```

## カンバン API

### カンバン表示

```text
GET /api/v1/projects/:project_id/kanban
```

レスポンス:

```json
{
  "kanban": {
    "todo": [],
    "in_progress": [],
    "review": [],
    "done": []
  }
}
```

## 自分の担当タスク API

### 自分の担当タスク一覧

```text
GET /api/v1/my/tasks
```

クエリパラメータ:

| パラメータ | 説明 |
| --- | --- |
| team_id | チームで絞り込み |
| project_id | プロジェクトで絞り込み |
| status | ステータスで絞り込み |
| priority | 優先度で絞り込み |
| due_on_to | 指定日までの期限で絞り込み |

レスポンス:

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Create authentication API",
      "status": "todo",
      "priority": "high",
      "due_on": "2026-07-15",
      "project": {
        "id": 1,
        "name": "MVP Backend"
      },
      "team": {
        "id": 1,
        "name": "Product Team"
      }
    }
  ]
}
```

## 認可テスト観点

RSpec の request spec では、最低限以下を検証します。

- 未ログインでは 401 になる
- JWT なし、JWT 不正、ログアウト済み JWT では 401 になる
- 所属していないチームの詳細取得は 404 になる
- 他チームのプロジェクト ID を指定すると 404 になる
- 他チームのタスク ID を指定すると 404 になる
- 所属チーム内で role 権限が足りない操作は 403 になる
- 他チームのユーザーをタスク担当者に設定できない
- member はチームメンバー追加ができない
- owner が 0 人になる削除や権限変更はできない
- チームメンバー削除時、対象チーム内の担当タスクの assignee_id が null になる
- タスク削除時、紐づくコメントも削除される

## ルーティング案

```ruby
namespace :api do
  namespace :v1 do
    namespace :auth do
      post "sign_up", to: "registrations#create"
      post "sign_in", to: "sessions#create"
      delete "sign_out", to: "sessions#destroy"
      get "me", to: "me#show"
    end

    resources :teams, only: %i[index show create update destroy] do
      resources :members, controller: "team_members", only: %i[index create update destroy]
      resources :projects, only: %i[index create]
    end

    resources :projects, only: %i[show update destroy] do
      get "kanban", to: "kanban#show"
      resources :tasks, only: %i[index create]
    end

    resources :tasks, only: %i[show update destroy] do
      resources :comments, only: %i[index create]
    end

    namespace :my do
      resources :tasks, only: %i[index]
    end
  end
end
```
