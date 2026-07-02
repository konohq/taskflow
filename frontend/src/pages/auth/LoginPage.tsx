import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../../components/common/AuthShell'
import { useAuth } from '../../contexts/useAuth'
import { getApiErrorMessage } from '../../utils/apiError'

const inputClassName =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await login({ email, password })
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          'メールアドレスまたはパスワードが正しくありません。',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="ログイン"
      description="チームのプロジェクト、タスク、コメントを管理するワークスペースへアクセスします。"
      footer={
        <>
          アカウントをお持ちでない場合は{' '}
          <Link className="font-medium text-indigo-600 hover:text-indigo-700" to="/signup">
            新規登録
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {errorMessage ? (
          <div
            className="whitespace-pre-line rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          メールアドレス
          <input
            autoComplete="email"
            className={inputClassName}
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          パスワード
          <input
            autoComplete="current-password"
            className={inputClassName}
            disabled={isSubmitting}
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password"
            required
            type="password"
            value={password}
          />
        </label>

        <button
          className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-indigo-300"
          disabled={isSubmitting || isLoading}
          type="submit"
        >
          {isSubmitting ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </AuthShell>
  )
}
