// モックデータベース接続用のスクリプト
// 静的デモ用に実際のデータベース接続の代わりにローカルストレージを使用

class MockDatabase {
  constructor() {
    this.storage = window.localStorage;
    this.initializeData();
  }

  // 初期データの設定
  initializeData() {
    // テーブル情報がなければ初期化
    if (!this.storage.getItem('tables')) {
      const initialTables = [
        { id: 1, tableNumber: 'A1', capacity: 4, status: 'available' },
        { id: 2, tableNumber: 'A2', capacity: 4, status: 'occupied' },
        { id: 3, tableNumber: 'A3', capacity: 2, status: 'payment_requested' },
        { id: 4, tableNumber: 'B1', capacity: 6, status: 'payment_completed' },
        { id: 5, tableNumber: 'B2', capacity: 8, status: 'cleaning' },
        { id: 6, tableNumber: 'C1', capacity: 2, status: 'available' }
      ];
      this.storage.setItem('tables', JSON.stringify(initialTables));
    }

    // メニューカテゴリがなければ初期化
    if (!this.storage.getItem('categories')) {
      const initialCategories = [
        { id: 1, name: '期間限定・極みネタ', order: 1 },
        { id: 2, name: 'にぎり', order: 2 },
        { id: 3, name: '裏巻き・軍艦', order: 3 },
        { id: 4, name: 'サイドメニュー', order: 4 },
        { id: 5, name: 'ドリンク', order: 5 }
      ];
      this.storage.setItem('categories', JSON.stringify(initialCategories));
    }

    // メニュー商品がなければ初期化
    if (!this.storage.getItem('menuItems')) {
      const initialMenuItems = [
        { 
          id: 1, 
          categoryId: 1, 
          name: '富山県産 白えび', 
          description: '富山湾の宝石と呼ばれる高級食材', 
          price: 330, 
          imageUrl: 'https://via.placeholder.com/150?text=白えび', 
          isSoldOut: false,
          order: 1
        },
        { 
          id: 2, 
          categoryId: 1, 
          name: '肩ロースハム 生ハムマルマヨ', 
          description: '生ハムとマヨネーズの絶妙な組み合わせ', 
          price: 220, 
          imageUrl: 'https://via.placeholder.com/150?text=生ハム', 
          isSoldOut: false,
          order: 2
        },
        { 
          id: 3, 
          categoryId: 2, 
          name: 'サーモン', 
          description: '脂がのった新鮮なサーモン', 
          price: 180, 
          imageUrl: 'https://via.placeholder.com/150?text=サーモン', 
          isSoldOut: false,
          order: 1
        },
        { 
          id: 4, 
          categoryId: 2, 
          name: 'マグロ', 
          description: '赤身の旨味が詰まった上質なマグロ', 
          price: 250, 
          imageUrl: 'https://via.placeholder.com/150?text=マグロ', 
          isSoldOut: false,
          order: 2
        },
        { 
          id: 5, 
          categoryId: 3, 
          name: 'カリフォルニアロール', 
          description: 'アボカドとカニカマの定番ロール', 
          price: 280, 
          imageUrl: 'https://via.placeholder.com/150?text=カリフォルニアロール', 
          isSoldOut: false,
          order: 1
        },
        { 
          id: 6, 
          categoryId: 4, 
          name: 'あさりの味噌汁', 
          description: 'あさりの旨味がたっぷり', 
          price: 150, 
          imageUrl: 'https://via.placeholder.com/150?text=味噌汁', 
          isSoldOut: false,
          order: 1
        },
        { 
          id: 7, 
          categoryId: 5, 
          name: '緑茶', 
          description: '香り高い日本茶', 
          price: 100, 
          imageUrl: 'https://via.placeholder.com/150?text=緑茶', 
          isSoldOut: false,
          order: 1
        },
        { 
          id: 8, 
          categoryId: 5, 
          name: 'ウーロン茶', 
          description: '香ばしい風味のウーロン茶', 
          price: 100, 
          imageUrl: 'https://via.placeholder.com/150?text=ウーロン茶', 
          isSoldOut: true,
          order: 2
        }
      ];
      this.storage.setItem('menuItems', JSON.stringify(initialMenuItems));
    }

    // 注文情報がなければ初期化
    if (!this.storage.getItem('orders')) {
      const initialOrders = [
        {
          id: 1001,
          tableId: 2,
          items: [
            { itemId: 1, name: '富山県産 白えび', quantity: 2, unitPrice: 330 },
            { itemId: 3, name: 'サーモン', quantity: 3, unitPrice: 180 }
          ],
          totalAmount: 1200,
          status: 'pending',
          paymentStatus: 'unpaid',
          createdAt: new Date(Date.now() - 3600000).toISOString() // 1時間前
        },
        {
          id: 1002,
          tableId: 3,
          items: [
            { itemId: 2, name: '肩ロースハム 生ハムマルマヨ', quantity: 1, unitPrice: 220 },
            { itemId: 4, name: 'マグロ', quantity: 2, unitPrice: 250 },
            { itemId: 7, name: '緑茶', quantity: 2, unitPrice: 100 }
          ],
          totalAmount: 920,
          status: 'pending',
          paymentStatus: 'requested',
          createdAt: new Date(Date.now() - 1800000).toISOString() // 30分前
        },
        {
          id: 1003,
          tableId: 4,
          items: [
            { itemId: 5, name: 'カリフォルニアロール', quantity: 2, unitPrice: 280 },
            { itemId: 6, name: 'あさりの味噌汁', quantity: 1, unitPrice: 150 }
          ],
          totalAmount: 710,
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2時間前
          completedAt: new Date(Date.now() - 5400000).toISOString() // 1.5時間前
        }
      ];
      this.storage.setItem('orders', JSON.stringify(initialOrders));
    }
  }

