class CreateProjects < ActiveRecord::Migration[8.0]
  def change
    create_projects
    add_project_constraints
  end

  private

  def create_projects
    create_table :projects do |t|
      t.references :team, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.string :status, null: false, default: "active"
      t.references :created_by, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :projects, %i[team_id status]
  end

  def add_project_constraints
    add_check_constraint :projects,
                         "status IN ('active', 'archived')",
                         name: "check_projects_status"
  end
end
