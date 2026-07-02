FactoryBot.define do
  factory :comment do
    association :task
    association :user
    content { Faker::Lorem.sentence }
  end
end
