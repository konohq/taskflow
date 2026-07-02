module Api
  module V1
    class CommentsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_task

      def index
        comments = @task.comments.includes(:user).order(created_at: :asc)

        render json: { comments: comments.map(&:api_json) }
      end

      def create
        comment = @task.comments.new(comment_params.merge(user: current_user))

        if comment.save
          render json: { comment: comment.api_json }, status: :created
        else
          render_validation_error(comment.errors.full_messages)
        end
      end

      private

      def set_task
        @task = Task.joins(project: :team)
                    .merge(current_user.teams)
                    .find(params.expect(:task_id))
      end

      def comment_params
        params.expect(comment: %i[content])
      end
    end
  end
end
