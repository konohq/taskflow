class Project < ApplicationRecord
  STATUSES = %w[active archived].freeze

  belongs_to :team
  belongs_to :created_by, class_name: "User", inverse_of: :created_projects

  has_many :tasks, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }
  validates :status, presence: true, inclusion: { in: STATUSES }

  def api_json
    {
      id: id,
      team_id: team_id,
      name: name,
      description: description,
      status: status,
      created_at: created_at&.iso8601,
      updated_at: updated_at&.iso8601
    }
  end
end
