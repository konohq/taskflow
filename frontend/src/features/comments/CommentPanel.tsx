import type { FormEvent } from 'react'
import type { Comment } from '../../types/comment'
import { formatDateTime } from '../tasks/taskDisplay'

type CommentPanelProps = {
  commentContent: string
  commentSubmitErrorMessage: string
  comments: Comment[]
  commentsErrorMessage: string
  isCommentSubmitting: boolean
  isCommentsLoading: boolean
  onCommentSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  setCommentContent: (value: string) => void
}

export function CommentPanel({
  commentContent,
  commentSubmitErrorMessage,
  comments,
  commentsErrorMessage,
  isCommentSubmitting,
  isCommentsLoading,
  onCommentSubmit,
  setCommentContent,
}: CommentPanelProps) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">コメント</h4>
          <p className="mt-1 text-xs text-slate-500">
            選択中のタスクへのコメントです。
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
          {comments.length}件
        </span>
      </div>

      {isCommentsLoading ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          コメントを読み込んでいます。
        </div>
      ) : null}

      {commentsErrorMessage ? (
        <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
          {commentsErrorMessage}
        </div>
      ) : null}

      {!isCommentsLoading && !commentsErrorMessage && comments.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
          コメントはまだありません。
        </div>
      ) : null}

      {!isCommentsLoading && !commentsErrorMessage && comments.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {comments.map((comment) => (
            <li
              className="rounded-lg border border-slate-200 bg-white p-3"
              key={comment.id}
            >
              <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-800">
                {comment.content}
              </p>
              <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-slate-700">
                  {comment.user.name}
                </span>
                <time dateTime={comment.created_at}>
                  {formatDateTime(comment.created_at)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        className="mt-4 border-t border-slate-200 pt-4"
        onSubmit={(event) => {
          void onCommentSubmit(event)
        }}
      >
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            コメント本文
          </span>
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isCommentSubmitting}
            onChange={(event) => {
              setCommentContent(event.target.value)
            }}
            placeholder="コメントを入力"
            value={commentContent}
          />
        </label>

        {commentSubmitErrorMessage ? (
          <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
            {commentSubmitErrorMessage}
          </div>
        ) : null}

        <button
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-indigo-300"
          disabled={isCommentSubmitting}
          type="submit"
        >
          {isCommentSubmitting ? '投稿しています...' : 'コメントを投稿'}
        </button>
      </form>
    </aside>
  )
}
