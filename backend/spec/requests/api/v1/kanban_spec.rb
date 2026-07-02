require "rails_helper"

RSpec.describe "Api::V1::Kanban", type: :request do
  describe "GET /api/v1/projects/:project_id/kanban" do
    it "returns kanban columns for a project in a team the current user belongs to" do
      user = create(:user)
      project = create_project_with_member(user)
      todo_task = create(:task, project: project, created_by: user, assignee: user, status: "todo")

      get "/api/v1/projects/#{project.id}/kanban", headers: authorization_header(user)

      columns = response.parsed_body.fetch("columns")

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch("project")).to eq("id" => project.id, "name" => project.name)
      expect(columns.fetch("todo").pluck("id")).to include(todo_task.id)
    end

    it "groups tasks by status" do
      user = create(:user)
      project = create_project_with_member(user)
      todo_task = create(:task, project: project, created_by: user, status: "todo")
      in_progress_task = create(:task, project: project, created_by: user, status: "in_progress")
      review_task = create(:task, project: project, created_by: user, status: "review")
      done_task = create(:task, project: project, created_by: user, status: "done")

      get "/api/v1/projects/#{project.id}/kanban", headers: authorization_header(user)

      columns = response.parsed_body.fetch("columns")

      expect(response).to have_http_status(:ok)
      expect(columns.fetch("todo").pluck("id")).to contain_exactly(todo_task.id)
      expect(columns.fetch("in_progress").pluck("id")).to contain_exactly(in_progress_task.id)
      expect(columns.fetch("review").pluck("id")).to contain_exactly(review_task.id)
      expect(columns.fetch("done").pluck("id")).to contain_exactly(done_task.id)
    end

    it "returns empty arrays for statuses without tasks" do
      user = create(:user)
      project = create_project_with_member(user)
      create(:task, project: project, created_by: user, status: "todo")

      get "/api/v1/projects/#{project.id}/kanban", headers: authorization_header(user)

      columns = response.parsed_body.fetch("columns")

      expect(response).to have_http_status(:ok)
      expect(columns.keys).to contain_exactly("todo", "in_progress", "review", "done")
      expect(columns.fetch("in_progress")).to eq([])
      expect(columns.fetch("review")).to eq([])
      expect(columns.fetch("done")).to eq([])
    end

    it "returns not found for another team's project" do
      user = create(:user)
      other_project = create_project_with_member(create(:user))

      get "/api/v1/projects/#{other_project.id}/kanban", headers: authorization_header(user)

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
    end

    it "returns unauthorized when unauthenticated" do
      project = create(:project)

      get "/api/v1/projects/#{project.id}/kanban"

      expect(response).to have_http_status(:unauthorized)
      expect(response_error["code"]).to eq("unauthorized")
    end

    it "returns assignee and created_by with only id and name" do
      user = create(:user)
      assignee = create(:user)
      project = create_project_with_member(user)
      create(:team_member, team: project.team, user: assignee, role: "member")
      task = create(:task, project: project, created_by: user, assignee: assignee, status: "todo")

      get "/api/v1/projects/#{project.id}/kanban", headers: authorization_header(user)

      task_response = response.parsed_body.dig("columns", "todo").find { |item| item["id"] == task.id }

      expect(response).to have_http_status(:ok)
      expect_minimal_user_response(task_response.fetch("assignee"), assignee)
      expect_minimal_user_response(task_response.fetch("created_by"), user)
    end

    it "returns nil for an unassigned task" do
      user = create(:user)
      project = create_project_with_member(user)
      task = create(:task, project: project, created_by: user, assignee: nil, status: "todo")

      get "/api/v1/projects/#{project.id}/kanban", headers: authorization_header(user)

      task_response = response.parsed_body.dig("columns", "todo").find { |item| item["id"] == task.id }

      expect(response).to have_http_status(:ok)
      expect(task_response.fetch("assignee")).to be_nil
    end
  end

  def create_project_with_member(user)
    team = create(:team, created_by: user)
    create(:team_member, team: team, user: user, role: "member")
    create(:project, team: team, created_by: user)
  end

  def authorization_header(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  def expect_minimal_user_response(user_response, user)
    expect(user_response).to include("id" => user.id, "name" => user.name)
    expect(user_response.keys).to contain_exactly("id", "name")
    expect(user_response.keys).not_to include("email", "encrypted_password", "jti")
  end

  def response_error
    response.parsed_body.fetch("error")
  end
end
