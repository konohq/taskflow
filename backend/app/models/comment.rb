class Comment < ApplicationRecord
  belongs_to :task
  belongs_to :user

  validates :content, presence: true, length: { maximum: 2_000 }

  def api_json
    {
      id: id,
      task_id: task_id,
      content: content,
      user: user_json,
      created_at: created_at&.iso8601,
      updated_at: updated_at&.iso8601
    }
  end

  private

  def user_json
    {
      id: user.id,
      name: user.name
    }
  end
end
