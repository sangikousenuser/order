/**
 * 支払い状態追跡モジュール
 * 
 * このモジュールは支払い状態の記録と管理を担当します。
 * 実際の支払い処理は別システムで行われるため、このモジュールでは状態の管理のみを行います。
 */

// 支払い状態の定義
const PAYMENT_STATUS = {
  UNPAID: 'unpaid',        // 未払い
  REQUESTED: 'requested',  // 会計リクエスト中
  PAID: 'paid',            // 支払い済み
  CANCELLED: 'cancelled'   // キャンセル
};

/**
 * 支払い状態を更新する
 * @param {number} orderId - 注文ID
 * @param {string} status - 新しい支払い状態
 * @param {Object} additionalInfo - 追加情報（オプション）
 * @returns {Object} 更新された注文情報
 */
async function updatePaymentStatus(orderId, status, additionalInfo = {}) {
  try {
    // 注文情報を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const order = {
      orderId,
      tableId: 1,
      totalAmount: 1920,
      status: 'pending',
      paymentStatus: PAYMENT_STATUS.UNPAID,
      updatedAt: new Date(Date.now() - 600000).toISOString() // 10分前
    };
    
    if (!order) {
      throw new Error('注文が見つかりません');
    }
    
    // 状態が有効かチェック
    if (!Object.values(PAYMENT_STATUS).includes(status)) {
      throw new Error('無効な支払い状態です');
    }
    
    // 支払い状態を更新
    order.paymentStatus = status;
    order.updatedAt = new Date().toISOString();
    
    // 追加情報があれば更新
    if (additionalInfo.paymentMethod) {
      order.paymentMethod = additionalInfo.paymentMethod;
    }
    
    if (additionalInfo.paymentNote) {
      order.paymentNote = additionalInfo.paymentNote;
    }
    
    // 支払い済みの場合は注文ステータスも完了に更新
    if (status === PAYMENT_STATUS.PAID) {
      order.status = 'completed';
      order.completedAt = new Date().toISOString();
    }
    
    // 支払い履歴に記録
    const paymentHistory = {
      orderId,
      tableId: order.tableId,
      status,
      timestamp: new Date().toISOString(),
      additionalInfo
    };
    
    console.log('支払い状態を更新しました:', order);
    console.log('支払い履歴を記録しました:', paymentHistory);
    
    return {
      order,
      paymentHistory
    };
  } catch (error) {
    console.error('支払い状態更新エラー:', error);
    throw new Error('支払い状態の更新に失敗しました');
  }
}

/**
 * 会計リクエストを作成する
 * @param {number} tableId - テーブルID
 * @returns {Object} 会計リクエスト情報
 */
async function createPaymentRequest(tableId) {
  try {
    // テーブルの注文情報を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const orders = [
      {
        orderId: 1001,
        tableId,
        totalAmount: 1920,
        status: 'pending',
        paymentStatus: PAYMENT_STATUS.UNPAID,
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1時間前
      }
    ];
    
    if (orders.length === 0) {
      throw new Error('このテーブルには未払いの注文がありません');
    }
    
    // 未払いの注文のみをフィルタリング
    const unpaidOrders = orders.filter(order => order.paymentStatus === PAYMENT_STATUS.UNPAID);
    
    if (unpaidOrders.length === 0) {
      throw new Error('このテーブルには未払いの注文がありません');
    }
    
    // 合計金額を計算
    let totalAmount = 0;
    unpaidOrders.forEach(order => {
      totalAmount += order.totalAmount;
    });
    
    // 会計リクエストを作成
    const paymentRequest = {
      requestId: `PR-${Date.now()}`,
      tableId,
      orders: unpaidOrders.map(order => order.orderId),
      totalAmount,
      status: PAYMENT_STATUS.REQUESTED,
      createdAt: new Date().toISOString()
    };
    
    // 注文の支払い状態を更新
    for (const order of unpaidOrders) {
      await updatePaymentStatus(order.orderId, PAYMENT_STATUS.REQUESTED, {
        paymentNote: `会計リクエスト: ${paymentRequest.requestId}`
      });
    }
    
    console.log('会計リクエストを作成しました:', paymentRequest);
    
    return paymentRequest;
  } catch (error) {
    console.error('会計リクエスト作成エラー:', error);
    throw new Error('会計リクエストの作成に失敗しました');
  }
}

/**
 * 会計リクエストを完了する
 * @param {string} requestId - 会計リクエストID
 * @param {string} paymentMethod - 支払い方法
 * @param {string} staffId - スタッフID
 * @returns {Object} 更新された会計リクエスト情報
 */
