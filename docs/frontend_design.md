# TaskFlow AI フロントエンド設計

## 目的

このドキュメントは、TaskFlow AI のフロントエンド設計方針と現在の実装状況を整理するためのものです。

バックエンド MVP は実装済みであり、フロントエンドは既存の Rails API を利用する React SPA として実装しています。添付画像は UI レイアウトと雰囲気の参考に留め、画像内のタスク名、ユーザー名、日付、会社名、数値、アクティビティ、コメント内容は固定データとして使用しません。

## フロントエンド概要

TaskFlow AI のフロントエンドは、チームでプロジェクトとタスクを管理するための SaaS 型管理画面です。

MVP では、バックエンド API から取得した実データを使い、以下を実現します。

- JWT 認証によるログイン、ログアウト、ログインユーザー取得
- チーム、メンバー、プロジェクト、タスク、コメントの管理
- プロジェクト詳細画面での 4 列カンバン表示
- 自分が作成したタスク一覧
- API エラーの分かりやすい表示
- 他チームデータへアクセスできないバックエンド認可を前提にした画面制御

## 現在の実装状況

### 実装済み画面

- ログイン
- ユーザー登録
- ダッシュボード
- チーム一覧
- チーム作成
- チーム詳細
- メンバー一覧
- プロジェクト一覧
- プロジェクト作成
- 所属チーム横断のプロジェクト一覧
- プロジェクト詳細
- カンバン表示
- タスク作成
- タスク詳細
- タスク編集
- コメント一覧
- コメント作成
- 作成したタスク
- Not Found

### 実装済みの主な挙動

- JWT を使った認証状態管理
- Axios 共通クライアントによる Authorization Bearer token 付与
- 401 時の認証状態クリア
- TaskCard クリックによる選択中タスクの詳細表示
- Task 更新後のカンバン差し替え
- status 変更時の正しいカラム移動
- assignee_id 未設定での Task 更新
- 選択中 Task 変更時の Task 詳細取得・Comment 取得の非同期競合対策
- コメント投稿成功後の一覧反映
- 作成したタスクの status / priority / due_on_from / due_on_to による期限日絞り込み
- 作成したタスクの連続検索・リセット・再読み込み時の非同期競合対策

### 後回し項目

- チーム更新、削除 UI
- チームメンバー権限変更、削除 UI
- プロジェクト更新、削除 UI
- タスク削除 UI
- コメント編集、削除
- カンバンのドラッグアンドドロップ
- アクティビティ API と履歴表示
- 通知
- 高度な横断検索
- AI アシスタント機能

## 技術スタック

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

アイコンが必要な箇所では、実装時に `lucide-react` などのアイコンライブラリ利用を検討します。手書き SVG を増やしすぎず、意味が伝わる一貫したアイコンを使います。

## 採用する UI レイアウト

添付画像を参考に、白基調の SaaS 管理画面として設計します。

### 全体構成

- 左サイドバー
- 上部ヘッダー
- メインコンテンツ
- プロジェクト詳細エリア
- KPI カード
- 4 列カンバンボード
- 右側パネル

### ビジュアル方針

- 背景は `bg-slate-50` 相当の淡いグレー
- カードとパネルは `bg-white`
- 境界線は `border-slate-200`
- 文字色は `text-slate-900`、補助テキストは `text-slate-500` から `text-slate-600`
- アクセントは indigo / blue / violet 系を中心に使用
- 成功状態は emerald / green 系を使用
- 警告や期限超過は amber / rose 系を使用
- カードの角丸は 8px 程度を上限にし、過度に丸くしない
- 影は `shadow-sm` 程度に抑え、情報の階層を境界線と余白で表現する
- 余白は `p-4`、`p-6`、`gap-4`、`gap-6` を中心に揃える
- 装飾目的の大きなグラデーションや背景オブジェクトは使わない

### レスポンシブ方針

- デスクトップでは左サイドバー、メイン、右パネルの 3 領域を表示する
- 画面幅が狭い場合はサイドバーを折りたたみ、メニューアイコンから開閉する
- 右側パネルはタブ、下部セクション、またはドロワーに退避できる設計にする
- カンバン 4 列は横スクロールを許可し、列幅を安定させる
- ボタンやカード内テキストは折り返しを許可し、UI 要素からはみ出さないようにする

## 画面一覧

MVP フロントエンドで想定する画面は以下です。

