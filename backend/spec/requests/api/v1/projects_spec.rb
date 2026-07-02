require "rails_helper"

RSpec.describe "Api::V1::Projects", type: :request do
  describe "GET /api/v1/teams/:team_id/projects" do
    it "returns projects for a team the current user belongs to" do
      user = create(:user)
      team = create_team_with_member(user, "member")
      project = create(:project, team: team, created_by: user)
      other_team = create_team_with_member(create(:user), "owner")
      other_project = create(:project, team: other_team, created_by: other_team.created_by)

      get "/api/v1/teams/#{team.id}/projects", headers: authorization_header(user)

      project_ids = response.parsed_body.fetch("projects").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(project_ids).to include(project.id)
      expect(project_ids).not_to include(other_project.id)
    end
  end

  describe "POST /api/v1/teams/:team_id/projects" do
    it "creates a project in a team the current user belongs to" do
      user = create(:user)
      team = create_team_with_member(user, "member")

      post "/api/v1/teams/#{team.id}/projects",
           params: { project: { name: "MVP Backend", description: "Build backend MVP" } },
           headers: authorization_header(user),
           as: :json

      project = Project.find(response.parsed_body.dig("project", "id"))

      expect(response).to have_http_status(:created)
      expect(project.team).to eq(team)
      expect(project.created_by).to eq(user)
      expect(response.parsed_body.dig("project", "status")).to eq("active")
    end

    it "returns unauthorized when unauthenticated" do
      team = create(:team)

      post "/api/v1/teams/#{team.id}/projects",
           params: { project: { name: "MVP Backend" } },
           as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response_error["code"]).to eq("unauthorized")
    end

    it "returns not found for another team" do
      user = create(:user)
      other_team = create_team_with_member(create(:user), "owner")

      post "/api/v1/teams/#{other_team.id}/projects",
           params: { project: { name: "MVP Backend" } },
           headers: authorization_header(user),
           as: :json

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
    end

    it "returns validation error without a name" do
      user = create(:user)
      team = create_team_with_member(user, "member")

      post "/api/v1/teams/#{team.id}/projects",
           params: { project: { description: "Build backend MVP" } },
           headers: authorization_header(user),
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_error["code"]).to eq("validation_error")
    end

    it "returns validation error with an invalid status" do
      user = create(:user)
      team = create_team_with_member(user, "member")

      post "/api/v1/teams/#{team.id}/projects",
           params: { project: { name: "MVP Backend", status: "invalid" } },
           headers: authorization_header(user),
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_error["code"]).to eq("validation_error")
    end
  end

  describe "GET /api/v1/projects/:id" do
    it "returns a project in a team the current user belongs to" do
      user = create(:user)
      team = create_team_with_member(user, "member")
      project = create(:project, team: team, created_by: user)

      get "/api/v1/projects/#{project.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("project", "id")).to eq(project.id)
    end

    it "returns not found for another team's project" do
      user = create(:user)
      other_team = create_team_with_member(create(:user), "owner")
      project = create(:project, team: other_team, created_by: other_team.created_by)

      get "/api/v1/projects/#{project.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
    end
  end

  describe "PATCH /api/v1/projects/:id" do
    it "updates a project in a team the current user belongs to" do
      user = create(:user)
      team = create_team_with_member(user, "member")
      project = create(:project, team: team, created_by: user)

      patch "/api/v1/projects/#{project.id}",
            params: { project: { name: "Updated Project", status: "archived" } },
            headers: authorization_header(user),
            as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("project", "name")).to eq("Updated Project")
      expect(response.parsed_body.dig("project", "status")).to eq("archived")
    end

    it "returns not found for another team's project" do
      user = create(:user)
      other_team = create_team_with_member(create(:user), "owner")
      project = create(:project, team: other_team, created_by: other_team.created_by)

      patch "/api/v1/projects/#{project.id}",
            params: { project: { name: "Updated Project" } },
            headers: authorization_header(user),
            as: :json

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
    end
  end

  describe "DELETE /api/v1/projects/:id" do
    it "deletes a project in a team the current user belongs to" do
      user = create(:user)
      team = create_team_with_member(user, "member")
      project = create(:project, team: team, created_by: user)

      delete "/api/v1/projects/#{project.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:no_content)
      expect(Project.exists?(project.id)).to be(false)
    end

    it "returns not found for another team's project" do
      user = create(:user)
      other_team = create_team_with_member(create(:user), "owner")
      project = create(:project, team: other_team, created_by: other_team.created_by)

      delete "/api/v1/projects/#{project.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
      expect(Project.exists?(project.id)).to be(true)
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
