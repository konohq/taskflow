import type { Task, TaskStatus } from '../../types/task'
import { TaskCard } from './TaskCard'

type KanbanColumnProps = {
  accentClass: string
  isTaskSelected: (taskId: number) => boolean
  onTaskCreateClick: (status: TaskStatus) => void
  onTaskSelect: (taskId: number) => void
  status: TaskStatus
  tasks: Task[]
  title: string
}

export function KanbanColumn({
  accentClass,
  isTaskSelected,
  onTaskCreateClick,
  onTaskSelect,
  status,
  tasks,
  title,
}: KanbanColumnProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={['h-2.5 w-2.5 rounded-full', accentClass].join(' ')}
          />
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
            {tasks.length}
          </span>
          <button
            aria-label={`${title}にタスクを追加`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-semibold leading-none text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            onClick={() => {
              onTaskCreateClick(status)
            }}
            type="button"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-500">
            タスクはありません。
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              isSelected={isTaskSelected(task.id)}
              key={task.id}
              onClick={() => {
                onTaskSelect(task.id)
              }}
              task={task}
            />
          ))
        )}
      </div>
    </section>
  )
}
