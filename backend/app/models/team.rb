class Team < ApplicationRecord
  belongs_to :created_by, class_name: "User", inverse_of: :created_teams

  has_many :team_members, dependent: :destroy
  has_many :users, through: :team_members
  has_many :projects, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }

  def membership_for(user)
    team_members.find_by(user: user)
  end
end
