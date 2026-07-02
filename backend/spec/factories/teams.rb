FactoryBot.define do
  factory :team do
    name { Faker::Team.name }
    description { Faker::Lorem.sentence }
    association :created_by, factory: :user
  end
end
