import { apiClient } from './client'
import type { TeamMembersResponse } from '../types/team'

export async function fetchTeamMembers(teamId: string) {
  const response = await apiClient.get<TeamMembersResponse>(
    `/teams/${teamId}/members`,
  )

  return response.data.members
}
