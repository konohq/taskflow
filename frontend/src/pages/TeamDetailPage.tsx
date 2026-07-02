import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchTeam } from '../api/teams'
import { fetchTeamMembers } from '../api/teamMembers'
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

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadTeamDetail = useCallback(async () => {
    if (!teamId) {
      setErrorMessage('チームIDが見つかりません。')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const [fetchedTeam, fetchedMembers] = await Promise.all([
        fetchTeam(teamId),
        fetchTeamMembers(teamId),
      ])

      setTeam(fetchedTeam)
      setMembers(fetchedMembers)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'チーム詳細を取得できませんでした。'))
    } finally {
      setIsLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    void loadTeamDetail()
  }, [loadTeamDetail])

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
