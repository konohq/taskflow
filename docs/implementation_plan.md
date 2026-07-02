# TaskFlow AI 実装計画

## 基本方針

実装はバックエンド MVP を優先します。Rails は API モード、DB は PostgreSQL、認証は devise-jwt による Bearer Token 方式で進めます。UI 設計と React SPA の実装は、認証、チーム、プロジェクト、タスク、コメントの主要 API が完成してから行います。

現在はバックエンド MVP の主要機能を実装済みです。認証 API、Team / TeamMember API、Project API、Task API、Comment 一覧・作成 API、My Tasks API、Kanban API は実装済みで、RSpec / RuboCop / Brakeman も通過済みです。

次のフェーズは、バックエンド API を前提にしたフロントエンド設計・実装です。

## フェーズ 0: 設計ドキュメント整備（完了）

目的: 実装前に MVP の範囲、DB、API、実装順序を明確にする。

作成するドキュメント:

- README.md
- docs/requirements.md
- docs/database_design.md
- docs/api_design.md
- docs/implementation_plan.md

完了条件:

- MVP 機能が整理されている
- 主要モデルが整理されている
- チーム単位の認可とデータ分離方針が明記されている
- devise-jwt による Bearer Token 認証方針が明記されている
- DB 制約とバリデーション方針が明記されている
- API のルーティングと入出力が整理されている

## フェーズ 1: Rails アプリ作成と開発基盤（完了）

目的: バックエンド MVP の土台を作る。

主な作業:

- Rails API モードでアプリを作成する
- PostgreSQL を設定する
- devise-jwt を導入する
- RSpec を導入する
- FactoryBot などテスト補助ライブラリを検討する
- RuboCop を導入する
- Brakeman を導入する
- CI を導入するか検討する

完了条件:

- Rails アプリが起動できる
- PostgreSQL に接続できる
- `dotenv-rails` により development / test で `backend/.env` を自動読み込みできる
- `TASKFLOW_AI_DATABASE_USERNAME`、`TASKFLOW_AI_DATABASE_PASSWORD`、`TASKFLOW_AI_DATABASE_HOST` でローカルDB接続を設定できる
- devise-jwt の設定方針が反映されている
- RSpec が実行できる
- RuboCop が実行できる
- Brakeman が実行できる
- 最小限のヘルスチェックまたは初期テストが通る

### ローカルDB作成手順

development / test 環境では `dotenv-rails` により `backend/.env` が自動で読み込まれます。`backend/.env.example` を参考に、ローカルの PostgreSQL 接続情報を `backend/.env` に設定します。

```env
TASKFLOW_AI_DATABASE_USERNAME=postgres
TASKFLOW_AI_DATABASE_PASSWORD=自分のPostgreSQLパスワード
TASKFLOW_AI_DATABASE_HOST=localhost
TASKFLOW_AI_JWT_SECRET_KEY=任意の長いランダム文字列
```

PowerShell で一時的に環境変数を設定して実行することもできます。

```powershell
$env:TASKFLOW_AI_DATABASE_USERNAME="postgres"
$env:TASKFLOW_AI_DATABASE_PASSWORD="自分のPostgreSQLパスワード"
$env:TASKFLOW_AI_DATABASE_HOST="localhost"
$env:TASKFLOW_AI_JWT_SECRET_KEY="任意の長いランダム文字列"

cd D:/RubyProjects/teamtaskapp/backend
ruby bin\rails db:create
```

`backend/.env.example` は設定値のひな形です。実際の秘密情報を入れる `.env` は Git 管理対象にしません。本番環境では `.env` に依存せず、実行環境の環境変数で設定します。

## フェーズ 2: 認証（完了）

目的: ユーザー登録、ログイン、ログアウト、ログインユーザー取得を実装する。

主な作業:

- User モデルを作成する
- users テーブルを作成する
- devise-jwt による JWT 発行と検証を実装する
- ユーザー登録 API を実装する
- ログイン API を実装する
- ログアウト API を実装する
- ログインユーザー取得 API を実装する
- `authenticate_user!` を実装する

重視する点:

- devise-jwt を使い、セッション Cookie 認証は使用しない
- Authorization ヘッダーの Bearer Token を検証する
- current_user を基準にデータ取得と認可を行う
- パスワードを平文保存しない
- email は保存前に downcase する
- PostgreSQL の `LOWER(email)` unique index で case-insensitive unique を保証する
- Strong Parameters を使う
- 認証処理を private メソッドで整理する

テスト:

- ユーザー登録できる
- 重複 email で登録できない
- 正しい認証情報でログインできる
- 間違った認証情報でログインできない
- ログアウトできる
- 未ログイン時に `/me` が 401 になる
- JWT なし、JWT 不正、ログアウト済み JWT では 401 になる

## フェーズ 3: チームとチームメンバー（完了）

目的: チーム作成、一覧、詳細、メンバー管理を実装する。

主な作業:

- Team モデルを作成する
- TeamMember モデルを作成する
- teams テーブルを作成する
- team_members テーブルを作成する
- チーム作成 API を実装する
- チーム一覧 API を実装する
- チーム詳細 API を実装する
- チーム更新 API を実装する
- チーム削除 API を実装する
- チームメンバー一覧 API を実装する
- チームメンバー追加 API を実装する
- チームメンバー権限変更 API を実装する
- チームメンバー削除 API を実装する
- `set_team` と `authorize_team_member!` を実装する

重視する点:

