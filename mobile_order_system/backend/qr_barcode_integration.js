/**
 * QRコードとバーコード機能の統合モジュール
 * 
 * このモジュールは管理画面と顧客画面間のQRコードとバーコード機能の連携を担当します。
 * - テーブルQRコードの生成と読み取り
 * - 支払いバーコードの生成と読み取り
 * - セッション管理
 */

const crypto = require('crypto');

// QRコード関連の設定
const QR_CODE_PREFIX = 'MORDER_TABLE_';
const QR_CODE_SECRET = 'qr_secret_key_12345'; // 本番環境では環境変数から取得すること

// バーコード関連の設定
const BARCODE_PREFIX = 'MORDER_PAY_';
const BARCODE_SECRET = 'barcode_secret_key_67890'; // 本番環境では環境変数から取得すること

/**
 * テーブル用QRコードのURLを生成する
 * @param {number} tableId - テーブルID
 * @param {string} tableNumber - テーブル番号
 * @returns {string} QRコードに埋め込むURL
 */
function generateTableQrUrl(tableId, tableNumber) {
  // 現在のタイムスタンプ（有効期限の設定に使用）
  const timestamp = Date.now();
  
  // 署名の生成（改ざん防止）
  const signature = generateSignature(`${QR_CODE_PREFIX}${tableId}_${timestamp}`, QR_CODE_SECRET);
  
  // QRコードに埋め込むURLを生成
  // 実際のドメインに置き換えること
  const baseUrl = 'https://example.com/customer/';
  const qrUrl = `${baseUrl}?table=${tableId}&t=${timestamp}&sig=${signature}`;
  
  return qrUrl;
}

/**
 * QRコードURLの検証
 * @param {string} url - QRコードから読み取ったURL
 * @returns {Object|null} 検証結果（テーブルIDなど）または無効な場合はnull
 */
function validateTableQrUrl(url) {
  try {
    // URLからパラメータを抽出
    const urlObj = new URL(url);
    const tableId = urlObj.searchParams.get('table');
    const timestamp = urlObj.searchParams.get('t');
    const receivedSignature = urlObj.searchParams.get('sig');
    
    if (!tableId || !timestamp || !receivedSignature) {
      return null;
    }
    
    // 署名を検証
    const expectedSignature = generateSignature(`${QR_CODE_PREFIX}${tableId}_${timestamp}`, QR_CODE_SECRET);
    if (receivedSignature !== expectedSignature) {
      return null;
    }
    
    // QRコードの有効期限をチェック（例: 24時間）
    const expirationTime = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）
    if (Date.now() - parseInt(timestamp) > expirationTime) {
      return null; // 期限切れ
    }
    
    return {
      tableId: parseInt(tableId),
      timestamp: parseInt(timestamp),
      isValid: true
    };
  } catch (error) {
    console.error('QRコードURL検証エラー:', error);
    return null;
  }
}

/**
 * 支払い用バーコードの値を生成する
 * @param {number} orderId - 注文ID
 * @param {number} amount - 支払い金額
 * @returns {string} バーコードに埋め込む値
 */
function generatePaymentBarcode(orderId, amount) {
  // 現在のタイムスタンプ（有効期限の設定に使用）
  const timestamp = Date.now();
  
  // 署名の生成（改ざん防止）
  const signature = generateSignature(`${BARCODE_PREFIX}${orderId}_${amount}_${timestamp}`, BARCODE_SECRET);
  
  // バーコードに埋め込む値を生成（CODE128形式に適した形式）
  const barcodeValue = `${BARCODE_PREFIX}${orderId}-${amount}-${timestamp}-${signature.substring(0, 8)}`;
  
  return barcodeValue;
}

/**
 * 支払いバーコードの検証
 * @param {string} barcodeValue - バーコードから読み取った値
 * @returns {Object|null} 検証結果（注文ID、金額など）または無効な場合はnull
 */
function validatePaymentBarcode(barcodeValue) {
  try {
    // バーコード値からデータを抽出
    const parts = barcodeValue.split('-');
    if (parts.length !== 4 || !parts[0].startsWith(BARCODE_PREFIX)) {
      return null;
    }
    
    const orderId = parseInt(parts[0].substring(BARCODE_PREFIX.length));
    const amount = parseInt(parts[1]);
    const timestamp = parseInt(parts[2]);
    const shortSignature = parts[3];
    
    // 署名を検証
    const expectedSignature = generateSignature(`${BARCODE_PREFIX}${orderId}_${amount}_${timestamp}`, BARCODE_SECRET);
    if (shortSignature !== expectedSignature.substring(0, 8)) {
      return null;
    }
    
    // バーコードの有効期限をチェック（例: 30分）
    const expirationTime = 30 * 60 * 1000; // 30分（ミリ秒）
    if (Date.now() - timestamp > expirationTime) {
      return null; // 期限切れ
    }
    
    return {
      orderId,
      amount,
      timestamp,
      isValid: true
    };
  } catch (error) {
    console.error('バーコード検証エラー:', error);
    return null;
  }
}

/**
 * 署名を生成する（HMAC-SHA256）
 * @param {string} data - 署名対象データ
 * @param {string} secret - 秘密鍵
 * @returns {string} 署名（16進数文字列）
 */
function generateSignature(data, secret) {
  return crypto.createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

/**
 * テーブルセッションを作成する
 * @param {number} tableId - テーブルID
 * @returns {string} セッションID
 */
function createTableSession(tableId) {
  // セッションIDを生成
  const sessionId = crypto.randomBytes(16).toString('hex');
  
  // セッションデータ（実際にはデータベースに保存する）
  const sessionData = {
    tableId,
    createdAt: Date.now(),
    expiresAt: Date.now() + (12 * 60 * 60 * 1000) // 12時間有効
  };
  
  // セッションをデータベースに保存する処理（ここではモックアップ）
  console.log(`セッション作成: ${sessionId}`, sessionData);
  
  return sessionId;
}

/**
 * テーブルセッションを検証する
 * @param {string} sessionId - セッションID
 * @returns {Object|null} セッションデータまたは無効な場合はnull
 */
function validateTableSession(sessionId) {
  // セッションをデータベースから取得する処理（ここではモックアップ）
  // 実際の実装ではデータベースからセッションを取得する
  const mockSessionData = {
    tableId: 1,
    createdAt: Date.now() - (1 * 60 * 60 * 1000), // 1時間前に作成されたと仮定
    expiresAt: Date.now() + (11 * 60 * 60 * 1000) // あと11時間有効
  };
  
  // セッションの有効期限をチェック
  if (Date.now() > mockSessionData.expiresAt) {
    return null; // 期限切れ
  }
  
  return mockSessionData;
}

// モジュールをエクスポート
module.exports = {
  generateTableQrUrl,
  validateTableQrUrl,
  generatePaymentBarcode,
  validatePaymentBarcode,
  createTableSession,
  validateTableSession
};
