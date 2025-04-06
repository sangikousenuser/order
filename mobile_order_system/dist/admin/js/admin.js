// /home/ubuntu/mobile_order_system/dist/admin/js/admin.js

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
  // 初期表示
  showPage('tables');
  loadTables();
  loadMenuCategories();

  // ナビゲーションメニューのイベントリスナー
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const pageId = this.getAttribute('data-page');
      showPage(pageId);
      
      // ページに応じたデータ読み込み
      if (pageId === 'tables') {
        loadTables();
      } else if (pageId === 'menu') {
        loadMenuCategories();
      } else if (pageId === 'orders') {
        loadOrders();
      }
    });
  });

  // テーブル管理関連
  document.getElementById('add-table-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const tableNumber = document.getElementById('table-number').value;
    const capacity = parseInt(document.getElementById('table-capacity').value);
    
    if (!tableNumber || isNaN(capacity) || capacity <= 0) {
      alert('テーブル番号と有効な座席数を入力してください');
      return;
    }
    
    try {
      await fetchAPI('/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, capacity })
      });
      
      document.getElementById('add-table-form').reset();
      loadTables();
      showNotification('テーブルを追加しました');
    } catch (error) {
      alert('テーブルの追加に失敗しました');
    }
  });

  // テーブル状態変更ハンドラー
  document.getElementById('tables-container').addEventListener('click', async function(e) {
    if (e.target.classList.contains('table-status-btn')) {
      const tableId = parseInt(e.target.getAttribute('data-table-id'));
      const newStatus = e.target.getAttribute('data-status');
      
      if (tableId && newStatus) {
        try {
          const updatedTable = await fetchAPI(`/tables/${tableId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          
          loadTables();
          showNotification(`テーブル ${updatedTable.table_number} の状態を ${getStatusLabel(newStatus)} に変更しました`);
        } catch (error) {
          alert('テーブル状態の更新に失敗しました');
        }
      }
    }
  });

  // メニュー管理関連
  document.getElementById('add-category-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const categoryName = document.getElementById('category-name').value;
    
    if (!categoryName) {
      alert('カテゴリ名を入力してください');
      return;
    }
    
    try {
      await fetchAPI('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName })
      });
      
      document.getElementById('add-category-form').reset();
      loadMenuCategories();
      showNotification('カテゴリを追加しました');
    } catch (error) {
      alert('カテゴリの追加に失敗しました');
    }
  });

  // メニュー項目追加フォーム
  document.getElementById('add-menu-item-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const itemName = document.getElementById('item-name').value;
    const itemDescription = document.getElementById('item-description').value;
    const itemPrice = parseInt(document.getElementById('item-price').value);
    const categoryId = parseInt(document.getElementById('item-category').value);
    const itemImage = document.getElementById('item-image').files[0];
    
    if (!itemName || isNaN(itemPrice) || itemPrice <= 0 || isNaN(categoryId)) {
      alert('商品名、説明、有効な価格、カテゴリを入力してください');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('name', itemName);
      formData.append('description', itemDescription);
      formData.append('price', itemPrice);
      formData.append('categoryId', categoryId);
      
      if (itemImage) {
        formData.append('image', itemImage);
      }
      
      await fetchAPI('/menu-items', {
        method: 'POST',
        body: formData
      });
      
      document.getElementById('add-menu-item-form').reset();
      loadMenuCategories();
      showNotification('メニュー項目を追加しました');
    } catch (error) {
      alert('メニュー項目の追加に失敗しました');
    }
  });

  // 完売状態切り替えハンドラー
  document.getElementById('menu-container').addEventListener('click', async function(e) {
    if (e.target.classList.contains('toggle-soldout-btn')) {
      const itemId = parseInt(e.target.getAttribute('data-item-id'));
      
      if (itemId) {
        try {
          const updatedItem = await fetchAPI(`/menu-items/${itemId}/toggle-sold-out`, {
            method: 'PUT'
          });
          
          loadMenuCategories();
          const status = updatedItem.is_sold_out ? '完売' : '販売中';
          showNotification(`${updatedItem.name} を ${status} に変更しました`);
        } catch (error) {
          alert('完売状態の更新に失敗しました');
        }
      }
    }
  });

  // 注文管理関連
  document.getElementById('orders-container').addEventListener('click', async function(e) {
    if (e.target.classList.contains('update-payment-status-btn')) {
      const orderId = parseInt(e.target.getAttribute('data-order-id'));
      const newStatus = e.target.getAttribute('data-status');
      
      if (orderId && newStatus) {
        try {
          await fetchAPI(`/orders/${orderId}/payment-status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: newStatus,
              paymentMethod: newStatus === 'paid' ? 'cash' : null
            })
          });
          
          loadOrders();
          showNotification(`注文 #${orderId} の支払い状態を ${getPaymentStatusLabel(newStatus)} に変更しました`);
        } catch (error) {
          alert('支払い状態の更新に失敗しました');
        }
      }
    }
  });

  // データ読み込み関数
  async function loadTables() {
    try {
      const tables = await fetchAPI('/tables');
      const tablesContainer = document.getElementById('tables-container');
      
      if (tables.length === 0) {
        tablesContainer.innerHTML = '<p>テーブルがありません。新しいテーブルを追加してください。</p>';
        return;
      }
      
      let html = '<div class="table-grid">';
      
      tables.forEach(table => {
        const statusClass = getStatusClass(table.status);
        const statusLabel = getStatusLabel(table.status);
        
        html += `
          <div class="table-card ${statusClass}">
            <div class="table-header">
              <h3>テーブル ${table.table_number}</h3>
              <button class="delete-table-btn" data-table-id="${table.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            <div class="table-info">
              <p>座席数: ${table.capacity}人</p>
              <p>状態: ${statusLabel}</p>
            </div>
            <div class="table-actions">
              <button class="generate-qr-btn" data-table-id="${table.id}">
                <i class="fas fa-qrcode"></i> QRコード
              </button>
              <div class="status-actions">
                ${getStatusButtons(table)}
              </div>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      tablesContainer.innerHTML = html;
    } catch (error) {
      console.error('テーブル読み込みエラー:', error);
      document.getElementById('tables-container').innerHTML = '<p>テーブルの読み込みに失敗しました</p>';
    }
  }

  async function loadMenuCategories() {
    try {
      const categories = await fetchAPI('/categories');
      const menuContainer = document.getElementById('menu-container');
      
      if (categories.length === 0) {
        menuContainer.innerHTML = '<p>カテゴリがありません。新しいカテゴリを追加してください。</p>';
        return;
      }
      
      let html = '';
      
      // カテゴリごとにメニュー項目を表示
      for (const category of categories) {
        const menuItems = await fetchAPI(`/categories/${category.id}/menu-items`);
        
        html += `
          <div class="menu-category">
            <h3>${category.name}</h3>
            <div class="menu-items-grid">
        `;
        
        if (menuItems.length === 0) {
          html += '<p>このカテゴリにはメニュー項目がありません。</p>';
        } else {
          menuItems.forEach(item => {
            const soldOutClass = item.is_sold_out ? 'sold-out' : '';
            const soldOutButtonText = item.is_sold_out ? '販売再開' : '完売にする';
            
            html += `
              <div class="menu-item-card ${soldOutClass}">
                <div class="menu-item-image">
                  <img src="${item.image_url}" alt="${item.name}">
                  ${item.is_sold_out ? '<div class="sold-out-overlay">完売</div>' : ''}
                </div>
                <div class="menu-item-info">
                  <h4>${item.name}</h4>
                  <p>${item.description}</p>
                  <p class="menu-item-price">¥${parseInt(item.price).toLocaleString()}（税込）</p>
                </div>
                <div class="menu-item-actions">
                  <button class="toggle-soldout-btn" data-item-id="${item.id}">
                    ${soldOutButtonText}
                  </button>
                  <button class="delete-menu-item-btn" data-item-id="${item.id}">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `;
          });
        }
        
        html += `
            </div>
          </div>
        `;
      }
      
      menuContainer.innerHTML = html;
      
      // カテゴリ選択肢を更新
      const categorySelect = document.getElementById('item-category');
      categorySelect.innerHTML = '';
      
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    } catch (error) {
      console.error('メニュー読み込みエラー:', error);
      document.getElementById('menu-container').innerHTML = '<p>メニューの読み込みに失敗しました</p>';
    }
  }

  async function loadOrders() {
    try {
      const orders = await fetchAPI('/orders');
      const ordersContainer = document.getElementById('orders-container');
      
      if (orders.length === 0) {
        ordersContainer.innerHTML = '<p>注文がありません。</p>';
        return;
      }
      
      let html = '<div class="orders-list">';
      
      // 注文を表示
      orders.forEach(order => {
        const statusClass = getOrderStatusClass(order.status, order.payment_status);
        const paymentStatusLabel = getPaymentStatusLabel(order.payment_status);
        
        html += `
          <div class="order-card ${statusClass}">
            <div class="order-header">
              <h3>注文 #${order.id}</h3>
              <span class="order-status">${paymentStatusLabel}</span>
            </div>
            <div class="order-info">
              <p>テーブル: ${order.table_id}</p>
              <p>注文時間: ${formatDateTime(order.created_at)}</p>
              ${order.completed_at ? `<p>完了時間: ${formatDateTime(order.completed_at)}</p>` : ''}
            </div>
            <div class="order-items">
              <h4>注文内容</h4>
              <ul>
                ${order.items.map(item => `
                  <li>${item.name} × ${item.quantity} = ¥${(item.unit_price * item.quantity).toLocaleString()}</li>
                `).join('')}
              </ul>
              <p class="order-total">合計: ¥${parseInt(order.total_amount).toLocaleString()}</p>
            </div>
            ${getOrderActions(order)}
          </div>
        `;
      });
      
      html += '</div>';
      ordersContainer.innerHTML = html;
    } catch (error) {
      console.error('注文読み込みエラー:', error);
      document.getElementById('orders-container').innerHTML = '<p>注文の読み込みに失敗しました</p>';
    }
  }

  // ユーティリティ関数
  function getStatusButtons(table) {
    const currentStatus = table.status;
    let buttons = '';
    
    // 状態に応じたボタンを表示
    if (currentStatus === 'payment_completed') {
      buttons += `<button class="table-status-btn" data-table-id="${table.id}" data-status="cleaning">清掃中にする</button>`;
    } else if (currentStatus === 'cleaning') {
      buttons += `<button class="table-status-btn" data-table-id="${table.id}" data-status="available">利用可能にする</button>`;
    } else if (currentStatus === 'available') {
      buttons += `<button class="table-status-btn" data-table-id="${table.id}" data-status="occupied">使用中にする</button>`;
    } else if (currentStatus === 'occupied') {
      buttons += `<button class="table-status-btn" data-table-id="${table.id}" data-status="payment_requested">会計中にする</button>`;
    } else if (currentStatus === 'payment_requested') {
      buttons += `<button class="table-status-btn" data-table-id="${table.id}" data-status="payment_completed">会計完了にする</button>`;
    }
    
    // メンテナンスボタンは常に表示
    buttons += `<button class="table-status-btn" data-table-id="${table.id}" data-status="maintenance">メンテナンス</button>`;
    
    return buttons;
  }

  function getOrderActions(order) {
    if (order.payment_status === 'paid') {
      return '<div class="order-actions"><span class="payment-complete">支払い完了</span></div>';
    }
    
    if (order.payment_status === 'requested') {
      return `
        <div class="order-actions">
          <button class="update-payment-status-btn" data-order-id="${order.id}" data-status="paid">
            支払い完了にする
          </button>
          <button class="update-payment-status-btn" data-order-id="${order.id}" data-status="unpaid">
            未払いに戻す
          </button>
        </div>
      `;
    }
    
    return `
      <div class="order-actions">
        <button class="update-payment-status-btn" data-order-id="${order.id}" data-status="requested">
          会計リクエストにする
        </button>
      </div>
    `;
  }

  // その他のユーティリティ関数（変更なし）
  // ...
});
