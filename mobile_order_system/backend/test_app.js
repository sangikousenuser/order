/**
 * モバイルオーダーシステム テストスクリプト
 * 
 * このスクリプトはアプリケーションの主要機能をテストします。
 * 実際の環境では自動テストフレームワークを使用することをお勧めします。
 */

const paymentStatusTracking = require('./payment_status_tracking');
const tableStatusManagement = require('./table_status_management');
const qrBarcodeIntegration = require('./qr_barcode_integration');

// テスト結果を保存する配列
const testResults = [];

/**
 * テストを実行する
 * @param {string} testName - テスト名
 * @param {Function} testFn - テスト関数
 */
async function runTest(testName, testFn) {
  console.log(`\n==== テスト開始: ${testName} ====`);
  try {
    await testFn();
    console.log(`✅ テスト成功: ${testName}`);
    testResults.push({ name: testName, success: true });
  } catch (error) {
    console.error(`❌ テスト失敗: ${testName}`);
    console.error(`エラー: ${error.message}`);
    testResults.push({ name: testName, success: false, error: error.message });
  }
}

/**
 * テスト結果のサマリーを表示
 */
function showTestSummary() {
  console.log('\n==== テスト結果サマリー ====');
  
  const totalTests = testResults.length;
  const successTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - successTests;
  
  console.log(`総テスト数: ${totalTests}`);
  console.log(`成功: ${successTests}`);
  console.log(`失敗: ${failedTests}`);
  
  if (failedTests > 0) {
    console.log('\n失敗したテスト:');
    testResults.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.name}: ${result.error}`);
    });
  }
}

// テーブル状態管理のテスト
async function testTableStatusManagement() {
  await runTest('テーブル状態の更新', async () => {
    const result = await tableStatusManagement.updateTableStatus(1, tableStatusManagement.TABLE_STATUS.OCCUPIED);
    if (!result.table || result.table.status !== tableStatusManagement.TABLE_STATUS.OCCUPIED) {
      throw new Error('テーブル状態の更新に失敗しました');
    }
  });
  
  await runTest('会計リクエスト後のテーブル状態更新', async () => {
    const result = await tableStatusManagement.updateTableAfterPaymentRequest(2);
    if (!result.table || result.table.status !== tableStatusManagement.TABLE_STATUS.PAYMENT_REQUESTED) {
      throw new Error('会計リクエスト後のテーブル状態更新に失敗しました');
    }
  });
  
  await runTest('会計完了後のテーブル状態更新', async () => {
    const result = await tableStatusManagement.updateTableAfterPaymentCompletion(3, 'STAFF001');
    if (!result.table || result.table.status !== tableStatusManagement.TABLE_STATUS.PAYMENT_COMPLETED) {
      throw new Error('会計完了後のテーブル状態更新に失敗しました');
    }
  });
  
  await runTest('テーブル清掃中設定', async () => {
    const result = await tableStatusManagement.setTableCleaning(4, 'STAFF002');
    if (!result.table || result.table.status !== tableStatusManagement.TABLE_STATUS.CLEANING) {
      throw new Error('テーブル清掃中設定に失敗しました');
    }
  });
  
  await runTest('テーブル清掃完了設定', async () => {
    const result = await tableStatusManagement.setTableCleaningCompleted(5, 'STAFF002');
    if (!result.table || result.table.status !== tableStatusManagement.TABLE_STATUS.AVAILABLE) {
      throw new Error('テーブル清掃完了設定に失敗しました');
    }
  });
  
  await runTest('全テーブル状態の取得', async () => {
    const tables = await tableStatusManagement.getAllTableStatus();
    if (!Array.isArray(tables) || tables.length === 0) {
      throw new Error('全テーブル状態の取得に失敗しました');
    }
  });
  
  await runTest('利用可能なテーブルの取得', async () => {
    const tables = await tableStatusManagement.getAvailableTables();
    if (!Array.isArray(tables)) {
      throw new Error('利用可能なテーブルの取得に失敗しました');
    }
  });
  
  await runTest('清掃が必要なテーブルの取得', async () => {
    const tables = await tableStatusManagement.getTablesNeedingCleaning();
    if (!Array.isArray(tables)) {
      throw new Error('清掃が必要なテーブルの取得に失敗しました');
    }
  });
  
  await runTest('テーブル状態レポートの生成', async () => {
    const report = await tableStatusManagement.generateTableStatusReport(new Date());
    if (!report || !report.date) {
      throw new Error('テーブル状態レポートの生成に失敗しました');
    }
  });
}

// 支払い状態追跡のテスト
async function testPaymentStatusTracking() {
  await runTest('支払い状態の更新', async () => {
    const result = await paymentStatusTracking.updatePaymentStatus(1001, paymentStatusTracking.PAYMENT_STATUS.REQUESTED);
    if (!result.order || result.order.paymentStatus !== paymentStatusTracking.PAYMENT_STATUS.REQUESTED) {
      throw new Error('支払い状態の更新に失敗しました');
    }
  });
  
  await runTest('会計リクエストの作成', async () => {
    const result = await paymentStatusTracking.createPaymentRequest(1);
    if (!result || !result.requestId) {
      throw new Error('会計リクエストの作成に失敗しました');
    }
  });
  
  await runTest('会計リクエストの完了', async () => {
    const result = await paymentStatusTracking.completePaymentRequest('PR-1234567890', 'cash', 'STAFF001');
    if (!result.paymentRequest || result.paymentRequest.status !== paymentStatusTracking.PAYMENT_STATUS.PAID) {
      throw new Error('会計リクエストの完了に失敗しました');
    }
  });
  
  await runTest('テーブルの未払い金額の取得', async () => {
    const result = await paymentStatusTracking.getTableUnpaidAmount(1);
    if (result === undefined || result.tableId !== 1) {
      throw new Error('テーブルの未払い金額の取得に失敗しました');
    }
  });
  
  await runTest('支払い状態レポートの生成', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // 1週間前
    const endDate = new Date();
    
    const report = await paymentStatusTracking.generatePaymentStatusReport(startDate, endDate);
    if (!report || !report.startDate) {
      throw new Error('支払い状態レポートの生成に失敗しました');
    }
  });
}

// QRコードとバーコード機能のテスト
async function testQrBarcodeIntegration() {
  await runTest('テーブル用QRコードURLの生成', () => {
    const url = qrBarcodeIntegration.generateTableQrUrl(1, 'A1');
    if (!url || !url.includes('table=1')) {
      throw new Error('テーブル用QRコードURLの生成に失敗しました');
    }
  });
  
  await runTest('テーブルQRコードURLの検証', () => {
    const url = qrBarcodeIntegration.generateTableQrUrl(1, 'A1');
    const result = qrBarcodeIntegration.validateTableQrUrl(url);
    if (!result || !result.isValid || result.tableId !== 1) {
      throw new Error('テーブルQRコードURLの検証に失敗しました');
    }
  });
  
  await runTest('支払い用バーコードの生成', () => {
    const barcode = qrBarcodeIntegration.generatePaymentBarcode(1001, 1920);
    if (!barcode || !barcode.includes('MORDER_PAY_')) {
      throw new Error('支払い用バーコードの生成に失敗しました');
    }
  });
  
  await runTest('支払いバーコードの検証', () => {
    const barcode = qrBarcodeIntegration.generatePaymentBarcode(1001, 1920);
    const result = qrBarcodeIntegration.validatePaymentBarcode(barcode);
    if (!result || !result.isValid || result.orderId !== 1001 || result.amount !== 1920) {
      throw new Error('支払いバーコードの検証に失敗しました');
    }
  });
  
  await runTest('テーブルセッションの作成', () => {
    const sessionId = qrBarcodeIntegration.createTableSession(1);
    if (!sessionId) {
      throw new Error('テーブルセッションの作成に失敗しました');
    }
  });
  
  await runTest('テーブルセッションの検証', () => {
    const sessionId = qrBarcodeIntegration.createTableSession(1);
    const result = qrBarcodeIntegration.validateTableSession(sessionId);
    if (!result || result.tableId !== 1) {
      throw new Error('テーブルセッションの検証に失敗しました');
    }
  });
}

// 統合テスト
async function testIntegration() {
  await runTest('会計リクエストからテーブル状態更新の統合テスト', async () => {
    // 1. 会計リクエストを作成
    const paymentRequest = await paymentStatusTracking.createPaymentRequest(1);
    if (!paymentRequest || !paymentRequest.requestId) {
      throw new Error('会計リクエストの作成に失敗しました');
    }
    
    // 2. テーブル状態を会計リクエスト中に更新
    const tableUpdateResult = await tableStatusManagement.updateTableAfterPaymentRequest(1);
    if (!tableUpdateResult.table || tableUpdateResult.table.status !== tableStatusManagement.TABLE_STATUS.PAYMENT_REQUESTED) {
      throw new Error('テーブル状態の更新に失敗しました');
    }
    
    // 3. 会計リクエストを完了
    const completeResult = await paymentStatusTracking.completePaymentRequest(paymentRequest.requestId, 'cash', 'STAFF001');
    if (!completeResult.paymentRequest || completeResult.paymentRequest.status !== paymentStatusTracking.PAYMENT_STATUS.PAID) {
      throw new Error('会計リクエストの完了に失敗しました');
    }
    
    // 4. テーブル状態を会計完了に更新
    const tableCompleteResult = await tableStatusManagement.updateTableAfterPaymentCompletion(1, 'STAFF001');
    if (!tableCompleteResult.table || tableCompleteResult.table.status !== tableStatusManagement.TABLE_STATUS.PAYMENT_COMPLETED) {
      throw new Error('テーブル状態の更新に失敗しました');
    }
    
    // 5. テーブルを清掃中に設定
    const cleaningResult = await tableStatusManagement.setTableCleaning(1, 'STAFF002');
    if (!cleaningResult.table || cleaningResult.table.status !== tableStatusManagement.TABLE_STATUS.CLEANING) {
      throw new Error('テーブル清掃中設定に失敗しました');
    }
    
    // 6. テーブルを清掃完了（利用可能）に設定
    const cleaningCompletedResult = await tableStatusManagement.setTableCleaningCompleted(1, 'STAFF002');
    if (!cleaningCompletedResult.table || cleaningCompletedResult.table.status !== tableStatusManagement.TABLE_STATUS.AVAILABLE) {
      throw new Error('テーブル清掃完了設定に失敗しました');
    }
  });
}

// メインテスト実行関数
async function runAllTests() {
  console.log('==== モバイルオーダーシステム テスト開始 ====');
  
  // テーブル状態管理のテスト
  console.log('\n=== テーブル状態管理のテスト ===');
  await testTableStatusManagement();
  
  // 支払い状態追跡のテスト
  console.log('\n=== 支払い状態追跡のテスト ===');
  await testPaymentStatusTracking();
  
  // QRコードとバーコード機能のテスト
  console.log('\n=== QRコードとバーコード機能のテスト ===');
  await testQrBarcodeIntegration();
  
  // 統合テスト
  console.log('\n=== 統合テスト ===');
  await testIntegration();
  
  // テスト結果のサマリーを表示
  showTestSummary();
}

// テストを実行
runAllTests().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
});
