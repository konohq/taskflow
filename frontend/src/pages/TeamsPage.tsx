import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createTeam, fetchTeams } from '../api/teams'
import type { Team, TeamMemberRole } from '../types/team'
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [createError, setCreateError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const teamCountLabel = useMemo(() => `${teams.length}件`, [teams.length])

  const loadTeams = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const fetchedTeams = await fetchTeams()
      setTeams(fetchedTeams)
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'チーム一覧を取得できませんでした。'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTeams()
  }, [loadTeams])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) return

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName) {
      setCreateError('チーム名を入力してください。')
      return
    }

    setIsSubmitting(true)
    setCreateError('')

    try {
      const createdTeam = await createTeam({
        name: trimmedName,
        description: trimmedDescription,
      })

      setTeams((currentTeams) => [createdTeam, ...currentTeams])
      setLoadError('')
      setName('')
      setDescription('')
    } catch (error) {
      setCreateError(getApiErrorMessage(error, 'チームを作成できませんでした。'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Teams</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            チーム一覧
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            所属しているチームを確認し、新しいチームを作成できます。
            チームを選択すると詳細画面へ移動します。
          </p>
        </div>
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          <span className="block text-xs font-medium text-indigo-500">
            所属チーム
          </span>
          <span className="mt-1 block text-2xl font-semibold">
            {teamCountLabel}
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                所属チーム
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                自分が参加しているチームだけが表示されます。
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={isLoading}
              onClick={() => void loadTeams()}
              type="button"
            >
              再読み込み
            </button>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              チーム一覧を読み込んでいます。
            </div>
          ) : null}

          {loadError ? (
            <div className="mt-6 whitespace-pre-line rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}

          {!isLoading && !loadError && teams.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h4 className="text-base font-semibold text-slate-900">
                まだチームがありません
              </h4>
              <p className="mt-2 text-sm text-slate-500">
                右側のフォームから最初のチームを作成してください。
              </p>
            </div>
          ) : null}

          {!isLoading && !loadError && teams.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {teams.map((team) => (
                <Link
                  className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  key={team.id}
                  to={`/teams/${team.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-base font-semibold text-slate-950 group-hover:text-indigo-700">
                        {team.name}
                      </h4>
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                        {team.description || '説明は未設定です。'}
                      </p>
                    </div>
                    <span
                      className={[
                        'shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold',
                        roleClasses[team.current_user_role],
                      ].join(' ')}
                    >
                      {roleLabels[team.current_user_role]}
                    </span>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>作成日 {formatDate(team.created_at)}</span>
                    <span className="font-medium text-indigo-600">
                      詳細を見る
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            チーム作成
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            作成したユーザーは自動的に owner として登録されます。
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="team-name"
              >
                チーム名
              </label>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-500"
                disabled={isSubmitting}
                id="team-name"
                maxLength={255}
                onChange={(event) => setName(event.target.value)}
                placeholder="例: プロダクトチーム"
                type="text"
                value={name}
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="team-description"
              >
                説明
              </label>
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-500"
                disabled={isSubmitting}
                id="team-description"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="チームの目的や対象プロジェクトを書いておくと、後から見返しやすくなります。"
                value={description}
              />
            </div>

            {createError ? (
              <div className="whitespace-pre-line rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                {createError}
              </div>
            ) : null}

            <button
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-indigo-300"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? '作成中' : 'チームを作成'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
