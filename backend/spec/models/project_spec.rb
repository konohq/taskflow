require "rails_helper"

RSpec.describe Project, type: :model do
  it "is valid with valid attributes" do
    project = build(:project)

    expect(project).to be_valid
  end

  it "is invalid without a name" do
    project = build(:project, name: nil)

    expect(project).not_to be_valid
  end

  it "is invalid without a team" do
    project = build(:project, team: nil)

    expect(project).not_to be_valid
  end

  it "allows only defined statuses" do
    project = build(:project, status: "invalid")

    expect(project).not_to be_valid
  end

  it "uses active as the default status" do
    project = described_class.new(
      team: build(:team),
      name: "Backend MVP",
      created_by: build(:user)
    )

    expect(project.status).to eq("active")
  end
end
