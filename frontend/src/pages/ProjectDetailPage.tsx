import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProject, fetchProjectKanban } from '../api/projects'
import type { Project, ProjectStatus } from '../types/project'
import type {
  KanbanResponse,
  Task,
  TaskPriority,
  TaskStatus,
} from '../types/task'
import { getApiErrorMessage } from '../utils/apiError'

const projectStatusLabels: Record<ProjectStatus, string> = {
  active: 'アクティブ',
  archived: 'アーカイブ',
}

const projectStatusClasses: Record<ProjectStatus, string> = {
  active: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  archived: 'border-slate-200 bg-slate-50 text-slate-600',
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

const kanbanColumns: Array<{
  status: TaskStatus
  title: string
  accentClass: string
}> = [
  {
    status: 'todo',
    title: '未着手',
    accentClass: 'bg-slate-500',
  },
  {
    status: 'in_progress',
    title: '進行中',
    accentClass: 'bg-blue-500',
  },
  {
    status: 'review',
    title: 'レビュー',
    accentClass: 'bg-violet-500',
  },
  {
    status: 'done',
    title: '完了',
    accentClass: 'bg-emerald-500',
  },
]

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
        projectStatusClasses[status],
      ].join(' ')}
    >
      {projectStatusLabels[status]}
    </span>
  )
}

function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold',
        taskPriorityClasses[priority],
      ].join(' ')}
    >
      {taskPriorityLabels[priority]}
    </span>
  )
}

function formatDate(value: string | null) {
  if (!value) return '期限未設定'

  const [year, month, day] = value.split('-')

  if (!year || !month || !day) return value

  return `${year}/${month}/${day}`
}

function TaskCard({ task }: { task: Task }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 break-words text-sm font-semibold leading-6 text-slate-950">
          {task.title}
        </h4>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs font-semibold text-slate-500">期限</dt>
          <dd className="text-right text-xs font-medium text-slate-700">
            {formatDate(task.due_on)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs font-semibold text-slate-500">担当者</dt>
          <dd className="min-w-0 truncate text-right text-xs font-medium text-slate-700">
            {task.assignee?.name ?? '未設定'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs font-semibold text-slate-500">作成者</dt>
          <dd className="min-w-0 truncate text-right text-xs font-medium text-slate-700">
            {task.created_by.name}
          </dd>
        </div>
      </dl>
    </article>
  )
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [kanban, setKanban] = useState<KanbanResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadProjectDetail = useCallback(async () => {
    if (!projectId) {
      setErrorMessage('プロジェクトIDが見つかりません。')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const [fetchedProject, fetchedKanban] = await Promise.all([
        fetchProject(projectId),
        fetchProjectKanban(projectId),
      ])

      setProject(fetchedProject)
      setKanban(fetchedKanban)
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, 'プロジェクト詳細を取得できませんでした。'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadProjectDetail()
  }, [loadProjectDetail])

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="inline-flex items-center text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          to={project ? `/teams/${project.team_id}` : '/teams'}
        >
          ← チーム詳細に戻る
        </Link>
      </div>

      {isLoading ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          プロジェクト詳細を読み込んでいます。
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-lg border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          {errorMessage}
        </section>
      ) : null}

      {!isLoading && !errorMessage && project && kanban ? (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-indigo-600">Project</p>
                <h2 className="mt-1 break-words text-2xl font-semibold text-slate-950">
                  {project.name}
                </h2>
                <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-600">
                  {project.description || '説明は未設定です。'}
                </p>
              </div>
              <ProjectStatusBadge status={project.status} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  カンバンボード
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  タスクをステータスごとに表示します。
                </p>
              </div>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                {kanbanColumns.reduce(
                  (total, column) => total + kanban.columns[column.status].length,
                  0,
                )}
                件
              </div>
            </div>

            <div className="mt-6 overflow-x-auto pb-2">
              <div className="grid min-w-[960px] grid-cols-4 gap-4">
                {kanbanColumns.map((column) => {
                  const tasks = kanban.columns[column.status]

                  return (
                    <section
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      key={column.status}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              'h-2.5 w-2.5 rounded-full',
                              column.accentClass,
                            ].join(' ')}
                          />
                          <h4 className="text-sm font-semibold text-slate-900">
                            {column.title}
                          </h4>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {tasks.length}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {tasks.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-500">
                            タスクはありません。
                          </div>
                        ) : (
                          tasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))
                        )}
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
