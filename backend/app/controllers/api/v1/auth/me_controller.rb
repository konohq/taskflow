module Api
  module V1
    module Auth
      class MeController < BaseController
        before_action :authenticate_user!

        def show
          render_user(current_user)
        end
      end
    end
  end
end
