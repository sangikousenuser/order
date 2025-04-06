// /home/ubuntu/mobile_order_system/backend/app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const dbConfig = require('./db_config');

const app = express();
const port = 3000;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../dist'));

// 画像アップロードディレクトリの設定
const uploadDir = '/uploads/images';
// ディレクトリが存在しない場合は作成
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multerの設定
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// 画像ファイルを提供するためのルート
app.use('/uploads/images', express.static(uploadDir));

// データベース接続プール
const pool = mysql.createPool(dbConfig);

// APIエンドポイント
// テーブル管理API
app.get('/api/tables', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tables');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// テーブル追加API
app.post('/api/tables', async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;
    const [result] = await pool.query(
      'INSERT INTO tables (table_number, capacity, status) VALUES (?, ?, "available")',
      [tableNumber, capacity]
    );
    const [newTable] = await pool.query('SELECT * FROM tables WHERE id = ?', [result.insertId]);
    res.status(201).json(newTable[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// テーブル状態更新API
app.put('/api/tables/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE tables SET status = ? WHERE id = ?', [status, id]);
    const [updatedTable] = await pool.query('SELECT * FROM tables WHERE id = ?', [id]);
    res.json(updatedTable[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// メニューカテゴリAPI
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY display_order');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// カテゴリ追加API
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const [maxOrder] = await pool.query('SELECT MAX(display_order) as max_order FROM categories');
    const order = maxOrder[0].max_order ? maxOrder[0].max_order + 1 : 1;
    
    const [result] = await pool.query(
      'INSERT INTO categories (name, display_order) VALUES (?, ?)',
      [name, order]
    );
    const [newCategory] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(newCategory[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// メニュー項目API
app.get('/api/menu-items', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu_items ORDER BY category_id, display_order');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// カテゴリ別メニュー項目API
app.get('/api/categories/:id/menu-items', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM menu_items WHERE category_id = ? ORDER BY display_order',
      [id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// メニュー項目追加API（画像アップロード付き）
app.post('/api/menu-items', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, categoryId } = req.body;
    let imagePath = null;
    
    if (req.file) {
      imagePath = `/uploads/images/${req.file.filename}`;
    } else {
      // デフォルト画像パス
      imagePath = `/uploads/images/default-food.jpg`;
    }
    
    const [maxOrder] = await pool.query(
      'SELECT MAX(display_order) as max_order FROM menu_items WHERE category_id = ?',
      [categoryId]
    );
    const order = maxOrder[0].max_order ? maxOrder[0].max_order + 1 : 1;
    
    const [result] = await pool.query(
      'INSERT INTO menu_items (name, description, price, category_id, image_url, is_sold_out, display_order) VALUES (?, ?, ?, ?, ?, 0, ?)',
      [name, description, price, categoryId, imagePath, order]
    );
    
    const [newItem] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
    res.status(201).json(newItem[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 完売状態切り替えAPI
app.put('/api/menu-items/:id/toggle-sold-out', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE menu_items SET is_sold_out = NOT is_sold_out WHERE id = ?', [id]);
    const [updatedItem] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    res.json(updatedItem[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 注文API
app.get('/api/orders', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    
    // 各注文の詳細を取得
    for (let order of orders) {
      const [items] = await pool.query(
        'SELECT oi.*, mi.name FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = ?',
        [order.id]
      );
      order.items = items;
    }
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// テーブル別注文API
app.get('/api/tables/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE table_id = ? ORDER BY created_at DESC',
      [id]
    );
    
    // 各注文の詳細を取得
    for (let order of orders) {
      const [items] = await pool.query(
        'SELECT oi.*, mi.name FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = ?',
        [order.id]
      );
      order.items = items;
    }
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 注文作成API
app.post('/api/orders', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { tableId, items } = req.body;
    let totalAmount = 0;
    
    // 合計金額を計算
    for (const item of items) {
      totalAmount += item.unitPrice * item.quantity;
    }
    
    // 注文を作成
    const [orderResult] = await connection.query(
      'INSERT INTO orders (table_id, total_amount, status, payment_status, created_at) VALUES (?, ?, "pending", "unpaid", NOW())',
      [tableId, totalAmount]
    );
    
    const orderId = orderResult.insertId;
    
    // 注文アイテムを追加
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.itemId, item.quantity, item.unitPrice]
      );
    }
    
    // テーブル状態を更新
    await connection.query(
      'UPDATE tables SET status = "occupied" WHERE id = ?',
      [tableId]
    );
    
    await connection.commit();
    
    // 作成された注文を取得
    const [newOrder] = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const [orderItems] = await connection.query(
      'SELECT oi.*, mi.name FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = ?',
      [orderId]
    );
    
    newOrder[0].items = orderItems;
    
    res.status(201).json(newOrder[0]);
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// 支払い状態更新API
app.put('/api/orders/:id/payment-status', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { status, paymentMethod } = req.body;
    
    // 注文の支払い状態を更新
    if (status === 'paid') {
      await connection.query(
        'UPDATE orders SET payment_status = ?, status = "completed", payment_method = ?, completed_at = NOW(), updated_at = NOW() WHERE id = ?',
        [status, paymentMethod, id]
      );
    } else {
      await connection.query(
        'UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
    }
    
    // 注文情報を取得
    const [updatedOrder] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
    
    // 支払い済みの場合、テーブル状態を更新
    if (status === 'paid') {
      await connection.query(
        'UPDATE tables SET status = "payment_completed" WHERE id = ?',
        [updatedOrder[0].table_id]
      );
    } else if (status === 'requested') {
      await connection.query(
        'UPDATE tables SET status = "payment_requested" WHERE id = ?',
        [updatedOrder[0].table_id]
      );
    }
    
    await connection.commit();
    
    // 注文アイテムを取得
    const [orderItems] = await connection.query(
      'SELECT oi.*, mi.name FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = ?',
      [id]
    );
    
    updatedOrder[0].items = orderItems;
    
    res.json(updatedOrder[0]);
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました`) ;
});
