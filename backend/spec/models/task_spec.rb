require "rails_helper"

RSpec.describe Task, type: :model do
  it "is valid with valid attributes" do
    task = build(:task)

    expect(task).to be_valid
  end

  it "is invalid without a title" do
    task = build(:task, title: nil)

    expect(task).not_to be_valid
  end

  it "is invalid without a project" do
    task = build(:task, project: nil)

    expect(task).not_to be_valid
  end

  it "is invalid without a created_by" do
    task = build(:task, created_by: nil)

    expect(task).not_to be_valid
  end

  it "uses todo as the default status" do
    task = described_class.new(
      project: build(:project),
      title: "Create task API",
      created_by: build(:user)
    )

    expect(task.status).to eq("todo")
  end

  it "uses medium as the default priority" do
    task = described_class.new(
      project: build(:project),
      title: "Create task API",
      created_by: build(:user)
    )

    expect(task.priority).to eq("medium")
  end

  it "allows only defined statuses" do
    task = build(:task, status: "invalid")

    expect(task).not_to be_valid
  end

  it "allows only defined priorities" do
    task = build(:task, priority: "urgent")

    expect(task).not_to be_valid
  end
end
