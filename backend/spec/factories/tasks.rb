FactoryBot.define do
  factory :task do
    association :project
    title { Faker::Lorem.sentence(word_count: 3) }
    description { Faker::Lorem.sentence }
    status { "todo" }
    priority { "medium" }
    due_on { 1.week.from_now.to_date }
    assignee { nil }
    association :created_by, factory: :user

    trait :in_progress do
      status { "in_progress" }
    end

    trait :review do
      status { "review" }
    end

    trait :done do
      status { "done" }
    end

    trait :low_priority do
      priority { "low" }
    end

    trait :high_priority do
      priority { "high" }
    end
  end
end
