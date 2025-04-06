/**
 * バーコードリーダー機能
 * 
 * このモジュールは管理画面でのバーコード読み取り機能を提供します。
 * - バーコード読み取り
 * - 注文情報の表示
 * - 会計処理の実行
 */

// バーコードリーダーの状態
let isReading = false;
let lastResult = '';
let timeoutId;

// バーコード読み取り開始
function startBarcodeReader() {
  if (isReading) return;
  
  isReading = true;
  document.getElementById('barcode-reader-status').textContent = '読み取り中...';
  document.getElementById('barcode-input').focus();
  
  // ステータス表示を更新
  document.getElementById('start-barcode-reader-btn').style.display = 'none';
  document.getElementById('stop-barcode-reader-btn').style.display = 'inline-block';
  
  // 結果表示をクリア
  document.getElementById('barcode-result').innerHTML = '';
}

// バーコード読み取り停止
function stopBarcodeReader() {
  isReading = false;
  document.getElementById('barcode-reader-status').textContent = '停止中';
  
  // ステータス表示を更新
  document.getElementById('start-barcode-reader-btn').style.display = 'inline-block';
  document.getElementById('stop-barcode-reader-btn').style.display = 'none';
}

// バーコード入力処理
function handleBarcodeInput(event) {
  if (!isReading) return;
  
  const barcodeValue = event.target.value.trim();
  
  // 入力をクリア
  event.target.value = '';
  
  if (barcodeValue === lastResult || barcodeValue === '') return;
  lastResult = barcodeValue;
  
  // バーコード処理
  processBarcodeValue(barcodeValue);
}

// バーコード値の処理
async function processBarcodeValue(barcodeValue) {
  try {
    document.getElementById('barcode-result').innerHTML = '<div class="alert alert-info">バーコードを処理中...</div>';
    
    // APIを呼び出して注文情報を取得
    const response = await fetch('/api/barcode/get-order-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ barcodeValue })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '無効なバーコードです');
    }
    
    // 注文情報を表示
    displayOrderInfo(data.orderInfo);
  } catch (error) {
    console.error('バーコード処理エラー:', error);
    document.getElementById('barcode-result').innerHTML = `
      <div class="alert alert-danger">
        <p><strong>エラー:</strong> ${error.message || 'バーコードの処理に失敗しました'}</p>
      </div>
    `;
  }
}

// 注文情報の表示
function displayOrderInfo(order) {
  // 税率と合計金額の計算
  const taxRate = 0.1;
  const subtotal = order.totalAmount;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;
  
  // 注文アイテムのHTML生成
  let itemsHtml = '';
  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      const itemTotal = item.unitPrice * item.quantity;
      itemsHtml += `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>¥${item.unitPrice.toLocaleString()}</td>
          <td>¥${itemTotal.toLocaleString()}</td>
        </tr>
      `;
    });
  } else {
    itemsHtml = '<tr><td colspan="4" class="text-center">注文アイテムがありません</td></tr>';
  }
  
  // 注文情報のHTML生成
  const orderInfoHtml = `
    <div class="card">
      <div class="card-header">
        注文情報
      </div>
      <div class="card-body">
        <div class="order-info">
          <p><strong>注文ID:</strong> ${order.orderId}</p>
          <p><strong>テーブル:</strong> ${order.tableId}</p>
          <p><strong>注文時間:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>ステータス:</strong> ${order.status}</p>
          <p><strong>支払い状況:</strong> ${order.paymentStatus}</p>
        </div>
        
        <div class="table-container mt-3">
          <table>
            <thead>
              <tr>
                <th>商品</th>
                <th>数量</th>
                <th>単価</th>
                <th>小計</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-right"><strong>小計</strong></td>
                <td>¥${subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-right"><strong>消費税 (10%)</strong></td>
                <td>¥${tax.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-right"><strong>合計</strong></td>
                <td>¥${total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div class="payment-actions mt-4">
          <h4>会計処理</h4>
          <div class="form-group">
            <label for="payment-method">支払い方法</label>
            <select id="payment-method" class="form-control">
              <option value="cash">現金</option>
              <option value="credit_card">クレジットカード</option>
              <option value="mobile_payment">モバイル決済</option>
            </select>
          </div>
          <button class="btn btn-success" onclick="processPayment(${order.orderId})">
            会計済みにする
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('barcode-result').innerHTML = orderInfoHtml;
}

// 会計処理の実行
async function processPayment(orderId) {
  try {
    const paymentMethod = document.getElementById('payment-method').value;
    
    if (!paymentMethod) {
      throw new Error('支払い方法を選択してください');
    }
    
    // 処理中表示
    const paymentActions = document.querySelector('.payment-actions');
    paymentActions.innerHTML = '<div class="alert alert-info">会計処理中...</div>';
    
    // APIを呼び出して会計処理を実行
    const response = await fetch('/api/barcode/process-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        paymentMethod,
        staffId: 'admin' // 実際の環境ではログインユーザーIDを使用
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '会計処理に失敗しました');
    }
    
    // 成功メッセージを表示
    document.getElementById('barcode-result').innerHTML = `
      <div class="alert alert-success">
        <h4>会計処理が完了しました</h4>
        <p><strong>注文ID:</strong> ${orderId}</p>
        <p><strong>支払い方法:</strong> ${getPaymentMethodName(paymentMethod)}</p>
        <p><strong>処理時間:</strong> ${new Date().toLocaleString()}</p>
        <button class="btn mt-3" onclick="clearBarcodeResult()">新しいバーコードをスキャン</button>
      </div>
    `;
  } catch (error) {
    console.error('会計処理エラー:', error);
    document.getElementById('barcode-result').innerHTML = `
      <div class="alert alert-danger">
        <p><strong>エラー:</strong> ${error.message || '会計処理に失敗しました'}</p>
        <button class="btn mt-3" onclick="clearBarcodeResult()">やり直す</button>
      </div>
    `;
  }
}

// 支払い方法の名前を取得
function getPaymentMethodName(method) {
  const methods = {
    cash: '現金',
    credit_card: 'クレジットカード',
    mobile_payment: 'モバイル決済'
  };
  return methods[method] || method;
}

// 結果表示をクリア
function clearBarcodeResult() {
  document.getElementById('barcode-result').innerHTML = '';
  document.getElementById('barcode-input').focus();
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', function() {
  // バーコード入力フィールドのイベントリスナー
  const barcodeInput = document.getElementById('barcode-input');
  if (barcodeInput) {
    barcodeInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        handleBarcodeInput(event);
      }
    });
  }
  
  // 開始ボタンのイベントリスナー
  const startBtn = document.getElementById('start-barcode-reader-btn');
  if (startBtn) {
    startBtn.addEventListener('click', startBarcodeReader);
  }
  
  // 停止ボタンのイベントリスナー
  const stopBtn = document.getElementById('stop-barcode-reader-btn');
  if (stopBtn) {
    stopBtn.addEventListener('click', stopBarcodeReader);
  }
});

// グローバルに公開する関数
window.startBarcodeReader = startBarcodeReader;
window.stopBarcodeReader = stopBarcodeReader;
window.processPayment = processPayment;
window.clearBarcodeResult = clearBarcodeResult;
