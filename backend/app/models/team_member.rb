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

  private

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
