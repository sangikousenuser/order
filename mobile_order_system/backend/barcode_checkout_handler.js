/**
 * バーコード会計処理ハンドラーモジュール
 * 
 * このモジュールはバーコード読み取りによる会計処理を担当します。
 * - バーコード検証
 * - 注文情報の取得
 * - 会計処理の実行
 */
const qrBarcodeIntegration = require('./qr_barcode_integration');
const paymentStatusTracking = require('./payment_status_tracking');

/**
 * バーコードから注文情報を取得する
 * @param {string} barcodeValue - バーコードの値
 * @returns {Object|null} 注文情報または無効な場合はnull
 */
async function getOrderInfoFromBarcode(barcodeValue) {
  try {
    // バーコードを検証
    const barcodeData = qrBarcodeIntegration.validatePaymentBarcode(barcodeValue);
    
    if (!barcodeData || !barcodeData.isValid) {
      console.error('無効なバーコードです:', barcodeValue);
      return null;
    }
    
    // 注文IDと金額を取得
    const { orderId, amount } = barcodeData;
    
    // 注文情報を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const order = {
      orderId,
      tableId: 1, // 実際にはデータベースから取得
      totalAmount: amount,
      status: 'pending',
      paymentStatus: 'requested',
      items: [
        // 実際にはデータベースから取得
        { name: 'サンプル商品1', quantity: 2, unitPrice: 500 },
        { name: 'サンプル商品2', quantity: 1, unitPrice: 300 }
      ],
      createdAt: new Date(Date.now() - 1800000).toISOString() // 30分前
    };
    
    return order;
  } catch (error) {
    console.error('バーコードからの注文情報取得エラー:', error);
    return null;
  }
}

/**
 * 会計処理を実行する
 * @param {number} orderId - 注文ID
 * @param {string} paymentMethod - 支払い方法
 * @param {string} staffId - スタッフID
 * @returns {Object} 処理結果
 */
async function processCheckout(orderId, paymentMethod, staffId = 'staff1') {
  try {
    // 支払い状態を「支払い済み」に更新
    const result = await paymentStatusTracking.updatePaymentStatus(
      orderId,
      'paid',
      {
        paymentMethod,
        staffId,
        note: `バーコード読み取りによる会計処理 (${new Date().toISOString()})`
      }
    );
    
    if (!result) {
      throw new Error('支払い状態の更新に失敗しました');
    }
    
    // 処理結果を返す
    return {
      success: true,
      orderId,
      paymentMethod,
      processedAt: new Date().toISOString(),
      message: '会計処理が完了しました'
    };
  } catch (error) {
    console.error('会計処理エラー:', error);
    return {
      success: false,
      orderId,
      error: error.message || '会計処理に失敗しました'
    };
  }
}

// モジュールをエクスポート
module.exports = {
  getOrderInfoFromBarcode,
  processCheckout
};
