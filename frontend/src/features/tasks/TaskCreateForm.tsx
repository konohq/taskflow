import type { FormEvent } from 'react'
import type { TeamMember } from '../../types/team'
import type { TaskPriority, TaskStatus } from '../../types/task'
import { kanbanColumns, taskPriorityOptions } from './taskDisplay'

type TaskCreateFormProps = {
  isTaskSubmitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  setTaskAssigneeId: (value: string) => void
  setTaskDescription: (value: string) => void
  setTaskDueOn: (value: string) => void
  setTaskPriority: (value: TaskPriority) => void
  setTaskStatus: (value: TaskStatus) => void
  setTaskTitle: (value: string) => void
  taskAssigneeId: string
  taskDescription: string
  taskDueOn: string
  taskErrorMessage: string
  taskPriority: TaskPriority
  taskStatus: TaskStatus
  taskTitle: string
  teamMembers: TeamMember[]
}

export function TaskCreateForm({
  isTaskSubmitting,
  onSubmit,
  setTaskAssigneeId,
  setTaskDescription,
  setTaskDueOn,
  setTaskPriority,
  setTaskStatus,
  setTaskTitle,
  taskAssigneeId,
  taskDescription,
  taskDueOn,
  taskErrorMessage,
  taskPriority,
  taskStatus,
  taskTitle,
  teamMembers,
}: TaskCreateFormProps) {
  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        void onSubmit(event)
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">タスク作成</h3>
          <p className="mt-1 text-sm text-slate-500">
            このプロジェクトに新しいタスクを追加します。
          </p>
        </div>
        <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
          担当者は任意
        </span>
      </div>

      {taskErrorMessage ? (
        <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
          {taskErrorMessage}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">title</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
            disabled={isTaskSubmitting}
            onChange={(event) => {
              setTaskTitle(event.target.value)
            }}
            placeholder="例: ログイン画面の入力チェックを追加"
            type="text"
            value={taskTitle}
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            description
          </span>
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
            disabled={isTaskSubmitting}
            onChange={(event) => {
              setTaskDescription(event.target.value)
            }}
            placeholder="タスクの詳細を入力"
            value={taskDescription}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">status</span>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
            disabled={isTaskSubmitting}
            onChange={(event) => {
              setTaskStatus(event.target.value as TaskStatus)
            }}
            value={taskStatus}
          >
            {kanbanColumns.map((column) => (
              <option key={column.status} value={column.status}>
                {column.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">priority</span>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
            disabled={isTaskSubmitting}
            onChange={(event) => {
              setTaskPriority(event.target.value as TaskPriority)
            }}
            value={taskPriority}
          >
            {taskPriorityOptions.map((option) => (
              <option key={option.priority} value={option.priority}>
                {option.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">due_on</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
            disabled={isTaskSubmitting}
            onChange={(event) => {
              setTaskDueOn(event.target.value)
            }}
            type="date"
            value={taskDueOn}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            assignee_id
          </span>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
            disabled={isTaskSubmitting}
            onChange={(event) => {
              setTaskAssigneeId(event.target.value)
            }}
            value={taskAssigneeId}
          >
            <option value="">未設定</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-indigo-300"
        disabled={isTaskSubmitting}
        type="submit"
      >
        {isTaskSubmitting ? '作成しています...' : 'タスクを作成'}
      </button>
    </form>
  )
}
