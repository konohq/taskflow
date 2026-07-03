export type TeamMemberRole = 'owner' | 'admin' | 'member'

export type Team = {
  id: number
  name: string
  description: string | null
  current_user_role: TeamMemberRole
  created_at: string
  updated_at: string
}

export type TeamsResponse = {
  teams: Team[]
}

export type TeamResponse = {
  team: Team
}

export type CreateTeamInput = {
  name: string
  description: string
}

export type TeamMember = {
  id: number
  user: {
    id: number
    name: string
    email: string
  }
  role: TeamMemberRole
  joined_at: string
}

export type TeamMembersResponse = {
  members: TeamMember[]
}

export type TeamMemberResponse = {
  member: TeamMember
}

export type CreateTeamMemberInput = {
  email: string
  role: Exclude<TeamMemberRole, 'owner'>
}
