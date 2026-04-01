(async () => {
  const CART_STORAGE_KEY = 'mitten-makes-cart-v1';
  const cartRoot = document.getElementById('online-checkout');
  if (!cartRoot) return;

  const response = await fetch('checkout-products.json?v=20260401a');
  if (!response.ok) return;

  const checkoutConfig = await response.json();
  const products = new Map(checkoutConfig.products.map(product => [product.id, product]));
  const minimumSubtotalCents = checkoutConfig.minimumSubtotalCents;
  const shippingCents = checkoutConfig.shippingCents;

  const cartList = document.getElementById('checkout-cart-items');
  const emptyState = document.getElementById('checkout-cart-empty');
  const subtotalValue = document.getElementById('checkout-subtotal');
  const shippingValue = document.getElementById('checkout-shipping');
  const totalValue = document.getElementById('checkout-total');
  const minimumNote = document.getElementById('checkout-minimum-note');
  const checkoutButton = document.getElementById('checkout-button');
  const checkoutMessage = document.getElementById('checkout-message');
  const cartCount = document.getElementById('checkout-cart-count');
  const featuredActions = document.querySelector('.featured-gift-copy .order-actions');

  const formatCurrency = cents =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  const readCart = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(item => products.has(item.id) && item.quantity > 0) : [];
    } catch {
      return [];
    }
  };

  const saveCart = cart => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  };

  let cart = readCart();

  const getFulfillmentMethod = () =>
    document.querySelector('input[name="checkout-fulfillment"]:checked')?.value || 'pickup';

  const getSubtotal = () =>
    cart.reduce((sum, item) => {
      const product = products.get(item.id);
      return product ? sum + (product.priceCents * item.quantity) : sum;
    }, 0);

  const syncCardButtons = () => {
    products.forEach((product, productId) => {
      const card = document.getElementById(productId);
      const actions = card?.querySelector('.product-card-actions');
      if (!card || !actions || actions.querySelector('.btn-add-to-cart')) return;

      const cartButton = document.createElement('button');
      cartButton.type = 'button';
      cartButton.className = 'btn btn-primary btn-add-to-cart';
      cartButton.textContent = 'Add to cart';
      cartButton.addEventListener('click', () => {
        addToCart(productId);
        cartRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      const cardNote = document.createElement('p');
      cardNote.className = 'product-checkout-note';
      cardNote.textContent = `${product.priceLabel} online for the standard ready-to-order version.`;
      actions.prepend(cartButton);
      actions.before(cardNote);
    });
  };

  const syncFeaturedButton = () => {
    if (!featuredActions || featuredActions.querySelector('.btn-add-to-cart')) return;
    const productId = 'dual-color-star-fidget';
    if (!products.has(productId)) return;

    const cartButton = document.createElement('button');
    cartButton.type = 'button';
    cartButton.className = 'btn btn-primary btn-add-to-cart';
    cartButton.textContent = 'Add to cart';
    cartButton.addEventListener('click', () => {
      addToCart(productId);
      cartRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const requestButton = featuredActions.querySelector('.btn.btn-primary') || featuredActions.querySelector('.btn');
    if (requestButton) {
      requestButton.classList.remove('btn-primary');
      requestButton.classList.add('btn-secondary');
    }

    featuredActions.prepend(cartButton);
  };

  const addToCart = productId => {
    const existing = cart.find(item => item.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: productId, quantity: 1 });
    }
    saveCart(cart);
    renderCart();
  };

  const updateQuantity = (productId, delta) => {
    cart = cart
      .map(item => item.id === productId ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0);
    saveCart(cart);
    renderCart();
  };

  const removeFromCart = productId => {
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    renderCart();
  };

  const renderCart = () => {
    const subtotal = getSubtotal();
    const fulfillmentMethod = getFulfillmentMethod();
    const shippingAmount = fulfillmentMethod === 'shipping' ? shippingCents : 0;
    const total = subtotal + shippingAmount;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const meetsMinimum = subtotal >= minimumSubtotalCents;

    cartCount.textContent = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
    subtotalValue.textContent = formatCurrency(subtotal);
    shippingValue.textContent = shippingAmount ? formatCurrency(shippingAmount) : 'Free';
    totalValue.textContent = formatCurrency(total);

    minimumNote.textContent = meetsMinimum
      ? `Your ready-to-order subtotal qualifies for online checkout. ${fulfillmentMethod === 'shipping' ? 'Shipping is a flat $9.97.' : 'Local pickup stays free.'}`
      : `Online checkout starts at ${formatCurrency(minimumSubtotalCents)} in ready-to-order items before shipping.`;

    checkoutButton.disabled = !cart.length || !meetsMinimum;

    emptyState.hidden = cart.length > 0;
    cartList.hidden = cart.length === 0;
    cartList.innerHTML = '';

    cart.forEach(item => {
      const product = products.get(item.id);
      if (!product) return;

      const lineItem = document.createElement('li');
      lineItem.className = 'checkout-cart-item';
      lineItem.innerHTML = `
        <div class="checkout-cart-item-copy">
          <strong>${product.name}</strong>
          <span>${product.priceLabel} each</span>
        </div>
        <div class="checkout-cart-item-controls">
          <button type="button" class="cart-qty-button" aria-label="Remove one ${product.name}">−</button>
          <span class="cart-qty-value">${item.quantity}</span>
          <button type="button" class="cart-qty-button" aria-label="Add one ${product.name}">+</button>
          <button type="button" class="cart-remove-button" aria-label="Remove ${product.name} from cart">Remove</button>
        </div>
      `;

      const [decreaseButton, increaseButton] = lineItem.querySelectorAll('.cart-qty-button');
      const removeButton = lineItem.querySelector('.cart-remove-button');

      decreaseButton.addEventListener('click', () => updateQuantity(item.id, -1));
      increaseButton.addEventListener('click', () => updateQuantity(item.id, 1));
      removeButton.addEventListener('click', () => removeFromCart(item.id));

      cartList.appendChild(lineItem);
    });
  };

  document.querySelectorAll('input[name="checkout-fulfillment"]').forEach(input => {
    input.addEventListener('change', renderCart);
  });

  checkoutButton.addEventListener('click', async () => {
    checkoutButton.disabled = true;
    checkoutMessage.textContent = 'Opening secure checkout...';

    try {
      const payload = {
        fulfillmentMethod: getFulfillmentMethod(),
        items: cart
      };

      const result = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await result.json();

      if (!result.ok || !data.url) {
        throw new Error(data.error || 'Online checkout is not available yet. Please use the request form for now.');
      }

      window.location.href = data.url;
    } catch (error) {
      checkoutMessage.textContent = error.message;
      checkoutButton.disabled = false;
    }
  });

  syncCardButtons();
  syncFeaturedButton();
  renderCart();
})();
