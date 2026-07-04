import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createTaskComment, fetchTaskComments } from '../api/comments'
import { deleteProject, fetchProject, fetchProjectKanban } from '../api/projects'
import { fetchTeamMembers } from '../api/teamMembers'
import { createProjectTask, deleteTask, fetchTask, updateTask } from '../api/tasks'
import { KanbanBoard } from '../features/kanban/KanbanBoard'
import { TaskCreateForm } from '../features/tasks/TaskCreateForm'
import { TaskEditPanel } from '../features/tasks/TaskEditPanel'
import { kanbanColumns } from '../features/tasks/taskDisplay'
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

function removeTaskFromKanban(
  currentKanban: KanbanResponse,
  taskId: number,
): KanbanResponse {
  return {
    ...currentKanban,
    columns: {
      todo: currentKanban.columns.todo.filter((task) => task.id !== taskId),
      in_progress: currentKanban.columns.in_progress.filter(
        (task) => task.id !== taskId,
      ),
      review: currentKanban.columns.review.filter((task) => task.id !== taskId),
      done: currentKanban.columns.done.filter((task) => task.id !== taskId),
    },
  }
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
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
  const [isTaskCreateOpen, setIsTaskCreateOpen] = useState(false)
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
  const [projectDeleteErrorMessage, setProjectDeleteErrorMessage] = useState('')
  const [isProjectDeleting, setIsProjectDeleting] = useState(false)
  const [isTaskDeleting, setIsTaskDeleting] = useState(false)
  const selectedTaskIdRef = useRef<number | null>(null)

  const setEditFormValues = useCallback((task: Task) => {
    setEditTaskTitle(task.title)
    setEditTaskDescription(task.description ?? '')
    setEditTaskStatus(task.status)
    setEditTaskPriority(task.priority)
    setEditTaskDueOn(task.due_on ?? '')
    setEditTaskAssigneeId(task.assignee ? String(task.assignee.id) : '')
  }, [])

  const resetTaskCreateForm = useCallback((status: TaskStatus) => {
    setTaskTitle('')
    setTaskDescription('')
    setTaskStatus(status)
    setTaskPriority('medium')
    setTaskDueOn('')
    setTaskAssigneeId('')
    setTaskErrorMessage('')
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
      setProjectDeleteErrorMessage('')
      setIsTaskCreateOpen(false)
      resetTaskCreateForm('todo')
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, 'プロジェクト詳細を取得できませんでした。'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [projectId, resetTaskCreateForm])

  useEffect(() => {
    void loadProjectDetail()
  }, [loadProjectDetail])

  const handleTaskCreateClick = (status: TaskStatus) => {
    resetTaskCreateForm(status)
    setIsTaskCreateOpen(true)
  }

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
      setIsTaskCreateOpen(false)
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

  const handleProjectDelete = async () => {
    if (isProjectDeleting || !project || !projectId) return

    const confirmed = window.confirm(
      `プロジェクト「${project.name}」を削除します。\n関連するタスクとコメントも削除されます。この操作は取り消せません。`,
    )

    if (!confirmed) return

    setIsProjectDeleting(true)
    setProjectDeleteErrorMessage('')

    try {
      await deleteProject(projectId)
      void navigate('/projects')
    } catch (error) {
      setProjectDeleteErrorMessage(
        getApiErrorMessage(error, 'プロジェクトを削除できませんでした。'),
      )
    } finally {
      setIsProjectDeleting(false)
    }
  }

  const handleTaskDelete = async () => {
    if (isTaskDeleting || !selectedTask) return

    if (selectedTaskIdRef.current !== selectedTask.id) {
      setTaskDetailErrorMessage('選択中のタスク詳細を読み込んでいます。')
      return
    }

    const taskId = selectedTask.id
    const confirmed = window.confirm(
      `タスク「${selectedTask.title}」を削除します。\n関連するコメントも削除されます。この操作は取り消せません。`,
    )

    if (!confirmed) return

    setIsTaskDeleting(true)
    setTaskDetailErrorMessage('')
    setTaskUpdateMessage('')
    setCommentSubmitErrorMessage('')

    try {
      await deleteTask(String(taskId))

      setKanban((currentKanban) => {
        if (!currentKanban) return currentKanban

        return removeTaskFromKanban(currentKanban, taskId)
      })

      if (selectedTaskIdRef.current === taskId) {
        selectedTaskIdRef.current = null
        setSelectedTaskId(null)
        setSelectedTask(null)
        setComments([])
        setCommentContent('')
        setCommentsErrorMessage('')
        setCommentSubmitErrorMessage('')
      }
    } catch (error) {
      if (selectedTaskIdRef.current !== taskId) return

      setTaskDetailErrorMessage(
        getApiErrorMessage(error, 'タスクを削除できませんでした。'),
      )
    } finally {
      setIsTaskDeleting(false)
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
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <ProjectStatusBadge status={project.status} />
                <button
                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:border-rose-100 disabled:text-rose-300"
                  disabled={isProjectDeleting}
                  onClick={() => {
                    void handleProjectDelete()
                  }}
                  type="button"
                >
                  {isProjectDeleting
                    ? '削除しています...'
                    : 'プロジェクトを削除'}
                </button>
              </div>
            </div>

            {projectDeleteErrorMessage ? (
              <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                {projectDeleteErrorMessage}
              </div>
            ) : null}
          </section>

          <KanbanBoard
            kanban={kanban}
            onTaskCreateClick={handleTaskCreateClick}
            onTaskSelect={(taskId) => {
              void handleTaskSelect(taskId)
            }}
            selectedTaskId={selectedTaskId}
          />

          <TaskEditPanel
            commentContent={commentContent}
            commentSubmitErrorMessage={commentSubmitErrorMessage}
            comments={comments}
            commentsErrorMessage={commentsErrorMessage}
            editTaskAssigneeId={editTaskAssigneeId}
            editTaskDescription={editTaskDescription}
            editTaskDueOn={editTaskDueOn}
            editTaskPriority={editTaskPriority}
            editTaskStatus={editTaskStatus}
            editTaskTitle={editTaskTitle}
            isCommentSubmitting={isCommentSubmitting}
            isCommentsLoading={isCommentsLoading}
            isTaskDeleting={isTaskDeleting}
            isTaskDetailLoading={isTaskDetailLoading}
            isTaskUpdating={isTaskUpdating}
            onCommentSubmit={handleCommentSubmit}
            onTaskDelete={handleTaskDelete}
            onTaskUpdate={handleTaskUpdate}
            selectedTask={selectedTask}
            selectedTaskId={selectedTaskId}
            setCommentContent={setCommentContent}
            setEditTaskAssigneeId={setEditTaskAssigneeId}
            setEditTaskDescription={setEditTaskDescription}
            setEditTaskDueOn={setEditTaskDueOn}
            setEditTaskPriority={setEditTaskPriority}
            setEditTaskStatus={setEditTaskStatus}
            setEditTaskTitle={setEditTaskTitle}
            taskDetailErrorMessage={taskDetailErrorMessage}
            taskUpdateMessage={taskUpdateMessage}
            teamMembers={teamMembers}
          />

          {isTaskCreateOpen ? (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8">
              <div className="w-full max-w-2xl">
                <div className="mb-3 flex justify-end">
                  <button
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    disabled={isTaskSubmitting}
                    onClick={() => {
                      setIsTaskCreateOpen(false)
                      setTaskErrorMessage('')
                    }}
                    type="button"
                  >
                    閉じる
                  </button>
                </div>

                <TaskCreateForm
                  isTaskSubmitting={isTaskSubmitting}
                  onSubmit={handleTaskSubmit}
                  setTaskAssigneeId={setTaskAssigneeId}
                  setTaskDescription={setTaskDescription}
                  setTaskDueOn={setTaskDueOn}
                  setTaskPriority={setTaskPriority}
                  setTaskStatus={setTaskStatus}
                  setTaskTitle={setTaskTitle}
                  taskAssigneeId={taskAssigneeId}
                  taskDescription={taskDescription}
                  taskDueOn={taskDueOn}
                  taskErrorMessage={taskErrorMessage}
                  taskPriority={taskPriority}
                  taskStatus={taskStatus}
                  taskTitle={taskTitle}
                  teamMembers={teamMembers}
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
