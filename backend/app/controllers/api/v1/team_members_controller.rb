module Api
  module V1
    class TeamMembersController < ApplicationController
      before_action :authenticate_user!
      before_action :set_team
      before_action :set_current_membership
      before_action :set_team_member, only: %i[update destroy]
      before_action :authorize_member_manager!, only: %i[create destroy]
      before_action :authorize_owner!, only: :update

      def index
        members = @team.team_members.includes(:user).order(:id)

        render json: { members: members.map(&:api_json) }
      end

      def create
        attributes = member_create_params
        return render_parameter_missing if attributes[:email].blank?

        role = attributes[:role].presence || "member"
        return unless addable_role?(role)

        create_member(attributes[:email], role)
      end

      def update
        role = member_update_params[:role]

        return render_parameter_missing if role.blank?
        return unless changeable_role?(role)

        update_member_role(role)
      end

      def destroy
        return render_forbidden if @team_member.user_id == current_user.id
        return render_forbidden if @team_member.owner?
        return render_forbidden if @current_membership.admin? && !@team_member.member?

        @team_member.destroy_with_task_unassignment!
        head :no_content
      end

      private

      def set_team
        @team = current_user.teams.find(params.expect(:team_id))
      end

      def set_current_membership
        @current_membership = @team.team_members.find_by!(user: current_user)
      end

      def set_team_member
        @team_member = @team.team_members.includes(:user).find(params.expect(:id))
      end

      def authorize_member_manager!
        render_forbidden unless @current_membership.owner? || @current_membership.admin?
      end

      def authorize_owner!
        render_forbidden unless @current_membership.owner?
      end

      def member_create_params
        if params[:member].present?
          params.expect(member: %i[email role])
        else
          { email: params.expect(:email), role: params[:role] }
        end
      end

      def member_update_params
        if params[:member].present?
          params.expect(member: %i[role])
        else
          { role: params.expect(:role) }
        end
      end

      def addable_role?(role)
        return invalid_role? unless TeamMember::ROLES.include?(role)
        return halt_with_validation?(["Owner cannot be added"]) if role == "owner"
        return halt_with_forbidden? if @current_membership.admin? && role != "member"

        true
      end

      def create_member(email, role)
        user = User.find_by(email: email.to_s.downcase)
        return render_not_found unless user

        member = @team.team_members.new(user: user, role: role)

        if member.save
          render json: { member: member.api_json }, status: :created
        else
          render_validation_error(member.errors.full_messages)
        end
      end

      def changeable_role?(role)
        return halt_with_forbidden? if @team_member.owner?
        return halt_with_validation?(["Owner role cannot be assigned"]) if role == "owner"
        return invalid_role? unless TeamMember::ROLES.include?(role)

        true
      end

      def update_member_role(role)
        if @team_member.update(role: role)
          render json: { member: @team_member.api_json }
        else
          render_validation_error(@team_member.errors.full_messages)
        end
      end

      def invalid_role?
        halt_with_validation?(["Role is not included in the list"])
      end

      def halt_with_validation?(details)
        render_validation_error(details)
        false
      end

      def halt_with_forbidden?
        render_forbidden
        false
      end
    end
  end
end
