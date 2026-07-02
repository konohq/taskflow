require "rails_helper"

RSpec.describe "Api::V1::Comments", type: :request do
  describe "GET /api/v1/tasks/:task_id/comments" do
    it "returns comments for a task in a team the current user belongs to" do
      user = create(:user)
      task = create_task_with_member(user, "member")
      comment = create(:comment, task: task, user: user)

      get "/api/v1/tasks/#{task.id}/comments", headers: authorization_header(user)

      comment_response = response.parsed_body.fetch("comments").find { |item| item["id"] == comment.id }
      user_response = comment_response.fetch("user")

      expect(response).to have_http_status(:ok)
      expect(user_response).to include("id" => user.id, "name" => user.name)
      expect(user_response.keys).to contain_exactly("id", "name")
      expect(user_response).not_to have_key("email")
      expect(user_response).not_to have_key("encrypted_password")
      expect(user_response).not_to have_key("jti")
    end

    it "returns not found for another team's task" do
      user = create(:user)
      other_task = create_task_with_member(create(:user), "owner")

      get "/api/v1/tasks/#{other_task.id}/comments", headers: authorization_header(user)

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
    end
  end

  describe "POST /api/v1/tasks/:task_id/comments" do
    it "creates a comment on a task in a team the current user belongs to" do
      user = create(:user)
      task = create_task_with_member(user, "member")

      post "/api/v1/tasks/#{task.id}/comments",
           params: { comment: { content: "Authentication API is ready for review." } },
           headers: authorization_header(user),
           as: :json

      comment = Comment.find(response.parsed_body.dig("comment", "id"))

      expect(response).to have_http_status(:created)
      expect(comment.task).to eq(task)
      expect(comment.content).to eq("Authentication API is ready for review.")
    end

    it "uses the current user as the comment user" do
      user = create(:user)
      task = create_task_with_member(user, "member")

      post "/api/v1/tasks/#{task.id}/comments",
           params: { comment: { content: "Looks good." } },
           headers: authorization_header(user),
           as: :json

      comment = Comment.find(response.parsed_body.dig("comment", "id"))

      expect(response).to have_http_status(:created)
      expect(comment.user).to eq(user)
    end

    it "does not allow user_id to be overridden" do
      user = create(:user)
      other_user = create(:user)
      task = create_task_with_member(user, "member")

      post "/api/v1/tasks/#{task.id}/comments",
           params: { comment: { content: "Looks good.", user_id: other_user.id } },
           headers: authorization_header(user),
           as: :json

      comment = Comment.find(response.parsed_body.dig("comment", "id"))

      expect(response).to have_http_status(:created)
      expect(comment.user).to eq(user)
    end

    it "returns unauthorized when unauthenticated" do
      task = create(:task)

      post "/api/v1/tasks/#{task.id}/comments",
           params: { comment: { content: "Looks good." } },
           as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response_error["code"]).to eq("unauthorized")
    end

    it "returns validation error without content" do
      user = create(:user)
      task = create_task_with_member(user, "member")

      post "/api/v1/tasks/#{task.id}/comments",
           params: { comment: { content: "" } },
           headers: authorization_header(user),
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_error["code"]).to eq("validation_error")
    end

    it "returns not found for another team's task" do
      user = create(:user)
      other_task = create_task_with_member(create(:user), "owner")

      post "/api/v1/tasks/#{other_task.id}/comments",
           params: { comment: { content: "Looks good." } },
           headers: authorization_header(user),
           as: :json

      expect(response).to have_http_status(:not_found)
      expect(response_error["code"]).to eq("not_found")
    end

    it "does not include unnecessary user fields in the response" do
      user = create(:user)
      task = create_task_with_member(user, "member")

      post "/api/v1/tasks/#{task.id}/comments",
           params: { comment: { content: "Looks good." } },
           headers: authorization_header(user),
           as: :json

      comment_response = response.parsed_body.fetch("comment")
      user_response = comment_response.fetch("user")

      expect(response).to have_http_status(:created)
      expect(comment_response).not_to have_key("user_id")
      expect(user_response).to include("id" => user.id, "name" => user.name)
      expect(user_response.keys).to contain_exactly("id", "name")
      expect(user_response).not_to have_key("email")
      expect(user_response).not_to have_key("encrypted_password")
      expect(user_response).not_to have_key("jti")
    end
  end

  describe "DELETE /api/v1/tasks/:id" do
    it "deletes comments when deleting a task" do
      user = create(:user)
      task = create_task_with_member(user, "member")
      comment = create(:comment, task: task, user: user)

      delete "/api/v1/tasks/#{task.id}", headers: authorization_header(user)

      expect(response).to have_http_status(:no_content)
      expect(Comment.exists?(comment.id)).to be(false)
    end
  end

  def create_task_with_member(user, role)
    team = create(:team, created_by: user)
    create(:team_member, team: team, user: user, role: role)
    project = create(:project, team: team, created_by: user)
    create(:task, project: project, created_by: user)
  end

  def authorization_header(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  def response_error
    response.parsed_body.fetch("error")
  end
end
