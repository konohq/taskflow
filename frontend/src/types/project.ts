export type ProjectStatus = 'active' | 'archived'

export type Project = {
  id: number
  team_id: number
  name: string
  description: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string
}
