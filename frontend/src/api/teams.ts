import { apiClient } from './client'
import type { CreateTeamInput, TeamResponse, TeamsResponse } from '../types/team'

export async function fetchTeams() {
  const response = await apiClient.get<TeamsResponse>('/teams')

  return response.data.teams
}

export async function fetchTeam(teamId: string) {
  const response = await apiClient.get<TeamResponse>(`/teams/${teamId}`)

  return response.data.team
}

export async function createTeam(input: CreateTeamInput) {
  const response = await apiClient.post<TeamResponse>('/teams', {
    team: input,
  })

  return response.data.team
}

export async function deleteTeam(teamId: string) {
  await apiClient.delete(`/teams/${teamId}`)
}