| 画面 | 目的 |
| --- | --- |
| ログイン | JWT を取得して認証状態にする |
| ユーザー登録 | 新規ユーザーを作成して JWT を取得する |
| ダッシュボード | 概要表示。初期 MVP では簡易表示でもよい |
| チーム一覧 | 所属チームを表示する |
| チーム詳細 | チーム情報とメンバーを表示する |
| メンバー管理 | メンバー一覧表示とメールアドレスによるメンバー追加を行う。role 変更、削除 UI は MVP 後回し |
| プロジェクト一覧 | 所属チーム内のプロジェクトを横断表示する |
| プロジェクト詳細 | プロジェクト概要、KPI、カンバンを表示する中心画面 |
| タスク詳細 / 編集 | タイトル、説明、担当者、ステータス、優先度、期限日を編集し、作成日時を表示する |
| コメント | タスクに紐づくコメント一覧と作成フォームを表示する |
| 作成したタスク | 自分が作成したタスクを一覧表示する |
| 設定 | MVP ではルートを作らず後回し。将来のユーザー設定やチーム設定に備える |
| Not Found | 404 相当の状態を表示する |
| Unauthorized | 認証切れや権限不足を適切に案内する |

## 画面遷移

React Router では、以下のようなルーティングを想定します。

```text
/login
/signup
/
/teams
/teams/:teamId
/projects
/projects/:projectId
/my/tasks
*
```

認証が必要な画面は `ProtectedRoute` で保護します。未ログイン時は `/login` へ遷移させます。

`/` はダッシュボード画面として扱います。メンバー管理、チーム詳細内のプロジェクト作成、設定などは、MVP では専用ルートを増やさず、チーム詳細画面やプロジェクト詳細画面内の表示として扱います。

`/projects/:projectId` はプロジェクト詳細兼カンバン画面とし、初期表示ではボードタブを表示します。ボード、リスト、設定などの表示切り替えは画面内のタブ状態で管理します。MVP では `/projects/:projectId/board` のようなボード専用ルートは作りません。

## 共通レイアウト

### AppLayout

認証後の画面は `AppLayout` で包みます。

- 左サイドバー
- 上部ヘッダー
- メイン領域
- 必要に応じた右側パネル

### 左サイドバー

配置するナビゲーションは以下です。

- ダッシュボード
- チーム
- プロジェクト
- 作成タスク
- 設定

現在のページは、淡い indigo 系背景、左側のアクセントバー、アイコン色で示します。

サイドバーの「プロジェクト」は `/projects` へ遷移し、所属チームを取得したうえで各チームのプロジェクト一覧 API を呼び出して、所属チーム内のプロジェクトを横断表示します。バックエンドには全チーム横断の `GET /api/v1/projects` は追加せず、既存の Team / Project API を組み合わせます。

サイドバー下部には、将来の AI 機能導線を置ける余白を残します。ただし MVP では AI 機能は未実装のため、実装時に表示する場合は「今後対応」やベータ扱いとして、主要導線を邪魔しない控えめな扱いにします。

### 上部ヘッダー

配置する要素は以下です。

- メニュー開閉アイコン
- 検索欄
- 通知アイコン
- ログインユーザー情報
- ログアウト導線

検索は MVP では UI のみ、またはローカル表示範囲内の簡易絞り込みから開始します。バックエンドに高度な検索 API は未実装のため、未実装 API を前提にした画面にはしません。

### メインコンテンツ

プロジェクト詳細画面では以下を表示します。

- パンくず
- プロジェクト名
- プロジェクト説明
- プロジェクトステータス
- メンバー数
- KPI カード
- タブ
- カンバンボード

現在の Project API と Project モデルには、プロジェクト自体の期限カラムはありません。そのため、MVP ではプロジェクト自体の期限は表示しません。必要な場合は、Task の `due_on` から最も近い期限や最終期限を補助的に算出する表示として扱います。Project モデルに期限カラムを追加する実装は MVP では行いません。

### 右側パネル

右側パネルには以下を想定します。

- 最近のアクティビティ
- コメント追加欄

アクティビティ API は未実装のため、MVP では空状態、簡易表示、または非表示にします。画像内のアクティビティ文言を固定データとして流用しません。

コメントは Task に紐づく既存 API を利用します。プロジェクト全体のコメントではなく、選択中タスクのコメントとして扱う設計にします。

## コンポーネント構成

実装時は、画面単位、機能単位、共通 UI 単位で分割します。

```text
src/
  app/
    App.tsx
    router.tsx
  layouts/
    AppLayout.tsx
    AuthLayout.tsx
    Sidebar.tsx
    TopHeader.tsx
  components/
    ui/
      Button.tsx
      IconButton.tsx
      Input.tsx
      Textarea.tsx
      Badge.tsx
      Card.tsx
      Tabs.tsx
      Avatar.tsx
      EmptyState.tsx
      LoadingState.tsx
      ErrorState.tsx
    navigation/
      Breadcrumbs.tsx
      ProtectedRoute.tsx
  features/
    auth/
    teams/
    teamMembers/
    projects/
    tasks/
    comments/
    myTasks/
    kanban/
  lib/
    apiClient.ts
    authStorage.ts
  types/
    api.ts
```

