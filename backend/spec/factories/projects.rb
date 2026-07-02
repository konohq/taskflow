FactoryBot.define do
  factory :project do
    association :team
    name { Faker::App.name }
    description { Faker::Lorem.sentence }
    status { "active" }
    association :created_by, factory: :user

    trait :archived do
      status { "archived" }
    end
  end
end
