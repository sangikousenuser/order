/**
 * 支払いワークフロー処理モジュール
 * 
 * このモジュールは注文から支払い完了までの一連のワークフローを管理します。
 * - 注文処理
 * - 支払い方法選択
 * - 支払い処理
 * - 支払い状態管理
 */

const crypto = require('crypto');
const qrBarcodeIntegration = require('./qr_barcode_integration');

// 支払い状態の定義
const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// 支払い方法の定義
const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  MOBILE_PAYMENT: 'mobile_payment'
};

/**
 * 注文を作成する
 * @param {number} tableId - テーブルID
 * @param {Array} items - 注文アイテム配列 [{itemId, quantity, unitPrice, specialInstructions}]
 * @returns {Object} 作成された注文情報
 */
async function createOrder(tableId, items) {
  try {
    // 注文の合計金額を計算
    let totalAmount = 0;
    items.forEach(item => {
      totalAmount += item.unitPrice * item.quantity;
    });
    
    // 消費税を計算（10%）
    const taxRate = 0.1;
    const taxAmount = Math.round(totalAmount * taxRate);
    const grandTotal = totalAmount + taxAmount;
    
    // 注文IDを生成（実際にはデータベースのシーケンスなどを使用）
    const orderId = Date.now();
    
    // 注文データを作成（実際にはデータベースに保存）
    const order = {
      orderId,
      tableId,
      items: items.map(item => ({
        ...item,
        status: 'pending'
      })),
      totalAmount,
      taxAmount,
      grandTotal,
      status: 'pending',
      paymentStatus: PAYMENT_STATUS.UNPAID,
      paymentMethod: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('注文を作成しました:', order);
    
    return order;
  } catch (error) {
    console.error('注文作成エラー:', error);
    throw new Error('注文の作成に失敗しました');
  }
}

/**
 * 支払い処理を開始する
 * @param {number} orderId - 注文ID
 * @param {string} paymentMethod - 支払い方法
 * @returns {Object} 支払い情報
 */
async function initiatePayment(orderId, paymentMethod) {
  try {
    // 注文情報を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const order = {
      orderId,
      tableId: 1,
      totalAmount: 1920,
      taxAmount: 192,
      grandTotal: 2112,
      status: 'pending',
      paymentStatus: PAYMENT_STATUS.UNPAID
    };
    
    if (!order) {
      throw new Error('注文が見つかりません');
    }
    
    // 支払い方法が有効かチェック
    if (!Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
      throw new Error('無効な支払い方法です');
    }
    
    // 支払いIDを生成
    const paymentId = crypto.randomBytes(8).toString('hex');
    
    // 支払い情報を作成
    const payment = {
      paymentId,
      orderId,
      amount: order.grandTotal,
      paymentMethod,
      status: PAYMENT_STATUS.PENDING,
      createdAt: new Date().toISOString()
    };
    
    // 支払い方法に応じた処理
    switch (paymentMethod) {
      case PAYMENT_METHODS.CASH:
        // 現金支払いの場合はバーコードを生成
        payment.barcode = qrBarcodeIntegration.generatePaymentBarcode(orderId, order.grandTotal);
        break;
        
      case PAYMENT_METHODS.CREDIT_CARD:
        // クレジットカード支払いの場合は決済IDを生成
        payment.transactionId = `CC-${crypto.randomBytes(8).toString('hex')}`;
        break;
        
      case PAYMENT_METHODS.MOBILE_PAYMENT:
        // モバイル決済の場合はQRコードURLを生成
        payment.qrCodeUrl = `mobilepay://payment?amount=${order.grandTotal}&reference=${orderId}`;
        break;
    }
    
    // 注文の支払い状態を更新
    order.paymentStatus = PAYMENT_STATUS.PENDING;
    order.paymentMethod = paymentMethod;
    order.updatedAt = new Date().toISOString();
    
    console.log('支払い処理を開始しました:', payment);
    
    return payment;
  } catch (error) {
    console.error('支払い開始エラー:', error);
    throw new Error('支払い処理の開始に失敗しました');
  }
}

