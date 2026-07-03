import { apiClient } from './client'
import type {
  CreateTaskInput,
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
