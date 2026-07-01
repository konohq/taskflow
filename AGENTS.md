# TASKFLOW AI

## Project Overview

チームでプロジェクトやタスクを管理できるWebアプリです。

ユーザーはチームを作成し、チームメンバーと一緒にプロジェクト・タスク・コメントを管理できます。
タスクはカンバン形式で表示し、担当者・ステータス・優先度・期限を管理できるようにします。

将来的にはAI機能を追加し、タスクの自動分解、進捗要約、今日やるべきタスクの提案などを実装する予定です。

## Tech Stack

### Backend

* Ruby on Rails API
* PostgreSQL
* devise-jwt
* RSpec
* RuboCop
* Brakeman

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Axios

## Current Development Focus

現在はバックエンドMVPの実装を優先します。

UI設計・フロントエンド実装は、バックエンドの主要機能が完成してから行います。
そのため、現時点ではフロントエンドの詳細な実装やUI作成には入らず、まずRails API側の設計・実装・テストを優先してください。

バックエンド実装は、以下の順番で進めます。

1. 認証機能
2. User / Team / TeamMember
3. Project
4. Task
5. Comment
6. 自分の担当タスク一覧
7. カンバン用API
8. RSpec追加
9. RuboCop / Brakeman / RSpec確認

## Coding Rules

* 日本語で回答する
* RESTfulに実装する
* Strong Parametersを必ず使用する
* before_actionを適切に使用する
* controller内の共通処理や補助メソッドはprivateメソッドに分離する
* fat controllerを避け、責務を分けて保守しやすいコードを書く
* N+1問題を考慮し、必要に応じてincludesを使用する
* 可読性を重視する
* 命名は分かりやすく、役割が伝わる名前にする
* 不要な複雑化は避け、まずはMVPを優先する
* 実装前に既存の設計ドキュメントを確認する
* 既存の設計ドキュメントと矛盾する実装をしない
* 変更内容が大きい場合は、実装内容と影響範囲を説明する

## Development Policy

* MVPを優先する
* セキュリティを考慮する
* 保守しやすいコードを書く
* 実装前に仕様・DB設計・API設計を確認する
* 一気に大きく実装せず、機能単位で段階的に実装する
* 実装後はテスト、静的解析、セキュリティチェックを行う
* RuboCop、Brakeman、RSpecが通る状態を維持する
* 既存テストを壊さない
* 不明点がある場合は、勝手に複雑な仕様を追加せず、MVPに必要な範囲で判断する

## Security Policy

* 認証が必要なAPIには必ずbefore_actionで認証チェックを入れる
* ログインユーザーは、自分が所属しているチームのデータのみ操作できるようにする
* 他チームのチーム、プロジェクト、タスク、コメント、メンバー情報を参照・作成・更新・削除できないようにする
* clientから送られてくるuser_idやteam_idを信用しすぎず、必ずサーバー側でcurrent_userを基準に検証する
* Strong Parametersで許可したパラメータのみ受け取る
* モデルには適切なバリデーションを追加する
* DB側にもNOT NULL制約、外部キー制約、unique制約を適切に追加する
* 認証エラー、認可エラー、バリデーションエラー、存在しないリソースへのアクセスは適切なステータスコードで返す
* Brakemanで警告が出にくい実装を心がける
* 秘密鍵、JWTシークレット、APIキーなどをコードに直接書かない
* 環境変数を使用する
* 不要な情報をAPIレスポンスに含めない

## Authorization Rules

* paramsで送られてきたuser_idをそのまま信用しない
* 作成者や担当者の設定は、必ずcurrent_userの所属チーム内のユーザーに限定する
* 他チームのユーザーをタスク担当者に設定できないようにする
* team_id、project_id、task_idを受け取る場合は、必ずログインユーザーがアクセス可能なリソースか確認する
* Teamにアクセスする際は、ログインユーザーがそのTeamに所属しているか確認する
* Projectにアクセスする際は、そのProjectがログインユーザーの所属Teamに紐づいているか確認する
* Taskにアクセスする際は、そのTaskがログインユーザーの所属TeamのProjectに紐づいているか確認する
* Commentにアクセスする際は、そのCommentがログインユーザーの所属TeamのTaskに紐づいているか確認する
* create/update/destroyでは、必ず認可チェックを行う
* 権限がない場合は403 Forbiddenを返す
* 存在しない、またはアクセスできないリソースには404 Not Foundを返す

## API Response Policy

