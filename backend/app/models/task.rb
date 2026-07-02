class Task < ApplicationRecord
  STATUSES = %w[todo in_progress review done].freeze
  PRIORITIES = %w[low medium high].freeze

  belongs_to :project
  belongs_to :created_by, class_name: "User", inverse_of: :created_tasks
  belongs_to :assignee, class_name: "User", optional: true, inverse_of: :assigned_tasks

  has_many :comments, dependent: :destroy

  validates :title, presence: true, length: { maximum: 100 }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :priority, presence: true, inclusion: { in: PRIORITIES }
  validate :assignee_must_belong_to_project_team

  def api_json
    task_attributes.merge(user_attributes, timestamp_attributes)
  end

  private

  def task_attributes
    {
      id: id,
      project_id: project_id,
      title: title,
      description: description,
      status: status,
      priority: priority,
      due_on: due_on&.iso8601
    }
  end

  def user_attributes
    {
      assignee: user_json(assignee),
      created_by: user_json(created_by)
    }
  end

  def timestamp_attributes
    {
      created_at: created_at&.iso8601,
      updated_at: updated_at&.iso8601
    }
  end

  def assignee_must_belong_to_project_team
    return if assignee_id.blank? || project.blank?
    return if project.team.team_members.exists?(user_id: assignee_id)

    errors.add(:assignee, "must belong to the project team")
  end

  def user_json(user)
    return nil unless user

    {
      id: user.id,
      name: user.name,
      email: user.email
    }
  end
end
