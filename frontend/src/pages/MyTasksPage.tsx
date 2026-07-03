import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMyCreatedTasks } from '../api/tasks'
import type {
  MyTask,
  MyTasksFilterParams,
  TaskPriority,
  TaskStatus,
} from '../types/task'
import { getApiErrorMessage } from '../utils/apiError'

const emptyFilters: MyTasksFilterParams = {
  status: '',
  priority: '',
  due_on_from: '',
  due_on_to: '',
}

const taskStatusLabels: Record<TaskStatus, string> = {
  todo: '未着手',
  in_progress: '進行中',
  review: 'レビュー',
  done: '完了',
}

const taskStatusClasses: Record<TaskStatus, string> = {
  todo: 'border-slate-200 bg-slate-50 text-slate-600',
  in_progress: 'border-blue-100 bg-blue-50 text-blue-700',
  review: 'border-violet-100 bg-violet-50 text-violet-700',
  done: 'border-emerald-100 bg-emerald-50 text-emerald-700',
}

const taskPriorityLabels: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const taskPriorityClasses: Record<TaskPriority, string> = {
  low: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-100 bg-amber-50 text-amber-700',
  high: 'border-rose-100 bg-rose-50 text-rose-700',
}

const taskStatusOptions: Array<{
  status: TaskStatus
  title: string
}> = [
  {
    status: 'todo',
    title: '未着手',
  },
  {
    status: 'in_progress',
    title: '進行中',
  },
  {
    status: 'review',
    title: 'レビュー',
  },
  {
    status: 'done',
    title: '完了',
  },
]

const taskPriorityOptions: Array<{
  priority: TaskPriority
  title: string
}> = [
  {
    priority: 'low',
    title: '低',
  },
  {
    priority: 'medium',
    title: '中',
  },
  {
    priority: 'high',
    title: '高',
  },
]

function formatDate(value: string | null) {
  if (!value) return '期限日未設定'

  const [year, month, day] = value.split('-')

  if (!year || !month || !day) return value

  return `${year}/${month}/${day}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
        taskStatusClasses[status],
      ].join(' ')}
    >
      {taskStatusLabels[status]}
    </span>
  )
}

function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
        taskPriorityClasses[priority],
      ].join(' ')}
    >
      {taskPriorityLabels[priority]}
    </span>
  )
}

function TaskCard({
  onClick,
  task,
}: {
  onClick: () => void
  task: MyTask
}) {
  return (
    <button
      className="block w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
      onClick={onClick}
      type="button"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-base font-semibold leading-6 text-slate-950">
            {task.title}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {task.team.name} / {task.project.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">期限日</dt>
          <dd className="mt-1 font-medium text-slate-800">
            {formatDate(task.due_on)}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">チーム</dt>
          <dd className="mt-1 truncate font-medium text-slate-800">
            {task.team.name}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">プロジェクト</dt>
          <dd className="mt-1 truncate font-medium text-slate-800">
            {task.project.name}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">作成者</dt>
          <dd className="mt-1 truncate font-medium text-slate-800">
            {task.created_by.name}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">作成日時</dt>
          <dd className="mt-1 truncate font-medium text-slate-800">
            {formatDateTime(task.created_at)}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">担当者</dt>
          <dd className="mt-1 truncate font-medium text-slate-800">
            {task.assignee?.name ?? '未設定'}
          </dd>
        </div>
      </dl>
    </button>
  )
}

export function MyTasksPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<MyTask[]>([])
  const [filters, setFilters] = useState<MyTasksFilterParams>(emptyFilters)
  const [appliedFilters, setAppliedFilters] =
    useState<MyTasksFilterParams>(emptyFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const myTasksRequestIdRef = useRef(0)

  const loadMyTasks = useCallback(async (targetFilters: MyTasksFilterParams) => {
    const requestId = myTasksRequestIdRef.current + 1
    myTasksRequestIdRef.current = requestId

    setAppliedFilters(targetFilters)
    setIsLoading(true)
    setErrorMessage('')

    try {
      const fetchedTasks = await fetchMyCreatedTasks(targetFilters)

      if (myTasksRequestIdRef.current !== requestId) return

      setTasks(fetchedTasks)
    } catch (error) {
      if (myTasksRequestIdRef.current !== requestId) return

      setErrorMessage(
        getApiErrorMessage(error, '作成したタスクを取得できませんでした。'),
      )
    } finally {
      if (myTasksRequestIdRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadMyTasks(emptyFilters)
  }, [loadMyTasks])

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      filters.due_on_from &&
      filters.due_on_to &&
      filters.due_on_from > filters.due_on_to
    ) {
      setErrorMessage('期限日の開始日は終了日以前の日付を指定してください。')
      return
    }

    void loadMyTasks({ ...filters })
  }

  const handleResetFilters = () => {
    setFilters(emptyFilters)
    void loadMyTasks(emptyFilters)
  }

  const hasActiveFilters = Boolean(
    appliedFilters.status ||
      appliedFilters.priority ||
      appliedFilters.due_on_from ||
      appliedFilters.due_on_to,
  )

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Created Tasks</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              作成したタスク
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              自分が作成したタスクを、ステータス・優先度・期限日で絞り込んで確認できます。
            </p>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
            {tasks.length}件
          </div>
        </div>

        <form
          className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
          onSubmit={handleFilterSubmit}
        >
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">status</span>
            <select
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
              disabled={isLoading}
              onChange={(event) => {
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  status: event.target.value as TaskStatus | '',
                }))
              }}
              value={filters.status}
            >
              <option value="">すべて</option>
              {taskStatusOptions.map((option) => (
                <option key={option.status} value={option.status}>
                  {option.title}
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
              disabled={isLoading}
              onChange={(event) => {
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  priority: event.target.value as TaskPriority | '',
                }))
              }}
              value={filters.priority}
            >
              <option value="">すべて</option>
              {taskPriorityOptions.map((option) => (
                <option key={option.priority} value={option.priority}>
                  {option.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              期限日（開始）
            </span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
              disabled={isLoading}
              onChange={(event) => {
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  due_on_from: event.target.value,
                }))
              }}
              type="date"
              value={filters.due_on_from}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              期限日（終了）
            </span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
              disabled={isLoading}
              onChange={(event) => {
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  due_on_to: event.target.value,
                }))
              }}
              type="date"
              value={filters.due_on_to}
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-indigo-300"
              disabled={isLoading}
              type="submit"
            >
              絞り込み
            </button>
            <button
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              disabled={isLoading}
              onClick={handleResetFilters}
              type="button"
            >
              リセット
            </button>
          </div>
        </form>
      </section>

      {isLoading ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          作成したタスクを読み込んでいます。
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-lg border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          <p className="whitespace-pre-line">{errorMessage}</p>
          <button
            className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100"
            onClick={() => {
              void loadMyTasks(appliedFilters)
            }}
            type="button"
          >
            再読み込み
          </button>
        </section>
      ) : null}

      {!isLoading && !errorMessage && tasks.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            {hasActiveFilters
              ? '条件に一致する作成タスクはありません。'
              : '作成したタスクはまだありません。'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {hasActiveFilters
              ? 'フィルタ条件を変えるか、リセットして確認してください。'
              : '自分が作成したタスクがここに表示されます。'}
          </p>
        </section>
      ) : null}

      {!isLoading && !errorMessage && tasks.length > 0 ? (
        <section className="space-y-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              onClick={() => {
                void navigate(`/projects/${task.project.id}`)
              }}
              task={task}
            />
          ))}
        </section>
      ) : null}
    </div>
  )
}
