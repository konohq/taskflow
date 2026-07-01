module Api
  module V1
    module Auth
      class RegistrationsController < BaseController
        def create
          user = User.new(sign_up_params)

          if user.save
            token = jwt_for(user)
            response.set_header("Authorization", "Bearer #{token}")
            render_user(user, status: :created, token: token)
          else
            render_errors(user)
          end
        end

        private

        def sign_up_params
          params.expect(user: %i[name email password password_confirmation])
        end
      end
    end
  end
end
