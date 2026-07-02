import { apiClient } from './client'
import type {
  CreateProjectInput,
  ProjectResponse,
  ProjectsResponse,
} from '../types/project'

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
