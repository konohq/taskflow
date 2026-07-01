module Api
  module V1
    module Auth
      class BaseController < ApplicationController
        private

        def render_user(user, status: :ok, token: nil)
          response_body = {
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            }
          }
          response_body[:token] = token if token.present?

          render json: response_body, status: status
        end

        def render_errors(record)
          render json: { errors: record.errors.full_messages }, status: :unprocessable_content
        end

        def render_unauthorized
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end

        def jwt_for(user)
          Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
        end
      end
    end
  end
end
