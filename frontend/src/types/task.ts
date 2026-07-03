export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high'

export type UserMini = {
  id: number
  name: string
}

export type Task = {
  id: number
  project_id?: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_on: string | null
  assignee: UserMini | null
  created_by: UserMini
  created_at: string
  updated_at: string
}

export type TaskResponse = {
  task: Task
}

export type CreateTaskInput = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_on: string | null
  assignee_id: number | null
}

export type UpdateTaskInput = CreateTaskInput

export type MyTask = Task & {
  project: {
    id: number
    name: string
  }
  team: {
    id: number
    name: string
  }
}

export type MyTasksResponse = {
  tasks: MyTask[]
}

export type MyTasksFilterParams = {
  status?: TaskStatus | ''
  priority?: TaskPriority | ''
  due_on_from?: string
  due_on_to?: string
}

export type KanbanResponse = {
  project: {
    id: number
    name: string
  }
  columns: Record<TaskStatus, Task[]>
}
