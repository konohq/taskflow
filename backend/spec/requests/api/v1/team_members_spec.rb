require "rails_helper"

RSpec.describe "Api::V1::TeamMembers", type: :request do
  describe "GET /api/v1/teams/:team_id/members" do
    it "returns members for a team the current user belongs to" do
      owner = create(:user)
      member_user = create(:user)
      team = create_team_with_member(owner, "owner")
      create(:team_member, team: team, user: member_user, role: "member")

      get "/api/v1/teams/#{team.id}/members", headers: authorization_header(owner)

      member_user_ids = response.parsed_body.fetch("members").pluck("user").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(member_user_ids).to contain_exactly(owner.id, member_user.id)
    end
  end

  describe "POST /api/v1/teams/:team_id/members" do
    it "allows owner to add a member" do
      owner = create(:user)
      user = create(:user, email: "member@example.com")
      team = create_team_with_member(owner, "owner")

      post "/api/v1/teams/#{team.id}/members",
           params: { email: "member@example.com", role: "member" },
           headers: authorization_header(owner),
           as: :json

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig("member", "user", "id")).to eq(user.id)
      expect(response.parsed_body.dig("member", "role")).to eq("member")
    end

    it "allows admin to add a member" do
      admin = create(:user)
      user = create(:user, email: "member@example.com")
      team = create_team_with_member(admin, "admin")

      post "/api/v1/teams/#{team.id}/members",
           params: { email: "member@example.com", role: "member" },
           headers: authorization_header(admin),
           as: :json

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig("member", "user", "id")).to eq(user.id)
    end

    it "does not allow admin to add an admin" do
      admin = create(:user)
      create(:user, email: "new-admin@example.com")
      team = create_team_with_member(admin, "admin")

      post "/api/v1/teams/#{team.id}/members",
           params: { email: "new-admin@example.com", role: "admin" },
           headers: authorization_header(admin),
           as: :json

      expect(response).to have_http_status(:forbidden)
      expect(response_error["code"]).to eq("forbidden")
    end

    it "does not allow member to add a member" do
      member = create(:user)
      create(:user, email: "new-member@example.com")
      team = create_team_with_member(member, "member")

      post "/api/v1/teams/#{team.id}/members",
           params: { email: "new-member@example.com", role: "member" },
           headers: authorization_header(member),
           as: :json

      expect(response).to have_http_status(:forbidden)
    end

    it "does not allow duplicate members" do
      owner = create(:user)
      user = create(:user, email: "member@example.com")
      team = create_team_with_member(owner, "owner")
      create(:team_member, team: team, user: user, role: "member")

      post "/api/v1/teams/#{team.id}/members",
           params: { email: "member@example.com", role: "member" },
           headers: authorization_header(owner),
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_error["code"]).to eq("validation_error")
    end

    it "returns not found when email does not exist" do
      owner = create(:user)
      team = create_team_with_member(owner, "owner")

      post "/api/v1/teams/#{team.id}/members",
           params: { email: "missing@example.com", role: "member" },
           headers: authorization_header(owner),
           as: :json

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
    end

    it "returns not found for another team's member operation" do
      owner = create(:user)
      other_owner = create(:user)
      create(:user, email: "member@example.com")
      create_team_with_member(owner, "owner")
      other_team = create_team_with_member(other_owner, "owner")

      post "/api/v1/teams/#{other_team.id}/members",
           params: { email: "member@example.com", role: "member" },
           headers: authorization_header(owner),
           as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH /api/v1/teams/:team_id/members/:id" do
    it "allows owner to change role between admin and member" do
      owner = create(:user)
      user = create(:user)
      team = create_team_with_member(owner, "owner")
      member = create(:team_member, team: team, user: user, role: "member")

      patch "/api/v1/teams/#{team.id}/members/#{member.id}",
            params: { role: "admin" },
            headers: authorization_header(owner),
            as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("member", "role")).to eq("admin")
    end

    it "does not allow owner to change own role" do
      owner = create(:user)
      team = create_team_with_member(owner, "owner")
      owner_member = team.team_members.find_by!(user: owner)

      patch "/api/v1/teams/#{team.id}/members/#{owner_member.id}",
            params: { role: "member" },
            headers: authorization_header(owner),
            as: :json

      expect(response).to have_http_status(:forbidden)
    end

    it "does not allow assigning owner role" do
      owner = create(:user)
      user = create(:user)
      team = create_team_with_member(owner, "owner")
      member = create(:team_member, team: team, user: user, role: "member")

      patch "/api/v1/teams/#{team.id}/members/#{member.id}",
            params: { role: "owner" },
            headers: authorization_header(owner),
            as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_error["code"]).to eq("validation_error")
    end

    it "returns not found when target member belongs to another team" do
      owner = create(:user)
      other_owner = create(:user)
      team = create_team_with_member(owner, "owner")
      other_team = create_team_with_member(other_owner, "owner")
      other_member = other_team.team_members.find_by!(user: other_owner)

      patch "/api/v1/teams/#{team.id}/members/#{other_member.id}",
            params: { role: "member" },
            headers: authorization_header(owner),
            as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /api/v1/teams/:team_id/members/:id" do
    it "allows owner to delete admin and member" do
      owner = create(:user)
      admin = create(:user)
      member_user = create(:user)
      team = create_team_with_member(owner, "owner")
      admin_member = create(:team_member, team: team, user: admin, role: "admin")
      regular_member = create(:team_member, team: team, user: member_user, role: "member")

      delete "/api/v1/teams/#{team.id}/members/#{admin_member.id}", headers: authorization_header(owner)
      expect(response).to have_http_status(:no_content)

      delete "/api/v1/teams/#{team.id}/members/#{regular_member.id}", headers: authorization_header(owner)
      expect(response).to have_http_status(:no_content)
    end

    it "allows admin to delete member" do
      admin = create(:user)
      member_user = create(:user)
      team = create_team_with_member(admin, "admin")
      member = create(:team_member, team: team, user: member_user, role: "member")

      delete "/api/v1/teams/#{team.id}/members/#{member.id}", headers: authorization_header(admin)

      expect(response).to have_http_status(:no_content)
    end

    it "unassigns tasks assigned to the deleted member in the target team" do
      owner = create(:user)
      member_user = create(:user)
      team = create_team_with_member(owner, "owner")
      member = create(:team_member, team: team, user: member_user, role: "member")
      project = create(:project, team: team, created_by: owner)
      task = create(:task, project: project, created_by: owner, assignee: member_user)

      delete "/api/v1/teams/#{team.id}/members/#{member.id}", headers: authorization_header(owner)

      expect(response).to have_http_status(:no_content)
      expect(task.reload.assignee).to be_nil
    end

    it "does not unassign tasks assigned to the deleted member in another team" do
      owner = create(:user)
      other_owner = create(:user)
      member_user = create(:user)
      team = create_team_with_member(owner, "owner")
      member = create(:team_member, team: team, user: member_user, role: "member")
      other_team = create_team_with_member(other_owner, "owner")
      create(:team_member, team: other_team, user: member_user, role: "member")
      other_project = create(:project, team: other_team, created_by: other_owner)
      other_task = create(:task, project: other_project, created_by: other_owner, assignee: member_user)

      delete "/api/v1/teams/#{team.id}/members/#{member.id}", headers: authorization_header(owner)

      expect(response).to have_http_status(:no_content)
      expect(other_task.reload.assignee).to eq(member_user)
    end

    it "does not allow admin to delete owner or admin" do
      owner = create(:user)
      admin = create(:user)
      other_admin = create(:user)
      team = create_team_with_member(owner, "owner")
      admin_member = create(:team_member, team: team, user: admin, role: "admin")
      other_admin_member = create(:team_member, team: team, user: other_admin, role: "admin")
      headers = authorization_header(admin)

      delete "/api/v1/teams/#{team.id}/members/#{team.team_members.find_by!(user: owner).id}", headers: headers
      expect(response).to have_http_status(:forbidden)

      delete "/api/v1/teams/#{team.id}/members/#{other_admin_member.id}", headers: headers
      expect(response).to have_http_status(:forbidden)
      expect(TeamMember.exists?(admin_member.id)).to be(true)
    end

    it "does not allow member to delete a member" do
      member = create(:user)
      other_user = create(:user)
      team = create_team_with_member(member, "member")
      target = create(:team_member, team: team, user: other_user, role: "member")

      delete "/api/v1/teams/#{team.id}/members/#{target.id}", headers: authorization_header(member)

      expect(response).to have_http_status(:forbidden)
    end

    it "does not allow owner to delete self" do
      owner = create(:user)
      team = create_team_with_member(owner, "owner")
      owner_member = team.team_members.find_by!(user: owner)

      delete "/api/v1/teams/#{team.id}/members/#{owner_member.id}", headers: authorization_header(owner)

      expect(response).to have_http_status(:forbidden)
    end
  end

  def create_team_with_member(user, role)
    team = create(:team, created_by: user)
    create(:team_member, team: team, user: user, role: role)
    team
  end

  def authorization_header(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  def response_error
    response.parsed_body.fetch("error")
  end
end
