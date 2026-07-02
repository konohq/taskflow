import { NavLink, useLocation } from 'react-router-dom'

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

type NavItem = {
  label: string
  description: string
  to: string
  match?: (pathname: string) => boolean
}

const navItems: NavItem[] = [
  {
    label: 'ダッシュボード',
    description: '概要を確認',
    to: '/',
    match: (pathname) => pathname === '/',
  },
  {
    label: 'チーム',
    description: '所属チーム',
    to: '/teams',
    match: (pathname) => pathname === '/teams' || pathname.startsWith('/teams/'),
  },
  {
    label: 'プロジェクト',
    description: 'チーム選択後に表示',
    to: '/teams',
    match: (pathname) => pathname.startsWith('/projects/'),
  },
  {
    label: 'マイタスク',
    description: '自分の担当',
    to: '/my/tasks',
    match: (pathname) => pathname === '/my/tasks',
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm transition-transform duration-200 lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
          TF
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-950">
            TaskFlow AI
          </p>
          <p className="text-xs text-slate-500">Team workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-5">
        {navItems.map((item) => {
          const isActive = item.match?.(location.pathname) ?? false

          return (
            <NavLink
              className={[
                'block rounded-lg border px-3 py-3 transition focus:outline-none focus:ring-4 focus:ring-indigo-100',
                isActive
                  ? 'border-indigo-100 bg-indigo-50 text-indigo-700'
                  : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950',
              ].join(' ')}
              key={item.label}
              onClick={onClose}
              to={item.to}
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {item.description}
              </span>
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-400"
          disabled
          type="button"
        >
          <span className="block font-semibold">設定</span>
          <span className="mt-0.5 block text-xs">MVP後に対応予定</span>
        </button>
      </div>
    </aside>
  )
}
