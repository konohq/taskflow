module Api
  module V1
    module My
      class TasksController < ApplicationController
        before_action :authenticate_user!

        def index
          tasks = apply_filters(my_tasks).order(created_at: :desc)

          render json: { tasks: tasks.map { |task| task_json(task) } }
        end

        private

        def my_tasks
          Task.includes(:assignee, :created_by, project: :team)
              .joins(project: :team)
              .merge(current_user.teams)
              .where(assignee_id: current_user.id)
        end

        def apply_filters(tasks)
          filtered_tasks = tasks
          filtered_tasks = filter_by_status(filtered_tasks)
          filtered_tasks = filter_by_priority(filtered_tasks)
          filtered_tasks = filter_by_due_on_from(filtered_tasks)
          filter_by_due_on_to(filtered_tasks)
        end

        def filter_by_status(tasks)
          return tasks if filter_params[:status].blank?

          tasks.where(status: filter_params[:status])
        end

        def filter_by_priority(tasks)
          return tasks if filter_params[:priority].blank?

          tasks.where(priority: filter_params[:priority])
        end

        def filter_by_due_on_from(tasks)
          return tasks if filter_params[:due_on_from].blank?

          tasks.where(due_on: filter_params[:due_on_from]..)
        end

        def filter_by_due_on_to(tasks)
          return tasks if filter_params[:due_on_to].blank?

          tasks.where(due_on: ..filter_params[:due_on_to])
        end

        def filter_params
          @filter_params ||= params.permit(:status, :priority, :due_on_from, :due_on_to)
        end

        def task_json(task)
          task_base_json(task).merge(
            project: project_json(task.project),
            team: team_json(task.project.team),
            created_by: user_json(task.created_by),
            assignee: user_json(task.assignee)
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

        def project_json(project)
          {
            id: project.id,
            name: project.name
          }
        end

        def team_json(team)
          {
            id: team.id,
            name: team.name
          }
        end

        def user_json(user)
          {
            id: user.id,
            name: user.name
          }
        end
      end
    end
  end
end
