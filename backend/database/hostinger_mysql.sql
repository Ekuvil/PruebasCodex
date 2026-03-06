CREATE DATABASE IF NOT EXISTS hotel_rogger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_rogger;

CREATE TABLE IF NOT EXISTS hotels (
  id VARCHAR(60) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL,
  address VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(120) NOT NULL,
  floors INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS floors (
  id VARCHAR(60) PRIMARY KEY,
  level INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  zone VARCHAR(120) NOT NULL,
  status VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(60) PRIMARY KEY,
  number VARCHAR(20) NOT NULL,
  floor INT NOT NULL,
  type VARCHAR(40) NOT NULL,
  status VARCHAR(40) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guests (
  id VARCHAR(60) PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  email VARCHAR(140) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  vip VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
  id VARCHAR(60) PRIMARY KEY,
  guest VARCHAR(140) NOT NULL,
  room VARCHAR(20) NOT NULL,
  checkIn DATE NOT NULL,
  checkOut DATE NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(60) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  area VARCHAR(90) NOT NULL,
  dueDate DATE NOT NULL,
  status VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(60) PRIMARY KEY,
  sender VARCHAR(90) NOT NULL,
  recipient VARCHAR(90) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  priority VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(60) PRIMARY KEY,
  item VARCHAR(120) NOT NULL,
  category VARCHAR(90) NOT NULL,
  stock INT NOT NULL,
  minStock INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO hotels (id, name, city, address, phone, email, floors)
VALUES ('hotel_1', 'El Hotel Rogger', 'Ciudad de México', 'Av. Central 180, Col. Centro', '+52 55 1100 2200', 'contacto@hotelrogger.com', 6)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO floors (id, level, name, zone, status)
VALUES
('floor_1', 1, 'Lobby y recepción', 'Operación general', 'Activo'),
('floor_2', 2, 'Habitaciones ejecutivas', 'Hospedaje', 'Activo'),
('floor_3', 3, 'Suites', 'Hospedaje premium', 'Activo')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO rooms (id, number, floor, type, status, price)
VALUES
('room_1', '101', 1, 'Suite', 'Ocupada', 3200),
('room_2', '201', 2, 'Doble', 'Disponible', 2200),
('room_3', '301', 3, 'Sencilla', 'Disponible', 1600)
ON DUPLICATE KEY UPDATE number = VALUES(number);