* 成功時のJSON形式をできるだけ統一する
* エラー時のJSON形式をできるだけ統一する
* バリデーションエラーは422 Unprocessable Entityを返す
* 認証エラーは401 Unauthorizedを返す
* 認可エラーは403 Forbiddenを返す
* 存在しないリソースは404 Not Foundを返す
* エラーメッセージは分かりやすく返す
* 不要に内部実装や例外内容をそのまま返さない

## App Concept

* TASKFLOW AIは、チーム向けのタスク管理SPAアプリ
* チームごとにプロジェクトを作成できる
* プロジェクトごとにタスクを作成できる
* タスクには担当者、ステータス、優先度、期限、説明を設定できる
* タスクにはコメントを追加できる
* タスクはカンバン形式で管理する
* React側で画面遷移を行い、Rails APIからJSONでデータを取得する
* Rails API側では、チーム所属チェックと認可を重視する

## MVP Features

* ユーザー登録
* ログイン
* ログアウト
* ログインユーザー取得
* チーム作成
* チーム一覧表示
* チーム詳細表示
* チームメンバー管理
* プロジェクト作成
* プロジェクト一覧表示
* プロジェクト詳細表示
* タスク作成
* タスク一覧表示
* タスク詳細表示
* タスク編集
* タスク削除
* タスクの担当者設定
* タスクのステータス管理
* タスクの優先度設定
* タスクの期限設定
* コメント作成
* コメント一覧表示
* カンバン表示
* 自分の担当タスク一覧

## Task Status

* 未着手
* 進行中
* レビュー中
* 完了

## Task Priority

* 低
* 中
* 高

## Main Models

* User
* Team
* TeamMember
* Project
* Task
* Comment

## Backend Implementation Rules

* current_userを基準にデータを取得する
* controllerに処理を書きすぎない
* 共通処理はprivateメソッドに切り出す
* 必要に応じてserializerを使用し、APIレスポンスを整える
* エラーレスポンスの形式はできるだけ統一する
* Team、Project、Task、Commentは必ずログインユーザーがアクセス可能な範囲から取得する
* `Model.find(params[:id])` をそのまま使って他チームのデータを取得しない
* 可能な限り、`current_user.teams` や所属チームを基準にスコープを絞る
* 担当者を設定する場合は、そのユーザーが対象チームに所属しているか確認する
* N+1が起きそうな一覧APIではincludesを検討する
* DB制約とmodel validationの両方を適切に設定する

## Test Policy

* RSpecでテストを書く
* model specではバリデーション、関連付け、制約を確認する
* request specでは正常系、異常系、認証エラー、認可エラーを確認する
* 他チームのデータにアクセスできないことを必ずテストする
* 他チームのユーザーをタスク担当者に設定できないことをテストする
* RuboCopを通す
* Brakemanを通す
* 既存テストを壊さない

## Frontend Implementation Rules

フロントエンドはバックエンドMVP完成後に実装します。

実装時は以下を意識してください。

* React + TypeScriptで実装する
* 関数コンポーネントを使用する
* API通信はAxiosを使用する
* 型定義を適切に行う
* コンポーネントを分割し、肥大化を避ける
* Tailwind CSSでスタイリングする
* 認証状態に応じて画面表示を切り替える
* APIエラーをユーザーに分かりやすく表示する
* カンバン表示は見やすく、ステータスごとにタスクを分類する

## Future AI Features

MVP完成後に、以下のAI機能を追加する予定です。

* タスク説明からサブタスクを自動生成
* チーム全体の進捗要約
* 今日やるべきタスクの提案
* 期限切れ・遅延リスクのあるタスクの抽出
* コメント履歴の要約
* プロジェクトの進行状況レポート生成

## Implementation Flow

1. AGENTS.mdを作成する
2. README.mdを作成する
3. requirements.mdで要件定義を整理する
4. database_design.mdでDB設計を整理する
5. api_design.mdでAPI設計を整理する
6. Rails APIバックエンドを作成する
7. 認証機能を実装する
8. Team / TeamMemberを実装する
9. Projectを実装する
10. Taskを実装する
11. Commentを実装する
12. 自分の担当タスク一覧APIを実装する
13. カンバン用APIを実装する
14. RSpecを追加する
15. RuboCop、Brakeman、RSpecを実行する
16. READMEを更新する
17. バックエンドMVP完成後にフロントエンドを実装する
18. MVP完成後にAI機能を追加する
