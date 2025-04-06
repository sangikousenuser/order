// お客様画面用JavaScript
document.addEventListener('DOMContentLoaded', function() {
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
        break;
      case 'call':
        headerTitle.textContent = 'スタッフ呼び出し';
        backButton.style.display = 'block';
        break;
      case 'payment':
        headerTitle.textContent = 'お会計';
        backButton.style.display = 'block';
        break;
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

  // カテゴリタブ切り替え
  const categoryTabs = document.querySelectorAll('.category-tab');
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      categoryTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      headerTitle.textContent = this.textContent;
      
      // ここでカテゴリに応じたメニューアイテムを読み込む処理を実装
      // 今回はデモのため省略
    });
  });

  // サブカテゴリタブ切り替え
  const subcategoryTabs = document.querySelectorAll('.subcategory-tab');
  subcategoryTabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      subcategoryTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // ここでサブカテゴリに応じたメニューアイテムを読み込む処理を実装
      // 今回はデモのため省略
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

  // 商品詳細モーダル
  const menuItems = document.querySelectorAll('.menu-item');
  const itemDetailModal = document.getElementById('item-detail-modal');
  const detailImage = document.getElementById('detail-image');
  const detailName = document.getElementById('detail-name');
  const detailDescription = document.getElementById('detail-description');
  const detailPrice = document.getElementById('detail-price');
  const quantityValue = document.getElementById('quantity-value');
  const decreaseQuantityBtn = document.getElementById('decrease-quantity');
  const increaseQuantityBtn = document.getElementById('increase-quantity');
  const addToCartButton = document.getElementById('add-to-cart-button');
  
  let currentItemId = null;
  
  // メニューアイテムのクリックイベント
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      // 完売商品はクリックできないようにする
      if (this.querySelector('.menu-item-sold-out')) {
        showNotification('申し訳ありません。この商品は完売しました。');
        return;
      }
      
      currentItemId = this.getAttribute('data-item-id');
      const image = this.querySelector('.menu-item-image').src;
      const name = this.querySelector('.menu-item-name').textContent;
      const description = this.querySelector('.menu-item-description').textContent;
      const price = this.querySelector('.menu-item-price').textContent;
      
      detailImage.src = image;
      detailImage.alt = name;
      detailName.textContent = name;
      detailDescription.textContent = description;
      detailPrice.textContent = price;
      quantityValue.textContent = '1';
      
      itemDetailModal.style.display = 'block';
    });
  });
  
  // 数量減少ボタンのクリックイベント
  decreaseQuantityBtn.addEventListener('click', function() {
    let quantity = parseInt(quantityValue.textContent);
    if (quantity > 1) {
      quantity--;
      quantityValue.textContent = quantity;
    }
  });
  
  // 数量増加ボタンのクリックイベント
  increaseQuantityBtn.addEventListener('click', function() {
    let quantity = parseInt(quantityValue.textContent);
    if (quantity < 10) {
      quantity++;
      quantityValue.textContent = quantity;
    }
  });
  
  // カート機能
  const cartItems = [];
  const cartSummary = document.getElementById('cart-summary');
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total');
  const cartList = document.getElementById('cart-list');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartTax = document.getElementById('cart-tax');
  const cartModalTotal = document.getElementById('cart-modal-total');
  const cartModal = document.getElementById('cart-modal');
  const proceedToOrderBtn = document.getElementById('proceed-to-order');
  
  // カートに商品を追加する関数
  function addToCart(itemId, name, price, quantity) {
    // 価格から数値を抽出（"¥ 330(税込)" → 330）
    const priceValue = parseInt(price.replace(/[^0-9]/g, ''));
    
    // 既存のアイテムを検索
    const existingItemIndex = cartItems.findIndex(item => item.id === itemId);
    
    if (existingItemIndex !== -1) {
      // 既存のアイテムの数量を更新
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      // 新しいアイテムを追加
      cartItems.push({
        id: itemId,
        name: name,
        price: priceValue,
        quantity: quantity
      });
    }
    
    updateCartSummary();
    showNotification(`${name} を ${quantity}点カートに追加しました`);
  }
  
  // カートサマリーを更新する関数
  function updateCartSummary() {
    let totalItems = 0;
    let totalPrice = 0;
    
    cartItems.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.price * item.quantity;
    });
    
    cartCount.textContent = totalItems;
    cartTotal.textContent = totalPrice.toLocaleString();
    
    if (totalItems > 0) {
      cartSummary.style.display = 'flex';
    } else {
      cartSummary.style.display = 'none';
    }
    
    // カートモーダルの内容も更新
    updateCartModal();
  }
  
  // カートモーダルの内容を更新する関数
  function updateCartModal() {
    cartList.innerHTML = '';
    
    if (cartItems.length === 0) {
      cartList.innerHTML = '<p>カートに商品がありません</p>';
      proceedToOrderBtn.disabled = true;
    } else {
      proceedToOrderBtn.disabled = false;
      
      let subtotal = 0;
      
      cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">¥${item.price.toLocaleString()} × ${item.quantity}</div>
          </div>
          <div class="cart-item-quantity">
            <div>¥${itemTotal.toLocaleString()}</div>
            <div class="cart-item-remove" data-item-id="${item.id}"><i class="fas fa-trash"></i></div>
          </div>
        `;
        cartList.appendChild(cartItemElement);
        
        // 削除ボタンのイベントリスナー
        const removeBtn = cartItemElement.querySelector('.cart-item-remove');
        removeBtn.addEventListener('click', function() {
          const itemId = this.getAttribute('data-item-id');
          removeFromCart(itemId);
        });
      });
      
      // 小計、税金、合計を計算して表示
      const taxRate = 0.1; // 10%
      const tax = Math.round(subtotal * taxRate);
      const total = subtotal + tax;
      
      cartSubtotal.textContent = subtotal.toLocaleString();
      cartTax.textContent = tax.toLocaleString();
      cartModalTotal.textContent = total.toLocaleString();
    }
  }
  
  // カートから商品を削除する関数
  function removeFromCart(itemId) {
    const index = cartItems.findIndex(item => item.id === itemId);
    
    if (index !== -1) {
      const item = cartItems[index];
      showNotification(`${item.name} をカートから削除しました`);
      cartItems.splice(index, 1);
      updateCartSummary();
    }
  }
  
  // カートに追加ボタンのクリックイベント
  addToCartButton.addEventListener('click', function() {
    const name = detailName.textContent;
    const price = detailPrice.textContent;
    const quantity = parseInt(quantityValue.textContent);
    
    addToCart(currentItemId, name, price, quantity);
    itemDetailModal.style.display = 'none';
  });
  
  // カートサマリーのクリックイベント
  cartSummary.addEventListener('click', function() {
    updateCartModal();
    cartModal.style.display = 'block';
  });
  
  // 注文確認モーダル
  const orderConfirmationModal = document.getElementById('order-confirmation-modal');
  const orderConfirmationItems = document.getElementById('order-confirmation-items');
  const orderConfirmationTotal = document.getElementById('order-confirmation-total');
  const confirmOrderButton = document.getElementById('confirm-order-button');
  
  // 注文確認モーダルを表示する関数
  function showOrderConfirmation() {
    orderConfirmationItems.innerHTML = '';
    
    let total = 0;
    
    cartItems.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      
      const orderItemElement = document.createElement('div');
      orderItemElement.className = 'order-confirmation-item';
      orderItemElement.innerHTML = `
        <div>${item.name} × ${item.quantity}</div>
        <div>¥${itemTotal.toLocaleString()}</div>
      `;
      orderConfirmationItems.appendChild(orderItemElement);
    });
    
    // 税金を含めた合計を計算
    const taxRate = 0.1; // 10%
    const tax = Math.round(total * taxRate);
    const grandTotal = total + tax;
    
    // 税金の行を追加
    const taxElement = document.createElement('div');
    taxElement.className = 'order-confirmation-item';
    taxElement.innerHTML = `
      <div>消費税 (10%)</div>
      <div>¥${tax.toLocaleString()}</div>
    `;
    orderConfirmationItems.appendChild(taxElement);
    
    orderConfirmationTotal.textContent = grandTotal.toLocaleString();
    orderConfirmationModal.style.display = 'block';
  }
  
  // 注文するボタンのクリックイベント
  proceedToOrderBtn.addEventListener('click', function() {
    cartModal.style.display = 'none';
    showOrderConfirmation();
  });
  
  // 注文確定ボタンのクリックイベント
  confirmOrderButton.addEventListener('click', function() {
    // 注文処理（APIリクエストなど）をここに実装
    // 今回はデモのため省略
    
    showNotification('ご注文ありがとうございます！');
    orderConfirmationModal.style.display = 'none';
    
    // カートをクリア
    cartItems.length = 0;
    updateCartSummary();
    
    // 注文履歴ページに遷移
    showPage('history');
  });

  // 呼び出し機能
  const callButtons = document.querySelectorAll('.call-button');
  const callConfirmationModal = document.getElementById('call-confirmation-modal');
  const callConfirmationMessage = document.getElementById('call-confirmation-message');
  const confirmCallButton = document.getElementById('confirm-call-button');
  
  let currentCallType = '';
  
  // 呼び出しボタンのクリックイベント
  callButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      currentCallType = this.id;
      let message = '';
      
      switch(currentCallType) {
        case 'call-staff':
          message = 'スタッフを呼び出しますか？';
          break;
        case 'call-water':
          message = 'お水をお願いしますか？';
          break;
        case 'call-condiments':
          message = '調味料をお願いしますか？';
          break;
        case 'call-chopsticks':
          message = 'お箸・スプーンをお願いしますか？';
          break;
      }
      
      callConfirmationMessage.textContent = message;
      callConfirmationModal.style.display = 'block';
    });
  });
  
  // 呼び出し確定ボタンのクリックイベント
  confirmCallButton.addEventListener('click', function() {
    // 呼び出し処理（APIリクエストなど）をここに実装
    // 今回はデモのため省略
    
    let message = '';
    
    switch(currentCallType) {
      case 'call-staff':
        message = 'スタッフを呼び出しました';
        break;
      case 'call-water':
        message = 'お水をお願いしました';
        break;
      case 'call-condiments':
        message = '調味料をお願いしました';
        break;
      case 'call-chopsticks':
        message = 'お箸・スプーンをお願いしました';
        break;
    }
    
    showNotification(message);
    callConfirmationModal.style.display = 'none';
  });

  // 会計機能
  const paymentMethods = document.querySelectorAll('.payment-method');
  const paymentBarcodeContainer = document.getElementById('payment-barcode-container');
  const paymentBarcodeSvg = document.getElementById('payment-barcode-svg');
  
  // 支払い方法ボタンのクリックイベント
  paymentMethods.forEach(method => {
    method.addEventListener('click', function() {
      // 支払い処理（APIリクエストなど）をここに実装
      // 今回はデモのため省略
      
      // バーコード生成
      const barcodeValue = `PAY${Date.now()}`;
      JsBarcode(paymentBarcodeSvg, barcodeValue, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true
      });
      
      paymentBarcodeContainer.style.display = 'block';
      
      // 支払い方法ボタンを非表示
      paymentMethods.forEach(m => {
        m.style.display = 'none';
      });
      
      showNotification('お支払いバーコードを生成しました');
    });
  });

  // 通知機能
  const notification = document.getElementById('notification');
  
  // 通知を表示する関数
  function showNotification(message) {
    notification.textContent = message;
    notification.style.display = 'block';
    
    // 3秒後に非表示
    setTimeout(function() {
      notification.style.display = 'none';
    }, 3000);
  }

  // 初期表示
  showPage('menu');
});
