import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
              TF
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">TaskFlow</p>
              <p className="text-xs text-slate-400">Team task management</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        {children}

        <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
          {footer}
        </div>
      </section>
    </main>
  )
}
