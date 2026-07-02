require "rails_helper"

RSpec.describe TeamMember, type: :model do
  it "does not allow duplicate users in the same team" do
    team = create(:team)
    user = create(:user)
    create(:team_member, team: team, user: user)

    duplicate_member = build(:team_member, team: team, user: user)

    expect(duplicate_member).not_to be_valid
  end

  it "allows only defined roles" do
    member = build(:team_member, role: "invalid")

    expect(member).not_to be_valid
  end
end
