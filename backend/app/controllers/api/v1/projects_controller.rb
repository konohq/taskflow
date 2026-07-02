module Api
  module V1
    class ProjectsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_team, only: %i[index create]
      before_action :set_project, only: %i[show update destroy]

      def index
        projects = @team.projects.order(created_at: :desc)

        render json: { projects: projects.map(&:api_json) }
      end

      def show
        render json: { project: @project.api_json }
      end

      def create
        project = @team.projects.new(project_params.merge(created_by: current_user))

        if project.save
          render json: { project: project.api_json }, status: :created
        else
          render_validation_error(project.errors.full_messages)
        end
      end

      def update
        if @project.update(project_params)
          render json: { project: @project.api_json }
        else
          render_validation_error(@project.errors.full_messages)
        end
      end

      def destroy
        @project.destroy!
        head :no_content
      end

      private

      def set_team
        @team = current_user.teams.find(params.expect(:team_id))
      end

      def set_project
        @project = Project.joins(:team).merge(current_user.teams).find(params.expect(:id))
      end

      def project_params
        params.expect(project: %i[name description status])
      end
    end
  end
end
