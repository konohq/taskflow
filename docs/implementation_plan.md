# TaskFlow 実装計画

## 基本方針

TaskFlow は、Rails API と React SPA で段階的に実装します。

バックエンドでは、認証、認可、チーム単位のデータ分離、Strong Parameters、before_action、DB 制約、RSpec を重視します。フロントエンドでは、既存 API 仕様に合わせた TypeScript 型、Axios による API 通信、認証状態管理、ローディング・エラー・空状態を重視します。

## 現在の進捗概要

- Backend MVP の主要 API は実装済み
- 認証、Team、TeamMember、Project、Task、Comment、Kanban、My Tasks API、Created Tasks API は実装済み
- Backend の RSpec / RuboCop / Brakeman は実行可能な状態
- Frontend MVP の主要画面は実装済み
- ログイン、ユーザー登録、Team、Project、Task、Comment、作成したタスクの画面は実装済み
- ダッシュボードは所属チーム数、プロジェクト数、作成タスク数、主要導線を表示済み
- ProjectDetailPage は Kanban / Task / Comment の機能コンポーネントへ分割済み
- README と docs は現在の実装状況に合わせて更新済み

## フェーズ 0: 設計ドキュメント整備（完了）

目的: 実装前に MVP の範囲、DB、API、実装順序を明確にする。

完了済み:

- README.md
- docs/requirements.md
- docs/database_design.md
- docs/api_design.md
- docs/implementation_plan.md
- docs/frontend_design.md

## フェーズ 1: Rails アプリ作成と開発基盤（完了）

目的: バックエンド MVP の土台を作る。

完了済み:

- Rails API モードのアプリ構築
- PostgreSQL 設定
- devise-jwt 導入
- dotenv-rails 導入
- RSpec 導入
- FactoryBot / Faker 導入
- RuboCop 導入
- Brakeman 導入
- ヘルスチェック確認

## フェーズ 2: 認証（完了）

目的: ユーザー登録、ログイン、ログアウト、ログインユーザー取得を実装する。

完了済み:

- User モデル
- users テーブル
- devise-jwt による JWT 発行と検証
- `POST /api/v1/auth/sign_up`
- `POST /api/v1/auth/sign_in`
- `DELETE /api/v1/auth/sign_out`
- `GET /api/v1/auth/me`
- `authenticate_user!`
- JWT 失効用の `jti` 更新

## フェーズ 3: チームとチームメンバー（完了）

目的: チーム作成、一覧、詳細、メンバー管理を実装する。

完了済み:

- Team モデル
- TeamMember モデル
- teams / team_members テーブル
- チーム作成、一覧、詳細、更新、削除 API
- チームメンバー一覧、追加、権限変更、削除 API
- owner / admin / member の role 制御
- 他チームデータの参照防止
- owner が 0 人になる操作の防止
- メンバー削除時の対象チーム内 Task `assignee_id` 解除

## フェーズ 4: プロジェクト（完了）

目的: チーム内のプロジェクト作成、一覧、詳細、更新、削除を実装する。

完了済み:

- Project モデル
- projects テーブル
- `GET /api/v1/teams/:team_id/projects`
- `POST /api/v1/teams/:team_id/projects`
- `GET /api/v1/projects/:id`
- `PATCH /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`
- Project を所属 Team 経由で取得する認可

## フェーズ 5: タスク（完了）

目的: タスクの作成、一覧、詳細、編集、削除、担当者、ステータス、優先度、期限を実装する。

完了済み:

- Task モデル
- tasks テーブル
- `GET /api/v1/projects/:project_id/tasks`
- `POST /api/v1/projects/:project_id/tasks`
- `GET /api/v1/tasks/:id`
- `PATCH /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`
- 担当者設定
- status / priority / due_on 管理
- 同じチームのユーザーのみ assignee に設定できる制御
- Task 削除時の Comment 削除

## フェーズ 6: コメント（完了）

目的: タスクへのコメント作成、コメント一覧を実装する。

完了済み:

- Comment モデル
- comments テーブル
- `GET /api/v1/tasks/:task_id/comments`
- `POST /api/v1/tasks/:task_id/comments`
- Comment の user を `current_user` で設定
- 他チーム Task へのコメント作成・参照防止

## フェーズ 7: カンバン表示と自分のタスク API（完了）

目的: MVP のタスク閲覧 API を完成させる。

完了済み:

