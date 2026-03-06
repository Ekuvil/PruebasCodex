CREATE TABLE IF NOT EXISTS hotel_records (
  id VARCHAR(80) PRIMARY KEY,
  module ENUM('rooms','reservations','guests','tasks','messages','inventory') NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_module_created_at (module, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
