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

export type ProjectsResponse = {
  projects: Project[]
}

export type ProjectResponse = {
  project: Project
}

export type CreateProjectInput = {
  name: string
  description: string
  status: ProjectStatus
}
