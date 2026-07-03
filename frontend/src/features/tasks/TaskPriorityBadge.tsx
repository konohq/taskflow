import type { TaskPriority } from '../../types/task'
import { taskPriorityClasses, taskPriorityLabels } from './taskDisplay'

type TaskPriorityBadgeProps = {
  priority: TaskPriority
}

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
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