/**
 * 支払いを完了する
 * @param {string} paymentId - 支払いID
 * @param {string} transactionId - 取引ID（オプション）
 * @returns {Object} 更新された支払い情報
 */
async function completePayment(paymentId, transactionId = null) {
  try {
    // 支払い情報を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const payment = {
      paymentId,
      orderId: 12345,
      amount: 2112,
      paymentMethod: PAYMENT_METHODS.CASH,
      status: PAYMENT_STATUS.PENDING,
      createdAt: new Date(Date.now() - 300000).toISOString() // 5分前
    };
    
    if (!payment) {
      throw new Error('支払い情報が見つかりません');
    }
    
    if (payment.status !== PAYMENT_STATUS.PENDING) {
      throw new Error('この支払いは既に処理されています');
    }
    
    // 支払い情報を更新
    payment.status = PAYMENT_STATUS.PAID;
    payment.transactionId = transactionId || payment.transactionId;
    payment.completedAt = new Date().toISOString();
    payment.updatedAt = new Date().toISOString();
    
    // 注文情報も更新（実際にはデータベースから取得して更新）
    const order = {
      orderId: payment.orderId,
      status: 'pending',
      paymentStatus: PAYMENT_STATUS.PENDING
    };
    
    order.paymentStatus = PAYMENT_STATUS.PAID;
    order.status = 'completed';
    order.updatedAt = new Date().toISOString();
    
    console.log('支払いを完了しました:', payment);
    console.log('注文を更新しました:', order);
    
    return {
      payment,
      order
    };
  } catch (error) {
    console.error('支払い完了エラー:', error);
    throw new Error('支払い処理の完了に失敗しました');
  }
}

/**
 * 支払いをキャンセルする
 * @param {string} paymentId - 支払いID
 * @param {string} reason - キャンセル理由
 * @returns {Object} 更新された支払い情報
 */
async function cancelPayment(paymentId, reason) {
  try {
    // 支払い情報を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const payment = {
      paymentId,
      orderId: 12345,
      amount: 2112,
      paymentMethod: PAYMENT_METHODS.CASH,
      status: PAYMENT_STATUS.PENDING,
      createdAt: new Date(Date.now() - 300000).toISOString() // 5分前
    };
    
    if (!payment) {
      throw new Error('支払い情報が見つかりません');
    }
    
    if (payment.status !== PAYMENT_STATUS.PENDING) {
      throw new Error('この支払いは既に処理されています');
    }
    
    // 支払い情報を更新
    payment.status = PAYMENT_STATUS.FAILED;
    payment.cancelReason = reason;
    payment.cancelledAt = new Date().toISOString();
    payment.updatedAt = new Date().toISOString();
    
    // 注文情報も更新（実際にはデータベースから取得して更新）
    const order = {
      orderId: payment.orderId,
      status: 'pending',
      paymentStatus: PAYMENT_STATUS.PENDING
    };
    
    order.paymentStatus = PAYMENT_STATUS.UNPAID; // 未払いに戻す
    order.updatedAt = new Date().toISOString();
    
    console.log('支払いをキャンセルしました:', payment);
    console.log('注文を更新しました:', order);
    
    return {
      payment,
      order
    };
  } catch (error) {
    console.error('支払いキャンセルエラー:', error);
    throw new Error('支払い処理のキャンセルに失敗しました');
  }
}

/**
 * 支払い状態を確認する
 * @param {string} paymentId - 支払いID
 * @returns {Object} 支払い情報
 */
