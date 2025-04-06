-- /home/ubuntu/mobile_order_system/backend/database_schema.sql
CREATE DATABASE IF NOT EXISTS mobile_order;
USE mobile_order;

-- テーブル管理テーブル
CREATE TABLE IF NOT EXISTS tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_number VARCHAR(10) NOT NULL,
  capacity INT NOT NULL,
  status ENUM('available', 'occupied', 'payment_requested', 'payment_completed', 'cleaning', 'reserved', 'maintenance') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- テーブル状態履歴テーブル
CREATE TABLE IF NOT EXISTS table_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT NOT NULL,
  previous_status ENUM('available', 'occupied', 'payment_requested', 'payment_completed', 'cleaning', 'reserved', 'maintenance') NOT NULL,
  new_status ENUM('available', 'occupied', 'payment_requested', 'payment_completed', 'cleaning', 'reserved', 'maintenance') NOT NULL,
  staff_id VARCHAR(50),
  note TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

-- メニューカテゴリテーブル
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  display_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- メニュー項目テーブル
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(255),
  is_sold_out BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 注文テーブル
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('unpaid', 'requested', 'paid', 'cancelled') NOT NULL DEFAULT 'unpaid',
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

-- 注文項目テーブル
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- 支払い履歴テーブル
CREATE TABLE IF NOT EXISTS payment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  status ENUM('requested', 'paid', 'cancelled') NOT NULL,
  payment_method VARCHAR(50),
  staff_id VARCHAR(50),
  note TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 初期データ
INSERT INTO tables (table_number, capacity, status) VALUES
('A1', 4, 'available'),
('A2', 4, 'available'),
('A3', 2, 'available'),
('B1', 6, 'available'),
('B2', 8, 'available'),
('C1', 2, 'available');

INSERT INTO categories (name, display_order) VALUES
('期間限定・極みネタ', 1),
('にぎり', 2),
('裏巻き・軍艦', 3),
('サイドメニュー', 4),
('ドリンク', 5);

INSERT INTO menu_items (category_id, name, description, price, image_url, is_sold_out, display_order) VALUES
(1, '富山県産 白えび', '富山湾の宝石と呼ばれる高級食材', 330, '/uploads/images/default-food.jpg', 0, 1),
(1, '肩ロースハム 生ハムマルマヨ', '生ハムとマヨネーズの絶妙な組み合わせ', 220, '/uploads/images/default-food.jpg', 0, 2),
(2, 'サーモン', '脂がのった新鮮なサーモン', 180, '/uploads/images/default-food.jpg', 0, 1),
(2, 'マグロ', '赤身の旨味が詰まった上質なマグロ', 250, '/uploads/images/default-food.jpg', 0, 2),
(3, 'カリフォルニアロール', 'アボカドとカニカマの定番ロール', 280, '/uploads/images/default-food.jpg', 0, 1),
(4, 'あさりの味噌汁', 'あさりの旨味がたっぷり', 150, '/uploads/images/default-food.jpg', 0, 1),
(5, '緑茶', '香り高い日本茶', 100, '/uploads/images/default-food.jpg', 0, 1),
(5, 'ウーロン茶', '香ばしい風味のウーロン茶', 100, '/uploads/images/default-food.jpg', 1, 2);
