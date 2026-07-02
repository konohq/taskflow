class TeamMember < ApplicationRecord
  ROLES = %w[owner admin member].freeze

  belongs_to :team
  belongs_to :user

  validates :role, presence: true, inclusion: { in: ROLES }
  validates :user_id, uniqueness: { scope: :team_id }
  validates :joined_at, presence: true

  before_validation :set_joined_at, on: :create

  def owner?
    role == "owner"
  end

  def admin?
    role == "admin"
  end

  def member?
    role == "member"
  end

  def api_json
    {
      id: id,
      user: user_json,
      role: role,
      joined_at: joined_at.iso8601
    }
  end

  def destroy_with_task_unassignment!
    self.class.transaction do
      assigned_tasks_in_team.find_each do |task|
        task.update!(assignee: nil)
      end

      destroy!
    end
  end

  private

  def assigned_tasks_in_team
    Task.joins(:project)
        .where(projects: { team_id: team_id }, assignee_id: user_id)
  end

  def set_joined_at
    self.joined_at ||= Time.current
  end

  def user_json
    {
      id: user.id,
      name: user.name,
      email: user.email
    }
  end
end
