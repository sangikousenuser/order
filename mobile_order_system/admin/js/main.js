// 管理画面用JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // 現在の日付を表示
  const currentDateElement = document.getElementById('current-date');
  const now = new Date();
  currentDateElement.textContent = now.toLocaleDateString('ja-JP', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long' 
  });

  // API基本URL
  const API_BASE_URL = '/api';

  // API呼び出し用の共通関数
  async function fetchAPI(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // セッションCookieを送信
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API呼び出しエラー:', error);
      showError(`API呼び出しエラー: ${error.message}`);
      throw error;
    }
  }

  // エラーメッセージ表示用関数
  function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'alert alert-danger error-message';
    errorElement.textContent = message;
    
    // 既存のエラーメッセージを削除
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(el => el.remove());
    
    // 画面上部に表示
    document.body.insertBefore(errorElement, document.body.firstChild);
    
    // 5秒後に自動的に消える
    setTimeout(() => {
      errorElement.remove();
    }, 5000);
  }

  // 成功メッセージ表示用関数
  function showSuccess(message) {
    const successElement = document.createElement('div');
    successElement.className = 'alert alert-success success-message';
    successElement.textContent = message;
    
    // 既存の成功メッセージを削除
    const existingSuccess = document.querySelectorAll('.success-message');
    existingSuccess.forEach(el => el.remove());
    
    // 画面上部に表示
    document.body.insertBefore(successElement, document.body.firstChild);
    
    // 3秒後に自動的に消える
    setTimeout(() => {
      successElement.remove();
    }, 3000);
  }

  // ナビゲーション機能
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  const pages = document.querySelectorAll('.page');

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetPage = this.getAttribute('data-page');
      
      // ログアウト処理
      if (targetPage === 'logout') {
        if (confirm('ログアウトしますか？')) {
          // ログアウト処理
          fetchAPI('/auth/logout', 'POST')
            .then(() => {
              window.location.href = '/admin/login.html';
            })
            .catch(() => {
              // エラーが発生しても強制的にログアウト
              window.location.href = '/admin/login.html';
            });
          return;
        } else {
          return;
        }
      }
      
      // アクティブなナビゲーションリンクを更新
      navLinks.forEach(link => link.classList.remove('active'));
      this.classList.add('active');
      
      // ページ表示を切り替え
      pages.forEach(page => {
        page.style.display = 'none';
      });
      document.getElementById(`${targetPage}-page`).style.display = 'block';
    });
  });

  // モーダル関連の機能
  const modals = document.querySelectorAll('.modal');
  const modalCloseBtns = document.querySelectorAll('.modal-close, .modal-close-btn');
  
  // モーダルを閉じる関数
  function closeAllModals() {
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }
  
  // 閉じるボタンのイベントリスナー
  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  
  // モーダル外クリックで閉じる
  window.addEventListener('click', function(e) {
    modals.forEach(modal => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  // テーブル管理機能
  const addTableBtn = document.getElementById('add-table-btn');
  const tableModal = document.getElementById('table-modal');
  const saveTableBtn = document.getElementById('save-table-btn');
  const tableForm = document.getElementById('table-form');
  const tablesList = document.getElementById('tables-list');
  
  // テーブル一覧を読み込む
  async function loadTables() {
    try {
      const response = await fetchAPI('/tables');
      const tables = response.data || [];
      
      tablesList.innerHTML = '';
      
      if (tables.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" class="text-center">テーブルデータがありません</td>`;
        tablesList.appendChild(row);
        return;
      }
      
      tables.forEach(table => {
        const statusText = {
          'available': '利用可能',
          'occupied': '使用中',
          'payment_requested': '支払い依頼中',
          'payment_completed': '支払い完了',
          'cleaning': '清掃中',
          'reserved': '予約済み',
          'maintenance': 'メンテナンス中'
        }[table.status];
        
        const statusClass = {
          'available': 'success',
          'occupied': 'warning',
          'payment_requested': 'info',
          'payment_completed': 'info',
          'cleaning': 'warning',
          'reserved': 'warning',
          'maintenance': 'danger'
        }[table.status];
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${table.table_number}</td>
          <td>${table.capacity}人</td>
          <td><span class="badge badge-${statusClass}">${statusText}</span></td>
          <td><button class="btn btn-sm" onclick="showQRCode(${table.id}, '${table.table_number}')"><i class="fas fa-qrcode"></i> QR表示</button></td>
          <td>
            <button class="btn btn-sm" onclick="editTable(${table.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteTable(${table.id})"><i class="fas fa-trash"></i></button>
          </td>
        `;
        tablesList.appendChild(row);
      });
    } catch (error) {
      showError('テーブル一覧の読み込みに失敗しました');
    }
  }
  
  // 新規テーブル追加ボタンのイベントリスナー
  if (addTableBtn) {
    addTableBtn.addEventListener('click', function() {
      document.getElementById('table-modal-title').textContent = 'テーブルを追加';
      document.getElementById('table-id').value = '';
      document.getElementById('table-number').value = '';
      document.getElementById('table-capacity').value = '';
      document.getElementById('table-status').value = 'available';
      tableModal.style.display = 'block';
    });
  }
  
  // テーブル保存ボタンのイベントリスナー
  if (saveTableBtn) {
    saveTableBtn.addEventListener('click', async function() {
      if (!tableForm.checkValidity()) {
        alert('必須項目を入力してください');
        return;
      }
      
      try {
        const tableId = document.getElementById('table-id').value;
        const tableData = {
          table_number: document.getElementById('table-number').value,
          capacity: parseInt(document.getElementById('table-capacity').value),
          status: document.getElementById('table-status').value
        };
        
        let response;
        if (tableId) {
          // 既存テーブルの更新
          response = await fetchAPI(`/tables/${tableId}`, 'PUT', tableData);
          showSuccess('テーブルを更新しました');
        } else {
          // 新規テーブルの追加
          response = await fetchAPI('/tables', 'POST', tableData);
          showSuccess('テーブルを追加しました');
        }
        
        // モーダルを閉じて、テーブル一覧を再読み込み
        tableModal.style.display = 'none';
        loadTables();
      } catch (error) {
        showError('テーブルの保存に失敗しました');
      }
    });
  }
  
  // テーブル編集関数（グローバルスコープに定義）
  window.editTable = async function(tableId) {
    try {
      // APIからテーブル情報を取得
      const response = await fetchAPI(`/tables/${tableId}`);
      const table = response.data;
      
      if (table) {
        document.getElementById('table-modal-title').textContent = 'テーブルを編集';
        document.getElementById('table-id').value = table.id;
        document.getElementById('table-number').value = table.table_number;
        document.getElementById('table-capacity').value = table.capacity;
        document.getElementById('table-status').value = table.status;
        tableModal.style.display = 'block';
      }
    } catch (error) {
      showError('テーブル情報の取得に失敗しました');
    }
  };
  
  // テーブル削除関数（グローバルスコープに定義）
  window.deleteTable = async function(tableId) {
    if (confirm('このテーブルを削除してもよろしいですか？')) {
      try {
        await fetchAPI(`/tables/${tableId}`, 'DELETE');
        showSuccess('テーブルを削除しました');
        loadTables();
      } catch (error) {
        showError('テーブルの削除に失敗しました');
      }
    }
  };
  
  // QRコード表示関数（グローバルスコープに定義）
  window.showQRCode = async function(tableId, tableNumber) {
    try {
      const qrModal = document.getElementById('qr-code-modal');
      const qrContainer = document.getElementById('qr-code-container');
      const qrTableNumber = document.getElementById('qr-table-number');
      
      qrContainer.innerHTML = '';
      qrTableNumber.textContent = tableNumber;
      
      // QRコードURLを生成するAPIを呼び出し
      const response = await fetchAPI(`/tables/${tableId}/qr-code`);
      const qrData = response.data;
      
      // 生成したQRコードURLを使用
      new QRCode(qrContainer, {
        text: qrData.url,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      
      // QRコードの有効期限情報を追加
      const expiryInfo = document.createElement('div');
      expiryInfo.className = 'text-center mt-1 small';
      
      // タイムスタンプから有効期限を計算（24時間）
      const timestamp = new URLSearchParams(new URL(qrData.url).search).get('t');
      if (timestamp) {
        const expiryDate = new Date(parseInt(timestamp) + 24 * 60 * 60 * 1000);
        expiryInfo.textContent = `有効期限: ${expiryDate.toLocaleString('ja-JP')}`;
        qrContainer.appendChild(expiryInfo);
      }
      
      // デバッグ用にURLを表示（本番環境では削除可能）
      const urlInfo = document.createElement('div');
      urlInfo.className = 'text-center mt-2 small text-muted';
      urlInfo.textContent = 'URL: ' + qrData.url;
      qrContainer.appendChild(urlInfo);
      
      qrModal.style.display = 'block';
    } catch (error) {
      showError('QRコードの生成に失敗しました: ' + error.message);
    }
  };
  
  // QRコード印刷ボタンのイベントリスナー
  const printQrBtn = document.getElementById('print-qr-btn');
  if (printQrBtn) {
    printQrBtn.addEventListener('click', function() {
      const qrContainer = document.getElementById('qr-code-container');
      const tableNumber = document.getElementById('qr-table-number').textContent;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>テーブルQRコード - ${tableNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; }
              .qr-container { margin: 20px auto; }
              h2 { margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <h2>テーブル: ${tableNumber}</h2>
            <div class="qr-container">
              ${qrContainer.innerHTML}
            </div>
            <p>このQRコードをスキャンしてメニューを表示</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    });
  }
  
  // QRコードダウンロードボタンのイベントリスナー
  const downloadQrBtn = document.getElementById('download-qr-btn');
  if (downloadQrBtn) {
    downloadQrBtn.addEventListener('click', function() {
      const qrContainer = document.getElementById('qr-code-container');
      const tableNumber = document.getElementById('qr-table-number').textContent;
      const qrImage = qrContainer.querySelector('img');
      
      if (qrImage) {
        const link = document.createElement('a');
        link.download = `qrcode_table_${tableNumber}.png`;
        link.href = qrImage.src;
        link.click();
      }
    });
  }

  // メニュー管理機能
  const addCategoryBtn = document.getElementById('add-category-btn');
  const categoryModal = document.getElementById('category-modal');
  const saveCategoryBtn = document.getElementById('save-category-btn');
  const categoriesList = document.getElementById('categories-list');
  
  const addMenuItemBtn = document.getElementById('add-menu-item-btn');
  const menuItemModal = document.getElementById('menu-item-modal');
  const saveMenuItemBtn = document.getElementById('save-menu-item-btn');
  const menuItemsList = document.getElementById('menu-items-list');
  const menuItemCategory = document.getElementById('menu-item-category');
  
  // カテゴリ一覧を読み込む
  async function loadCategories() {
    try {
      const response = await fetchAPI('/categories');
      const categories = response.data || [];
      
      categoriesList.innerHTML = '';
      
      if (categories.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="3" class="text-center">カテゴリデータがありません</td>`;
        categoriesList.appendChild(row);
        return;
      }
      
      categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${category.name}</td>
          <td>${category.display_order}</td>
          <td>
            <button class="btn btn-sm" onclick="editCategory(${category.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})"><i class="fas fa-trash"></i></button>
          </td>
        `;
        categoriesList.appendChild(row);
      });
      
      // メニュー追加/編集フォームのカテゴリ選択肢を更新
      if (menuItemCategory) {
        menuItemCategory.innerHTML = '';
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          menuItemCategory.appendChild(option);
        });
      }
    } catch (error) {
      showError('カテゴリ一覧の読み込みに失敗しました');
    }
  }
  
  // メニュー一覧を読み込む
  async function loadMenuItems() {
    try {
      const response = await fetchAPI('/menu-items');
      const menuItems = response.data || [];
      
      menuItemsList.innerHTML = '';
      
      if (menuItems.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" class="text-center">メニューデータがありません</td>`;
        menuItemsList.appendChild(row);
        return;
      }
      
      // カテゴリ情報を取得
      const categoriesResponse = await fetchAPI('/categories');
      const categories = categoriesResponse.data || [];
      
      menuItems.forEach(item => {
        const category = categories.find(c => c.id === item.category_id);
        const categoryName = category ? category.name : '';
        const availabilityClass = !item.is_sold_out ? 'success' : 'danger';
        const availabilityText = !item.is_sold_out ? '提供中' : '完売';
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><img src="${item.image_url || 'img/no-image.png'}" alt="${item.name}" class="image-preview"></td>
          <td>${item.name}</td>
          <td>${categoryName}</td>
          <td>¥${item.price.toLocaleString()}</td>
          <td><span class="badge badge-${availabilityClass}">${availabilityText}</span></td>
          <td>
            <button class="btn btn-sm" onclick="editMenuItem(${item.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${item.id})"><i class="fas fa-trash"></i></button>
          </td>
        `;
        menuItemsList.appendChild(row);
      });
    } catch (error) {
      showError('メニュー一覧の読み込みに失敗しました');
    }
  }
  
  // 新規カテゴリ追加ボタンのイベントリスナー
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', function() {
      document.getElementById('category-modal-title').textContent = 'カテゴリを追加';
      document.getElementById('category-id').value = '';
      document.getElementById('category-name').value = '';
      document.getElementById('category-order').value = '0';
      categoryModal.style.display = 'block';
    });
  }
  
  // カテゴリ保存ボタンのイベントリスナー
  if (saveCategoryBtn) {
    saveCategoryBtn.addEventListener('click', async function() {
      const categoryForm = document.getElementById('category-form');
      if (!categoryForm.checkValidity()) {
        alert('必須項目を入力してください');
        return;
      }
      
      try {
        const categoryId = document.getElementById('category-id').value;
        const categoryData = {
          name: document.getElementById('category-name').value,
          display_order: parseInt(document.getElementById('category-order').value)
        };
        
        let response;
        if (categoryId) {
          // 既存カテゴリの更新
          response = await fetchAPI(`/categories/${categoryId}`, 'PUT', categoryData);
          showSuccess('カテゴリを更新しました');
        } else {
          // 新規カテゴリの追加
          response = await fetchAPI('/categories', 'POST', categoryData);
          showSuccess('カテゴリを追加しました');
        }
        
        // モーダルを閉じて、カテゴリ一覧を再読み込み
        categoryModal.style.display = 'none';
        loadCategories();
      } catch (error) {
        showError('カテゴリの保存に失敗しました');
      }
    });
  }
  
  // 新規メニュー追加ボタンのイベントリスナー
  if (addMenuItemBtn) {
    addMenuItemBtn.addEventListener('click', function() {
      document.getElementById('menu-item-modal-title').textContent = 'メニューを追加';
      document.getElementById('menu-item-id').value = '';
      document.getElementById('menu-item-name').value = '';
      document.getElementById('menu-item-description').value = '';
      document.getElementById('menu-item-price').value = '';
      document.getElementById('menu-item-order').value = '0';
      document.getElementById('menu-item-available').checked = true;
      document.getElementById('menu-item-image-preview').innerHTML = '';
      menuItemModal.style.display = 'block';
    });
  }
  
  // メニュー保存ボタンのイベントリスナー
  if (saveMenuItemBtn) {
    saveMenuItemBtn.addEventListener('click', async function() {
      const menuItemForm = document.getElementById('menu-item-form');
      if (!menuItemForm.checkValidity()) {
        alert('必須項目を入力してください');
        return;
      }
      
      try {
        const itemId = document.getElementById('menu-item-id').value;
        const formData = new FormData();
        
        formData.append('name', document.getElementById('menu-item-name').value);
        formData.append('category_id', document.getElementById('menu-item-category').value);
        formData.append('description', document.getElementById('menu-item-description').value);
        formData.append('price', document.getElementById('menu-item-price').value);
        formData.append('display_order', document.getElementById('menu-item-order').value);
        formData.append('is_sold_out', !document.getElementById('menu-item-available').checked);
        
        // 画像ファイルが選択されている場合のみ追加
        const imageFile = document.getElementById('menu-item-image').files[0];
        if (imageFile) {
          formData.append('image', imageFile);
        }
        
        // 画像アップロード用のカスタムリクエスト
        const url = itemId 
          ? `${API_BASE_URL}/menu-items/${itemId}` 
          : `${API_BASE_URL}/menu-items`;
        
        const method = itemId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
        }
        
        // 成功メッセージ表示
        showSuccess(itemId ? 'メニューを更新しました' : 'メニューを追加しました');
        
        // モーダルを閉じて、メニュー一覧を再読み込み
        menuItemModal.style.display = 'none';
        loadMenuItems();
      } catch (error) {
        showError('メニューの保存に失敗しました');
      }
    });
  }
  
  // 在庫状況切り替えのイベントリスナー
  const menuItemAvailable = document.getElementById('menu-item-available');
  const availabilityStatus = document.getElementById('availability-status');
  
  if (menuItemAvailable && availabilityStatus) {
    menuItemAvailable.addEventListener('change', function() {
      availabilityStatus.textContent = this.checked ? '提供中' : '完売';
    });
  }
  
  // 画像プレビュー機能
  const menuItemImage = document.getElementById('menu-item-image');
  const menuItemImagePreview = document.getElementById('menu-item-image-preview');
  
  if (menuItemImage && menuItemImagePreview) {
    menuItemImage.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          menuItemImagePreview.innerHTML = `<img src="${e.target.result}" class="image-preview">`;
        };
        reader.readAsDataURL(file);
      } else {
        menuItemImagePreview.innerHTML = '';
      }
    });
  }
  
  // カテゴリ編集関数（グローバルスコープに定義）
  window.editCategory = async function(categoryId) {
    try {
      // APIからカテゴリ情報を取得
      const response = await fetchAPI(`/categories/${categoryId}`);
      const category = response.data;
      
      if (category) {
        document.getElementById('category-modal-title').textContent = 'カテゴリを編集';
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-order').value = category.display_order;
        categoryModal.style.display = 'block';
      }
    } catch (error) {
      showError('カテゴリ情報の取得に失敗しました');
    }
  };
  
  // カテゴリ削除関数（グローバルスコープに定義）
  window.deleteCategory = async function(categoryId) {
    if (confirm('このカテゴリを削除してもよろしいですか？関連するメニューアイテムも削除されます。')) {
      try {
        await fetchAPI(`/categories/${categoryId}`, 'DELETE');
        showSuccess('カテゴリを削除しました');
        loadCategories();
        loadMenuItems();
      } catch (error) {
        showError('カテゴリの削除に失敗しました');
      }
    }
  };
  
  // メニュー編集関数（グローバルスコープに定義）
  window.editMenuItem = async function(itemId) {
    try {
      // APIからメニュー情報を取得
      const response = await fetchAPI(`/menu-items/${itemId}`);
      const item = response.data;
      
      if (item) {
        document.getElementById('menu-item-modal-title').textContent = 'メニューを編集';
        document.getElementById('menu-item-id').value = item.id;
        document.getElementById('menu-item-name').value = item.name;
        document.getElementById('menu-item-category').value = item.category_id;
        document.getElementById('menu-item-description').value = item.description;
        document.getElementById('menu-item-price').value = item.price;
        document.getElementById('menu-item-order').value = item.display_order;
        document.getElementById('menu-item-available').checked = !item.is_sold_out;
        
        const availabilityStatus = document.getElementById('availability-status');
        if (availabilityStatus) {
          availabilityStatus.textContent = !item.is_sold_out ? '提供中' : '完売';
        }
        
        const imagePreview = document.getElementById('menu-item-image-preview');
        if (imagePreview) {
          if (item.image_url) {
            imagePreview.innerHTML = `<img src="${item.image_url}" class="image-preview">`;
          } else {
            imagePreview.innerHTML = '';
          }
        }
        
        menuItemModal.style.display = 'block';
      }
    } catch (error) {
      showError('メニュー情報の取得に失敗しました');
    }
  };
  
  // メニュー削除関数（グローバルスコープに定義）
  window.deleteMenuItem = async function(itemId) {
    if (confirm('このメニューを削除してもよろしいですか？')) {
      try {
        await fetchAPI(`/menu-items/${itemId}`, 'DELETE');
        showSuccess('メニューを削除しました');
        loadMenuItems();
      } catch (error) {
        showError('メニューの削除に失敗しました');
      }
    }
  };

  // 注文管理機能
  const orderStatusFilter = document.getElementById('order-status-filter');
  const ordersList = document.getElementById('orders-list');
  
  // 注文一覧を読み込む
  async function loadOrders(status = 'all') {
    try {
      const endpoint = status === 'all' ? '/orders' : `/orders?status=${status}`;
      const response = await fetchAPI(endpoint);
      const orders = response.data || [];
      
      ordersList.innerHTML = '';
      
      if (orders.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" class="text-center">注文データがありません</td>`;
        ordersList.appendChild(row);
        return;
      }
      
      orders.forEach(order => {
        const statusText = {
          'pending': '未処理',
          'processing': '処理中',
          'completed': '完了',
          'cancelled': 'キャンセル'
        }[order.status];
        
        const statusClass = {
          'pending': 'warning',
          'processing': 'warning',
          'completed': 'success',
          'cancelled': 'danger'
        }[order.status];
        
        const paymentStatusText = {
          'unpaid': '未払い',
          'requested': '支払い依頼中',
          'paid': '支払済',
          'cancelled': 'キャンセル'
        }[order.payment_status];
        
        const paymentStatusClass = {
          'unpaid': 'warning',
          'requested': 'info',
          'paid': 'success',
          'cancelled': 'danger'
        }[order.payment_status];
        
        const orderDate = new Date(order.created_at);
        const formattedDate = orderDate.toLocaleString('ja-JP');
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${order.id}</td>
          <td>${order.table_number}</td>
          <td>¥${order.total_amount.toLocaleString()}</td>
          <td><span class="badge badge-${statusClass}">${statusText}</span></td>
          <td><span class="badge badge-${paymentStatusClass}">${paymentStatusText}</span></td>
          <td>${formattedDate}</td>
          <td>
            <button class="btn btn-sm" onclick="viewOrderDetails(${order.id})"><i class="fas fa-eye"></i></button>
            ${order.status !== 'completed' && order.status !== 'cancelled' ? `<button class="btn btn-sm btn-danger" onclick="cancelOrder(${order.id})"><i class="fas fa-times"></i></button>` : ''}
          </td>
        `;
        ordersList.appendChild(row);
      });
    } catch (error) {
      showError('注文一覧の読み込みに失敗しました');
    }
  }
  
  // 注文ステータスフィルターのイベントリスナー
  if (orderStatusFilter) {
    orderStatusFilter.addEventListener('change', function() {
      loadOrders(this.value);
    });
  }
  
  // 注文詳細表示関数（グローバルスコープに定義）
  window.viewOrderDetails = async function(orderId) {
    try {
      // 注文詳細とアイテム情報を取得
      const orderResponse = await fetchAPI(`/orders/${orderId}`);
      const order = orderResponse.data;
      
      const orderItemsResponse = await fetchAPI(`/orders/${orderId}/items`);
      const items = orderItemsResponse.data || [];
      
      if (order) {
        const orderDetailModal = document.getElementById('order-detail-modal');
        
        // 注文情報を表示
        document.getElementById('order-id').textContent = order.id;
        document.getElementById('order-table').textContent = order.table_number;
        
        const orderDate = new Date(order.created_at);
        document.getElementById('order-time').textContent = orderDate.toLocaleString('ja-JP');
        
        const statusText = {
          'pending': '未処理',
          'processing': '処理中',
          'completed': '完了',
          'cancelled': 'キャンセル'
        }[order.status];
        document.getElementById('order-status').textContent = statusText;
        
        const paymentStatusText = {
          'unpaid': '未払い',
          'requested': '支払い依頼中',
          'paid': '支払済',
          'cancelled': 'キャンセル'
        }[order.payment_status];
        document.getElementById('order-payment').textContent = paymentStatusText;
        
        // 注文アイテムを表示
        const orderItemsContainer = document.getElementById('order-items');
        orderItemsContainer.innerHTML = '';
        
        let subtotal = 0;
        
        items.forEach(item => {
          const itemTotal = item.quantity * item.unit_price;
          subtotal += itemTotal;
          
          const statusText = {
            'pending': '未処理',
            'preparing': '調理中',
            'ready': '提供準備完了',
            'served': '提供済',
            'cancelled': 'キャンセル'
          }[item.status || 'pending']; // デフォルトはpending
          
          const statusClass = {
            'pending': 'warning',
            'preparing': 'warning',
            'ready': 'success',
            'served': 'success',
            'cancelled': 'danger'
          }[item.status || 'pending']; // デフォルトはpending
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>¥${item.unit_price.toLocaleString()}</td>
            <td>¥${itemTotal.toLocaleString()}</td>
            <td><span class="badge badge-${statusClass}">${statusText}</span></td>
          `;
          orderItemsContainer.appendChild(row);
        });
        
        // 小計、税金、合計を計算して表示
        document.getElementById('order-subtotal').textContent = `¥${subtotal.toLocaleString()}`;
        
        // 設定から税率を取得
        const settingsResponse = await fetchAPI('/settings');
        const settings = settingsResponse.data;
        const taxRate = (settings && settings.tax_rate) ? settings.tax_rate / 100 : 0.1; // デフォルトは10%
        
        const tax = Math.round(subtotal * taxRate);
        document.getElementById('order-tax').textContent = `¥${tax.toLocaleString()}`;
        
        const total = subtotal + tax;
        document.getElementById('order-total').textContent = `¥${total.toLocaleString()}`;
        
        // ボタンの表示/非表示を制御
        const cancelOrderBtn = document.getElementById('cancel-order-btn');
        const updateOrderStatusBtn = document.getElementById('update-order-status-btn');
        const completeOrderBtn = document.getElementById('complete-order-btn');
        
        if (cancelOrderBtn) {
          cancelOrderBtn.style.display = (order.status !== 'completed' && order.status !== 'cancelled') ? 'inline-block' : 'none';
        }
        
        if (updateOrderStatusBtn) {
          updateOrderStatusBtn.style.display = (order.status !== 'completed' && order.status !== 'cancelled') ? 'inline-block' : 'none';
        }
        
        if (completeOrderBtn) {
          completeOrderBtn.style.display = (order.status !== 'completed' && order.status !== 'cancelled') ? 'inline-block' : 'none';
        }
        
        orderDetailModal.style.display = 'block';
      }
    } catch (error) {
      showError('注文詳細の取得に失敗しました');
    }
  };
  
  // 注文キャンセル関数（グローバルスコープに定義）
  window.cancelOrder = async function(orderId) {
    if (confirm('この注文をキャンセルしてもよろしいですか？')) {
      try {
        await fetchAPI(`/orders/${orderId}/cancel`, 'PUT');
        showSuccess('注文をキャンセルしました');
        loadOrders(orderStatusFilter ? orderStatusFilter.value : 'all');
      } catch (error) {
        showError('注文のキャンセルに失敗しました');
      }
    }
  };
  
  // 注文キャンセルボタンのイベントリスナー
  const cancelOrderBtn = document.getElementById('cancel-order-btn');
  if (cancelOrderBtn) {
    cancelOrderBtn.addEventListener('click', async function() {
      const orderId = document.getElementById('order-id').textContent;
      if (confirm('この注文をキャンセルしてもよろしいですか？')) {
        try {
          await fetchAPI(`/orders/${orderId}/cancel`, 'PUT');
          showSuccess('注文をキャンセルしました');
          
          // モーダルを閉じて、注文一覧を再読み込み
          document.getElementById('order-detail-modal').style.display = 'none';
          loadOrders(orderStatusFilter ? orderStatusFilter.value : 'all');
        } catch (error) {
          showError('注文のキャンセルに失敗しました');
        }
      }
    });
  }
  
  // 注文ステータス更新ボタンのイベントリスナー
  const updateOrderStatusBtn = document.getElementById('update-order-status-btn');
  if (updateOrderStatusBtn) {
    updateOrderStatusBtn.addEventListener('click', async function() {
      const orderId = document.getElementById('order-id').textContent;
      const newStatus = prompt('新しいステータスを選択してください（pending, processing, completed, cancelled）:');
      
      if (newStatus && ['pending', 'processing', 'completed', 'cancelled'].includes(newStatus)) {
        try {
          await fetchAPI(`/orders/${orderId}/status`, 'PUT', { status: newStatus });
          showSuccess('注文ステータスを更新しました');
          
          // モーダルを閉じて、注文一覧を再読み込み
          document.getElementById('order-detail-modal').style.display = 'none';
          loadOrders(orderStatusFilter ? orderStatusFilter.value : 'all');
        } catch (error) {
          showError('注文ステータスの更新に失敗しました');
        }
      } else if (newStatus) {
        alert('無効なステータスです。pending, processing, completed, cancelledのいずれかを入力してください。');
      }
    });
  }
  
  // 注文完了ボタンのイベントリスナー
  const completeOrderBtn = document.getElementById('complete-order-btn');
  if (completeOrderBtn) {
    completeOrderBtn.addEventListener('click', async function() {
      const orderId = document.getElementById('order-id').textContent;
      if (confirm('この注文を完了としてマークしますか？')) {
        try {
          await fetchAPI(`/orders/${orderId}/complete`, 'PUT');
          showSuccess('注文を完了としてマークしました');
          
          // モーダルを閉じて、注文一覧を再読み込み
          document.getElementById('order-detail-modal').style.display = 'none';
          loadOrders(orderStatusFilter ? orderStatusFilter.value : 'all');
        } catch (error) {
          showError('注文の完了処理に失敗しました');
        }
      }
    });
  }

  // QRコードスキャナー機能
  const startScannerBtn = document.getElementById('start-scanner-btn');
  const stopScannerBtn = document.getElementById('stop-scanner-btn');
  const scanResult = document.getElementById('scan-result');
  let scanner = null;
  
  // QRコードスキャナー開始ボタンのイベントリスナー
  if (startScannerBtn) {
    startScannerBtn.addEventListener('click', async function() {
      startScannerBtn.style.display = 'none';
      stopScannerBtn.style.display = 'inline-block';
      
      scanResult.innerHTML = '<div class="alert alert-info">カメラを初期化中...</div>';
      
      try {
        // QRコードスキャナーのHTML要素を生成
        const scannerContainer = document.createElement('div');
        scannerContainer.id = 'scanner-container';
        scannerContainer.style.width = '100%';
        scannerContainer.style.height = '300px';
        scanResult.innerHTML = '';
        scanResult.appendChild(scannerContainer);
        
        // QRコードスキャナーの初期化
        scanner = new Html5Qrcode('scanner-container');
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
        };
        
        // カメラアクセスとスキャン開始
        await scanner.start(
          { facingMode: "environment" }, // バックカメラを使用
          config,
          async (decodedText) => {
            // QRコードが検出された時の処理
            try {
              // スキャナーを停止
              await scanner.stop();
              scanner = null;
              stopScannerBtn.style.display = 'none';
              startScannerBtn.style.display = 'inline-block';
              
              // QRコードからテーブルIDを抽出
              const url = new URL(decodedText);
              const tableId = url.searchParams.get('table');
              
              if (!tableId) {
                throw new Error('無効なQRコードです');
              }
              
              // テーブル情報を取得
              const tableResponse = await fetchAPI(`/tables/${tableId}`);
              const table = tableResponse.data;
              
              if (!table) {
                throw new Error('テーブルが見つかりません');
              }
              
              scanResult.innerHTML = `
                <div class="alert alert-success">
                  <p><strong>スキャン成功!</strong></p>
                  <p>テーブル: ${table.table_number}</p>
                  <p>テーブルID: ${table.id}</p>
                </div>
                <div class="mt-3">
                  <button class="btn" onclick="viewTableOrders(${table.id})">注文を表示</button>
                  <button class="btn btn-success" onclick="processPayment(${table.id})">支払い処理</button>
                </div>
              `;
            } catch (error) {
              showError(`QRコードの処理に失敗しました: ${error.message}`);
              startScannerBtn.style.display = 'inline-block';
            }
          },
          (errorMessage) => {
            // エラー時は無視（ログのみ）
            console.error(errorMessage);
          }
        );
      } catch (error) {
        showError(`カメラの初期化に失敗しました: ${error.message}`);
        startScannerBtn.style.display = 'inline-block';
        stopScannerBtn.style.display = 'none';
      }
    });
  }
  
  // QRコードスキャナー停止ボタンのイベントリスナー
  if (stopScannerBtn) {
    stopScannerBtn.addEventListener('click', async function() {
      if (scanner) {
        try {
          await scanner.stop();
          scanner = null;
        } catch (error) {
          console.error('スキャナー停止エラー:', error);
        }
      }
      
      startScannerBtn.style.display = 'inline-block';
      stopScannerBtn.style.display = 'none';
      
      scanResult.innerHTML = '<div class="alert alert-info">スキャナーを停止しました。再度スキャンするには「スキャン開始」ボタンを押してください。</div>';
    });
  }
  
  // テーブル注文表示関数（グローバルスコープに定義）
  window.viewTableOrders = async function(tableId) {
    try {
      const response = await fetchAPI(`/tables/${tableId}/orders`);
      const tableOrders = response.data || [];
      
      // テーブル情報を取得
      const tableResponse = await fetchAPI(`/tables/${tableId}`);
      const table = tableResponse.data;
      
      if (tableOrders.length > 0) {
        scanResult.innerHTML = `
          <div class="alert alert-info">
            <p><strong>テーブル ${table.table_number} の注文:</strong></p>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>注文ID</th>
                  <th>金額</th>
                  <th>ステータス</th>
                  <th>支払い状況</th>
                  <th>時間</th>
                  <th>アクション</th>
                </tr>
              </thead>
              <tbody>
                ${tableOrders.map(order => {
                  const statusText = {
                    'pending': '未処理',
                    'processing': '処理中',
                    'completed': '完了',
                    'cancelled': 'キャンセル'
                  }[order.status];
                  
                  const statusClass = {
                    'pending': 'warning',
                    'processing': 'warning',
                    'completed': 'success',
                    'cancelled': 'danger'
                  }[order.status];
                  
                  const paymentStatusText = {
                    'unpaid': '未払い',
                    'requested': '支払い依頼中',
                    'paid': '支払済',
                    'cancelled': 'キャンセル'
                  }[order.payment_status];
                  
                  const paymentStatusClass = {
                    'unpaid': 'warning',
                    'requested': 'info',
                    'paid': 'success',
                    'cancelled': 'danger'
                  }[order.payment_status];
                  
                  const orderDate = new Date(order.created_at);
                  const formattedDate = orderDate.toLocaleString('ja-JP');
                  
                  return `
                    <tr>
                      <td>${order.id}</td>
                      <td>¥${order.total_amount.toLocaleString()}</td>
                      <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                      <td><span class="badge badge-${paymentStatusClass}">${paymentStatusText}</span></td>
                      <td>${formattedDate}</td>
                      <td>
                        <button class="btn btn-sm" onclick="viewOrderDetails(${order.id})"><i class="fas fa-eye"></i></button>
                        ${order.payment_status === 'unpaid' ? `<button class="btn btn-sm btn-success" onclick="processPayment(${tableId}, ${order.id})"><i class="fas fa-cash-register"></i></button>` : ''}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="mt-3">
            <button class="btn" onclick="startScannerBtn.click()">新しいQRコードをスキャン</button>
            ${tableOrders.some(o => o.payment_status === 'unpaid') ? `<button class="btn btn-success" onclick="processPayment(${tableId})">一括支払い処理</button>` : ''}
          </div>
        `;
      } else {
        scanResult.innerHTML = `
          <div class="alert alert-warning">
            <p>このテーブル（${table.table_number}）の注文は見つかりませんでした。</p>
          </div>
          <div class="mt-3">
            <button class="btn" onclick="startScannerBtn.click()">新しいQRコードをスキャン</button>
          </div>
        `;
      }
    } catch (error) {
      showError('テーブルの注文情報の取得に失敗しました');
    }
  };
  
  // 支払い処理関数（グローバルスコープに定義）
  window.processPayment = async function(tableId, orderId) {
    try {
      // テーブル情報を取得
      const tableResponse = await fetchAPI(`/tables/${tableId}`);
      const table = tableResponse.data;
      
      const message = orderId 
        ? `注文 #${orderId} の支払いを処理しますか？` 
        : `テーブル ${table.table_number} の全ての注文の支払いを処理しますか？`;
      
      if (confirm(message)) {
        // 支払い処理中の表示
        scanResult.innerHTML = `
          <div class="alert alert-info">
            <p>支払い処理中...</p>
          </div>
        `;
        
        // 支払いバーコードを生成するAPIリクエスト
        const paymentData = {
          table_id: tableId,
          order_id: orderId || null
        };
        
        const paymentResponse = await fetchAPI('/payments/generate-barcode', 'POST', paymentData);
        const paymentCode = paymentResponse.data;
        
        const barcodeContainer = document.createElement('div');
        barcodeContainer.className = 'text-center mt-3';
        
        const barcodeCanvas = document.createElement('canvas');
        barcodeCanvas.id = 'payment-barcode';
        barcodeContainer.appendChild(barcodeCanvas);
        
        scanResult.innerHTML = `
          <div class="alert alert-success">
            <p><strong>支払い準備完了</strong></p>
            <p>お客様に以下のバーコードをスキャンしてもらってください。</p>
          </div>
        `;
        
        scanResult.appendChild(barcodeContainer);
        
        // バーコード生成
        JsBarcode('#payment-barcode', paymentCode.barcode_value, {
          format: 'CODE128',
          width: 2,
          height: 100,
          displayValue: true
        });
        
        // 支払い完了ボタンを追加
        const completePaymentBtn = document.createElement('button');
        completePaymentBtn.className = 'btn btn-success mt-3';
        completePaymentBtn.textContent = '支払い完了';
        completePaymentBtn.addEventListener('click', async function() {
          try {
            // 支払い完了処理のAPIリクエスト
            await fetchAPI(`/payments/${paymentCode.payment_id}/complete`, 'PUT');
            
            scanResult.innerHTML = `
              <div class="alert alert-success">
                <p><strong>支払いが完了しました！</strong></p>
                <p>注文ステータスが更新されました。</p>
              </div>
              <div class="mt-3">
                <button class="btn" onclick="startScannerBtn.click()">新しいQRコードをスキャン</button>
              </div>
            `;
            
            // 注文一覧を再読み込み
            loadOrders(orderStatusFilter ? orderStatusFilter.value : 'all');
          } catch (error) {
            showError('支払い完了処理に失敗しました');
          }
        });
        
        scanResult.appendChild(completePaymentBtn);
        
        // キャンセルボタンを追加
        const cancelPaymentBtn = document.createElement('button');
        cancelPaymentBtn.className = 'btn btn-secondary mt-3 ml-2';
        cancelPaymentBtn.textContent = 'キャンセル';
        cancelPaymentBtn.addEventListener('click', async function() {
          try {
            // 支払いキャンセル処理のAPIリクエスト
            await fetchAPI(`/payments/${paymentCode.payment_id}/cancel`, 'PUT');
            
            scanResult.innerHTML = `
              <div class="alert alert-info">
                <p>支払い処理がキャンセルされました。</p>
              </div>
              <div class="mt-3">
                <button class="btn" onclick="startScannerBtn.click()">新しいQRコードをスキャン</button>
              </div>
            `;
          } catch (error) {
            showError('支払いキャンセル処理に失敗しました');
          }
        });
        
        scanResult.appendChild(cancelPaymentBtn);
      }
    } catch (error) {
      showError('支払い処理の準備に失敗しました');
    }
  };

  // 設定保存機能
  const settingsForm = document.getElementById('settings-form');
  
  // 設定を読み込む
  async function loadSettings() {
    try {
      const response = await fetchAPI('/settings');
      const settings = response.data;
      
      if (settings) {
        document.getElementById('restaurant-name').value = settings.restaurant_name || '';
        document.getElementById('tax-rate').value = settings.tax_rate || '10';
        document.getElementById('service-charge').value = settings.service_charge || '0';
        document.getElementById('auto-accept-orders').checked = settings.auto_accept_orders || false;
      }
    } catch (error) {
      showError('設定の読み込みに失敗しました');
    }
  }
  
  if (settingsForm) {
    // 設定フォームの読み込み
    loadSettings();
    
    settingsForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      try {
        const settingsData = {
          restaurant_name: document.getElementById('restaurant-name').value,
          tax_rate: parseFloat(document.getElementById('tax-rate').value),
          service_charge: parseFloat(document.getElementById('service-charge').value),
          auto_accept_orders: document.getElementById('auto-accept-orders').checked
        };
        
        await fetchAPI('/settings', 'PUT', settingsData);
        showSuccess('設定が保存されました');
      } catch (error) {
        showError('設定の保存に失敗しました');
      }
    });
  }

  // 初期データ読み込み
  loadTables();
  loadCategories();
  loadMenuItems();
  loadOrders();
  
  // ダッシュボードを表示
  document.getElementById('dashboard-page').style.display = 'block';
});
