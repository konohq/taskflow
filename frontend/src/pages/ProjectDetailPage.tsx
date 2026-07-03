import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createTaskComment, fetchTaskComments } from '../api/comments'
import { fetchProject, fetchProjectKanban } from '../api/projects'
import { fetchTeamMembers } from '../api/teamMembers'
import { createProjectTask, fetchTask, updateTask } from '../api/tasks'
import type { Comment } from '../types/comment'
import type { Project, ProjectStatus } from '../types/project'
import type { TeamMember } from '../types/team'
import type {
  CreateTaskInput,
  KanbanResponse,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function replaceTaskInKanban(
  currentKanban: KanbanResponse,
  updatedTask: Task,
): KanbanResponse {
  const nextColumns: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  }
  let inserted = false

  kanbanColumns.forEach((column) => {
    nextColumns[column.status] = currentKanban.columns[column.status].flatMap(
      (task) => {
        if (task.id !== updatedTask.id) return [task]

        if (column.status === updatedTask.status) {
          inserted = true
          return [updatedTask]
        }

        return []
      },
    )
  })

  if (!inserted) {
    nextColumns[updatedTask.status] = [
      updatedTask,
      ...nextColumns[updatedTask.status],
    ]
  }

  return {
    ...currentKanban,
    columns: nextColumns,
  }
}

