import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createTeamProject, fetchTeamProjects } from '../api/projects'
import { fetchTeam } from '../api/teams'
import { fetchTeamMembers } from '../api/teamMembers'
import type { Project, ProjectStatus } from '../types/project'
import type { Team, TeamMember, TeamMemberRole } from '../types/team'
import { getApiErrorMessage } from '../utils/apiError'

const roleLabels: Record<TeamMemberRole, string> = {
  owner: 'オーナー',
  admin: '管理者',
  member: 'メンバー',
}

const roleClasses: Record<TeamMemberRole, string> = {
  owner: 'border-indigo-100 bg-indigo-50 text-indigo-700',
  admin: 'border-blue-100 bg-blue-50 text-blue-700',
  member: 'border-slate-200 bg-slate-50 text-slate-600',
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

function RoleBadge({ role }: { role: TeamMemberRole }) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
        roleClasses[role],
      ].join(' ')}
    >
      {roleLabels[role]}
    </span>
  )
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

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('active')
  const [projectErrorMessage, setProjectErrorMessage] = useState('')
  const [isProjectSubmitting, setIsProjectSubmitting] = useState(false)

  const loadTeamDetail = useCallback(async () => {
    if (!teamId) {
      setErrorMessage('チームIDが見つかりません。')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const [fetchedTeam, fetchedMembers, fetchedProjects] =
        await Promise.all([
          fetchTeam(teamId),
          fetchTeamMembers(teamId),
          fetchTeamProjects(teamId),
        ])

      setTeam(fetchedTeam)
      setMembers(fetchedMembers)
      setProjects(fetchedProjects)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'チーム詳細を取得できませんでした。'))
    } finally {
      setIsLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    void loadTeamDetail()
  }, [loadTeamDetail])

  const handleProjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isProjectSubmitting) return

    if (!teamId) {
      setProjectErrorMessage('チームIDが見つかりません。')
      return
    }

    const trimmedName = projectName.trim()
    const trimmedDescription = projectDescription.trim()

    if (!trimmedName) {
      setProjectErrorMessage('プロジェクト名を入力してください。')
      return
    }

    setIsProjectSubmitting(true)
    setProjectErrorMessage('')

    try {
      const createdProject = await createTeamProject(teamId, {
        name: trimmedName,
        description: trimmedDescription,
        status: projectStatus,
      })

      setProjects((currentProjects) => [createdProject, ...currentProjects])
      setProjectName('')
      setProjectDescription('')
      setProjectStatus('active')
    } catch (error) {
      setProjectErrorMessage(
        getApiErrorMessage(error, 'プロジェクトを作成できませんでした。'),
      )
    } finally {
      setIsProjectSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="inline-flex items-center text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          to="/teams"
        >
          ← チーム一覧に戻る
        </Link>
      </div>

      {isLoading ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          チーム詳細を読み込んでいます。
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-lg border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          {errorMessage}
        </section>
      ) : null}

      {!isLoading && !errorMessage && team ? (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-indigo-600">Team</p>
                <h2 className="mt-1 break-words text-2xl font-semibold text-slate-950">
                  {team.name}
                </h2>
                <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-600">
                  {team.description || '説明は未設定です。'}
                </p>
              </div>
              <RoleBadge role={team.current_user_role} />
            </div>

            <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-semibold text-slate-500">作成日</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {formatDateTime(team.created_at)}
                </dd>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-semibold text-slate-500">更新日</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {formatDateTime(team.updated_at)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    プロジェクト一覧
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    このチームで管理しているプロジェクトを表示します。
                  </p>
                </div>
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                  {projects.length}件
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    プロジェクトはまだありません。
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    右側のフォームから最初のプロジェクトを作成できます。
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {projects.map((project) => (
                    <button
                      className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      key={project.id}
                      onClick={() => {
                        void navigate(`/projects/${project.id}`)
                      }}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="min-w-0 break-words text-base font-semibold text-slate-950">
                          {project.name}
                        </h4>
                        <ProjectStatusBadge status={project.status} />
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {project.description || '説明は未設定です。'}
                      </p>
                      <p className="mt-4 text-xs font-medium text-slate-500">
                        作成日 {formatDateTime(project.created_at)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              onSubmit={(event) => {
                void handleProjectSubmit(event)
              }}
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  プロジェクト作成
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  チームに紐づく新しいプロジェクトを作成します。
                </p>
              </div>

              {projectErrorMessage ? (
                <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                  {projectErrorMessage}
                </div>
              ) : null}

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    プロジェクト名
                  </span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                    disabled={isProjectSubmitting}
                    onChange={(event) => {
                      setProjectName(event.target.value)
                    }}
                    placeholder="例: モバイルアプリ改善"
                    type="text"
                    value={projectName}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    説明
                  </span>
                  <textarea
                    className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                    disabled={isProjectSubmitting}
                    onChange={(event) => {
                      setProjectDescription(event.target.value)
                    }}
                    placeholder="プロジェクトの目的や範囲を入力"
                    value={projectDescription}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    status
                  </span>
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                    disabled={isProjectSubmitting}
                    onChange={(event) => {
                      setProjectStatus(event.target.value as ProjectStatus)
                    }}
                    value={projectStatus}
                  >
                    <option value="active">アクティブ</option>
                    <option value="archived">アーカイブ</option>
                  </select>
                </label>
              </div>

              <button
                className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-indigo-300"
                disabled={isProjectSubmitting}
                type="submit"
              >
                {isProjectSubmitting ? '作成しています...' : 'プロジェクトを作成'}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  メンバー一覧
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  このチームに所属しているメンバーを表示します。
                </p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                {members.length}人
              </div>
            </div>

            {members.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                メンバーがまだ登録されていません。
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                  <span>名前</span>
                  <span>メールアドレス</span>
                  <span>role</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {members.map((member) => (
                    <li
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-4 px-4 py-4"
                      key={member.id}
                    >
                      <span className="min-w-0 truncate text-sm font-semibold text-slate-900">
                        {member.user.name}
                      </span>
                      <span className="min-w-0 truncate text-sm text-slate-600">
                        {member.user.email}
                      </span>
                      <RoleBadge role={member.role} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