  // テーブル関連のメソッド
  getTables() {
    return JSON.parse(this.storage.getItem('tables') || '[]');
  }

  getTableById(id) {
    const tables = this.getTables();
    return tables.find(table => table.id === id);
  }

  updateTable(tableData) {
    const tables = this.getTables();
    const index = tables.findIndex(table => table.id === tableData.id);
    
    if (index !== -1) {
      tables[index] = { ...tables[index], ...tableData };
      this.storage.setItem('tables', JSON.stringify(tables));
      return tables[index];
    }
    
    return null;
  }

  addTable(tableData) {
    const tables = this.getTables();
    const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    
    const newTable = {
      id: newId,
      ...tableData,
      status: 'available'
    };
    
    tables.push(newTable);
    this.storage.setItem('tables', JSON.stringify(tables));
    
    return newTable;
  }

  deleteTable(id) {
    const tables = this.getTables();
    const filteredTables = tables.filter(table => table.id !== id);
    
    if (filteredTables.length < tables.length) {
      this.storage.setItem('tables', JSON.stringify(filteredTables));
      return true;
    }
    
    return false;
  }

  // メニューカテゴリ関連のメソッド
  getCategories() {
    return JSON.parse(this.storage.getItem('categories') || '[]');
  }

  getCategoryById(id) {
    const categories = this.getCategories();
    return categories.find(category => category.id === id);
  }

  addCategory(categoryData) {
    const categories = this.getCategories();
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    
    const newCategory = {
      id: newId,
      ...categoryData
    };
    
    categories.push(newCategory);
    this.storage.setItem('categories', JSON.stringify(categories));
    
    return newCategory;
  }

  updateCategory(categoryData) {
    const categories = this.getCategories();
    const index = categories.findIndex(category => category.id === categoryData.id);
    
    if (index !== -1) {
      categories[index] = { ...categories[index], ...categoryData };
      this.storage.setItem('categories', JSON.stringify(categories));
      return categories[index];
    }
    
    return null;
  }

  deleteCategory(id) {
    const categories = this.getCategories();
    const filteredCategories = categories.filter(category => category.id !== id);
    
    if (filteredCategories.length < categories.length) {
      this.storage.setItem('categories', JSON.stringify(filteredCategories));
      return true;
    }
    
    return false;
  }

