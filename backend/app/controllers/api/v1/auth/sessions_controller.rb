module Api
  module V1
    module Auth
      class SessionsController < BaseController
        before_action :authenticate_user!, only: :destroy

        def create
          user = User.find_by(email: sign_in_params[:email].to_s.downcase)

          return render_unauthorized unless user&.valid_password?(sign_in_params[:password])

          token = jwt_for(user)
          response.set_header("Authorization", "Bearer #{token}")
          render_user(user, token: token)
        end

        def destroy
          current_user.update!(jti: SecureRandom.uuid)
          head :no_content
        end

        private

        def sign_in_params
          params.expect(user: %i[email password])
        end
      end
    end
  end
end