- チーム作成時に作成者を owner として登録する
- Team と TeamMember 作成はトランザクションで行う
- 他チームのデータを取得できないようにする
- owner が 0 人になる操作を禁止する
- TeamMember の role は DB 制約とバリデーションで制限する
- role は owner、admin、member の 3 種類にする
- member 削除時、そのユーザーが担当していた対象チーム内のタスクの assignee_id を null にする

テスト:

- チームを作成できる
- 作成者が owner になる
- 所属チーム一覧のみ取得できる
- 非所属チームの詳細を取得できない
- owner または admin はメンバー追加できる
- member はメンバー追加できない
- 同じユーザーを同じチームへ重複追加できない
- owner が 0 人になる削除や権限変更はできない
- admin は owner の削除、owner の降格、owner への変更ができない
- メンバー削除時に対象チーム内の担当タスクの assignee_id が null になる

## フェーズ 4: プロジェクト（完了）

目的: チーム内のプロジェクト作成、一覧、詳細、更新、削除を実装する。

主な作業:

- Project モデルを作成する
- projects テーブルを作成する
- プロジェクト作成 API を実装する
- プロジェクト一覧 API を実装する
- プロジェクト詳細 API を実装する
- プロジェクト更新 API を実装する
- プロジェクト削除 API を実装する
- `set_project` を実装する

重視する点:

- Project は Team に必ず紐づける
- Project は所属チームからスコープして取得する
- created_by はログインユーザーを設定する

テスト:

- 所属チームにプロジェクトを作成できる
- 所属チームのプロジェクト一覧を取得できる
- 他チームのプロジェクトを取得できない
- 所属チームのプロジェクトを更新できる
- 所属チームのプロジェクトを削除できる
- name なしでは作成できない

## フェーズ 5: タスク（完了）

目的: タスクの作成、一覧、詳細、編集、削除、担当者、ステータス、優先度、期限を実装する。

主な作業:

- Task モデルを作成する
- tasks テーブルを作成する
- タスク作成 API を実装する
- タスク一覧 API を実装する
- タスク詳細 API を実装する
- タスク編集 API を実装する
- タスク削除 API を実装する
- 担当者設定を実装する
- ステータス管理を実装する
- 優先度設定を実装する
- 期限設定を実装する
- `set_task` を実装する

重視する点:

- Task は Project に必ず紐づける
- Task は Team と Project を確認してから取得する
- assignee は同じチームのメンバーのみ許可する
- status と priority は定義済みの値のみ許可する
- status の default は todo、priority の default は medium にする
- Strong Parameters で更新可能属性を制限する
- タスク削除時は `dependent: :destroy` により紐づくコメントも削除する

テスト:

- タスクを作成できる
- タスク一覧を取得できる
- タスク詳細を取得できる
- タスクを編集できる
- タスクを削除できる
- 他チームのタスクを取得できない
- 他チームのユーザーを担当者に設定できない
- 不正な status を設定できない
- 不正な priority を設定できない
- タスク削除時に紐づくコメントも削除される

## フェーズ 6: コメント（完了）

目的: タスクへのコメント作成、コメント一覧を実装する。

主な作業:

- Comment モデルを作成する
- comments テーブルを作成する
- コメント作成 API を実装する
- コメント一覧 API を実装する

重視する点:

- Comment は Task に必ず紐づける
- Comment の user はログインユーザーを設定する
- コメント対象タスクは所属チームからスコープして取得する

テスト:

- コメントを作成できる
- コメント一覧を取得できる
- 他チームのタスクにコメントできない
- content なしではコメントできない

## フェーズ 7: カンバン表示と自分の担当タスク（完了）

目的: MVP のタスク閲覧 API を完成させる。

主な作業:

- カンバン表示 API を実装する
- 自分の担当タスク一覧 API を実装する
- 自分の担当タスク一覧 API の絞り込みを整備する

重視する点:

- カンバン API は status ごとにタスクをグルーピングする
- 自分の担当タスクは所属チーム内のデータだけを返す
- 絞り込み条件のパラメータを Strong Parameters または明示的な許可リストで扱う
- 通常の Task 一覧 API では MVP 時点で絞り込みは未対応とする

テスト:

- カンバン形式でタスクを取得できる
- 自分に割り当てられたタスクのみ取得できる
- 他チームの担当タスクは含まれない
- status、priority、due_on_from、due_on_to で絞り込める

## フェーズ 8: 品質確認（完了）

目的: MVP の安全性と保守性を確認する。

主な作業:

- RSpec を全件実行する
- RuboCop を実行する
- Brakeman を実行する
- 認可漏れがないか確認する
- 不要な public メソッドや重複処理を整理する
- コントローラが肥大化している場合はサービス層や private メソッドへ整理する

完了条件:

- RSpec が通る
- RuboCop が通る
- Brakeman で重大な警告がない
- 他チームデータへのアクセス禁止がテストで保証されている
- README と設計ドキュメントが実装内容と一致している

## フェーズ 9: UI 設計とフロントエンド準備

目的: バックエンド MVP 完成後に、UI とフロントエンドの設計へ進む。

主な作業:

- 必要画面を整理する
- API レスポンスが画面要件を満たすか確認する
- Bearer Token の保存場所と認証状態の扱いを設計する
- カンバン表示 UI を設計する
- フロントエンド技術選定を行う

備考:

- バックエンド MVP の主要機能は実装済みのため、次に着手するフェーズとする
- React SPA として実装し、Rails API から JSON を取得する

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
- RuboCop を実行している
- Brakeman を実行している

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
- 主要な認証・認可・バリデーション・DB 制約がテストされている
- RuboCop と Brakeman を実行できる
- UI とフロントエンドは未着手でも、バックエンド API として利用できる状態になっている
