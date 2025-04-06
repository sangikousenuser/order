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
          // ログアウト処理をここに実装
          alert('ログアウトしました');
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
  function loadTables() {
    // APIからデータを取得する代わりに、サンプルデータを使用
    const tables = [
      { table_id: 1, table_number: 'A1', capacity: 4, status: 'available' },
      { table_id: 2, table_number: 'A2', capacity: 4, status: 'occupied' },
      { table_id: 3, table_number: 'A3', capacity: 2, status: 'available' },
      { table_id: 4, table_number: 'B1', capacity: 6, status: 'available' },
      { table_id: 5, table_number: 'B2', capacity: 8, status: 'reserved' },
      { table_id: 6, table_number: 'C1', capacity: 2, status: 'maintenance' }
    ];
    
    tablesList.innerHTML = '';
    
    tables.forEach(table => {
      const statusText = {
        'available': '利用可能',
        'occupied': '使用中',
        'reserved': '予約済み',
        'maintenance': 'メンテナンス中'
      }[table.status];
      
      const statusClass = {
        'available': 'success',
        'occupied': 'warning',
        'reserved': 'warning',
        'maintenance': 'danger'
      }[table.status];
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${table.table_number}</td>
        <td>${table.capacity}人</td>
        <td><span class="badge badge-${statusClass}">${statusText}</span></td>
        <td><button class="btn btn-sm" onclick="showQRCode(${table.table_id}, '${table.table_number}')"><i class="fas fa-qrcode"></i> QR表示</button></td>
        <td>
          <button class="btn btn-sm" onclick="editTable(${table.table_id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteTable(${table.table_id})"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tablesList.appendChild(row);
    });
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
    saveTableBtn.addEventListener('click', function() {
      if (!tableForm.checkValidity()) {
        alert('必須項目を入力してください');
        return;
      }
      
      const tableId = document.getElementById('table-id').value;
      const tableNumber = document.getElementById('table-number').value;
      const capacity = document.getElementById('table-capacity').value;
      const status = document.getElementById('table-status').value;
      
      // APIを使用してデータを保存する代わりに、コンソールに出力
      console.log('テーブルを保存:', {
        table_id: tableId,
        table_number: tableNumber,
        capacity: capacity,
        status: status
      });
      
      // モーダルを閉じて、テーブル一覧を再読み込み
      tableModal.style.display = 'none';
      loadTables();
    });
  }
  
  // テーブル編集関数（グローバルスコープに定義）
  window.editTable = function(tableId) {
    // APIからデータを取得する代わりに、サンプルデータを使用
    const tables = [
      { table_id: 1, table_number: 'A1', capacity: 4, status: 'available' },
      { table_id: 2, table_number: 'A2', capacity: 4, status: 'occupied' },
      { table_id: 3, table_number: 'A3', capacity: 2, status: 'available' },
      { table_id: 4, table_number: 'B1', capacity: 6, status: 'available' },
      { table_id: 5, table_number: 'B2', capacity: 8, status: 'reserved' },
      { table_id: 6, table_number: 'C1', capacity: 2, status: 'maintenance' }
    ];
    
    const table = tables.find(t => t.table_id === tableId);
    
    if (table) {
      document.getElementById('table-modal-title').textContent = 'テーブルを編集';
      document.getElementById('table-id').value = table.table_id;
      document.getElementById('table-number').value = table.table_number;
      document.getElementById('table-capacity').value = table.capacity;
      document.getElementById('table-status').value = table.status;
      tableModal.style.display = 'block';
    }
  };
  
  // テーブル削除関数（グローバルスコープに定義）
  window.deleteTable = function(tableId) {
    if (confirm('このテーブルを削除してもよろしいですか？')) {
      // APIを使用してデータを削除する代わりに、コンソールに出力
      console.log('テーブルを削除:', tableId);
      loadTables();
    }
  };
  
  // QRコード表示関数（グローバルスコープに定義）
  window.showQRCode = function(tableId, tableNumber) {
    const qrModal = document.getElementById('qr-code-modal');
    const qrContainer = document.getElementById('qr-code-container');
    const qrTableNumber = document.getElementById('qr-table-number');
    
    qrContainer.innerHTML = '';
    qrTableNumber.textContent = tableNumber;
    
    // QRコードを生成
    const qrUrl = `${window.location.origin}/customer/index.html?table=${tableId}`;
    new QRCode(qrContainer, {
      text: qrUrl,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    
    qrModal.style.display = 'block';
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
  function loadCategories() {
    // APIからデータを取得する代わりに、サンプルデータを使用
    const categories = [
      { category_id: 1, name: '前菜', display_order: 1 },
      { category_id: 2, name: 'メイン', display_order: 2 },
      { category_id: 3, name: 'サイドメニュー', display_order: 3 },
      { category_id: 4, name: 'デザート', display_order: 4 },
      { category_id: 5, name: 'ドリンク', display_order: 5 }
    ];
    
    categoriesList.innerHTML = '';
    
    categories.forEach(category => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${category.name}</td>
        <td>${category.display_order}</td>
        <td>
          <button class="btn btn-sm" onclick="editCategory(${category.category_id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.category_id})"><i class="fas fa-trash"></i></button>
        </td>
      `;
      categoriesList.appendChild(row);
    });
    
    // メニュー追加/編集フォームのカテゴリ選択肢を更新
    if (menuItemCategory) {
      menuItemCategory.innerHTML = '';
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.category_id;
        option.textContent = category.name;
        menuItemCategory.appendChild(option);
      });
    }
  }
  
  // メニュー一覧を読み込む
  function loadMenuItems() {
    // APIからデータを取得する代わりに、サンプルデータを使用
    const menuItems = [
      { item_id: 1, name: 'シーザーサラダ', category_id: 1, price: 800, is_available: true, image_url: '' },
      { item_id: 2, name: 'カプレーゼ', category_id: 1, price: 900, is_available: true, image_url: '' },
      { item_id: 3, name: 'ビーフステーキ', category_id: 2, price: 2800, is_available: true, image_url: '' },
      { item_id: 4, name: 'シーフードパスタ', category_id: 2, price: 1800, is_available: true, image_url: '' },
      { item_id: 5, name: 'フライドポテト', category_id: 3, price: 500, is_available: true, image_url: '' },
      { item_id: 6, name: 'チョコレートケーキ', category_id: 4, price: 700, is_available: false, image_url: '' },
      { item_id: 7, name: 'コーヒー', category_id: 5, price: 400, is_available: true, image_url: '' },
      { item_id: 8, name: 'オレンジジュース', category_id: 5, price: 500, is_available: true, image_url: '' }
    ];
    
    const categories = [
      { category_id: 1, name: '前菜' },
      { category_id: 2, name: 'メイン' },
      { category_id: 3, name: 'サイドメニュー' },
      { category_id: 4, name: 'デザート' },
      { category_id: 5, name: 'ドリンク' }
    ];
    
    menuItemsList.innerHTML = '';
    
    menuItems.forEach(item => {
      const category = categories.find(c => c.category_id === item.category_id);
      const categoryName = category ? category.name : '';
      const availabilityClass = item.is_available ? 'success' : 'danger';
      const availabilityText = item.is_available ? '提供中' : '完売';
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><img src="${item.image_url || 'img/no-image.png'}" alt="${item.name}" class="image-preview"></td>
        <td>${item.name}</td>
        <td>${categoryName}</td>
        <td>¥${item.price.toLocaleString()}</td>
        <td><span class="badge badge-${availabilityClass}">${availabilityText}</span></td>
        <td>
          <button class="btn btn-sm" onclick="editMenuItem(${item.item_id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${item.item_id})"><i class="fas fa-trash"></i></button>
        </td>
      `;
      menuItemsList.appendChild(row);
    });
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
    saveCategoryBtn.addEventListener('click', function() {
      const categoryForm = document.getElementById('category-form');
      if (!categoryForm.checkValidity()) {
        alert('必須項目を入力してください');
        return;
      }
      
      const categoryId = document.getElementById('category-id').value;
      const categoryName = document.getElementById('category-name').value;
      const displayOrder = document.getElementById('category-order').value;
      
      // APIを使用してデータを保存する代わりに、コンソールに出力
      console.log('カテゴリを保存:', {
        category_id: categoryId,
        name: categoryName,
        display_order: displayOrder
      });
      
      // モーダルを閉じて、カテゴリ一覧を再読み込み
      categoryModal.style.display = 'none';
      loadCategories();
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
      document.getElementById('menu-item-featured').checked = false;
      document.getElementById('menu-item-image-preview').innerHTML = '';
      menuItemModal.style.display = 'block';
    });
  }
  
  // メニュー保存ボタンのイベントリスナー
  if (saveMenuItemBtn) {
    saveMenuItemBtn.addEventListener('click', function() {
      const menuItemForm = document.getElementById('menu-item-form');
      if (!menuItemForm.checkValidity()) {
        alert('必須項目を入力してください');
        return;
      }
      
      const itemId = document.getElementById('menu-item-id').value;
      const itemName = document.getElementById('menu-item-name').value;
      const categoryId = document.getElementById('menu-item-category').value;
      const description = document.getElementById('menu-item-description').value;
      const price = document.getElementById('menu-item-price').value;
      const displayOrder = document.getElementById('menu-item-order').value;
      const isAvailable = document.getElementById('menu-item-available').checked;
      const isFeatured = document.getElementById('menu-item-featured').checked;
      
      // APIを使用してデータを保存する代わりに、コンソールに出力
      console.log('メニューを保存:', {
        item_id: itemId,
        name: itemName,
        category_id: categoryId,
        description: description,
        price: price,
        display_order: displayOrder,
        is_available: isAvailable,
        is_featured: isFeatured
      });
      
      // モーダルを閉じて、メニュー一覧を再読み込み
      menuItemModal.style.display = 'none';
      loadMenuItems();
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
  window.editCategory = function(categoryId) {
    // APIからデータを取得する代わりに、サンプルデータを使用
    const categories = [
      { category_id: 1, name: '前菜', display_order: 1 },
      { category_id: 2, name: 'メイン', display_order: 2 },
      { category_id: 3, name: 'サイドメニュー', display_order: 3 },
      { category_id: 4, name: 'デザート', display_order: 4 },
      { category_id: 5, name: 'ドリンク', display_order: 5 }
    ];
    
    const category = categories.find(c => c.category_id === categoryId);
    
    if (category) {
      document.getElementById('category-modal-title').textContent = 'カテゴリを編集';
      document.getElementById('category-id').value = category.category_id;
      document.getElementById('category-name').value = category.name;
      document.getElementById('category-order').value = category.display_order;
      categoryModal.style.display = 'block';
    }
  };
  
  // カテゴリ削除関数（グローバルスコープに定義）
  window.deleteCategory = function(categoryId) {
    if (confirm('このカテゴリを削除してもよろしいですか？関連するメニューアイテムも削除されます。')) {
      // APIを使用してデータを削除する代わりに、コンソールに出力
      console.log('カテゴリを削除:', categoryId);
      loadCategories();
      loadMenuItems();
    }
  };
  
  // メニュー編集関数（グローバルスコープに定義）
  window.editMenuItem = function(itemId) {
    // APIからデータを取得する代わりに、サンプルデータを使用
    const menuItems = [
      { item_id: 1, name: 'シーザーサラダ', category_id: 1, description: '新鮮なロメインレタスとクルトン、パルメザンチーズのクラシックなシーザーサラダ', price: 800, display_order: 1, is_available: true, is_featured: false, image_url: '' },
      { item_id: 2, name: 'カプレーゼ', category_id: 1, description: 'トマトとモッツァレラチーズのカプレーゼ', price: 900, display_order: 2, is_available: true, is_featured: false, image_url: '' },
      { item_id: 3, name: 'ビーフステーキ', category_id: 2, description: '厳選された牛肉の贅沢なステーキ', price: 2800, display_order: 1, is_available: true, is_featured: true, image_url: '' },
      { item_id: 4, name: 'シーフードパスタ', category_id: 2, description: '新鮮な魚介類をふんだんに使ったクリームパスタ', price: 1800, display_order: 2, is_available: true, is_featured: false, image_url: '' },
      { item_id: 5, name: 'フライドポテト', category_id: 3, description: 'カリッと揚げたポテトフライ', price: 500, display_order: 1, is_available: true, is_featured: false, image_url: '' },
      { item_id: 6, name: 'チョコレートケーキ', category_id: 4, description: '濃厚なチョコレートケーキ', price: 700, display_order: 1, is_available: false, is_featured: false, image_url: '' },
      { item_id: 7, name: 'コーヒー', category_id: 5, description: '香り高い挽きたてコーヒー', price: 400, display_order: 1, is_available: true, is_featured: false, image_url: '' },
      { item_id: 8, name: 'オレンジジュース', category_id: 5, description: '搾りたてのオレンジジュース', price: 500, display_order: 2, is_available: true, is_featured: false, image_url: '' }
    ];
    
    const item = menuItems.find(i => i.item_id === itemId);
    
    if (item) {
      document.getElementById('menu-item-modal-title').textContent = 'メニューを編集';
      document.getElementById('menu-item-id').value = item.item_id;
      document.getElementById('menu-item-name').value = item.name;
      document.getElementById('menu-item-category').value = item.category_id;
      document.getElementById('menu-item-description').value = item.description;
      document.getElementById('menu-item-price').value = item.price;
      document.getElementById('menu-item-order').value = item.display_order;
      document.getElementById('menu-item-available').checked = item.is_available;
      document.getElementById('menu-item-featured').checked = item.is_featured;
      
      const availabilityStatus = document.getElementById('availability-status');
      if (availabilityStatus) {
        availabilityStatus.textContent = item.is_available ? '提供中' : '完売';
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
  };
  
  // メニュー削除関数（グローバルスコープに定義）
  window.deleteMenuItem = function(itemId) {
    if (confirm('このメニューを削除してもよろしいですか？')) {
      // APIを使用してデータを削除する代わりに、コンソールに出力
      console.log('メニューを削除:', itemId);
      loadMenuItems();
    }
  };

  // 注文管理機能
  const orderStatusFilter = document.getElementById('order-status-filter');
  const ordersList = document.getElementById('orders-list');
  
  // 注文一覧を読み込む
  function loadOrders(status = 'all') {
    // APIからデータを取得する代わりに、サンプルデータを使用
    const orders = [
      { order_id: 1001, table_id: 2, table_number: 'A2', total_amount: 4500, status: 'pending', payment_status: 'unpaid', created_at: '2025-04-03T09:30:00' },
      { order_id: 1002, table_id: 5, table_number: 'B2', total_amount: 3200, status: 'processing', payment_status: 'unpaid', created_at: '2025-04-03T09:15:00' },
      { order_id: 1003, table_id: 1, table_number: 'A1', total_amount: 2800, status: 'completed', payment_status: 'paid', created_at: '2025-04-03T08:45:00' },
      { order_id: 1004, table_id: 3, table_number: 'A3', total_amount: 1500, status: 'cancelled', payment_status: 'refunded', created_at: '2025-04-03T08:30:00' }
    ];
    
    // ステータスでフィルタリング
    const filteredOrders = status === 'all' ? orders : orders.filter(order => order.status === status);
    
    ordersList.innerHTML = '';
    
    if (filteredOrders.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="7" class="text-center">注文データがありません</td>`;
      ordersList.appendChild(row);
      return;
    }
    
    filteredOrders.forEach(order => {
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
        'paid': '支払済',
        'refunded': '返金済'
      }[order.payment_status];
      
      const paymentStatusClass = {
        'unpaid': 'warning',
        'paid': 'success',
        'refunded': 'danger'
      }[order.payment_status];
      
      const orderDate = new Date(order.created_at);
      const formattedDate = orderDate.toLocaleString('ja-JP');
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${order.order_id}</td>
        <td>${order.table_number}</td>
        <td>¥${order.total_amount.toLocaleString()}</td>
        <td><span class="badge badge-${statusClass}">${statusText}</span></td>
        <td><span class="badge badge-${paymentStatusClass}">${paymentStatusText}</span></td>
        <td>${formattedDate}</td>
        <td>
          <button class="btn btn-sm" onclick="viewOrderDetails(${order.order_id})"><i class="fas fa-eye"></i></button>
          ${order.status !== 'completed' && order.status !== 'cancelled' ? `<button class="btn btn-sm btn-danger" onclick="cancelOrder(${order.order_id})"><i class="fas fa-times"></i></button>` : ''}
        </td>
      `;
      ordersList.appendChild(row);
    });
  }
  
  // 注文ステータスフィルターのイベントリスナー
  if (orderStatusFilter) {
    orderStatusFilter.addEventListener('change', function() {
      loadOrders(this.value);
    });
  }
  
  // 注文詳細表示関数（グローバルスコープに定義）
  window.viewOrderDetails = function(orderId) {
    // APIからデータを取得する代わりに、サンプルデータを使用
    const orders = [
      { order_id: 1001, table_id: 2, table_number: 'A2', total_amount: 4500, status: 'pending', payment_status: 'unpaid', created_at: '2025-04-03T09:30:00' },
      { order_id: 1002, table_id: 5, table_number: 'B2', total_amount: 3200, status: 'processing', payment_status: 'unpaid', created_at: '2025-04-03T09:15:00' },
      { order_id: 1003, table_id: 1, table_number: 'A1', total_amount: 2800, status: 'completed', payment_status: 'paid', created_at: '2025-04-03T08:45:00' },
      { order_id: 1004, table_id: 3, table_number: 'A3', total_amount: 1500, status: 'cancelled', payment_status: 'refunded', created_at: '2025-04-03T08:30:00' }
    ];
    
    const orderItems = [
      { order_id: 1001, item_id: 3, name: 'ビーフステーキ', quantity: 1, unit_price: 2800, status: 'pending' },
      { order_id: 1001, item_id: 5, name: 'フライドポテト', quantity: 2, unit_price: 500, status: 'pending' },
      { order_id: 1001, item_id: 7, name: 'コーヒー', quantity: 2, unit_price: 400, status: 'pending' },
      { order_id: 1002, item_id: 4, name: 'シーフードパスタ', quantity: 1, unit_price: 1800, status: 'preparing' },
      { order_id: 1002, item_id: 2, name: 'カプレーゼ', quantity: 1, unit_price: 900, status: 'ready' },
      { order_id: 1002, item_id: 8, name: 'オレンジジュース', quantity: 1, unit_price: 500, status: 'served' }
    ];
    
    const order = orders.find(o => o.order_id === orderId);
    const items = orderItems.filter(i => i.order_id === orderId);
    
    if (order) {
      const orderDetailModal = document.getElementById('order-detail-modal');
      
      // 注文情報を表示
      document.getElementById('order-id').textContent = order.order_id;
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
        'paid': '支払済',
        'refunded': '返金済'
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
        }[item.status];
        
        const statusClass = {
          'pending': 'warning',
          'preparing': 'warning',
          'ready': 'success',
          'served': 'success',
          'cancelled': 'danger'
        }[item.status];
        
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
      
      const taxRate = 0.1; // 10%
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
  };
  
  // 注文キャンセル関数（グローバルスコープに定義）
  window.cancelOrder = function(orderId) {
    if (confirm('この注文をキャンセルしてもよろしいですか？')) {
      // APIを使用してデータを更新する代わりに、コンソールに出力
      console.log('注文をキャンセル:', orderId);
      loadOrders(orderStatusFilter ? orderStatusFilter.value : 'all');
    }
  };
  
  // 注文キャンセルボタンのイベントリスナー
  const cancelOrderBtn = document.getElementById('cancel-order-btn');
  if (cancelOrderBtn) {
    cancelOrderBtn.addEventListener('click', function() {
      const orderId = document.getElementById('order-id').textContent;
      if (confirm('この注文をキャンセルしてもよろしいですか？')) {
        // APIを使用してデータを更新する代わりに、コンソールに出力
        console.log('注文をキャンセル:', orderId);
        
        // モーダルを閉じて、注文一覧を再読み込み
        document.getElementById('order-detail-modal').style.display = 'none';
        loadOrders(orderStatusFilter ? orderStatusFilter.value : 'all');
      }
    });
  }
  
  // 注文ステータス更新ボタンのイベントリスナー
  const updateOrderStatusBtn = document.getElementById('update-order-status-btn');
  if (updateOrderStatusBtn) {
    updateOrderStatusBtn.addEventListener('click', function() {
      const orderId = document.getElementById('order-id').textContent;
      const newStatus = prompt('新しいステータスを選択してください（pending, processing, completed, cancelled）:');
      
      if (newStatus && ['pending', 'processing', 'completed', 'cancelled'].includes(newStatus)) {
        // APIを使用してデータを更新する代わりに、コンソールに出力
        console.log('注文ステータスを更新:', orderId, newStatus);
        
        // モーダルを閉じて、注文一覧を再読み込み
        document.getElementById('order-detail-modal').style.display = 'none';
        loadOrders(orderStatusFilter ? orderStatusFilter.value : 'all');
      } else if (newStatus) {
        alert('無効なステータスです。pending, processing, completed, cancelledのいずれかを入力してください。');
      }
    });
  }
  
  // 注文完了ボタンのイベントリスナー
  const completeOrderBtn = document.getElementById('complete-order-btn');
  if (completeOrderBtn) {
    completeOrderBtn.addEventListener('click', function() {
      const orderId = document.getElementById('order-id').textContent;
      if (confirm('この注文を完了としてマークしますか？')) {
        // APIを使用してデータを更新する代わりに、コンソールに出力
        console.log('注文を完了:', orderId);
        
        // モーダルを閉じて、注文一覧を再読み込み
        document.getElementById('order-detail-modal').style.display = 'none';
        loadOrders(orderStatusFilter ? orderStatusFilter.value : 'all');
      }
    });
  }

  // QRコードスキャナー機能
  const startScannerBtn = document.getElementById('start-scanner-btn');
  const stopScannerBtn = document.getElementById('stop-scanner-btn');
  const scanResult = document.getElementById('scan-result');
  
  // QRコードスキャナー開始ボタンのイベントリスナー
  if (startScannerBtn) {
    startScannerBtn.addEventListener('click', function() {
      // 実際のQRコードスキャナーの代わりに、シミュレーションを使用
      startScannerBtn.style.display = 'none';
      stopScannerBtn.style.display = 'inline-block';
      
      scanResult.innerHTML = '<div class="alert alert-info">スキャン中...</div>';
      
      // 3秒後にQRコードをスキャンしたと仮定
      setTimeout(function() {
        const tableId = Math.floor(Math.random() * 6) + 1;
        const tableNumber = ['A1', 'A2', 'A3', 'B1', 'B2', 'C1'][tableId - 1];
        
        scanResult.innerHTML = `
          <div class="alert alert-success">
            <p><strong>スキャン成功!</strong></p>
            <p>テーブル: ${tableNumber}</p>
            <p>テーブルID: ${tableId}</p>
          </div>
          <div class="mt-3">
            <button class="btn" onclick="viewTableOrders(${tableId})">注文を表示</button>
            <button class="btn btn-success" onclick="processPayment(${tableId})">支払い処理</button>
          </div>
        `;
        
        stopScannerBtn.click();
      }, 3000);
    });
  }
  
  // QRコードスキャナー停止ボタンのイベントリスナー
  if (stopScannerBtn) {
    stopScannerBtn.addEventListener('click', function() {
      startScannerBtn.style.display = 'inline-block';
      stopScannerBtn.style.display = 'none';
    });
  }
  
  // テーブル注文表示関数（グローバルスコープに定義）
  window.viewTableOrders = function(tableId) {
    // APIからデータを取得する代わりに、サンプルデータを使用
    const orders = [
      { order_id: 1001, table_id: 2, table_number: 'A2', total_amount: 4500, status: 'pending', payment_status: 'unpaid', created_at: '2025-04-03T09:30:00' },
      { order_id: 1002, table_id: 5, table_number: 'B2', total_amount: 3200, status: 'processing', payment_status: 'unpaid', created_at: '2025-04-03T09:15:00' }
    ];
    
    const tableOrders = orders.filter(o => o.table_id === tableId);
    
    if (tableOrders.length > 0) {
      scanResult.innerHTML = `
        <div class="alert alert-info">
          <p><strong>テーブル ${tableOrders[0].table_number} の注文:</strong></p>
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
                  'paid': '支払済',
                  'refunded': '返金済'
                }[order.payment_status];
                
                const paymentStatusClass = {
                  'unpaid': 'warning',
                  'paid': 'success',
                  'refunded': 'danger'
                }[order.payment_status];
                
                const orderDate = new Date(order.created_at);
                const formattedDate = orderDate.toLocaleString('ja-JP');
                
                return `
                  <tr>
                    <td>${order.order_id}</td>
                    <td>¥${order.total_amount.toLocaleString()}</td>
                    <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                    <td><span class="badge badge-${paymentStatusClass}">${paymentStatusText}</span></td>
                    <td>${formattedDate}</td>
                    <td>
                      <button class="btn btn-sm" onclick="viewOrderDetails(${order.order_id})"><i class="fas fa-eye"></i></button>
                      <button class="btn btn-sm btn-success" onclick="processPayment(${tableId}, ${order.order_id})"><i class="fas fa-cash-register"></i></button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="mt-3">
          <button class="btn" onclick="startScannerBtn.click()">新しいQRコードをスキャン</button>
        </div>
      `;
    } else {
      scanResult.innerHTML = `
        <div class="alert alert-warning">
          <p>このテーブルの注文は見つかりませんでした。</p>
        </div>
        <div class="mt-3">
          <button class="btn" onclick="startScannerBtn.click()">新しいQRコードをスキャン</button>
        </div>
      `;
    }
  };
  
  // 支払い処理関数（グローバルスコープに定義）
  window.processPayment = function(tableId, orderId) {
    // 特定の注文IDが指定されていない場合、テーブルの全ての注文を処理
    const message = orderId 
      ? `注文 #${orderId} の支払いを処理しますか？` 
      : `テーブル ${['A1', 'A2', 'A3', 'B1', 'B2', 'C1'][tableId - 1]} の全ての注文の支払いを処理しますか？`;
    
    if (confirm(message)) {
      // 支払い処理のシミュレーション
      scanResult.innerHTML = `
        <div class="alert alert-info">
          <p>支払い処理中...</p>
        </div>
      `;
      
      setTimeout(function() {
        // バーコード生成
        const barcodeValue = `PAY${Date.now()}`;
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
        JsBarcode('#payment-barcode', barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 100,
          displayValue: true
        });
        
        // 支払い完了ボタンを追加
        const completePaymentBtn = document.createElement('button');
        completePaymentBtn.className = 'btn btn-success mt-3';
        completePaymentBtn.textContent = '支払い完了';
        completePaymentBtn.addEventListener('click', function() {
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
        });
        
        scanResult.appendChild(completePaymentBtn);
      }, 2000);
    }
  };

  // 設定保存機能
  const settingsForm = document.getElementById('settings-form');
  
  if (settingsForm) {
    settingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const restaurantName = document.getElementById('restaurant-name').value;
      const taxRate = document.getElementById('tax-rate').value;
      const serviceCharge = document.getElementById('service-charge').value;
      const autoAcceptOrders = document.getElementById('auto-accept-orders').checked;
      
      // APIを使用してデータを保存する代わりに、コンソールに出力
      console.log('設定を保存:', {
        restaurant_name: restaurantName,
        tax_rate: taxRate,
        service_charge: serviceCharge,
        auto_accept_orders: autoAcceptOrders
      });
      
      alert('設定が保存されました');
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
