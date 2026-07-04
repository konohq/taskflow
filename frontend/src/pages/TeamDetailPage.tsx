import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createTeamProject, fetchTeamProjects } from '../api/projects'
import { deleteTeam, fetchTeam } from '../api/teams'
import {
  createTeamMember,
  deleteTeamMember,
  fetchTeamMembers,
} from '../api/teamMembers'
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
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] =
    useState<Exclude<TeamMemberRole, 'owner'>>('member')
  const [memberErrorMessage, setMemberErrorMessage] = useState('')
  const [memberDeleteErrorMessage, setMemberDeleteErrorMessage] = useState('')
  const [memberSuccessMessage, setMemberSuccessMessage] = useState('')
  const [isMemberSubmitting, setIsMemberSubmitting] = useState(false)
  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')
  const [isDeletingTeam, setIsDeletingTeam] = useState(false)

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

  const handleMemberSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isMemberSubmitting) return

    if (!teamId) {
      setMemberErrorMessage('チームIDが見つかりません。')
      return
    }

    const trimmedEmail = memberEmail.trim()

    if (!trimmedEmail) {
      setMemberErrorMessage('メールアドレスを入力してください。')
      return
    }

    setIsMemberSubmitting(true)
    setMemberErrorMessage('')
    setMemberDeleteErrorMessage('')
    setMemberSuccessMessage('')

    try {
      const createdMember = await createTeamMember(teamId, {
        email: trimmedEmail,
        role: memberRole,
      })

      setMembers((currentMembers) => [createdMember, ...currentMembers])
      setMemberEmail('')
      setMemberRole('member')
      setMemberSuccessMessage('メンバーを追加しました。')
    } catch (error) {
      setMemberErrorMessage(
        getApiErrorMessage(error, 'メンバーを追加できませんでした。'),
      )
    } finally {
      setIsMemberSubmitting(false)
    }
  }

  const handleMemberDelete = async (member: TeamMember) => {
    if (
      deletingMemberId ||
      !teamId ||
      team?.current_user_role !== 'owner' ||
      member.role === 'owner'
    ) {
      return
    }

    const confirmed = window.confirm(
      `メンバー「${member.user.name}」をこのチームから削除します。\nユーザーアカウント自体は削除されません。`,
    )

    if (!confirmed) return

    setDeletingMemberId(member.id)
    setMemberDeleteErrorMessage('')
    setMemberSuccessMessage('')

    try {
      await deleteTeamMember(teamId, member.id)
      setMembers((currentMembers) =>
        currentMembers.filter((currentMember) => currentMember.id !== member.id),
      )
    } catch (error) {
      setMemberDeleteErrorMessage(
        getApiErrorMessage(error, 'メンバーをチームから削除できませんでした。'),
      )
    } finally {
      setDeletingMemberId(null)
    }
  }

  const handleTeamDelete = async () => {
    if (isDeletingTeam || !team || !teamId) return

    const confirmed = window.confirm(
      `チーム「${team.name}」を削除します。\n関連するプロジェクト、タスク、コメントも削除されます。この操作は取り消せません。`,
    )

    if (!confirmed) return

    setIsDeletingTeam(true)
    setDeleteErrorMessage('')

    try {
      await deleteTeam(teamId)
      void navigate('/teams')
    } catch (error) {
      setDeleteErrorMessage(
        getApiErrorMessage(error, 'チームを削除できませんでした。'),
      )
    } finally {
      setIsDeletingTeam(false)
    }
  }

  const memberGridColumns =
    team?.current_user_role === 'owner'
      ? 'grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto_auto]'
      : 'grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]'

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
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <RoleBadge role={team.current_user_role} />
                {team.current_user_role === 'owner' ? (
                  <button
                    className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:border-rose-100 disabled:text-rose-300"
                    disabled={isDeletingTeam}
                    onClick={() => {
                      void handleTeamDelete()
                    }}
                    type="button"
                  >
                    {isDeletingTeam ? '削除しています...' : 'チームを削除'}
                  </button>
                ) : null}
              </div>
            </div>

            {deleteErrorMessage ? (
              <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                {deleteErrorMessage}
              </div>
            ) : null}

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

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
                  <div
                    className={[
                      'grid gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500',
                      memberGridColumns,
                    ].join(' ')}
                  >
                    <span>名前</span>
                    <span>メールアドレス</span>
                    <span>role</span>
                    {team.current_user_role === 'owner' ? (
                      <span className="text-right">操作</span>
                    ) : null}
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {members.map((member) => {
                      const canDeleteMember =
                        team.current_user_role === 'owner' &&
                        member.role !== 'owner'

                      return (
                        <li
                          className={[
                            'grid items-center gap-4 px-4 py-4',
                            memberGridColumns,
                          ].join(' ')}
                          key={member.id}
                        >
                          <span className="min-w-0 truncate text-sm font-semibold text-slate-900">
                            {member.user.name}
                          </span>
                          <span className="min-w-0 truncate text-sm text-slate-600">
                            {member.user.email}
                          </span>
                          <RoleBadge role={member.role} />
                          {team.current_user_role === 'owner' ? (
                            <div className="flex justify-end">
                              {canDeleteMember ? (
                                <button
                                  className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:border-rose-100 disabled:text-rose-300"
                                  disabled={deletingMemberId !== null}
                                  onClick={() => {
                                    void handleMemberDelete(member)
                                  }}
                                  type="button"
                                >
                                  {deletingMemberId === member.id
                                    ? '削除中...'
                                    : '削除'}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {memberDeleteErrorMessage ? (
                <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                  {memberDeleteErrorMessage}
                </div>
              ) : null}
            </div>

            <form
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              onSubmit={(event) => {
                void handleMemberSubmit(event)
              }}
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  メンバー追加
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  登録済みユーザーをメールアドレスでチームに追加します。
                </p>
              </div>

              {team.current_user_role === 'member' ? (
                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  メンバー追加は owner または admin が利用できます。
                </div>
              ) : null}

              {memberErrorMessage ? (
                <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                  {memberErrorMessage}
                </div>
              ) : null}

              {memberSuccessMessage ? (
                <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {memberSuccessMessage}
                </div>
              ) : null}

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    メールアドレス
                  </span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                    disabled={
                      isMemberSubmitting || team.current_user_role === 'member'
                    }
                    onChange={(event) => {
                      setMemberEmail(event.target.value)
                    }}
                    placeholder="user@example.com"
                    type="email"
                    value={memberEmail}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    role
                  </span>
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                    disabled={
                      isMemberSubmitting || team.current_user_role === 'member'
                    }
                    onChange={(event) => {
                      setMemberRole(
                        event.target.value as Exclude<
                          TeamMemberRole,
                          'owner'
                        >,
                      )
                    }}
                    value={memberRole}
                  >
                    <option value="member">メンバー</option>
                    {team.current_user_role === 'owner' ? (
                      <option value="admin">管理者</option>
                    ) : null}
                  </select>
                </label>
              </div>

              <button
                className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-indigo-300"
                disabled={
                  isMemberSubmitting || team.current_user_role === 'member'
                }
                type="submit"
              >
                {isMemberSubmitting ? '追加しています...' : 'メンバーを追加'}
              </button>
            </form>
          </section>
        </>
      ) : null}
    </div>
  )
}
