import axios from 'axios'

type ApiErrorResponse = {
  error?: {
    code?: string
    message?: string
    details?: string[]
  }
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = '処理に失敗しました。時間をおいて再度お試しください。',
) {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallbackMessage
  }

  if (!error.response) {
    return 'サーバーに接続できませんでした。バックエンドAPIが起動しているか確認してください。'
  }

  const apiError = error.response.data?.error

  if (apiError?.details?.length) {
    return [apiError.message, ...apiError.details].filter(Boolean).join('\n')
  }

  return apiError?.message || fallbackMessage
}
