import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../../components/common/AuthShell'
import { useAuth } from '../../contexts/useAuth'
import { getApiErrorMessage } from '../../utils/apiError'

const inputClassName =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100'

export function SignupPage() {
  const navigate = useNavigate()
  const { signup, isAuthenticated, isLoading } = useAuth()
  const [name, setName] = useState('')
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
      await signup({
        name,
        email,
        password,
        password_confirmation: password,
      })
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '新規登録に失敗しました。入力内容を確認してください。'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="新規登録"
      description="TaskFlow AI のワークスペースを作成し、チームでタスク管理を始めます。"
      footer={
        <>
          すでにアカウントをお持ちの場合は{' '}
          <Link className="font-medium text-indigo-600 hover:text-indigo-700" to="/login">
            ログイン
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
          名前
          <input
            autoComplete="name"
            className={inputClassName}
            disabled={isSubmitting}
            onChange={(event) => setName(event.target.value)}
            placeholder="山田 太郎"
            required
            type="text"
            value={name}
          />
        </label>

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
            autoComplete="new-password"
            className={inputClassName}
            disabled={isSubmitting}
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="6文字以上"
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
          {isSubmitting ? '登録中...' : '新規登録'}
        </button>
      </form>
    </AuthShell>
  )
}