### プロジェクト詳細関連

```text
features/projects/
  ProjectDetailPage.tsx
  ProjectHeader.tsx
  ProjectKpiGrid.tsx
  ProjectTabs.tsx

features/kanban/
  KanbanBoard.tsx
  KanbanColumn.tsx
  TaskCard.tsx

features/tasks/
  TaskDetailDrawer.tsx
  TaskForm.tsx
  TaskStatusSelect.tsx
  TaskPriorityBadge.tsx

features/comments/
  CommentList.tsx
  CommentComposer.tsx
```

本番コンポーネントは API から取得した props または hooks のデータを描画し、サンプルデータを直書きしません。

### 現在の主な実装構成

現在の実装では、ページ単位の責務を `src/pages` に置き、Project 詳細まわりの肥大化を避けるために機能別コンポーネントを `src/features` 配下へ分割しています。

```text
frontend/src/
  api/
    client.ts
    comments.ts
    projects.ts
    tasks.ts
    teamMembers.ts
    teams.ts
  contexts/
    AuthContext.tsx
    AuthContextState.ts
    useAuth.ts
  components/
    common/
      AuthShell.tsx
      ProtectedRoute.tsx
    layout/
      AppLayout.tsx
      Header.tsx
      Sidebar.tsx
  pages/
    auth/
      LoginPage.tsx
      SignupPage.tsx
    DashboardPage.tsx
    ProjectsPage.tsx
    TeamsPage.tsx
    TeamDetailPage.tsx
    ProjectDetailPage.tsx
    MyTasksPage.tsx
    NotFoundPage.tsx
  routes/
    AppRoutes.tsx
  features/
    kanban/
      KanbanBoard.tsx
      KanbanColumn.tsx
      TaskCard.tsx
    tasks/
      TaskCreateForm.tsx
      TaskEditPanel.tsx
      TaskPriorityBadge.tsx
      taskDisplay.ts
    comments/
      CommentPanel.tsx
  types/
    auth.ts
    comment.ts
    project.ts
    task.ts
    team.ts
    teamMember.ts
```

## API 連携方針

API ベースパスは `/api/v1` です。Axios の共通クライアントを作成し、JWT を Authorization ヘッダーに付与します。

```text
Authorization: Bearer <JWT>
```

### 利用する主な API

| 用途 | Method | Path |
| --- | --- | --- |
| ユーザー登録 | POST | `/api/v1/auth/sign_up` |
| ログイン | POST | `/api/v1/auth/sign_in` |
| ログアウト | DELETE | `/api/v1/auth/sign_out` |
| ログインユーザー取得 | GET | `/api/v1/auth/me` |
| チーム一覧 | GET | `/api/v1/teams` |
| チーム作成 | POST | `/api/v1/teams` |
| チーム詳細 | GET | `/api/v1/teams/:id` |
| チーム更新 | PATCH | `/api/v1/teams/:id` |
| チーム削除 | DELETE | `/api/v1/teams/:id` |
| メンバー一覧 | GET | `/api/v1/teams/:team_id/members` |
| メンバー追加 | POST | `/api/v1/teams/:team_id/members` |
| メンバー権限変更 | PATCH | `/api/v1/teams/:team_id/members/:id` |
| メンバー削除 | DELETE | `/api/v1/teams/:team_id/members/:id` |
| 所属チーム横断のプロジェクト一覧 | GET | `/api/v1/teams` + `/api/v1/teams/:team_id/projects` |
| チーム内プロジェクト一覧 | GET | `/api/v1/teams/:team_id/projects` |
| プロジェクト作成 | POST | `/api/v1/teams/:team_id/projects` |
| プロジェクト詳細 | GET | `/api/v1/projects/:id` |
| プロジェクト更新 | PATCH | `/api/v1/projects/:id` |
| プロジェクト削除 | DELETE | `/api/v1/projects/:id` |
| タスク一覧 | GET | `/api/v1/projects/:project_id/tasks` |
| タスク作成 | POST | `/api/v1/projects/:project_id/tasks` |
| タスク詳細 | GET | `/api/v1/tasks/:id` |
| タスク更新 | PATCH | `/api/v1/tasks/:id` |
| タスク削除 | DELETE | `/api/v1/tasks/:id` |
| コメント一覧 | GET | `/api/v1/tasks/:task_id/comments` |
| コメント作成 | POST | `/api/v1/tasks/:task_id/comments` |
| 自分の担当タスク | GET | `/api/v1/my/tasks` |
| 自分が作成したタスク | GET | `/api/v1/my/created_tasks` |
| カンバン | GET | `/api/v1/projects/:project_id/kanban` |

