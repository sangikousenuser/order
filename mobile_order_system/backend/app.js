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
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/customer', express.static(path.join(__dirname, '../customer')));

// 画像アップロードディレクトリの設定
const uploadDir = path.join(__dirname, '../uploads/images');
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
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// バーコード会計処理ハンドラーの読み込み
const barcodeCheckoutHandler = require('./barcode_checkout_handler');

// データベース接続プール
let pool;
async function initDb() {
  try {
    pool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('データベース接続プールを初期化しました');
  } catch (error) {
    console.error('データベース接続エラー:', error);
  }
}

// APIエンドポイント

// バーコードから注文情報を取得するAPI
app.post('/api/barcode/get-order-info', async (req, res) => {
  try {
    const { barcodeValue } = req.body;
    
    if (!barcodeValue) {
      return res.status(400).json({ success: false, message: 'バーコード値が必要です' });
    }
    
    const orderInfo = await barcodeCheckoutHandler.getOrderInfoFromBarcode(barcodeValue);
    
    if (!orderInfo) {
      return res.status(404).json({ success: false, message: '注文情報が見つかりません' });
    }
    
    res.json({ success: true, orderInfo });
  } catch (error) {
    console.error('バーコード処理エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});

// 会計処理を実行するAPI
app.post('/api/barcode/process-checkout', async (req, res) => {
  try {
    const { orderId, paymentMethod, staffId } = req.body;
    
    if (!orderId || !paymentMethod) {
      return res.status(400).json({ success: false, message: '注文IDと支払い方法が必要です' });
    }
    
    const result = await barcodeCheckoutHandler.processCheckout(orderId, paymentMethod, staffId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('会計処理エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});

// QRコード表示関数（グローバルスコープに定義）
window.showQRCode = async function(tableId, tableNumber) {
  try {
    const qrModal = document.getElementById('qr-code-modal');
    const qrContainer = document.getElementById('qr-code-container');
    const qrTableNumber = document.getElementById('qr-table-number');
    
    qrContainer.innerHTML = '';
    qrTableNumber.textContent = tableNumber;
    
    // 本番環境用：バックエンドAPIを呼び出してセキュアなQRコードURLを生成
    const response = await fetchAPI(`/tables/${tableId}/qr-code-url`);
    const qrUrl = response.data.url;
    
    // セキュリティログ（本番環境では削除することも検討）
    console.log('QR生成:', { tableId, timestamp: new Date().toISOString() });
    
    // QRコードを生成
    new QRCode(qrContainer, {
      text: qrUrl,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    
    // QRコードの有効期限情報を追加
    const expiryInfo = document.createElement('div');
    expiryInfo.className = 'text-center mt-1 small';
    
    // URLからタイムスタンプを抽出して有効期限を計算（24時間）
    const urlParams = new URLSearchParams(new URL(qrUrl).search);
    const timestamp = urlParams.get('t');
    if (timestamp) {
      const expiryDate = new Date(parseInt(timestamp) + 24 * 60 * 60 * 1000);
      expiryInfo.textContent = `有効期限: ${expiryDate.toLocaleString('ja-JP')}`;
      qrContainer.appendChild(expiryInfo);
    }
    
    // テーブル情報を表示
    const tableInfo = document.createElement('div');
    tableInfo.className = 'text-center mt-2';
    tableInfo.innerHTML = `
      <p><strong>テーブル番号:</strong> ${tableNumber}</p>
      <p><strong>URL発行日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
    `;
    qrContainer.appendChild(tableInfo);
    
    qrModal.style.display = 'block';
  } catch (error) {
    showError('QRコードの生成に失敗しました: ' + error.message);
    console.error('QRコード生成エラー:', error);
  }
};

// サーバー起動
async function startServer() {
  await initDb();
  app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
  });
}

startServer();
