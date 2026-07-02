module Api
  module V1
    class KanbanController < ApplicationController
      before_action :authenticate_user!
      before_action :set_project

      def show
        render json: {
          project: project_json,
          columns: columns_json
        }
      end

      private

      def set_project
        @project = Project.joins(:team).merge(current_user.teams).find(params.expect(:project_id))
      end

      def columns_json
        grouped_tasks = kanban_tasks.group_by(&:status)

        Task::STATUSES.index_with do |status|
          Array(grouped_tasks[status]).map { |task| task_json(task) }
        end
      end

      def kanban_tasks
        @project.tasks.includes(:assignee, :created_by).order(created_at: :desc)
      end

      def project_json
        {
          id: @project.id,
          name: @project.name
        }
      end

      def task_json(task)
        task_base_json(task).merge(
          assignee: user_json(task.assignee),
          created_by: user_json(task.created_by)
        )
      end

      def task_base_json(task)
        {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due_on: task.due_on&.iso8601,
          created_at: task.created_at&.iso8601,
          updated_at: task.updated_at&.iso8601
        }
      end

      def user_json(user)
        return nil unless user

        {
          id: user.id,
          name: user.name
        }
      end
    end
  end
end
