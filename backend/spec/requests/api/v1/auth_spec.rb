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
      expect(response.parsed_body.dig("user", "password")).to be_nil
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
    end
  end

  describe "GET /api/v1/auth/me" do
    it "returns the current user when authenticated" do
      user = create(:user)
      token = jwt_for(user)

      get "/api/v1/auth/me", headers: authorization_header(token)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("user", "id")).to eq(user.id)
      expect(response.parsed_body.dig("user", "password")).to be_nil
    end

    it "returns unauthorized when unauthenticated" do
      get "/api/v1/auth/me"

      expect(response).to have_http_status(:unauthorized)
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
  end

  def jwt_for(user)
    Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
  end

  def authorization_header(token)
    { "Authorization" => "Bearer #{token}" }
  end
end
