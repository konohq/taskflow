import { apiClient } from './client'
import type {
  CreateProjectInput,
  ProjectResponse,
  ProjectsResponse,
} from '../types/project'
import type { KanbanResponse } from '../types/task'

export async function fetchTeamProjects(teamId: string) {
  const response = await apiClient.get<ProjectsResponse>(
    `/teams/${teamId}/projects`,
  )

  return response.data.projects
}

export async function createTeamProject(
  teamId: string,
  input: CreateProjectInput,
) {
  const response = await apiClient.post<ProjectResponse>(
    `/teams/${teamId}/projects`,
    {
      project: input,
    },
  )

  return response.data.project
}

export async function fetchProject(projectId: string) {
  const response = await apiClient.get<ProjectResponse>(`/projects/${projectId}`)

  return response.data.project
}

export async function fetchProjectKanban(projectId: string) {
  const response = await apiClient.get<KanbanResponse>(
    `/projects/${projectId}/kanban`,
  )

  return response.data
}

export async function deleteProject(projectId: string) {
  await apiClient.delete(`/projects/${projectId}`)
}
