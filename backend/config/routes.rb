Rails.application.routes.draw do
  devise_for :users, skip: :all

  namespace :api do
    namespace :v1 do
      namespace :auth do
        post "sign_up", to: "registrations#create"
        post "sign_in", to: "sessions#create"
        delete "sign_out", to: "sessions#destroy"
        get "me", to: "me#show"
      end

      resources :teams, only: %i[index show create update destroy] do
        resources :members, controller: "team_members", only: %i[index create update destroy]
        resources :projects, only: %i[index create]
      end

      resources :projects, only: %i[show update destroy] do
        get "kanban", to: "kanban#show"
        resources :tasks, only: %i[index create]
      end

      resources :tasks, only: %i[show update destroy] do
        resources :comments, only: %i[index create]
      end

      namespace(:my) { resources :tasks, only: %i[index] }
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
