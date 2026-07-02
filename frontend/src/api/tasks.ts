import { apiClient } from './client'
import type { CreateTaskInput, TaskResponse } from '../types/task'

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
