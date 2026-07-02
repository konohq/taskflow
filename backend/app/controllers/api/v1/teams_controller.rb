module Api
  module V1
    class TeamsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_team, only: %i[show update destroy]
      before_action :set_current_membership, only: %i[show update destroy]
      before_action :authorize_owner!, only: %i[update destroy]

      def index
        memberships = current_user.team_members.includes(:team).joins(:team).order("teams.created_at DESC")

        render json: { teams: memberships.map { |membership| team_json(membership.team, membership.role) } }
      end

      def show
        render json: { team: team_json(@team, @current_membership.role) }
      end

      def create
        team = nil

        Team.transaction do
          team = Team.create!(team_params.merge(created_by: current_user))
          team.team_members.create!(user: current_user, role: "owner")
        end

        render json: { team: team_json(team, "owner") }, status: :created
      end

      def update
        if @team.update(team_params)
          render json: { team: team_json(@team, @current_membership.role) }
        else
          render_validation_error(@team.errors.full_messages)
        end
      end

      def destroy
        @team.destroy!
        head :no_content
      end

      private

      def set_team
        @team = current_user.teams.find(params.expect(:id))
      end

      def set_current_membership
        @current_membership = @team.team_members.find_by!(user: current_user)
      end

      def authorize_owner!
        return if @current_membership.owner?

        render_forbidden
      end

      def team_params
        params.expect(team: %i[name description])
      end

      def team_json(team, current_user_role)
        {
          id: team.id,
          name: team.name,
          description: team.description,
          current_user_role: current_user_role,
          created_at: team.created_at&.iso8601,
          updated_at: team.updated_at&.iso8601
        }
      end
    end
  end
end
