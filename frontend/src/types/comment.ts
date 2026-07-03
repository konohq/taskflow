import type { UserMini } from './task'

export type Comment = {
  id: number
  task_id: number
  content: string
  user: UserMini
  created_at: string
  updated_at: string
}

export type CommentsResponse = {
  comments: Comment[]
}

export type CommentResponse = {
  comment: Comment
}

export type CreateCommentInput = {
  content: string
}
