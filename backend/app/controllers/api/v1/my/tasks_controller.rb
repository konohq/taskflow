module Api
  module V1
    module My
      class TasksController < BaseTasksController
        def index
          tasks = apply_filters(my_tasks).order(created_at: :desc)

          render_tasks(tasks)
        end

        private

        def my_tasks
          scoped_tasks.where(assignee_id: current_user.id)
        end
      end
    end
  end
end
