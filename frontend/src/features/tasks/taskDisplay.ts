import type { TaskPriority, TaskStatus } from '../../types/task'

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const taskPriorityOptions: Array<{
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

export const taskPriorityClasses: Record<TaskPriority, string> = {
  low: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-100 bg-amber-50 text-amber-700',
  high: 'border-rose-100 bg-rose-50 text-rose-700',
}

export const kanbanColumns: Array<{
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

export function formatDate(value: string | null) {
  if (!value) return '期限未設定'

  const [year, month, day] = value.split('-')

  if (!year || !month || !day) return value

  return `${year}/${month}/${day}`
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
