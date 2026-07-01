Devise.setup do |config|
  config.mailer_sender = "no-reply@taskflow-ai.local"

  require "devise/orm/active_record"

  config.navigational_formats = []
  config.skip_session_storage = %i[http_auth params_auth]

  config.jwt do |jwt|
    jwt.secret = ENV.fetch("TASKFLOW_AI_JWT_SECRET_KEY")
  end
end