### エラー処理

バックエンドの共通エラーレスポンスを前提にします。

```json
{
  "error": {
    "code": "validation_error",
    "message": "入力内容に誤りがあります",
    "details": ["Title can't be blank"]
  }
}
```

画面側では以下の方針で扱います。

- 401: 認証状態をクリアし、ログイン画面へ誘導する
- 403: 権限不足メッセージを表示する
- 404: Not Found 画面または対象データなしの状態を表示する
- 422: フォームのエラーとして表示する

## 認証状態管理

MVP では `AuthContext` を中心に認証状態を管理します。

保持する主な状態:

- `user`
- `token`
- `isAuthenticated`
- `isLoading`

ログインまたはユーザー登録成功時、バックエンドは JWT をレスポンスヘッダーと JSON body の `token` の両方で返します。フロントエンドでは JSON body の `token` を使う方針にします。

JWT の保存先は MVP では `localStorage` を想定します。ただし XSS リスクを考慮し、保存する情報は JWT と最小限のユーザー情報に限定します。将来的にセキュリティ要件が高まる場合は、保存方式の見直しを検討します。

Axios interceptor で token を付与し、401 を受け取った場合は token と user を削除してログイン画面へ遷移します。

## データ型方針

バックエンドレスポンスに合わせて TypeScript 型を定義します。

```ts
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type UserMini = {
  id: number;
  name: string;
};

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  // due_on は期限日。created_at は Rails が自動保存する作成日時。
  due_on: string | null;
  assignee: UserMini | null;
  created_by: UserMini;
  created_at: string;
  updated_at: string;
};

export type KanbanResponse = {
  project: {
    id: number;
    name: string;
  };
  columns: Record<TaskStatus, Task[]>;
};
```

Task API、My Tasks API、Created Tasks API、Kanban API の `assignee` / `created_by` は `id` と `name` のみに限定されます。`email`、`password`、`encrypted_password`、`jti` は表示しません。

## カンバン画面設計

プロジェクト詳細画面の中心はカンバンボードです。

### 利用 API

```text
GET /api/v1/projects/:project_id/kanban
```

レスポンスは以下の形式を前提にします。

```json
{
  "project": {
    "id": 1,
    "name": "TaskFlow AI"
  },
  "columns": {
    "todo": [],
    "in_progress": [],
    "review": [],
    "done": []
  }
}
```

### カラム

| 表示名 | status |
| --- | --- |
| 未着手 | todo |
| 進行中 | in_progress |
| レビュー | review |
| 完了 | done |

空のステータスも空配列として表示します。タスクがないカラムには、控えめな空状態を表示します。

### TaskCard 表示内容

- タイトル
- 優先度
- 期限日
- 担当者
- ステータス

優先度の表示色は以下を想定します。

| priority | 表示 |
| --- | --- |
| low | emerald 系の控えめなバッジ |
| medium | amber 系の控えめなバッジ |
| high | rose 系の控えめなバッジ |

### ステータス変更

MVP ではドラッグアンドドロップは実装しません。タスク詳細または編集フォームから `PATCH /api/v1/tasks/:id` を呼び出し、`status` を更新します。

将来的にドラッグアンドドロップを追加する場合も、既存の Task 更新 API を使ってステータスを保存します。

## KPI カード設計

プロジェクト詳細画面では、カンバンレスポンスやチームメンバー情報から KPI を表示します。

| KPI | 算出方針 |
| --- | --- |
| 総タスク数 | `columns` 内の全タスク数 |
| 期限超過 | 期限日である `due_on` が今日より前かつ `status !== "done"` のタスク数 |
| メンバー数 | チームメンバー API から取得 |
| 進捗率 | `done` のタスク数 / 総タスク数 |

KPI カードは横並びを基本とし、狭い画面では 2 列または 1 列に折り返します。

## 作成したタスク画面設計

### 利用 API

```text
GET /api/v1/my/created_tasks
```

対応しているクエリパラメータ:

- `status`
- `priority`
- `due_on_from`
- `due_on_to`

画面では、自分が作成したタスクのみを一覧表示します。レスポンスには Project 情報と Team 情報も含まれるため、どのチーム、どのプロジェクトのタスクか分かるように表示します。

### 表示項目

- タイトル
- ステータス
- 優先度
- 期限日
- 作成日時
- プロジェクト名
- チーム名
- 作成者
- 担当者

