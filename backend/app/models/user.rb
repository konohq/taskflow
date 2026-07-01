class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable,
         :registerable,
         :validatable,
         :jwt_authenticatable,
         jwt_revocation_strategy: self

  before_validation :downcase_email
  before_validation :ensure_jti, on: :create

  validates :name, presence: true

  private

  def downcase_email
    self.email = email.to_s.downcase
  end

  def ensure_jti
    self.jti ||= SecureRandom.uuid
  end
end
