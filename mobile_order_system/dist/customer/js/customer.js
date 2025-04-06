// /home/ubuntu/mobile_order_system/dist/customer/js/customer.js

// APIベースURL
const API_BASE_URL = '/api';

// APIリクエスト関数
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // URLからテーブルIDを取得
  const urlParams = new URLSearchParams(window.location.search);
  const tableId = parseInt(urlParams.get('table')) || 1; // デフォルトは1
  
  // カートアイテム
  const cartItems = [];
  
  // テーブル情報を取得
  async function loadTableInfo() {
    try {
      const tables = await fetchAPI('/tables');
      const table = tables.find(t => t.id === tableId);
      
      if (table) {
        document.getElementById('table-number').textContent = table.table_number;
      } else {
        console.error('テーブルが見つかりません');
        alert('テーブルが見つかりません');
      }
    } catch (error) {
      console.error('テーブル情報取得エラー:', error);
    }
  }
  
  // 初期化
  loadTableInfo();
  
  // ページ切り替え機能
  const pages = document.querySelectorAll('.page');
  const navItems = document.querySelectorAll('.footer-nav-item');
  const headerTitle = document.querySelector('.header-title');
  const backButton = document.getElementById('back-button');

  // ページ切り替え関数
  function showPage(pageId) {
    pages.forEach(page => {
      page.style.display = 'none';
    });
    document.getElementById(`${pageId}-page`).style.display = 'block';
    
    // ナビゲーションアイテムのアクティブ状態を更新
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-page') === pageId) {
        item.classList.add('active');
      }
    });
    
    // ヘッダータイトルを更新
    switch(pageId) {
      case 'menu':
        headerTitle.textContent = '期間限定・極みネタ';
        backButton.style.display = 'none';
        break;
      case 'history':
        headerTitle.textContent = '注文履歴';
        backButton.style.display = 'block';
        loadOrderHistory();
        break;
      case 'call':
        headerTitle.textContent = 'スタッフ呼び出し';
        backButton.style.display = 'block';
        break;
      case 'payment':
        headerTitle.textContent = 'お会計';
        backButton.style.display = 'block';
        updatePaymentSummary();
        break;
    }
    
    // ページに応じたデータ読み込み
    if (pageId === 'menu') {
      loadMenuCategories();
    }
  }

  // ナビゲーションアイテムのクリックイベント
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const pageId = this.getAttribute('data-page');
      showPage(pageId);
    });
  });

  // 戻るボタンのクリックイベント
  backButton.addEventListener('click', function(e) {
    e.preventDefault();
    showPage('menu');
  });

  // メニューカテゴリの読み込み
  async function loadMenuCategories() {
    try {
      const categories = await fetchAPI('/categories');
      const categoryTabsContainer = document.getElementById('category-tabs');
      const menuItemsContainer = document.getElementById('menu-items-container');
      
      if (categories.length === 0) {
        menuItemsContainer.innerHTML = '<p>メニューがありません</p>';
        return;
      }
      
      // カテゴリタブを生成
      let tabsHtml = '';
      categories.forEach((category, index) => {
        const activeClass = index === 0 ? 'active' : '';
        tabsHtml += `<div class="category-tab ${activeClass}" data-category-id="${category.id}">${category.name}</div>`;
      });
      categoryTabsContainer.innerHTML = tabsHtml;
      
      // 最初のカテゴリのメニュー項目を表示
      if (categories.length > 0) {
        loadMenuItemsByCategory(categories[0].id);
        headerTitle.textContent = categories[0].name;
      }
      
      // カテゴリタブのクリックイベント
      document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          
          const categoryId = parseInt(this.getAttribute('data-category-id'));
          loadMenuItemsByCategory(categoryId);
          
          // カテゴリ名をヘッダーに表示
          const category = categories.find(c => c.id === categoryId);
          if (category) {
            headerTitle.textContent = category.name;
          }
        });
      });
    } catch (error) {
      console.error('カテゴリ読み込みエラー:', error);
      document.getElementById('category-tabs').innerHTML = '<p>カテゴリの読み込みに失敗しました</p>';
    }
  }

  // カテゴリ別メニュー項目の読み込み
  async function loadMenuItemsByCategory(categoryId) {
    try {
      const menuItems = await fetchAPI(`/categories/${categoryId}/menu-items`);
      const menuItemsContainer = document.getElementById('menu-items-container');
      
      if (menuItems.length === 0) {
        menuItemsContainer.innerHTML = '<p>このカテゴリにはメニューがありません</p>';
        return;
      }
      
      let html = '';
      menuItems.forEach(item => {
        if (item.is_sold_out) {
          html += `
            <div class="menu-item sold-out" data-item-id="${item.id}">
              <div class="menu-item-image">
                <img src="${item.image_url}" alt="${item.name}">
                <div class="sold-out-label">完売</div>
              </div>
              <div class="menu-item-details">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-description">${item.description}</div>
                <div class="menu-item-price">¥ ${parseInt(item.price).toLocaleString()}（税込）</div>
              </div>
            </div>
          `;
        } else {
          html += `
            <div class="menu-item" data-item-id="${item.id}">
              <div class="menu-item-image">
                <img src="${item.image_url}" alt="${item.name}">
              </div>
              <div class="menu-item-details">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-description">${item.description}</div>
                <div class="menu-item-price">¥ ${parseInt(item.price).toLocaleString()}（税込）</div>
              </div>
            </div>
          `;
        }
      });
      
      menuItemsContainer.innerHTML = html;
      
      // メニュー項目のクリックイベント
      document.querySelectorAll('.menu-item:not(.sold-out)').forEach(item => {
        item.addEventListener('click', async function() {
          const itemId = parseInt(this.getAttribute('data-item-id'));
          try {
            const menuItems = await fetchAPI(`/menu-items`);
            const menuItem = menuItems.find(item => item.id === itemId);
            
            if (menuItem) {
              showItemDetailModal(menuItem);
            }
          } catch (error) {
            console.error('メニュー項目取得エラー:', error);
          }
        });
      });
    } catch (error) {
      console.error('メニュー項目読み込みエラー:', error);
      document.getElementById('menu-items-container').innerHTML = '<p>メニュー項目の読み込みに失敗しました</p>';
    }
  }

  // 商品詳細モーダル
  function showItemDetailModal(item) {
    const modal = document.getElementById('item-detail-modal');
    const itemImage = document.getElementById('detail-image');
    const itemName = document.getElementById('detail-name');
    const itemDescription = document.getElementById('detail-description');
    const itemPrice = document.getElementById('detail-price');
    const quantityValue = document.getElementById('quantity-value');
    
    itemImage.src = item.image_url;
    itemImage.alt = item.name;
    itemName.textContent = item.name;
    itemDescription.textContent = item.description;
    itemPrice.textContent = `¥ ${parseInt(item.price).toLocaleString()}（税込）`;
    quantityValue.textContent = '1';
    
    // 商品IDを設定
    document.getElementById('add-to-cart-button').setAttribute('data-item-id', item.id);
    
    modal.style.display = 'block';
  }

  // 数量減少ボタン
  document.getElementById('decrease-quantity').addEventListener('click', function() {
    const quantityValue = document.getElementById('quantity-value');
    let quantity = parseInt(quantityValue.textContent);
    if (quantity > 1) {
      quantity--;
      quantityValue.textContent = quantity;
    }
  });

  // 数量増加ボタン
  document.getElementById('increase-quantity').addEventListener('click', function() {
    const quantityValue = document.getElementById('quantity-value');
    let quantity = parseInt(quantityValue.textContent);
    if (quantity < 10) {
      quantity++;
      quantityValue.textContent = quantity;
    }
  });

  // カートに追加ボタン
  document.getElementById('add-to-cart-button').addEventListener('click', async function() {
    const itemId = parseInt(this.getAttribute('data-item-id'));
    const quantity = parseInt(document.getElementById('quantity-value').textContent);
    
    if (itemId && quantity > 0) {
      try {
        const menuItems = await fetchAPI(`/menu-items`);
        const item = menuItems.find(item => item.id === itemId);
        
        if (item) {
          // カートに追加
          const existingItemIndex = cartItems.findIndex(cartItem => cartItem.itemId === itemId);
          
          if (existingItemIndex !== -1) {
            // 既存のアイテムの数量を更新
            cartItems[existingItemIndex].quantity += quantity;
          } else {
            // 新しいアイテムを追加
            cartItems.push({
              itemId: item.id,
              name: item.name,
              price: parseInt(item.price),
              quantity: quantity
            });
          }
          
          // モーダルを閉じる
          document.getElementById('item-detail-modal').style.display = 'none';
          
          // カートサマリーを更新
          updateCartSummary();
          
          // 通知を表示
          showNotification(`${item.name} を ${quantity}点カートに追加しました`);
        }
      } catch (error) {
        console.error('カートに追加エラー:', error);
      }
    }
  });

  // モーダルを閉じるボタン
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      this.closest('.modal').style.display = 'none';
    });
  });

  // カートサマリーの更新
  function updateCartSummary() {
    const cartSummary = document.getElementById('cart-summary');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    if (cartItems.length === 0) {
      cartSummary.style.display = 'none';
      return;
    }
    
    let totalCount = 0;
    let totalAmount = 0;
    
    cartItems.forEach(item => {
      totalCount += item.quantity;
      totalAmount += item.price * item.quantity;
    });
    
    cartCount.textContent = totalCount;
    cartTotal.textContent = totalAmount.toLocaleString();
    cartSummary.style.display = 'flex';
  }

  // カートサマリーのクリックイベント
  document.getElementById('cart-summary').addEventListener('click', function() {
    showCartModal();
  });

  // カートモーダルの表示
  function showCartModal() {
    const modal = document.getElementById('cart-modal');
    const cartList = document.getElementById('cart-list');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTax = document.getElementById('cart-tax');
    const cartModalTotal = document.getElementById('cart-modal-total');
    const proceedToOrderBtn = document.getElementById('proceed-to-order');
    
    if (cartItems.length === 0) {
      cartList.innerHTML = '<p>カートに商品がありません</p>';
      cartSubtotal.textContent = '0';
      cartTax.textContent = '0';
      cartModalTotal.textContent = '0';
      proceedToOrderBtn.disabled = true;
    } else {
      let html = '';
      let subtotal = 0;
      
      cartItems.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        html += `
          <div class="cart-item">
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">¥${item.price.toLocaleString()} × ${item.quantity}</div>
            </div>
            <div class="cart-item-quantity">
              <div>¥${itemTotal.toLocaleString()}</div>
              <div class="cart-item-remove" data-index="${index}"><i class="fas fa-trash"></i></div>
            </div>
          </div>
        `;
      });
      
      cartList.innerHTML = html;
      
      // 税金計算（10%）
      const tax = Math.round(subtotal * 0.1);
      const total = subtotal + tax;
      
      cartSubtotal.textContent = subtotal.toLocaleString();
      cartTax.textContent = tax.toLocaleString();
      cartModalTotal.textContent = total.toLocaleString();
      proceedToOrderBtn.disabled = false;
      
      // 削除ボタンのイベント
      document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          cartItems.splice(index, 1);
          updateCartSummary();
          showCartModal(); // モーダルを更新
        });
      });
    }
    
    modal.style.display = 'block';
  }

  // 注文するボタン
  document.getElementById('proceed-to-order').addEventListener('click', function() {
    if (cartItems.length === 0) return;
    
    // 注文確認モーダルを表示
    showOrderConfirmationModal();
    
    // カートモーダルを閉じる
    document.getElementById('cart-modal').style.display = 'none';
  });

  // 注文確認モーダル
  function showOrderConfirmationModal() {
    const modal = document.getElementById('order-confirmation-modal');
    const orderItems = document.getElementById('order-confirmation-items');
    const orderTotal = document.getElementById('order-confirmation-total');
    
    let html = '';
    let subtotal = 0;
    
    cartItems.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      
      html += `
        <div class="order-confirmation-item">
          <div>${item.name} × ${item.quantity}</div>
          <div>¥${itemTotal.toLocaleString()}</div>
        </div>
      `;
    });
    
    // 税金計算（10%）
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    
    html += `
      <div class="order-confirmation-item">
        <div>消費税（10%）</div>
        <div>¥${tax.toLocaleString()}</div>
      </div>
    `;
    
    orderItems.innerHTML = html;
    orderTotal.textContent = total.toLocaleString();
    
    modal.style.display = 'block';
  }

  // 注文確定ボタン
  document.getElementById('confirm-order-button').addEventListener('click', async function() {
    try {
      // 注文アイテムを準備
      const items = cartItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.price
      }));
      
      // 注文をデータベースに保存
      await fetchAPI('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: tableId,
          items: items
        })
      });
      
      // 注文確認モーダルを閉じる
      document.getElementById('order-confirmation-modal').style.display = 'none';
      
      // カートをクリア
      cartItems.length = 0;
      updateCartSummary();
      
      // 通知を表示
      showNotification('ご注文ありがとうございます！');
      
      // 注文履歴ページに移動
      showPage('history');
    } catch (error) {
      console.error('注文作成エラー:', error);
      alert('注文の作成に失敗しました。もう一度お試しください。');
    }
  });

  // 注文履歴の読み込み
  async function loadOrderHistory() {
    try {
      const orders = await fetchAPI(`/tables/${tableId}/orders`);
      const historyContainer = document.getElementById('order-history-container');
      
      if (orders.length === 0) {
        historyContainer.innerHTML = '<p>注文履歴がありません</p>';
        return;
      }
      
      let html = '';
      
      // 注文を新しい順に表示
      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).forEach(order => {
        const statusClass = getOrderStatusClass(order.status, order.payment_status);
        const statusLabel = getOrderStatusLabel(order.status, order.payment_status);
        
        html += `
          <div class="order-history-item ${statusClass}">
            <div class="order-history-header">
              <div class="order-history-id">注文 #${order.id}</div>
              <div class="order-history-status">${statusLabel}</div>
            </div>
            <div class="order-history-time">
              ${formatDateTime(order.created_at)}
            </div>
            <div class="order-history-details">
              <div class="order-history-items">
                ${order.items.map(item => `
                  <div class="order-history-item-row">
                    <span>${item.name} × ${item.quantity}</span>
                    <span>¥${(item.unit_price * item.quantity).toLocaleString()}</span>
                  </div>
                `).join('')}
              </div>
              <div class="order-history-total">
                合計: ¥${parseInt(order.total_amount).toLocaleString()}
              </div>
            </div>
          </div>
        `;
      });
      
      historyContainer.innerHTML = html;
    } catch (error) {
      console.error('注文履歴読み込みエラー:', error);
      document.getElementById('order-history-container').innerHTML = '<p>注文履歴の読み込みに失敗しました</p>';
    }
  }

  // 支払い画面の更新
  async function updatePaymentSummary() {
    try {
      const orders = await fetchAPI(`/tables/${tableId}/orders`);
      const paymentContainer = document.getElementById('payment-container');
      const unpaidOrders = orders.filter(order => 
        order.payment_status === 'unpaid' || order.payment_status === 'requested'
      );
      
      if (unpaidOrders.length === 0) {
        paymentContainer.innerHTML = '<p>お支払いが必要な注文はありません</p>';
        return;
      }
      
      let html = '<div class="payment-summary">';
      let totalAmount = 0;
      
      html += '<h3>お支払い内容</h3>';
      
      unpaidOrders.forEach(order => {
        html += `
          <div class="payment-order">
            <div class="payment-order-header">
              <div>注文 #${order.id}</div>
              <div>${formatDateTime(order.created_at)}</div>
            </div>
            <div class="payment-order-items">
              ${order.items.map(item => `
                <div class="payment-order-item">
                  <span>${item.name} × ${item.quantity}</span>
                  <span>¥${(item.unit_price * item.quantity).toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
            <div class="payment-order-total">
              小計: ¥${parseInt(order.total_amount).toLocaleString()}
            </div>
          </div>
        `;
        
        totalAmount += parseInt(order.total_amount);
      });
      
      html += `
        <div class="payment-total">
          <div class="payment-total-label">合計金額</div>
          <div class="payment-total-amount">¥${totalAmount.toLocaleString()}</div>
        </div>
        
        <div class="payment-methods">
          <button id="request-payment-button" class="payment-method-button">
            お会計をリクエスト
          </button>
        </div>
      `;
      
      html += '</div>';
      paymentContainer.innerHTML = html;
      
      // お会計リクエストボタンのイベント
      document.getElementById('request-payment-button').addEventListener('click', function() {
        // 会計リクエストを作成
        requestPayment(unpaidOrders);
      });
    } catch (error) {
      console.error('支払い情報読み込みエラー:', error);
      document.getElementById('payment-container').innerHTML = '<p>支払い情報の読み込みに失敗しました</p>';
    }
  }

  // 会計リクエスト
  async function requestPayment(unpaidOrders) {
    try {
      // テーブル状態を更新
      await fetchAPI(`/tables/${tableId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'payment_requested' })
      });
      
      // 未払いの注文を更新
      for (const order of unpaidOrders) {
        if (order.payment_status === 'unpaid') {
          await fetchAPI(`/orders/${order.id}/payment-status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'requested' })
          });
        }
      }
      
      // バーコードを表示
      showPaymentBarcode();
    } catch (error) {
      console.error('会計リクエストエラー:', error);
      alert('会計リクエストの送信に失敗しました');
    }
  }

  // 支払いバーコードの表示
  function showPaymentBarcode() {
    const paymentContainer = document.getElementById('payment-container');
    
    // バーコード生成（実際の実装ではユニークな値を生成）
    const barcodeValue = `MORDER_PAY_${tableId}_${Date.now()}`;
    
    let html = `
      <div class="payment-barcode-container">
        <h3>お会計バーコード</h3>
        <p>このバーコードをスタッフにお見せください</p>
        <div id="payment-barcode"></div>
        <p class="payment-barcode-note">お会計リクエストを送信しました。<br>スタッフが参ります。</p>
      </div>
    `;
    
    paymentContainer.innerHTML = html;
    
    // バーコード生成
    JsBarcode("#payment-barcode", barcodeValue, {
      format: "CODE128",
      width: 2,
      height: 100,
      displayValue: true
    });
  }

  // 呼び出し機能
  document.querySelectorAll('.call-button').forEach(button => {
    button.addEventListener('click', function() {
      const callType = this.id;
      let message = '';
      
      switch(callType) {
        case 'call-staff':
          message = 'スタッフを呼び出しました';
          break;
        case 'call-water':
          message = 'お水をリクエストしました';
          break;
        case 'call-condiments':
          message = '調味料をリクエストしました';
          break;
        case 'call-chopsticks':
          message = 'お箸・スプーンをリクエストしました';
          break;
      }
      
      showNotification(message);
    });
  });

  // ユーティリティ関数（変更なし）
  // ...

  // 初期表示
  showPage('menu');
});