絞り込み UI はセレクト、日付入力、リセットボタンで構成します。

## Team / Project / Task / Comment 画面設計

### Team

- 所属チーム一覧を表示する
- チーム作成フォームを用意する
- チーム詳細で説明と現在の role を表示する
- チーム更新、削除 UI は後回しにする

### TeamMember

- メンバー一覧を表示する
- メンバー追加 UI を表示する
- owner は member / admin を追加できる
- admin は member のみ追加できる
- role 変更、削除 UI は後回しにする

TeamMember API では管理用途として user email が返る可能性がありますが、その他の秘密情報は表示しません。

### Project

- チーム詳細またはプロジェクト一覧からプロジェクトを選択する
- プロジェクト詳細では、概要、KPI、タブ、カンバンを表示する
- Project の作成は実装済み
- Project の更新、削除 UI は後回しにする

### Task

- タスク一覧とカンバンカードから詳細を開く
- 作成、詳細表示、更新は既存 Task API を使う
- 削除 UI は後回しにする
- `due_on` は期限日として表示し、作成・編集フォームの入力ラベルは「期限日」にする
- `created_at` は作成日時として表示し、ユーザーに入力させない
- `created_by_id` は送信しない
- `assignee_id` は同じチームのメンバーから選択する
- 担当者解除では `assignee_id: null` を送信する

### Comment

- 選択中タスクに対してコメント一覧を取得する
- コメント作成時は `content` のみ送信する
- `user_id` は送信しない
- MVP ではコメント編集と削除 UI は作らない

## Mock / Sample データ方針

API 連携前に仮表示が必要な場合でも、画像内のタスク名、ユーザー名、日付、会社名、数値、アクティビティ、コメント内容はコピーしません。

mock データを使う場合は以下の方針にします。

- `src/mocks` や `src/features/*/__mocks__` など、mock であることが分かる場所に分離する
- 本番コンポーネントにサンプルデータを直書きしない
- API 連携後に削除しやすい構造にする
- 画面確認用の値は `sample` や `mock` と分かる命名にする

## アクセシビリティと操作性

- アイコンボタンには `aria-label` を付与する
- フォーム項目には label を付与する
- キーボード操作で主要導線を扱えるようにする
- フォーカスリングを見える状態にする
- 色だけで状態を判断させず、テキストやアイコンも併用する
- ローディング、空状態、エラー状態を各画面で用意する
- 破壊的操作は確認ダイアログを挟む

## MVP で後回しにすること

- カンバンのドラッグアンドドロップ
- アクティビティ API と本格的なアクティビティ履歴
- 通知 API
- 高度な横断検索
- ファイル添付
- コメント編集、削除
- AI アシスタント機能
- ガントチャート
- リアルタイム更新

## 実装進捗

### 完了

1. Vite + React + TypeScript + Tailwind CSS の初期構築
2. React Router と AppLayout の作成
3. Axios API client と AuthContext の作成
4. ログイン、ユーザー登録、ログアウト、ログインユーザー取得の実装
5. チーム一覧、チーム作成、チーム詳細、メンバー一覧の実装
6. プロジェクト一覧、プロジェクト作成、プロジェクト詳細の実装
7. Kanban API を使ったプロジェクト詳細ボードの実装
8. タスク作成、詳細、編集の実装
9. 選択中タスクのコメント一覧、コメント作成の実装
10. 作成したタスク画面と絞り込みの実装
11. ローディング、空状態、エラー状態、送信中状態の追加
12. ProjectDetailPage のコンポーネント分割

### 後回し

- Team 更新、削除 UI
- TeamMember role 変更、削除 UI
- Project 更新、削除 UI
- Task 削除 UI
- Comment 編集、削除 UI
- カンバンのドラッグアンドドロップ
- 通知、検索、アクティビティ、AI 機能

## 実装確認チェックリスト

- バックエンド API の起動手順を確認する
- `GET /api/v1/auth/me` で認証状態を復元できることを確認する
- JWT を Authorization ヘッダーに付与できる設計にする
- `401` を受け取った場合のログイン誘導を実装する
- 他チームリソースの `404` を通常の Not Found として扱う
- Task / Comment レスポンスに不要なユーザー情報を表示しない
- `created_by_id` や `user_id` を送信しない
- Task の担当者解除では `assignee_id: null` を送信する
- Task 詳細、Comment、作成したタスクの連続取得で古いレスポンスを適用しない
- mock データを本番コンポーネントへ直書きしない
- 画像内のサンプル文字列を固定データとして流用しない
- `npm.cmd run build` と `npm.cmd run lint` を実行する
