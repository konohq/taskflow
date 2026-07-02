require "rails_helper"

RSpec.describe "Api::V1::My::Tasks", type: :request do
  describe "GET /api/v1/my/tasks" do
    it "returns tasks assigned to the current user" do
      user = create(:user)
      project = create_project_with_member(user)
      task = create(:task, project: project, created_by: user, assignee: user)

      get "/api/v1/my/tasks", headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(task.id)
    end

    it "does not include tasks assigned to another user" do
      user = create(:user)
      other_user = create(:user)
      project = create_project_with_member(user)
      create(:team_member, team: project.team, user: other_user, role: "member")
      assigned_task = create(:task, project: project, created_by: user, assignee: user)
      other_task = create(:task, project: project, created_by: user, assignee: other_user)

      get "/api/v1/my/tasks", headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(assigned_task.id)
      expect(task_ids).not_to include(other_task.id)
    end

    it "does not include tasks outside teams the current user belongs to" do
      user = create(:user)
      other_user = create(:user)
      project = create_project_with_member(user)
      other_project = create_project_with_member(other_user)
      assigned_task = create(:task, project: project, created_by: user, assignee: user)
      other_team_task = create(:task, project: other_project, created_by: other_user, assignee: other_user)
      assign_task_without_membership_validation(other_team_task, user)

      get "/api/v1/my/tasks", headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(assigned_task.id)
      expect(task_ids).not_to include(other_team_task.id)
    end

    it "returns unauthorized when unauthenticated" do
      get "/api/v1/my/tasks"

      expect(response).to have_http_status(:unauthorized)
      expect(response_error["code"]).to eq("unauthorized")
    end

    it "filters tasks by status" do
      user = create(:user)
      project = create_project_with_member(user)
      todo_task = create(:task, project: project, created_by: user, assignee: user, status: "todo")
      done_task = create(:task, project: project, created_by: user, assignee: user, status: "done")

      get "/api/v1/my/tasks", params: { status: "done" }, headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(done_task.id)
      expect(task_ids).not_to include(todo_task.id)
    end

    it "filters tasks by priority" do
      user = create(:user)
      project = create_project_with_member(user)
      low_task = create(:task, project: project, created_by: user, assignee: user, priority: "low")
      high_task = create(:task, project: project, created_by: user, assignee: user, priority: "high")

      get "/api/v1/my/tasks", params: { priority: "high" }, headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(high_task.id)
      expect(task_ids).not_to include(low_task.id)
    end

    it "returns project, team, created_by, and assignee details without sensitive fields" do
      user = create(:user)
      project = create_project_with_member(user)
      task = create(:task, project: project, created_by: user, assignee: user)

      get "/api/v1/my/tasks", headers: authorization_header(user)

      task_response = response.parsed_body.fetch("tasks").find { |item| item["id"] == task.id }

      expect(response).to have_http_status(:ok)
      expect(task_response.fetch("project")).to eq("id" => project.id, "name" => project.name)
      expect(task_response.fetch("team")).to eq("id" => project.team.id, "name" => project.team.name)
      expect_minimal_user_response(task_response.fetch("created_by"), user)
      expect_minimal_user_response(task_response.fetch("assignee"), user)
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

  def assign_task_without_membership_validation(task, user)
    # Defensive scope test: simulate a stale row that points to a user outside the task's team.
    task.assignee_id = user.id
    task.save!(validate: false)
  end

  def response_error
    response.parsed_body.fetch("error")
  end
end
