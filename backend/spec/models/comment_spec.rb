require "rails_helper"

RSpec.describe Comment, type: :model do
  it "is valid with valid attributes" do
    comment = build(:comment)

    expect(comment).to be_valid
  end

  it "is invalid without content" do
    comment = build(:comment, content: nil)

    expect(comment).not_to be_valid
  end

  it "is invalid without a task" do
    comment = build(:comment, task: nil)

    expect(comment).not_to be_valid
  end

  it "is invalid without a user" do
    comment = build(:comment, user: nil)

    expect(comment).not_to be_valid
  end
end