async function checkPaymentStatus(paymentId) {
  try {
    // 支払い情報を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const payment = {
      paymentId,
      orderId: 12345,
      amount: 2112,
      paymentMethod: PAYMENT_METHODS.CASH,
      status: PAYMENT_STATUS.PENDING,
      createdAt: new Date(Date.now() - 300000).toISOString() // 5分前
    };
    
    if (!payment) {
      throw new Error('支払い情報が見つかりません');
    }
    
    return payment;
  } catch (error) {
    console.error('支払い状態確認エラー:', error);
    throw new Error('支払い状態の確認に失敗しました');
  }
}

/**
 * 注文の支払い履歴を取得する
 * @param {number} orderId - 注文ID
 * @returns {Array} 支払い履歴
 */
async function getPaymentHistory(orderId) {
  try {
    // 支払い履歴を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const paymentHistory = [
      {
        paymentId: 'abc123',
        orderId,
        amount: 2112,
        paymentMethod: PAYMENT_METHODS.CREDIT_CARD,
        status: PAYMENT_STATUS.FAILED,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1時間前
        updatedAt: new Date(Date.now() - 3540000).toISOString(), // 59分前
        cancelReason: 'カード決済エラー'
      },
      {
        paymentId: 'def456',
        orderId,
        amount: 2112,
        paymentMethod: PAYMENT_METHODS.CASH,
        status: PAYMENT_STATUS.PAID,
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30分前
        completedAt: new Date(Date.now() - 1740000).toISOString(), // 29分前
        updatedAt: new Date(Date.now() - 1740000).toISOString() // 29分前
      }
    ];
    
    return paymentHistory;
  } catch (error) {
    console.error('支払い履歴取得エラー:', error);
    throw new Error('支払い履歴の取得に失敗しました');
  }
}

/**
 * 領収書データを生成する
 * @param {number} orderId - 注文ID
 * @returns {Object} 領収書データ
 */
async function generateReceipt(orderId) {
  try {
    // 注文情報を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const order = {
      orderId,
      tableId: 1,
      items: [
        { itemId: 1, name: '富山県産 白えび', quantity: 2, unitPrice: 330 },
        { itemId: 2, name: '肩ロースハム 生ハムマルマヨ', quantity: 1, unitPrice: 220 },
        { itemId: 3, name: 'サーモン', quantity: 3, unitPrice: 180 },
        { itemId: 4, name: 'マグロ', quantity: 2, unitPrice: 250 }
      ],
      totalAmount: 1920,
      taxAmount: 192,
      grandTotal: 2112,
      status: 'completed',
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentMethod: PAYMENT_METHODS.CASH,
      createdAt: new Date(Date.now() - 1800000).toISOString(), // 30分前
      completedAt: new Date(Date.now() - 1740000).toISOString() // 29分前
    };
    
    if (!order) {
      throw new Error('注文が見つかりません');
    }
    
    if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
      throw new Error('この注文はまだ支払いが完了していません');
    }
    
    // 支払い情報を取得
    const paymentHistory = await getPaymentHistory(orderId);
    const payment = paymentHistory.find(p => p.status === PAYMENT_STATUS.PAID);
    
    if (!payment) {
      throw new Error('支払い情報が見つかりません');
    }
    
    // 領収書データを生成
    const receipt = {
      receiptId: `R-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      orderId,
      tableId: order.tableId,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice
      })),
      subtotal: order.totalAmount,
      tax: order.taxAmount,
      total: order.grandTotal,
      paymentMethod: order.paymentMethod,
      paymentId: payment.paymentId,
      issuedAt: new Date().toISOString(),
      restaurantInfo: {
        name: 'サンプルレストラン',
        address: '東京都渋谷区〇〇町1-2-3',
        phone: '03-1234-5678',
        taxId: '1234567890'
      }
    };
    
    console.log('領収書を生成しました:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('領収書生成エラー:', error);
    throw new Error('領収書の生成に失敗しました');
  }
}

// モジュールをエクスポート
module.exports = {
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  createOrder,
  initiatePayment,
  completePayment,
  cancelPayment,
  checkPaymentStatus,
  getPaymentHistory,
  generateReceipt
};
