import type { FormEvent } from 'react'
import type { Comment } from '../../types/comment'
import type { TeamMember } from '../../types/team'
import type { Task, TaskPriority, TaskStatus } from '../../types/task'
import { CommentPanel } from '../comments/CommentPanel'
import { formatDateTime, kanbanColumns, taskPriorityOptions } from './taskDisplay'

type TaskEditPanelProps = {
  commentContent: string
  commentSubmitErrorMessage: string
  comments: Comment[]
  commentsErrorMessage: string
  editTaskAssigneeId: string
  editTaskDescription: string
  editTaskDueOn: string
  editTaskPriority: TaskPriority
  editTaskStatus: TaskStatus
  editTaskTitle: string
  isCommentSubmitting: boolean
  isCommentsLoading: boolean
  isTaskDeleting: boolean
  isTaskDetailLoading: boolean
  isTaskUpdating: boolean
  onCommentSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  onTaskDelete: () => void | Promise<void>
  onTaskUpdate: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  selectedTask: Task | null
  selectedTaskId: number | null
  setCommentContent: (value: string) => void
  setEditTaskAssigneeId: (value: string) => void
  setEditTaskDescription: (value: string) => void
  setEditTaskDueOn: (value: string) => void
  setEditTaskPriority: (value: TaskPriority) => void
  setEditTaskStatus: (value: TaskStatus) => void
  setEditTaskTitle: (value: string) => void
  taskDetailErrorMessage: string
  taskUpdateMessage: string
  teamMembers: TeamMember[]
}

export function TaskEditPanel({
  commentContent,
  commentSubmitErrorMessage,
  comments,
  commentsErrorMessage,
  editTaskAssigneeId,
  editTaskDescription,
  editTaskDueOn,
  editTaskPriority,
  editTaskStatus,
  editTaskTitle,
  isCommentSubmitting,
  isCommentsLoading,
  isTaskDeleting,
  isTaskDetailLoading,
  isTaskUpdating,
  onCommentSubmit,
  onTaskDelete,
  onTaskUpdate,
  selectedTask,
  selectedTaskId,
  setCommentContent,
  setEditTaskAssigneeId,
  setEditTaskDescription,
  setEditTaskDueOn,
  setEditTaskPriority,
  setEditTaskStatus,
  setEditTaskTitle,
  taskDetailErrorMessage,
  taskUpdateMessage,
  teamMembers,
}: TaskEditPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            タスク詳細・編集
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            カンバンのタスクを選択すると詳細を確認し、内容を更新できます。
          </p>
        </div>
        {selectedTask ? (
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            Task #{selectedTask.id}
          </span>
        ) : null}
      </div>

      {!selectedTaskId ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          編集するタスクをカンバンから選択してください。
        </div>
      ) : null}

      {isTaskDetailLoading ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          タスク詳細を読み込んでいます。
        </div>
      ) : null}

      {taskDetailErrorMessage ? (
        <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
          {taskDetailErrorMessage}
        </div>
      ) : null}

      {taskUpdateMessage ? (
        <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
          {taskUpdateMessage}
        </div>
      ) : null}

      {selectedTask && !isTaskDetailLoading ? (
        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <form
            className="grid gap-4 lg:grid-cols-2"
            onSubmit={(event) => {
              void onTaskUpdate(event)
            }}
          >
            <label className="block lg:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                title
              </span>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                disabled={isTaskUpdating}
                onChange={(event) => {
                  setEditTaskTitle(event.target.value)
                }}
                type="text"
                value={editTaskTitle}
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                description
              </span>
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                disabled={isTaskUpdating}
                onChange={(event) => {
                  setEditTaskDescription(event.target.value)
                }}
                value={editTaskDescription}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                status
              </span>
              <select
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                disabled={isTaskUpdating}
                onChange={(event) => {
                  setEditTaskStatus(event.target.value as TaskStatus)
                }}
                value={editTaskStatus}
              >
                {kanbanColumns.map((column) => (
                  <option key={column.status} value={column.status}>
                    {column.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                priority
              </span>
              <select
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                disabled={isTaskUpdating}
                onChange={(event) => {
                  setEditTaskPriority(event.target.value as TaskPriority)
                }}
                value={editTaskPriority}
              >
                {taskPriorityOptions.map((option) => (
                  <option key={option.priority} value={option.priority}>
                    {option.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                期限日
              </span>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                disabled={isTaskUpdating}
                onChange={(event) => {
                  setEditTaskDueOn(event.target.value)
                }}
                type="date"
                value={editTaskDueOn}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                assignee_id
              </span>
              <select
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                disabled={isTaskUpdating}
                onChange={(event) => {
                  setEditTaskAssigneeId(event.target.value)
                }}
                value={editTaskAssigneeId}
              >
                <option value="">未設定</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.user.id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="lg:col-span-2">
              <dl className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold text-slate-500">
                    作成者
                  </dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {selectedTask.created_by.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">
                    作成日時
                  </dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {formatDateTime(selectedTask.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">
                    最終更新
                  </dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {formatDateTime(selectedTask.updated_at)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-indigo-300"
                disabled={isTaskUpdating || isTaskDeleting}
                type="submit"
              >
                {isTaskUpdating ? '更新しています...' : 'タスクを更新'}
              </button>
              <button
                className="rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:border-rose-100 disabled:text-rose-300"
                disabled={isTaskUpdating || isTaskDeleting}
                onClick={() => {
                  void onTaskDelete()
                }}
                type="button"
              >
                {isTaskDeleting ? '削除しています...' : 'タスクを削除'}
              </button>
            </div>
          </form>

          <CommentPanel
            commentContent={commentContent}
            commentSubmitErrorMessage={commentSubmitErrorMessage}
            comments={comments}
            commentsErrorMessage={commentsErrorMessage}
            isCommentSubmitting={isCommentSubmitting}
            isCommentsLoading={isCommentsLoading}
            onCommentSubmit={onCommentSubmit}
            setCommentContent={setCommentContent}
          />
        </div>
      ) : null}
    </section>
  )
}
