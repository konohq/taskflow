import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchTeamProjects } from '../api/projects'
import { fetchTeams } from '../api/teams'
import type { Project, ProjectStatus } from '../types/project'
import type { Team } from '../types/team'
import { getApiErrorMessage } from '../utils/apiError'

type ProjectWithTeam = Project & {
  team: Pick<Team, 'id' | 'name'>
}

const projectStatusLabels: Record<ProjectStatus, string> = {
  active: 'アクティブ',
  archived: 'アーカイブ',
}

const projectStatusClasses: Record<ProjectStatus, string> = {
  active: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  archived: 'border-slate-200 bg-slate-50 text-slate-600',
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
        projectStatusClasses[status],
      ].join(' ')}
    >
      {projectStatusLabels[status]}
    </span>
  )
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<ProjectWithTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const fetchedTeams = await fetchTeams()
      const projectGroups = await Promise.all(
        fetchedTeams.map(async (team) => {
          const teamProjects = await fetchTeamProjects(String(team.id))

          return teamProjects.map((project) => ({
            ...project,
            team: {
              id: team.id,
              name: team.name,
            },
          }))
        }),
      )

      setTeams(fetchedTeams)
      setProjects(projectGroups.flat())
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, 'プロジェクト一覧を取得できませんでした。'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (firstProject, secondProject) =>
          new Date(secondProject.updated_at).getTime() -
          new Date(firstProject.updated_at).getTime(),
      ),
    [projects],
  )

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Projects</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              プロジェクト一覧
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              所属チーム内のプロジェクトを横断して確認できます。
              プロジェクトを選択するとカンバンへ移動します。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-72">
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-indigo-700">
              <span className="block text-xs font-medium text-indigo-500">
                所属チーム
              </span>
              <span className="mt-1 block text-2xl font-semibold">
                {teams.length}件
              </span>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-blue-700">
              <span className="block text-xs font-medium text-blue-500">
                プロジェクト
              </span>
              <span className="mt-1 block text-2xl font-semibold">
                {projects.length}件
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              所属チームのプロジェクト
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              所属しているチームごとにプロジェクトをまとめて表示します。
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={isLoading}
            onClick={() => {
              void loadProjects()
            }}
            type="button"
          >
            再読み込み
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            プロジェクト一覧を読み込んでいます。
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-lg border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700">
            <p className="whitespace-pre-line">{errorMessage}</p>
            <button
              className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100"
              onClick={() => {
                void loadProjects()
              }}
              type="button"
            >
              再読み込み
            </button>
          </div>
        ) : null}

        {!isLoading && !errorMessage && teams.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              所属チームがまだありません。
            </p>
            <p className="mt-1 text-sm text-slate-500">
              チームを作成すると、プロジェクトを追加できます。
            </p>
            <Link
              className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              to="/teams"
            >
              チームを作成
            </Link>
          </div>
        ) : null}

        {!isLoading &&
        !errorMessage &&
        teams.length > 0 &&
        sortedProjects.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              プロジェクトはまだありません。
            </p>
            <p className="mt-1 text-sm text-slate-500">
              チーム詳細から最初のプロジェクトを作成してください。
            </p>
            <Link
              className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              to="/teams"
            >
              チーム一覧へ
            </Link>
          </div>
        ) : null}

        {!isLoading && !errorMessage && sortedProjects.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedProjects.map((project) => (
              <button
                className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
                key={project.id}
                onClick={() => {
                  void navigate(`/projects/${project.id}`)
                }}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-indigo-600">
                      {project.team.name}
                    </p>
                    <h4 className="mt-1 break-words text-base font-semibold text-slate-950">
                      {project.name}
                    </h4>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <p className="mt-3 line-clamp-3 min-h-16 text-sm leading-6 text-slate-600">
                  {project.description || '説明は未設定です。'}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>更新日 {formatDateTime(project.updated_at)}</span>
                  <span className="font-medium text-indigo-600">
                    カンバンを開く
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