  // メニュー商品関連のメソッド
  getMenuItems() {
    return JSON.parse(this.storage.getItem('menuItems') || '[]');
  }

  getMenuItemById(id) {
    const menuItems = this.getMenuItems();
    return menuItems.find(item => item.id === id);
  }

  getMenuItemsByCategory(categoryId) {
    const menuItems = this.getMenuItems();
    return menuItems.filter(item => item.categoryId === categoryId);
  }

  addMenuItem(itemData) {
    const menuItems = this.getMenuItems();
    const newId = menuItems.length > 0 ? Math.max(...menuItems.map(i => i.id)) + 1 : 1;
    
    const newItem = {
      id: newId,
      ...itemData,
      isSoldOut: false
    };
    
    menuItems.push(newItem);
    this.storage.setItem('menuItems', JSON.stringify(menuItems));
    
    return newItem;
  }

  updateMenuItem(itemData) {
    const menuItems = this.getMenuItems();
    const index = menuItems.findIndex(item => item.id === itemData.id);
    
    if (index !== -1) {
      menuItems[index] = { ...menuItems[index], ...itemData };
      this.storage.setItem('menuItems', JSON.stringify(menuItems));
      return menuItems[index];
    }
    
    return null;
  }

  deleteMenuItem(id) {
    const menuItems = this.getMenuItems();
    const filteredItems = menuItems.filter(item => item.id !== id);
    
    if (filteredItems.length < menuItems.length) {
      this.storage.setItem('menuItems', JSON.stringify(filteredItems));
      return true;
    }
    
    return false;
  }

  toggleSoldOutStatus(id) {
    const menuItems = this.getMenuItems();
    const index = menuItems.findIndex(item => item.id === id);
    
    if (index !== -1) {
      menuItems[index].isSoldOut = !menuItems[index].isSoldOut;
      this.storage.setItem('menuItems', JSON.stringify(menuItems));
      return menuItems[index];
    }
    
    return null;
  }

  // 注文関連のメソッド
  getOrders() {
    return JSON.parse(this.storage.getItem('orders') || '[]');
  }

  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find(order => order.id === id);
  }

  getOrdersByTable(tableId) {
    const orders = this.getOrders();
    return orders.filter(order => order.tableId === tableId);
  }

  addOrder(orderData) {
    const orders = this.getOrders();
    const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;
    
    const newOrder = {
      id: newId,
      ...orderData,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    this.storage.setItem('orders', JSON.stringify(orders));
    
    return newOrder;
  }

  updateOrder(orderData) {
    const orders = this.getOrders();
    const index = orders.findIndex(order => order.id === orderData.id);
    
    if (index !== -1) {
      orders[index] = { ...orders[index], ...orderData };
      this.storage.setItem('orders', JSON.stringify(orders));
      return orders[index];
    }
    
    return null;
  }

  updateOrderPaymentStatus(id, paymentStatus) {
    const orders = this.getOrders();
    const index = orders.findIndex(order => order.id === id);
    
    if (index !== -1) {
      orders[index].paymentStatus = paymentStatus;
      
      if (paymentStatus === 'paid') {
        orders[index].status = 'completed';
        orders[index].completedAt = new Date().toISOString();
      }
      
      this.storage.setItem('orders', JSON.stringify(orders));
      return orders[index];
    }
    
    return null;
  }

  // テーブル状態管理関連のメソッド
  updateTableStatus(id, status) {
    const tables = this.getTables();
    const index = tables.findIndex(table => table.id === id);
    
    if (index !== -1) {
      tables[index].status = status;
      tables[index].updatedAt = new Date().toISOString();
      
      this.storage.setItem('tables', JSON.stringify(tables));
      return tables[index];
    }
    
    return null;
  }

  getAvailableTables() {
    const tables = this.getTables();
    return tables.filter(table => table.status === 'available');
  }

  getTablesNeedingCleaning() {
    const tables = this.getTables();
    return tables.filter(table => table.status === 'payment_completed');
  }
}

// グローバルインスタンスを作成
window.db = new MockDatabase();
