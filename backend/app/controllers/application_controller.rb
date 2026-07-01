class ApplicationController < ActionController::API
  rescue_from ActionController::ParameterMissing, with: :render_parameter_missing
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

  private

  def authenticate_user!
    return if current_user

    render_unauthorized
  end

  def render_unauthorized
    render_error(
      code: "unauthorized",
      message: "ログインしてください",
      status: :unauthorized
    )
  end

  def render_forbidden
    render_error(
      code: "forbidden",
      message: "この操作を行う権限がありません",
      status: :forbidden
    )
  end

  def render_not_found
    render_error(
      code: "not_found",
      message: "リソースが見つかりません",
      status: :not_found
    )
  end

  def render_validation_error(details)
    render_error(
      code: "validation_error",
      message: "入力内容に誤りがあります",
      status: :unprocessable_content,
      details: details
    )
  end

  def render_parameter_missing
    render_error(
      code: "parameter_missing",
      message: "必要なパラメータが不足しています",
      status: :bad_request
    )
  end

  def render_error(code:, message:, status:, details: nil)
    error = {
      code: code,
      message: message
    }
    error[:details] = details if details.present?

    render json: { error: error }, status: status
  end
end
