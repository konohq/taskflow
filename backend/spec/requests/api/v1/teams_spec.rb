require "rails_helper"

RSpec.describe "Api::V1::Teams", type: :request do
  describe "GET /api/v1/teams" do
    it "returns only teams the current user belongs to" do
      user = create(:user)
      team = create_team_with_member(user, "owner")
      other_user = create(:user)
      other_team = create_team_with_member(other_user, "owner")

      get "/api/v1/teams", headers: authorization_header(user)

      team_ids = response.parsed_body.fetch("teams").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(team_ids).to include(team.id)
      expect(team_ids).not_to include(other_team.id)
    end

    it "returns unauthorized when unauthenticated" do
      get "/api/v1/teams"

      expect(response).to have_http_status(:unauthorized)
      expect(response_error["code"]).to eq("unauthorized")
    end
  end

  describe "POST /api/v1/teams" do
    it "creates a team and registers the current user as owner" do
      user = create(:user)

      post "/api/v1/teams",
           params: { team: { name: "Product Team", description: "Backend MVP" } },
           headers: authorization_header(user),
           as: :json

      team = Team.find(response.parsed_body.dig("team", "id"))

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig("team", "current_user_role")).to eq("owner")
      expect(team.team_members.find_by(user: user).role).to eq("owner")
    end
  end

  describe "GET /api/v1/teams/:id" do
    it "returns the team when the current user belongs to it" do
      user = create(:user)
      team = create_team_with_member(user, "member")

      get "/api/v1/teams/#{team.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("team", "id")).to eq(team.id)
      expect(response.parsed_body.dig("team", "current_user_role")).to eq("member")
    end

    it "returns not found for another team's detail" do
      user = create(:user)
      other_user = create(:user)
      other_team = create_team_with_member(other_user, "owner")

      get "/api/v1/teams/#{other_team.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
    end
  end

  describe "PATCH /api/v1/teams/:id" do
    it "allows owner to update the team" do
      user = create(:user)
      team = create_team_with_member(user, "owner")

      patch "/api/v1/teams/#{team.id}",
            params: { team: { name: "Updated Team" } },
            headers: authorization_header(user),
            as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("team", "name")).to eq("Updated Team")
    end

    it "does not allow admin to update the team" do
      user = create(:user)
      team = create_team_with_member(user, "admin")

      patch "/api/v1/teams/#{team.id}",
            params: { team: { name: "Updated Team" } },
            headers: authorization_header(user),
            as: :json

      expect(response).to have_http_status(:forbidden)
      expect(response_error["code"]).to eq("forbidden")
    end

    it "does not allow member to update the team" do
      user = create(:user)
      team = create_team_with_member(user, "member")

      patch "/api/v1/teams/#{team.id}",
            params: { team: { name: "Updated Team" } },
            headers: authorization_header(user),
            as: :json

      expect(response).to have_http_status(:forbidden)
      expect(response_error["code"]).to eq("forbidden")
    end
  end

  describe "DELETE /api/v1/teams/:id" do
    it "allows owner to delete the team" do
      user = create(:user)
      team = create_team_with_member(user, "owner")

      delete "/api/v1/teams/#{team.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:no_content)
      expect(Team.exists?(team.id)).to be(false)
    end

    it "does not allow admin to delete the team" do
      user = create(:user)
      team = create_team_with_member(user, "admin")

      delete "/api/v1/teams/#{team.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:forbidden)
      expect(Team.exists?(team.id)).to be(true)
    end

    it "does not allow member to delete the team" do
      user = create(:user)
      team = create_team_with_member(user, "member")

      delete "/api/v1/teams/#{team.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:forbidden)
      expect(Team.exists?(team.id)).to be(true)
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
