module Api
  module V1
    class TasksController < ApplicationController
      before_action :authenticate_user!
      before_action :set_project, only: %i[index create]
      before_action :set_task, only: %i[show update destroy]

      def index
        tasks = @project.tasks.includes(:assignee, :created_by).order(created_at: :desc)

        render json: { tasks: tasks.map(&:api_json) }
      end

      def show
        render json: { task: @task.api_json }
      end

      def create
        task = @project.tasks.new(task_params.merge(created_by: current_user))

        if task.save
          render json: { task: task.api_json }, status: :created
        else
          render_validation_error(task.errors.full_messages)
        end
      end

      def update
        if @task.update(task_params)
          render json: { task: @task.api_json }
        else
          render_validation_error(@task.errors.full_messages)
        end
      end

      def destroy
        @task.destroy!
        head :no_content
      end

      private

      def set_project
        @project = Project.joins(:team).merge(current_user.teams).find(params.expect(:project_id))
      end

      def set_task
        @task = Task.includes(:assignee, :created_by)
                    .joins(project: :team)
                    .merge(current_user.teams)
                    .find(params.expect(:id))
      end

      def task_params
        params.expect(task: %i[title description status priority due_on assignee_id])
      end
    end
  end
end