function TaskCard({
  isSelected,
  onClick,
  task,
}: {
  isSelected: boolean
  onClick: () => void
  task: Task
}) {
  return (
    <button
      className={[
        'block w-full rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 hover:shadow focus:outline-none focus:ring-4 focus:ring-indigo-100',
        isSelected ? 'border-indigo-300 ring-4 ring-indigo-100' : 'border-slate-200',
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
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
    </button>
  )
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [kanban, setKanban] = useState<KanbanResponse | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo')
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium')
  const [taskDueOn, setTaskDueOn] = useState('')
  const [taskAssigneeId, setTaskAssigneeId] = useState('')
  const [taskErrorMessage, setTaskErrorMessage] = useState('')
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDetailLoading, setIsTaskDetailLoading] = useState(false)
  const [taskDetailErrorMessage, setTaskDetailErrorMessage] = useState('')
  const [taskUpdateMessage, setTaskUpdateMessage] = useState('')
  const [isTaskUpdating, setIsTaskUpdating] = useState(false)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDescription, setEditTaskDescription] = useState('')
  const [editTaskStatus, setEditTaskStatus] = useState<TaskStatus>('todo')
  const [editTaskPriority, setEditTaskPriority] =
    useState<TaskPriority>('medium')
  const [editTaskDueOn, setEditTaskDueOn] = useState('')
  const [editTaskAssigneeId, setEditTaskAssigneeId] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [commentContent, setCommentContent] = useState('')
  const [isCommentsLoading, setIsCommentsLoading] = useState(false)
  const [commentsErrorMessage, setCommentsErrorMessage] = useState('')
  const [commentSubmitErrorMessage, setCommentSubmitErrorMessage] =
    useState('')
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const selectedTaskIdRef = useRef<number | null>(null)

  const setEditFormValues = useCallback((task: Task) => {
    setEditTaskTitle(task.title)
    setEditTaskDescription(task.description ?? '')
    setEditTaskStatus(task.status)
    setEditTaskPriority(task.priority)
    setEditTaskDueOn(task.due_on ?? '')
    setEditTaskAssigneeId(task.assignee ? String(task.assignee.id) : '')
  }, [])

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
      const fetchedTeamMembers = await fetchTeamMembers(
        String(fetchedProject.team_id),
      )

      setProject(fetchedProject)
      setKanban(fetchedKanban)
      setTeamMembers(fetchedTeamMembers)
      selectedTaskIdRef.current = null
      setSelectedTaskId(null)
      setSelectedTask(null)
      setTaskDetailErrorMessage('')
      setTaskUpdateMessage('')
      setComments([])
      setCommentContent('')
      setCommentsErrorMessage('')
      setCommentSubmitErrorMessage('')
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

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isTaskSubmitting) return

    if (!projectId) {
      setTaskErrorMessage('プロジェクトIDが見つかりません。')
      return
    }

    const trimmedTitle = taskTitle.trim()
    const trimmedDescription = taskDescription.trim()

    if (!trimmedTitle) {
      setTaskErrorMessage('タスクタイトルを入力してください。')
      return
    }

    const input: CreateTaskInput = {
      title: trimmedTitle,
      description: trimmedDescription,
      status: taskStatus,
      priority: taskPriority,
      due_on: taskDueOn || null,
      assignee_id: taskAssigneeId ? Number(taskAssigneeId) : null,
    }

    setIsTaskSubmitting(true)
    setTaskErrorMessage('')

    try {
      const createdTask = await createProjectTask(projectId, input)

      setKanban((currentKanban) => {
        if (!currentKanban) return currentKanban

        return {
          ...currentKanban,
          columns: {
            ...currentKanban.columns,
            [createdTask.status]: [
              createdTask,
              ...currentKanban.columns[createdTask.status],
            ],
          },
        }
      })
      setTaskTitle('')
      setTaskDescription('')
      setTaskStatus('todo')
      setTaskPriority('medium')
      setTaskDueOn('')
      setTaskAssigneeId('')
    } catch (error) {
      setTaskErrorMessage(
        getApiErrorMessage(error, 'タスクを作成できませんでした。'),
      )
    } finally {
      setIsTaskSubmitting(false)
    }
  }

  const handleTaskSelect = async (taskId: number) => {
    selectedTaskIdRef.current = taskId
    setSelectedTaskId(taskId)
    setSelectedTask(null)
    setIsTaskDetailLoading(true)
    setTaskDetailErrorMessage('')
    setTaskUpdateMessage('')
    setComments([])
    setCommentContent('')
    setCommentsErrorMessage('')
    setCommentSubmitErrorMessage('')
    setIsCommentsLoading(true)
    setIsCommentSubmitting(false)

    try {
      const fetchedTask = await fetchTask(String(taskId))

      if (selectedTaskIdRef.current !== taskId) return

      setSelectedTask(fetchedTask)
      setEditFormValues(fetchedTask)
    } catch (error) {
      if (selectedTaskIdRef.current !== taskId) return

      setTaskDetailErrorMessage(
        getApiErrorMessage(error, 'タスク詳細を取得できませんでした。'),
      )
      setIsCommentsLoading(false)
      return
    } finally {
      if (selectedTaskIdRef.current === taskId) {
        setIsTaskDetailLoading(false)
      }
    }

    try {
      const fetchedComments = await fetchTaskComments(String(taskId))

      if (selectedTaskIdRef.current !== taskId) return

      setComments(fetchedComments)
    } catch (error) {
      if (selectedTaskIdRef.current !== taskId) return

      setCommentsErrorMessage(
        getApiErrorMessage(error, 'コメント一覧を取得できませんでした。'),
      )
    } finally {
      if (selectedTaskIdRef.current === taskId) {
        setIsCommentsLoading(false)
      }
    }
  }

  const handleTaskUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isTaskUpdating) return

    if (!selectedTask) {
      setTaskDetailErrorMessage('編集するタスクを選択してください。')
      return
    }

    if (selectedTaskIdRef.current !== selectedTask.id) {
      setTaskDetailErrorMessage('選択中のタスク詳細を読み込んでいます。')
      return
    }

    const trimmedTitle = editTaskTitle.trim()
    const trimmedDescription = editTaskDescription.trim()

    if (!trimmedTitle) {
      setTaskDetailErrorMessage('タスクタイトルを入力してください。')
      return
    }

    const input: UpdateTaskInput = {
      title: trimmedTitle,
      description: trimmedDescription,
      status: editTaskStatus,
      priority: editTaskPriority,
      due_on: editTaskDueOn || null,
      assignee_id: editTaskAssigneeId ? Number(editTaskAssigneeId) : null,
    }

    setIsTaskUpdating(true)
    setTaskDetailErrorMessage('')
    setTaskUpdateMessage('')

    try {
      const updatedTask = await updateTask(String(selectedTask.id), input)

      setKanban((currentKanban) => {
        if (!currentKanban) return currentKanban

        return replaceTaskInKanban(currentKanban, updatedTask)
      })

      if (selectedTaskIdRef.current === updatedTask.id) {
        setSelectedTask(updatedTask)
        setEditFormValues(updatedTask)
        setTaskUpdateMessage('タスクを更新しました。')
      }
    } catch (error) {
      setTaskDetailErrorMessage(
        getApiErrorMessage(error, 'タスクを更新できませんでした。'),
      )
    } finally {
      setIsTaskUpdating(false)
    }
  }

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isCommentSubmitting) return

    if (!selectedTask) {
      setCommentSubmitErrorMessage('コメントするタスクを選択してください。')
      return
    }

    if (selectedTaskIdRef.current !== selectedTask.id) {
      setCommentSubmitErrorMessage('選択中のタスク詳細を読み込んでいます。')
      return
    }

    const trimmedContent = commentContent.trim()

    if (!trimmedContent) {
      setCommentSubmitErrorMessage('コメント本文を入力してください。')
      return
    }

    const taskId = selectedTask.id

    setIsCommentSubmitting(true)
    setCommentSubmitErrorMessage('')

    try {
      const createdComment = await createTaskComment(String(taskId), {
        content: trimmedContent,
      })

      if (selectedTaskIdRef.current !== taskId) return

      setCommentsErrorMessage('')
      setComments((currentComments) => [...currentComments, createdComment])
      setCommentContent('')
    } catch (error) {
      if (selectedTaskIdRef.current !== taskId) return

      setCommentSubmitErrorMessage(
        getApiErrorMessage(error, 'コメントを投稿できませんでした。'),
      )
    } finally {
      if (selectedTaskIdRef.current === taskId) {
        setIsCommentSubmitting(false)
      }
    }
  }

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

          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={(event) => {
              void handleTaskSubmit(event)
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  タスク作成
                </h3>
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
                <span className="text-sm font-semibold text-slate-700">
                  title
                </span>
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
                <span className="text-sm font-semibold text-slate-700">
                  status
                </span>
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
                <span className="text-sm font-semibold text-slate-700">
                  priority
                </span>
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
                <span className="text-sm font-semibold text-slate-700">
                  due_on
                </span>
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
                    void handleTaskUpdate(event)
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
                      due_on
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
                    <dl className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
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
                          最終更新
                        </dt>
                        <dd className="mt-1 font-medium text-slate-800">
                          {formatDateTime(selectedTask.updated_at)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="lg:col-span-2">
                    <button
                      className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-indigo-300"
                      disabled={isTaskUpdating}
                      type="submit"
                    >
                      {isTaskUpdating ? '更新しています...' : 'タスクを更新'}
                    </button>
                  </div>
                </form>

                <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-950">
                        コメント
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        選択中のタスクへのコメントです。
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {comments.length}件
                    </span>
                  </div>

                  {isCommentsLoading ? (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
                      コメントを読み込んでいます。
                    </div>
                  ) : null}

                  {commentsErrorMessage ? (
                    <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                      {commentsErrorMessage}
                    </div>
                  ) : null}

                  {!isCommentsLoading &&
                  !commentsErrorMessage &&
                  comments.length === 0 ? (
                    <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
                      コメントはまだありません。
                    </div>
                  ) : null}

                  {!isCommentsLoading &&
                  !commentsErrorMessage &&
                  comments.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                      {comments.map((comment) => (
                        <li
                          className="rounded-lg border border-slate-200 bg-white p-3"
                          key={comment.id}
                        >
                          <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-800">
                            {comment.content}
                          </p>
                          <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-medium text-slate-700">
                              {comment.user.name}
                            </span>
                            <time dateTime={comment.created_at}>
                              {formatDateTime(comment.created_at)}
                            </time>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <form
                    className="mt-4 border-t border-slate-200 pt-4"
                    onSubmit={(event) => {
                      void handleCommentSubmit(event)
                    }}
                  >
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        コメント本文
                      </span>
                      <textarea
                        className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                        disabled={isCommentSubmitting}
                        onChange={(event) => {
                          setCommentContent(event.target.value)
                        }}
                        placeholder="コメントを入力"
                        value={commentContent}
                      />
                    </label>

                    {commentSubmitErrorMessage ? (
                      <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                        {commentSubmitErrorMessage}
                      </div>
                    ) : null}

                    <button
                      className="mt-3 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-indigo-300"
                      disabled={isCommentSubmitting}
                      type="submit"
                    >
                      {isCommentSubmitting ? '投稿しています...' : 'コメントを投稿'}
                    </button>
                  </form>
                </aside>
              </div>
            ) : null}
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
                            <TaskCard
                              isSelected={selectedTaskId === task.id}
                              key={task.id}
                              onClick={() => {
                                void handleTaskSelect(task.id)
                              }}
                              task={task}
                            />
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
