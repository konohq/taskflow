require "rails_helper"

RSpec.describe User, type: :model do
  it "downcases email before saving" do
    user = create(:user, email: "USER@example.COM")

    expect(user.email).to eq("user@example.com")
  end

  it "does not allow duplicate emails case-insensitively" do
    create(:user, email: "user@example.com")

    duplicate_user = build(:user, email: "USER@example.com")

    expect(duplicate_user).not_to be_valid
  end

  it "does not allow passwords that are too short" do
    user = build(:user, password: "short", password_confirmation: "short")

    expect(user).not_to be_valid
  end
end
