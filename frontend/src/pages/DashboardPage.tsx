import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchTeamProjects } from '../api/projects'
import { fetchTeams } from '../api/teams'
import { fetchMyCreatedTasks } from '../api/tasks'
import type { Project } from '../types/project'
import type { Team } from '../types/team'
import type { MyTask } from '../types/task'
import { getApiErrorMessage } from '../utils/apiError'

type DashboardProject = Project & {
  teamName: string
}

function formatDate(value: string | null) {
  if (!value) return '期限未設定'

  const [year, month, day] = value.split('-')

  if (!year || !month || !day) return value

  return `${year}/${month}/${day}`
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  )
}

function ActionLink({
  description,
  label,
  to,
}: {
  description: string
  label: string
  to: string
}) {
  return (
    <Link
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
      to={to}
    >
      <span className="block text-base font-semibold text-slate-950">
        {label}
      </span>
      <span className="mt-2 block text-sm leading-6 text-slate-500">
        {description}
      </span>
    </Link>
  )
}

export function DashboardPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<DashboardProject[]>([])
  const [myTasks, setMyTasks] = useState<MyTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const fetchedTeams = await fetchTeams()
      const [projectGroups, fetchedMyTasks] = await Promise.all([
        Promise.all(
          fetchedTeams.map(async (team) => {
            const teamProjects = await fetchTeamProjects(String(team.id))

            return teamProjects.map((project) => ({
              ...project,
              teamName: team.name,
            }))
          }),
        ),
        fetchMyCreatedTasks(),
      ])

      setTeams(fetchedTeams)
      setProjects(projectGroups.flat())
      setMyTasks(fetchedMyTasks)
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, 'ダッシュボードを取得できませんでした。'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort(
          (firstProject, secondProject) =>
            new Date(secondProject.updated_at).getTime() -
            new Date(firstProject.updated_at).getTime(),
        )
        .slice(0, 4),
    [projects],
  )

  const upcomingTasks = useMemo(
    () =>
      [...myTasks]
        .sort((firstTask, secondTask) => {
          if (!firstTask.due_on && !secondTask.due_on) return 0
          if (!firstTask.due_on) return 1
          if (!secondTask.due_on) return -1

          return firstTask.due_on.localeCompare(secondTask.due_on)
        })
        .slice(0, 4),
    [myTasks],
  )

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Dashboard</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              作業の入口
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              所属チーム、プロジェクト、自分が作成したタスクをまとめて確認できます。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              to="/teams"
            >
              チームを開く
            </Link>
            <Link
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              to="/my/tasks"
            >
              作成したタスク
            </Link>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          ダッシュボードを読み込んでいます。
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-lg border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          <p className="whitespace-pre-line">{errorMessage}</p>
          <button
            className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100"
            onClick={() => {
              void loadDashboard()
            }}
            type="button"
          >
            再読み込み
          </button>
        </section>
      ) : null}

      {!isLoading && !errorMessage ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard
              description="所属しているチーム"
              label="所属チーム"
              value={teams.length}
            />
            <StatCard
              description="所属チーム内のプロジェクト"
              label="プロジェクト"
              value={projects.length}
            />
            <StatCard
              description="自分が作成したタスク"
              label="作成タスク"
              value={myTasks.length}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <ActionLink
              description="所属チームの一覧とチーム作成へ移動します。"
              label="チーム一覧"
              to="/teams"
            />
            <ActionLink
              description="期限やステータスで自分が作成したタスクを確認します。"
              label="作成したタスク"
              to="/my/tasks"
            />
            <ActionLink
              description={
                recentProjects[0]
                  ? '所属チーム内のプロジェクトを一覧で確認します。'
                  : 'チーム詳細からプロジェクトを作成できます。'
              }
              label="プロジェクト"
              to="/projects"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    最近のプロジェクト
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    よく開く作業場所へすぐ移動できます。
                  </p>
                </div>
                <Link
                  className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  to="/projects"
                >
                  すべて
                </Link>
              </div>

              {recentProjects.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    プロジェクトはまだありません。
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    チーム詳細から最初のプロジェクトを作成してください。
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {recentProjects.map((project) => (
                    <Link
                      className="rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      key={project.id}
                      to={`/projects/${project.id}`}
                    >
                      <p className="truncate text-base font-semibold text-slate-950">
                        {project.name}
                      </p>
                      <p className="mt-2 truncate text-sm text-slate-500">
                        {project.teamName}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    期限が近い作成タスク
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    自分が作成したタスクです。
                  </p>
                </div>
                <Link
                  className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  to="/my/tasks"
                >
                  すべて
                </Link>
              </div>

              {upcomingTasks.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  作成したタスクはありません。
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {upcomingTasks.map((task) => (
                    <Link
                      className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      key={task.id}
                      to={`/projects/${task.project.id}`}
                    >
                      <p className="line-clamp-2 text-sm font-semibold text-slate-950">
                        {task.title}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {task.team.name} / {task.project.name}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-700">
                        {formatDate(task.due_on)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
