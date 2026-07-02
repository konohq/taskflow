class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  has_many :team_members, dependent: :destroy
  has_many :teams, through: :team_members
  has_many :created_teams, class_name: "Team", foreign_key: :created_by_id, dependent: :restrict_with_error,
                           inverse_of: :created_by
  has_many :created_projects, class_name: "Project", foreign_key: :created_by_id, dependent: :restrict_with_error,
                              inverse_of: :created_by
  has_many :created_tasks, class_name: "Task", foreign_key: :created_by_id, dependent: :restrict_with_error,
                           inverse_of: :created_by
  has_many :assigned_tasks, class_name: "Task", foreign_key: :assignee_id, dependent: :nullify,
                            inverse_of: :assignee
  has_many :comments, dependent: :restrict_with_error

  devise :database_authenticatable,
         :registerable,
         :validatable,
         :jwt_authenticatable,
         jwt_revocation_strategy: self

  before_validation :downcase_email
  before_validation :ensure_jti, on: :create

  validates :name, presence: true

  private

  def downcase_email
    self.email = email.to_s.downcase
  end

  def ensure_jti
    self.jti ||= SecureRandom.uuid
  end
end
