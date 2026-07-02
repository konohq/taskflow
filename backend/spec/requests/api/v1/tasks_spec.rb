require "rails_helper"

RSpec.describe "Api::V1::Tasks", type: :request do
  describe "GET /api/v1/projects/:project_id/tasks" do
    it "returns tasks for a project in a team the current user belongs to" do
      user = create(:user)
      project = create_project_with_member(user, "member")
      task = create(:task, project: project, created_by: user)

      get "/api/v1/projects/#{project.id}/tasks", headers: authorization_header(user)

      task_ids = response.parsed_body.fetch("tasks").pluck("id")

      expect(response).to have_http_status(:ok)
      expect(task_ids).to include(task.id)
    end

    it "does not expose unnecessary user fields in assignee and created_by" do
      user = create(:user)
      assignee = create(:user)
      project = create_project_with_member(user, "member")
      create(:team_member, team: project.team, user: assignee, role: "member")
      task = create(:task, project: project, created_by: user, assignee: assignee)

      get "/api/v1/projects/#{project.id}/tasks", headers: authorization_header(user)

      task_json = response.parsed_body.fetch("tasks").find { |item| item.fetch("id") == task.id }

      expect(response).to have_http_status(:ok)
      expect_public_user_payload(task_json.fetch("assignee"))
      expect_public_user_payload(task_json.fetch("created_by"))
    end

    it "returns not found for another team's project" do
      user = create(:user)
      other_project = create_project_with_member(create(:user), "owner")

      get "/api/v1/projects/#{other_project.id}/tasks", headers: authorization_header(user)

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
    end
  end

  describe "POST /api/v1/projects/:project_id/tasks" do
    it "creates a task in a project the current user belongs to" do
      user = create(:user)
      project = create_project_with_member(user, "member")

      post "/api/v1/projects/#{project.id}/tasks",
           params: { task: { title: "Create task API", description: "Build task endpoints" } },
           headers: authorization_header(user),
           as: :json

      task = Task.find(response.parsed_body.dig("task", "id"))

      expect(response).to have_http_status(:created)
      expect(task.project).to eq(project)
      expect(task.created_by).to eq(user)
      expect(response.parsed_body.dig("task", "status")).to eq("todo")
      expect(response.parsed_body.dig("task", "priority")).to eq("medium")
    end

    it "does not allow created_by_id to be overridden" do
      user = create(:user)
      other_user = create(:user)
      project = create_project_with_member(user, "member")

      post "/api/v1/projects/#{project.id}/tasks",
           params: { task: { title: "Create task API", created_by_id: other_user.id } },
           headers: authorization_header(user),
           as: :json

      task = Task.find(response.parsed_body.dig("task", "id"))

      expect(response).to have_http_status(:created)
      expect(task.created_by).to eq(user)
    end

    it "allows assigning a user from the same team" do
      user = create(:user)
      assignee = create(:user)
      project = create_project_with_member(user, "member")
      create(:team_member, team: project.team, user: assignee, role: "member")

      post "/api/v1/projects/#{project.id}/tasks",
           params: { task: { title: "Create task API", assignee_id: assignee.id } },
           headers: authorization_header(user),
           as: :json

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig("task", "assignee", "id")).to eq(assignee.id)
    end

    it "does not expose unnecessary user fields in the created task response" do
      user = create(:user)
      assignee = create(:user)
      project = create_project_with_member(user, "member")
      create(:team_member, team: project.team, user: assignee, role: "member")

      post "/api/v1/projects/#{project.id}/tasks",
           params: { task: { title: "Create task API", assignee_id: assignee.id } },
           headers: authorization_header(user),
           as: :json

      task_json = response.parsed_body.fetch("task")

      expect(response).to have_http_status(:created)
      expect_public_user_payload(task_json.fetch("assignee"))
      expect_public_user_payload(task_json.fetch("created_by"))
    end

    it "returns validation error when assigning a user from another team" do
      user = create(:user)
      other_user = create(:user)
      project = create_project_with_member(user, "member")
      create_project_with_member(other_user, "member")

      post "/api/v1/projects/#{project.id}/tasks",
           params: { task: { title: "Create task API", assignee_id: other_user.id } },
           headers: authorization_header(user),
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_error["code"]).to eq("validation_error")
    end

    it "returns unauthorized when unauthenticated" do
      project = create(:project)

      post "/api/v1/projects/#{project.id}/tasks",
           params: { task: { title: "Create task API" } },
           as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response_error["code"]).to eq("unauthorized")
    end

    it "returns validation error without a title" do
      user = create(:user)
      project = create_project_with_member(user, "member")

      post "/api/v1/projects/#{project.id}/tasks",
           params: { task: { description: "Build task endpoints" } },
           headers: authorization_header(user),
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_error["code"]).to eq("validation_error")
    end

    it "returns validation error with an invalid status" do
      user = create(:user)
      project = create_project_with_member(user, "member")

      post "/api/v1/projects/#{project.id}/tasks",
           params: { task: { title: "Create task API", status: "invalid" } },
           headers: authorization_header(user),
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_error["code"]).to eq("validation_error")
    end

    it "returns validation error with an invalid priority" do
      user = create(:user)
      project = create_project_with_member(user, "member")

      post "/api/v1/projects/#{project.id}/tasks",
           params: { task: { title: "Create task API", priority: "urgent" } },
           headers: authorization_header(user),
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_error["code"]).to eq("validation_error")
    end
  end

  describe "GET /api/v1/tasks/:id" do
    it "returns a task in a project the current user belongs to" do
      user = create(:user)
      project = create_project_with_member(user, "member")
      task = create(:task, project: project, created_by: user)

      get "/api/v1/tasks/#{task.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("task", "id")).to eq(task.id)
    end

    it "does not expose unnecessary user fields in assignee and created_by" do
      user = create(:user)
      assignee = create(:user)
      project = create_project_with_member(user, "member")
      create(:team_member, team: project.team, user: assignee, role: "member")
      task = create(:task, project: project, created_by: user, assignee: assignee)

      get "/api/v1/tasks/#{task.id}", headers: authorization_header(user)

      task_json = response.parsed_body.fetch("task")

      expect(response).to have_http_status(:ok)
      expect_public_user_payload(task_json.fetch("assignee"))
      expect_public_user_payload(task_json.fetch("created_by"))
    end

    it "returns not found for another team's task" do
      user = create(:user)
      other_user = create(:user)
      other_project = create_project_with_member(other_user, "owner")
      task = create(:task, project: other_project, created_by: other_user)

      get "/api/v1/tasks/#{task.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
    end
  end

  describe "PATCH /api/v1/tasks/:id" do
    it "updates a task in a project the current user belongs to" do
      user = create(:user)
      assignee = create(:user)
      project = create_project_with_member(user, "member")
      create(:team_member, team: project.team, user: assignee, role: "member")
      task = create(:task, project: project, created_by: user, assignee: assignee)

      patch "/api/v1/tasks/#{task.id}",
            params: { task: { title: "Updated task", status: "done", priority: "high", assignee_id: nil } },
            headers: authorization_header(user),
            as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("task", "title")).to eq("Updated task")
      expect(response.parsed_body.dig("task", "status")).to eq("done")
      expect(response.parsed_body.dig("task", "priority")).to eq("high")
      expect(response.parsed_body.dig("task", "assignee")).to be_nil
    end

    it "does not expose unnecessary user fields in the updated task response" do
      user = create(:user)
      assignee = create(:user)
      project = create_project_with_member(user, "member")
      create(:team_member, team: project.team, user: assignee, role: "member")
      task = create(:task, project: project, created_by: user, assignee: assignee)

      patch "/api/v1/tasks/#{task.id}",
            params: { task: { title: "Updated task" } },
            headers: authorization_header(user),
            as: :json

      task_json = response.parsed_body.fetch("task")

      expect(response).to have_http_status(:ok)
      expect_public_user_payload(task_json.fetch("assignee"))
      expect_public_user_payload(task_json.fetch("created_by"))
    end

    it "returns not found for another team's task" do
      user = create(:user)
      other_user = create(:user)
      other_project = create_project_with_member(other_user, "owner")
      task = create(:task, project: other_project, created_by: other_user)

      patch "/api/v1/tasks/#{task.id}",
            params: { task: { title: "Updated task" } },
            headers: authorization_header(user),
            as: :json

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
    end
  end

  describe "DELETE /api/v1/tasks/:id" do
    it "deletes a task in a project the current user belongs to" do
      user = create(:user)
      project = create_project_with_member(user, "member")
      task = create(:task, project: project, created_by: user)

      delete "/api/v1/tasks/#{task.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:no_content)
      expect(Task.exists?(task.id)).to be(false)
    end

    it "returns not found for another team's task" do
      user = create(:user)
      other_user = create(:user)
      other_project = create_project_with_member(other_user, "owner")
      task = create(:task, project: other_project, created_by: other_user)

      delete "/api/v1/tasks/#{task.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
      expect(Task.exists?(task.id)).to be(true)
    end
  end

  def create_project_with_member(user, role)
    team = create(:team, created_by: user)
    create(:team_member, team: team, user: user, role: role)
    create(:project, team: team, created_by: user)
  end

  def authorization_header(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  def response_error
    response.parsed_body.fetch("error")
  end

  def expect_public_user_payload(user_json)
    expect(user_json.keys).to contain_exactly("id", "name")
    expect(user_json).not_to include("email", "encrypted_password", "jti", "password")
  end
end
