import { apiClient } from './client'
import type {
  CreateTeamMemberInput,
  TeamMemberResponse,
  TeamMembersResponse,
} from '../types/team'

export async function fetchTeamMembers(teamId: string) {
  const response = await apiClient.get<TeamMembersResponse>(
    `/teams/${teamId}/members`,
  )

  return response.data.members
}

export async function createTeamMember(
  teamId: string,
  input: CreateTeamMemberInput,
) {
  const response = await apiClient.post<TeamMemberResponse>(
    `/teams/${teamId}/members`,
    {
      member: input,
    },
  )

  return response.data.member
}

export async function deleteTeamMember(
  teamId: string,
  memberId: number | string,
) {
  await apiClient.delete(`/teams/${teamId}/members/${memberId}`)
}
