import type { Task } from '../../types/task'
import { TaskPriorityBadge } from '../tasks/TaskPriorityBadge'
import { formatDate } from '../tasks/taskDisplay'

type TaskCardProps = {
  isSelected: boolean
  onClick: () => void
  task: Task
}

export function TaskCard({ isSelected, onClick, task }: TaskCardProps) {
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
          <dt className="text-xs font-semibold text-slate-500">期限日</dt>
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
