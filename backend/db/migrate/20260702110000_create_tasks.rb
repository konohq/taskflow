class CreateTasks < ActiveRecord::Migration[8.0]
  def change
    create_tasks
    add_task_indexes
    add_task_constraints
  end

  private

  def create_tasks
    create_table :tasks do |t|
      t.references :project, null: false, foreign_key: true
      t.string :title, null: false
      t.string :status, null: false, default: "todo"
      t.string :priority, null: false, default: "medium"
      t.references :created_by, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_task_optional_columns
  end

  def add_task_optional_columns
    add_column :tasks, :description, :text
    add_column :tasks, :due_on, :date
    add_reference :tasks, :assignee, foreign_key: { to_table: :users }
  end

  def add_task_indexes
    add_index :tasks, %i[project_id status]
    add_index :tasks, :due_on
  end

  def add_task_constraints
    add_check_constraint :tasks,
                         "status IN ('todo', 'in_progress', 'review', 'done')",
                         name: "check_tasks_status"
    add_check_constraint :tasks,
                         "priority IN ('low', 'medium', 'high')",
                         name: "check_tasks_priority"
  end
end
