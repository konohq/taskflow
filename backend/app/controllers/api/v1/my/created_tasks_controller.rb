module Api
  module V1
    module My
      class CreatedTasksController < BaseTasksController
        def index
          tasks = apply_filters(created_tasks).order(created_at: :desc)

          render_tasks(tasks)
        end

        private

        def created_tasks
          scoped_tasks.where(created_by_id: current_user.id)
        end
      end
    end
  end
end
