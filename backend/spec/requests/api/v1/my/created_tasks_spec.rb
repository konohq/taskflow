require "rails_helper"

RSpec.describe "Api::V1::My::CreatedTasks", type: :request do
  describe "GET /api/v1/my/created_tasks" do
    it "returns tasks created by the current user" do
      user = create(:user)
      assignee = create(:user)
      project = create_project_with_member(user)
      create(:team_member, team: project.team, user: assignee, role: "member")
      created_task = create(:task, project: project, created_by: user, assignee: assignee)

      get "/api/v1/my/created_tasks", headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(created_task.id)
    end

    it "does not include tasks created by another user" do
      user = create(:user)
      other_user = create(:user)
      project = create_project_with_member(user)
      create(:team_member, team: project.team, user: other_user, role: "member")
      created_task = create(:task, project: project, created_by: user)
      other_created_task = create(:task, project: project, created_by: other_user, assignee: user)

      get "/api/v1/my/created_tasks", headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(created_task.id)
      expect(task_ids).not_to include(other_created_task.id)
    end

    it "does not include tasks outside teams the current user belongs to" do
      user = create(:user)
      other_user = create(:user)
      project = create_project_with_member(user)
      other_project = create_project_with_member(other_user)
      created_task = create(:task, project: project, created_by: user)
      other_team_task = create(:task, project: other_project, created_by: user)

      get "/api/v1/my/created_tasks", headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(created_task.id)
      expect(task_ids).not_to include(other_team_task.id)
    end

    it "returns unauthorized when unauthenticated" do
      get "/api/v1/my/created_tasks"

      expect(response).to have_http_status(:unauthorized)
      expect(response_error["code"]).to eq("unauthorized")
    end

    it "filters created tasks by status" do
      user = create(:user)
      project = create_project_with_member(user)
      todo_task = create(:task, project: project, created_by: user, status: "todo")
      done_task = create(:task, project: project, created_by: user, status: "done")

      get "/api/v1/my/created_tasks", params: { status: "done" }, headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(done_task.id)
      expect(task_ids).not_to include(todo_task.id)
    end

    it "filters created tasks by priority" do
      user = create(:user)
      project = create_project_with_member(user)
      low_task = create(:task, project: project, created_by: user, priority: "low")
      high_task = create(:task, project: project, created_by: user, priority: "high")

      get "/api/v1/my/created_tasks", params: { priority: "high" }, headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(high_task.id)
      expect(task_ids).not_to include(low_task.id)
    end

    it "filters created tasks by due_on range" do
      user = create(:user)
      project = create_project_with_member(user)
      old_task = create(:task, project: project, created_by: user, due_on: Date.new(2026, 7, 1))
      target_task = create(:task, project: project, created_by: user, due_on: Date.new(2026, 7, 10))
      future_task = create(:task, project: project, created_by: user, due_on: Date.new(2026, 7, 20))

      get "/api/v1/my/created_tasks",
          params: { due_on_from: "2026-07-05", due_on_to: "2026-07-15" },
          headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(target_task.id)
      expect(task_ids).not_to include(old_task.id)
      expect(task_ids).not_to include(future_task.id)
    end

    it "returns project, team, created_by, and assignee details without sensitive fields" do
      user = create(:user)
      assignee = create(:user)
      project = create_project_with_member(user)
      create(:team_member, team: project.team, user: assignee, role: "member")
      task = create(:task, project: project, created_by: user, assignee: assignee)

      get "/api/v1/my/created_tasks", headers: authorization_header(user)

      task_response = response.parsed_body.fetch("tasks").find { |item| item["id"] == task.id }

      expect(response).to have_http_status(:ok)
      expect(task_response.fetch("project")).to eq("id" => project.id, "name" => project.name)
      expect(task_response.fetch("team")).to eq("id" => project.team.id, "name" => project.team.name)
      expect_minimal_user_response(task_response.fetch("created_by"), user)
      expect_minimal_user_response(task_response.fetch("assignee"), assignee)
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
