import { apiClient } from './client'
import type {
  CommentResponse,
  CommentsResponse,
  CreateCommentInput,
} from '../types/comment'

export async function fetchTaskComments(taskId: string) {
  const response = await apiClient.get<CommentsResponse>(
    `/tasks/${taskId}/comments`,
  )

  return response.data.comments
}

export async function createTaskComment(
  taskId: string,
  input: CreateCommentInput,
) {
  const response = await apiClient.post<CommentResponse>(
    `/tasks/${taskId}/comments`,
    {
      comment: input,
    },
  )

  return response.data.comment
}
