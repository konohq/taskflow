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
        resources :tasks, only: %i[index create]
      end

      resources :tasks, only: %i[show update destroy]
    end
  end

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