- `GET /api/v1/projects/:project_id/kanban`
- `GET /api/v1/my/tasks`
- `GET /api/v1/my/created_tasks`
- status / priority / due_on_from / due_on_to による My Tasks / Created Tasks 絞り込み
- My Tasks / Created Tasks で Project / Team / created_by / assignee を返すレスポンス
- 所属チーム内の担当タスクだけを返す制御
- 所属チーム内で自分が作成したタスクだけを返す制御

## フェーズ 8: Backend 品質確認（完了）

目的: MVP の安全性と保守性を確認する。

完了済み:

- RSpec 実行
- RuboCop 実行
- Brakeman 実行
- 認証、認可、バリデーション、他チームデータ分離のテスト整備

Backend 修正後に確認するコマンド:

```powershell
cd D:/RubyProjects/teamtaskapp/backend
bundle exec rspec
bundle exec rubocop
bundle exec brakeman
```

## フェーズ 9: フロントエンド基盤（完了）

目的: React SPA の土台を作る。

完了済み:

- Vite + React + TypeScript
- Tailwind CSS
- React Router
- Axios API client
- JWT の Authorization ヘッダー付与
- 401 時の認証状態クリア
- AuthContext
- ProtectedRoute
- AppLayout
- ログイン、ユーザー登録、ログアウト

## フェーズ 10: フロントエンド主要画面（完了）

目的: MVP の主要 API を画面から利用できるようにする。

完了済み:

- チーム一覧
- チーム作成
- チーム詳細
- メンバー一覧
- メンバー追加
- 所属チーム横断のプロジェクト一覧
- チーム詳細内のプロジェクト一覧
- プロジェクト作成
- プロジェクト詳細
- タスク作成
- カンバン列からのタスク作成
- カンバン表示
- TaskCard クリックによるタスク詳細表示
- タスク編集
- status / priority / title / description / due_on / assignee_id 更新
- タスク更新後のカンバン差し替え
- status 変更時のカラム移動
- コメント一覧
- コメント作成
- 作成したタスク一覧
- 作成したタスクの status / priority / due_on_from / due_on_to 絞り込み
- ローディング、エラー、空状態、送信中状態
- Task 詳細取得、Comment 取得、作成したタスク取得の非同期競合対策
- ProjectDetailPage のコンポーネント分割

Frontend 修正後に確認するコマンド:

```powershell
cd D:/RubyProjects/teamtaskapp/frontend
npm.cmd run build
npm.cmd run lint
```

## フェーズ 11: ドキュメント更新・仕上げ（完了）

目的: README と docs を現在の実装状態に合わせる。

完了済み:

- README の古いフロントエンド未着手前提の記述を削除
- 実装済み機能を Backend / Frontend に分けて整理
- セットアップ手順に backend / frontend の起動方法を記載
- 確認コマンドを backend / frontend に分けて記載
- docs/implementation_plan.md の進捗を現在化
- docs/frontend_design.md に実装済み項目と後回し項目を反映

## 後回しにする項目

- チーム更新、削除 UI
- チームメンバー権限変更、削除 UI
- プロジェクト更新、削除 UI
- タスク削除 UI
- コメント編集、削除
- カンバンのドラッグアンドドロップ
- 通知
- 横断検索
- アクティビティ履歴
- ファイル添付
- AI 機能

## 実装時の共通チェックリスト

- before_action で認証と親リソース取得を整理している
- ID 直指定で他チームのレコードを取得していない
- 未ログインは 401、他チームリソースは 404、role 権限不足は 403 にしている
- Strong Parameters で許可属性を限定している
- private メソッドでコントローラ内の補助処理を整理している
- モデルにバリデーションがある
- DB に NOT NULL、default、外部キー、一意制約、必要に応じた CHECK 制約がある
- 正常系と異常系の RSpec がある
- 他チームのデータにアクセスできないことをテストしている
- user_id、team_id、created_by_id をフロントエンドから信用していない
- フロントエンドの型が API レスポンスに合っている
- フロントエンドは build / lint を通す
- mock データや画像内のサンプル文字列を本番コンポーネントへ直書きしていない

## MVP 完了条件

- 認証 API が完成している
- devise-jwt による Bearer Token 認証が完成している
- チーム API が完成している
- チームメンバー管理 API が完成している
- プロジェクト API が完成している
- タスク API が完成している
- コメント API が完成している
- カンバン API が完成している
- 自分の担当タスク API が完成している
- 自分が作成したタスク API が完成している
- React SPA から認証、Team、Project、Task、Comment、作成したタスクの主要操作ができる
- 主要な認証・認可・バリデーション・DB 制約がテストされている
- Backend の RSpec / RuboCop / Brakeman を実行できる
- Frontend の build / lint を実行できる
- README と docs が実装状態と大きくズレていない
