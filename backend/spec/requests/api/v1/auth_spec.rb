require "rails_helper"

RSpec.describe "Api::V1::Auth", type: :request do
  describe "POST /api/v1/auth/sign_up" do
    it "registers a user" do
      post "/api/v1/auth/sign_up",
           params: {
             user: {
               name: "Test User",
               email: "test@example.com",
               password: "password123",
               password_confirmation: "password123"
             }
           },
           as: :json

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig("user", "email")).to eq("test@example.com")
      expect(response.headers["Authorization"]).to start_with("Bearer ")
      expect(response.parsed_body["token"]).to be_present
      expect(response_user).not_to include("password", "encrypted_password", "jti")
    end

    it "rejects duplicate emails" do
      create(:user, email: "test@example.com")

      post "/api/v1/auth/sign_up",
           params: {
             user: {
               name: "Test User",
               email: "TEST@example.com",
               password: "password123",
               password_confirmation: "password123"
             }
           },
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_error).to include(
        "code" => "validation_error",
        "message" => "入力内容に誤りがあります"
      )
      expect(response_error["details"]).to include("Email has already been taken")
    end

    it "rejects passwords that are too short" do
      post "/api/v1/auth/sign_up",
           params: {
             user: {
               name: "Test User",
               email: "test@example.com",
               password: "short",
               password_confirmation: "short"
             }
           },
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_error["code"]).to eq("validation_error")
    end

    it "returns a unified error response when required parameters are missing" do
      post "/api/v1/auth/sign_up", params: {}, as: :json

      expect(response).to have_http_status(:bad_request)
      expect(response_error).to eq(
        "code" => "parameter_missing",
        "message" => "必要なパラメータが不足しています"
      )
    end
  end

  describe "POST /api/v1/auth/sign_in" do
    it "signs in a user and returns a JWT" do
      create(:user, email: "test@example.com", password: "password123")

      post "/api/v1/auth/sign_in",
           params: { user: { email: "test@example.com", password: "password123" } },
           as: :json

      expect(response).to have_http_status(:ok)
      expect(response.headers["Authorization"]).to start_with("Bearer ")
      expect(response.parsed_body["token"]).to be_present
      expect(response_user).not_to include("password", "encrypted_password", "jti")
    end

    it "signs in a user even when email uses uppercase letters" do
      create(:user, email: "test@example.com", password: "password123")

      post "/api/v1/auth/sign_in",
           params: { user: { email: "TEST@example.com", password: "password123" } },
           as: :json

      expect(response).to have_http_status(:ok)
      expect(response.headers["Authorization"]).to start_with("Bearer ")
    end

    it "returns unauthorized with a unified error response when credentials are invalid" do
      create(:user, email: "test@example.com", password: "password123")

      post "/api/v1/auth/sign_in",
           params: { user: { email: "test@example.com", password: "wrong-password" } },
           as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response_error).to eq(
        "code" => "unauthorized",
        "message" => "ログインしてください"
      )
    end
  end

  describe "GET /api/v1/auth/me" do
    it "returns the current user when authenticated" do
      user = create(:user)
      token = jwt_for(user)

      get "/api/v1/auth/me", headers: authorization_header(token)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("user", "id")).to eq(user.id)
      expect(response_user).not_to include("password", "encrypted_password", "jti")
    end

    it "returns unauthorized when unauthenticated" do
      get "/api/v1/auth/me"

      expect(response).to have_http_status(:unauthorized)
      expect(response_error).to eq(
        "code" => "unauthorized",
        "message" => "ログインしてください"
      )
    end

    it "returns unauthorized when JWT is invalid" do
      get "/api/v1/auth/me", headers: authorization_header("invalid.jwt.token")

      expect(response).to have_http_status(:unauthorized)
      expect(response_error).to eq(
        "code" => "unauthorized",
        "message" => "ログインしてください"
      )
    end
  end

  describe "DELETE /api/v1/auth/sign_out" do
    it "signs out the user" do
      user = create(:user)
      token = jwt_for(user)

      delete "/api/v1/auth/sign_out", headers: authorization_header(token)

      expect(response).to have_http_status(:no_content)

      get "/api/v1/auth/me", headers: authorization_header(token)

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns unauthorized when unauthenticated" do
      delete "/api/v1/auth/sign_out"

      expect(response).to have_http_status(:unauthorized)
      expect(response_error).to eq(
        "code" => "unauthorized",
        "message" => "ログインしてください"
      )
    end
  end

  def jwt_for(user)
    Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
  end

  def response_error
    response.parsed_body.fetch("error")
  end

  def response_user
    response.parsed_body.fetch("user")
  end

  def authorization_header(token)
    { "Authorization" => "Bearer #{token}" }
  end
end
