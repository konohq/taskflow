import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

type HeaderProps = {
  onMenuClick: () => void
}

function getPageTitle(pathname: string) {
  if (pathname === '/') return 'ダッシュボード'
  if (pathname === '/teams') return 'チーム'
  if (pathname.startsWith('/teams/')) return 'チーム詳細'
  if (pathname.startsWith('/projects/')) return 'プロジェクト詳細'
  if (pathname === '/my/tasks') return '作成したタスク'
  return 'TaskFlow AI'
}

export function Header({ onMenuClick }: HeaderProps) {
  const { currentUser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          aria-label="メニューを開く"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100 lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <span className="flex flex-col gap-1.5">
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            TaskFlow AI
          </p>
          <h1 className="truncate text-lg font-semibold text-slate-950">
            {getPageTitle(location.pathname)}
          </h1>
        </div>

        <div className="hidden min-w-72 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 shadow-sm md:flex">
          検索は今後対応します
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="max-w-40 truncate text-sm font-semibold text-slate-900">
              {currentUser?.name || 'ログインユーザー'}
            </p>
            <p className="text-xs text-slate-500">オンライン</p>
          </div>

          <button
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={isLoggingOut}
            onClick={handleLogout}
            type="button"
          >
            {isLoggingOut ? 'ログアウト中' : 'ログアウト'}
          </button>
        </div>
      </div>
    </header>
  )
}
