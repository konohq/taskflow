import type { KanbanResponse } from '../../types/task'
import { kanbanColumns } from '../tasks/taskDisplay'
import { KanbanColumn } from './KanbanColumn'

type KanbanBoardProps = {
  kanban: KanbanResponse
  onTaskSelect: (taskId: number) => void
  selectedTaskId: number | null
}

export function KanbanBoard({
  kanban,
  onTaskSelect,
  selectedTaskId,
}: KanbanBoardProps) {
  return (
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
          {kanbanColumns.map((column) => (
            <KanbanColumn
              accentClass={column.accentClass}
              isTaskSelected={(taskId) => selectedTaskId === taskId}
              key={column.status}
              onTaskSelect={onTaskSelect}
              tasks={kanban.columns[column.status]}
              title={column.title}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
