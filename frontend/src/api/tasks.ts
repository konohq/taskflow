import { apiClient } from './client'
import type {
  CreateTaskInput,
  MyTasksFilterParams,
  MyTasksResponse,
  TaskResponse,
  UpdateTaskInput,
} from '../types/task'

export async function createProjectTask(
  projectId: string,
  input: CreateTaskInput,
) {
  const response = await apiClient.post<TaskResponse>(
    `/projects/${projectId}/tasks`,
    {
      task: input,
    },
  )

  return response.data.task
}

export async function fetchTask(taskId: string) {
  const response = await apiClient.get<TaskResponse>(`/tasks/${taskId}`)

  return response.data.task
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  const response = await apiClient.patch<TaskResponse>(`/tasks/${taskId}`, {
    task: input,
  })

  return response.data.task
}

export async function fetchMyTasks(filters: MyTasksFilterParams = {}) {
  const response = await apiClient.get<MyTasksResponse>('/my/tasks', {
    params: {
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      due_on_from: filters.due_on_from || undefined,
      due_on_to: filters.due_on_to || undefined,
    },
  })

  return response.data.tasks
}
