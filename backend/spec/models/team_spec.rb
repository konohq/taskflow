require "rails_helper"

RSpec.describe Team, type: :model do
  it "is invalid without a name" do
    team = build(:team, name: nil)

    expect(team).not_to be_valid
  end
end
