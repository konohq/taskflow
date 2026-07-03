Rails.application.config.middleware.insert_before 0, Rack::Cors do
  frontend_origins = ENV.fetch("FRONTEND_ORIGIN", "")
                        .split(",")
                        .map(&:strip)
                        .compact_blank

  allow do
    origins "http://localhost:5173",
            "http://127.0.0.1:5173",
            *frontend_origins

    resource "/api/*",
             headers: :any,
             methods: %i[get post put patch delete options head],
             expose: ["Authorization"]
  end
end
