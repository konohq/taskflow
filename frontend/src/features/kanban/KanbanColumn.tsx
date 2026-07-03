import type { Task } from '../../types/task'
import { TaskCard } from './TaskCard'

type KanbanColumnProps = {
  accentClass: string
  isTaskSelected: (taskId: number) => boolean
  onTaskSelect: (taskId: number) => void
  tasks: Task[]
  title: string
}

export function KanbanColumn({
  accentClass,
  isTaskSelected,
  onTaskSelect,
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
