class CreateTeamsAndTeamMembers < ActiveRecord::Migration[8.0]
  def change
    create_teams
    create_team_members
    add_team_member_constraints
  end

  private

  def create_teams
    create_table :teams do |t|
      t.string :name, null: false
      t.text :description
      t.references :created_by, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end

  def create_team_members
    create_table :team_members do |t|
      t.references :user, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true
      t.string :role, null: false, default: "member"
      t.datetime :joined_at, null: false, default: -> { "CURRENT_TIMESTAMP" }

      t.timestamps
    end
  end

  def add_team_member_constraints
    add_index :team_members, %i[team_id user_id], unique: true
    add_index :team_members, %i[team_id role]
    add_check_constraint :team_members,
                         "role IN ('owner', 'admin', 'member')",
                         name: "check_team_members_role"
  end
end