async function completePaymentRequest(requestId, paymentMethod, staffId) {
  try {
    // 会計リクエスト情報を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const paymentRequest = {
      requestId,
      tableId: 1,
      orders: [1001],
      totalAmount: 1920,
      status: PAYMENT_STATUS.REQUESTED,
      createdAt: new Date(Date.now() - 300000).toISOString() // 5分前
    };
    
    if (!paymentRequest) {
      throw new Error('会計リクエストが見つかりません');
    }
    
    if (paymentRequest.status !== PAYMENT_STATUS.REQUESTED) {
      throw new Error('この会計リクエストは既に処理されています');
    }
    
    // 会計リクエストを更新
    paymentRequest.status = PAYMENT_STATUS.PAID;
    paymentRequest.paymentMethod = paymentMethod;
    paymentRequest.staffId = staffId;
    paymentRequest.completedAt = new Date().toISOString();
    paymentRequest.updatedAt = new Date().toISOString();
    
    // 関連する注文の支払い状態を更新
    const updatedOrders = [];
    for (const orderId of paymentRequest.orders) {
      const result = await updatePaymentStatus(orderId, PAYMENT_STATUS.PAID, {
        paymentMethod,
        paymentNote: `スタッフID: ${staffId} による支払い処理完了`
      });
      updatedOrders.push(result.order);
    }
    
    console.log('会計リクエストを完了しました:', paymentRequest);
    console.log('更新された注文:', updatedOrders);
    
    return {
      paymentRequest,
      orders: updatedOrders
    };
  } catch (error) {
    console.error('会計リクエスト完了エラー:', error);
    throw new Error('会計リクエストの完了に失敗しました');
  }
}

/**
 * テーブルの未払い金額を取得する
 * @param {number} tableId - テーブルID
 * @returns {Object} 未払い情報
 */
async function getTableUnpaidAmount(tableId) {
  try {
    // テーブルの注文情報を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const orders = [
      {
        orderId: 1001,
        tableId,
        totalAmount: 1920,
        status: 'pending',
        paymentStatus: PAYMENT_STATUS.UNPAID,
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1時間前
      },
      {
        orderId: 1002,
        tableId,
        totalAmount: 850,
        status: 'completed',
        paymentStatus: PAYMENT_STATUS.PAID,
        createdAt: new Date(Date.now() - 7200000).toISOString() // 2時間前
      }
    ];
    
    // 未払いの注文のみをフィルタリング
    const unpaidOrders = orders.filter(order => 
      order.paymentStatus === PAYMENT_STATUS.UNPAID || 
      order.paymentStatus === PAYMENT_STATUS.REQUESTED
    );
    
    // 合計金額を計算
    let totalUnpaidAmount = 0;
    unpaidOrders.forEach(order => {
      totalUnpaidAmount += order.totalAmount;
    });
    
    return {
      tableId,
      unpaidOrders: unpaidOrders.map(order => ({
        orderId: order.orderId,
        amount: order.totalAmount,
        status: order.paymentStatus
      })),
      totalUnpaidAmount,
      hasUnpaidOrders: unpaidOrders.length > 0
    };
  } catch (error) {
    console.error('未払い金額取得エラー:', error);
    throw new Error('テーブルの未払い金額の取得に失敗しました');
  }
}

/**
 * 支払い状態レポートを生成する
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @returns {Object} 支払い状態レポート
 */
async function generatePaymentStatusReport(startDate, endDate) {
  try {
    // 支払い履歴を取得（実際にはデータベースから取得）
    // ここではモックデータを使用
    const paymentHistories = [
      {
        orderId: 1001,
        tableId: 1,
        status: PAYMENT_STATUS.PAID,
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1日前
        additionalInfo: {
          paymentMethod: 'cash',
          paymentNote: 'スタッフID: STAFF001 による支払い処理完了'
        }
      },
      {
        orderId: 1002,
        tableId: 2,
        status: PAYMENT_STATUS.PAID,
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2日前
        additionalInfo: {
          paymentMethod: 'credit_card',
          paymentNote: 'スタッフID: STAFF002 による支払い処理完了'
        }
      },
      {
        orderId: 1003,
        tableId: 3,
        status: PAYMENT_STATUS.CANCELLED,
        timestamp: new Date(Date.now() - 259200000).toISOString(), // 3日前
        additionalInfo: {
          paymentNote: 'お客様の要望によりキャンセル'
        }
      }
    ];
    
    // 日付範囲でフィルタリング
    const filteredHistories = paymentHistories.filter(history => {
      const historyDate = new Date(history.timestamp);
      return historyDate >= startDate && historyDate <= endDate;
    });
    
    // 支払い方法ごとの集計
    const paymentMethodSummary = {};
    filteredHistories.forEach(history => {
      if (history.status === PAYMENT_STATUS.PAID) {
        const method = history.additionalInfo.paymentMethod || 'unknown';
        if (!paymentMethodSummary[method]) {
          paymentMethodSummary[method] = {
            count: 0,
            amount: 0
          };
        }
        paymentMethodSummary[method].count += 1;
        // 実際には注文の金額を取得して加算する
        paymentMethodSummary[method].amount += 1000; // ダミー値
      }
    });
    
    // 状態ごとの集計
    const statusSummary = {};
    filteredHistories.forEach(history => {
      if (!statusSummary[history.status]) {
        statusSummary[history.status] = 0;
      }
      statusSummary[history.status] += 1;
    });
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalRecords: filteredHistories.length,
      paymentMethodSummary,
      statusSummary,
      histories: filteredHistories
    };
  } catch (error) {
    console.error('支払い状態レポート生成エラー:', error);
    throw new Error('支払い状態レポートの生成に失敗しました');
  }
}

// モジュールをエクスポート
module.exports = {
  PAYMENT_STATUS,
  updatePaymentStatus,
  createPaymentRequest,
  completePaymentRequest,
  getTableUnpaidAmount,
  generatePaymentStatusReport
};
