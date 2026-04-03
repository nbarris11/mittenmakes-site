(async () => {
  const CART_STORAGE_KEY = 'mitten-makes-cart-v1';
  const GOLF_BALL_PRODUCT_ID = 'custom-golf-ball-holder';
  const cartRoot = document.getElementById('online-checkout');
  const cartSummaryLinks = Array.from(document.querySelectorAll('[data-cart-link]'));
  const cartSummaryCounts = Array.from(document.querySelectorAll('[data-cart-count]'));
  const checkoutPanelPresent = Boolean(cartRoot);
  const featuredActions = document.querySelector('.featured-gift-copy .order-actions');
  let cartToastTimeout;

  const response = await fetch('checkout-products.json?v=20260403a');
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

  const formatCurrency = cents =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  const escapeHtml = value =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const getProductCustomization = productId => products.get(productId)?.customization || null;

  const buildCartKey = (productId, options = null) => {
    if (!options) return productId;
    return [
      productId,
      options.customWords?.trim().toLowerCase() || '',
      options.primaryColor || '',
      options.secondaryColor || ''
    ].join('::');
  };

  const normalizeOptions = (productId, rawOptions = null) => {
    const customization = getProductCustomization(productId);
    if (!customization) return null;

    if (customization.kind === 'golf-ball-holder') {
      const allowedColors = customization.colorOptions || [];
      const customWords = String(rawOptions?.customWords || '').trim().slice(0, customization.maxWords || 24);
      const primaryColor = allowedColors.includes(rawOptions?.primaryColor) ? rawOptions.primaryColor : '';
      const secondaryColor = allowedColors.includes(rawOptions?.secondaryColor) ? rawOptions.secondaryColor : '';

      if (!customWords || !primaryColor || !secondaryColor || primaryColor === secondaryColor) {
        return null;
      }

      return { customWords, primaryColor, secondaryColor };
    }

    return null;
  };

  const normalizeCartItem = rawItem => {
    const product = products.get(rawItem?.id);
    const quantity = Number(rawItem?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1) return null;

    const options = normalizeOptions(rawItem.id, rawItem.options);
    return {
      id: rawItem.id,
      quantity,
      cartKey: buildCartKey(rawItem.id, options),
      ...(options ? { options } : {})
    };
  };

  const readCart = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
      return Array.isArray(parsed)
        ? parsed.map(normalizeCartItem).filter(Boolean)
        : [];
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

  const updateCartSummary = () => {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartSummaryCounts.forEach(node => {
      node.textContent = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
    });

    cartSummaryLinks.forEach(link => {
      link.textContent = itemCount > 0
        ? `View cart & checkout (${itemCount})`
        : 'Open cart';
    });
  };

  const ensureCartToast = () => {
    let toast = document.querySelector('[data-cart-toast]');
    if (toast) return toast;

    toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.setAttribute('data-cart-toast', '');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toast);
    return toast;
  };

  const showCartToast = message => {
    const toast = ensureCartToast();
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(cartToastTimeout);
    cartToastTimeout = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2200);
  };

  const pulseCartIndicators = () => {
    document.querySelectorAll('.shop-cart-summary-actions, .shop-cart-dock').forEach(node => {
      node.classList.remove('cart-updated');
      void node.offsetWidth;
      node.classList.add('cart-updated');
      window.setTimeout(() => {
        node.classList.remove('cart-updated');
      }, 800);
    });
  };

  const flashAddedState = button => {
    if (!button) return;
    const originalLabel = button.dataset.defaultLabel || button.textContent;
    button.dataset.defaultLabel = originalLabel;
    button.textContent = 'Added';
    button.classList.add('is-added');
    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.classList.remove('is-added');
    }, 1200);
  };

  const syncCardButtons = () => {
    products.forEach((product, productId) => {
      const card = document.getElementById(productId);
      const actions = card?.querySelector('.product-card-actions');
      if (!card || !actions || actions.querySelector('.btn-add-to-cart')) return;

      const cartButton = document.createElement('button');
      cartButton.type = 'button';
      cartButton.className = 'btn btn-primary btn-add-to-cart';
      cartButton.textContent = product.customization ? 'Customize & add' : 'Add to cart';
      cartButton.addEventListener('click', async () => {
        const wasAdded = await addToCart(productId);
        if (wasAdded) flashAddedState(cartButton);
      });

      actions.prepend(cartButton);
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
    cartButton.addEventListener('click', async () => {
      const wasAdded = await addToCart(productId);
      if (wasAdded) flashAddedState(cartButton);
    });

    const requestButton = featuredActions.querySelector('.btn.btn-primary') || featuredActions.querySelector('.btn');
    if (requestButton) {
      requestButton.classList.remove('btn-primary');
      requestButton.classList.add('btn-secondary');
    }

    featuredActions.prepend(cartButton);
  };

  const ensureCustomizationDialog = () => {
    let dialog = document.querySelector('[data-cart-customization-dialog]');
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.className = 'product-option-dialog';
    dialog.setAttribute('data-cart-customization-dialog', '');
    dialog.innerHTML = `
      <form method="dialog" class="product-option-form">
        <div class="product-option-copy">
          <p class="order-eyebrow">Before we add it</p>
          <h2>Customize your golf ball holder</h2>
          <p>Choose the words for the front, then pick two colors for the print.</p>
        </div>
        <label>
          Words on the front
          <input type="text" name="customWords" maxlength="24" placeholder="Dad's League" required>
        </label>
        <div class="product-option-grid">
          <label>
            Main color
            <select name="primaryColor" required></select>
          </label>
          <label>
            Accent color
            <select name="secondaryColor" required></select>
          </label>
        </div>
        <p class="product-option-error" data-option-error hidden></p>
        <div class="product-option-actions">
          <button type="button" class="btn btn-secondary" data-option-cancel>Cancel</button>
          <button type="submit" class="btn btn-primary">Add to cart</button>
        </div>
      </form>
    `;
    document.body.appendChild(dialog);
    return dialog;
  };

  const requestProductOptions = productId => {
    const customization = getProductCustomization(productId);
    if (!customization) return Promise.resolve(null);

    if (customization.kind !== 'golf-ball-holder') return Promise.resolve(null);

    const dialog = ensureCustomizationDialog();
    const form = dialog.querySelector('form');
    const wordsInput = form.elements.customWords;
    const primarySelect = form.elements.primaryColor;
    const secondarySelect = form.elements.secondaryColor;
    const errorNode = form.querySelector('[data-option-error]');
    const cancelButton = form.querySelector('[data-option-cancel]');

    const optionsMarkup = ['<option value="">Choose a color</option>']
      .concat((customization.colorOptions || []).map(color => `<option value="${escapeHtml(color)}">${escapeHtml(color)}</option>`))
      .join('');

    primarySelect.innerHTML = optionsMarkup;
    secondarySelect.innerHTML = optionsMarkup;
    wordsInput.value = '';
    primarySelect.value = '';
    secondarySelect.value = '';
    errorNode.hidden = true;
    errorNode.textContent = '';

    return new Promise(resolve => {
      const closeDialog = result => {
        form.removeEventListener('submit', handleSubmit);
        cancelButton.removeEventListener('click', handleCancel);
        dialog.removeEventListener('cancel', handleCancel);
        dialog.close();
        resolve(result);
      };

      const handleCancel = event => {
        event?.preventDefault?.();
        closeDialog(null);
      };

      const handleSubmit = event => {
        event.preventDefault();
        const options = normalizeOptions(productId, {
          customWords: wordsInput.value,
          primaryColor: primarySelect.value,
          secondaryColor: secondarySelect.value
        });

        if (!options) {
          errorNode.textContent = 'Add the words and choose two different colors before continuing.';
          errorNode.hidden = false;
          return;
        }

        closeDialog(options);
      };

      form.addEventListener('submit', handleSubmit);
      cancelButton.addEventListener('click', handleCancel);
      dialog.addEventListener('cancel', handleCancel);
      dialog.showModal();
      wordsInput.focus();
    });
  };

  const addToCart = async productId => {
    const product = products.get(productId);
    const options = getProductCustomization(productId)
      ? await requestProductOptions(productId)
      : null;

    if (getProductCustomization(productId) && !options) {
      return false;
    }

    const cartKey = buildCartKey(productId, options);
    const existing = cart.find(item => item.cartKey === cartKey);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: productId,
        quantity: 1,
        cartKey,
        ...(options ? { options } : {})
      });
    }
    saveCart(cart);
    updateCartSummary();
    renderCart();
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    pulseCartIndicators();
    showCartToast(`${product?.name || 'Item'} added to cart • ${itemCount} item${itemCount === 1 ? '' : 's'} ready`);
    return true;
  };

  const updateQuantity = (cartKey, delta) => {
    cart = cart
      .map(item => item.cartKey === cartKey ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0);
    saveCart(cart);
    updateCartSummary();
    renderCart();
  };

  const removeFromCart = cartKey => {
    cart = cart.filter(item => item.cartKey !== cartKey);
    saveCart(cart);
    updateCartSummary();
    renderCart();
  };

  const renderCart = () => {
    updateCartSummary();
    if (!checkoutPanelPresent) return;

    const subtotal = getSubtotal();
    const fulfillmentMethod = getFulfillmentMethod();
    const shippingAmount = fulfillmentMethod === 'shipping' ? shippingCents : 0;
    const total = subtotal + shippingAmount;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const meetsMinimum = subtotal >= minimumSubtotalCents;
    const amountRemaining = Math.max(minimumSubtotalCents - subtotal, 0);

    cartCount.textContent = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
    subtotalValue.textContent = formatCurrency(subtotal);
    shippingValue.textContent = shippingAmount ? formatCurrency(shippingAmount) : 'Free';
    totalValue.textContent = formatCurrency(total);

    minimumNote.textContent = meetsMinimum
      ? `Your ready-to-order subtotal qualifies for online checkout. ${fulfillmentMethod === 'shipping' ? 'Shipping is a flat $9.97.' : 'Local pickup stays free.'}`
      : `Online checkout starts at ${formatCurrency(minimumSubtotalCents)} in ready-to-order items before shipping.`;

    checkoutButton.disabled = !cart.length || !meetsMinimum;
    checkoutButton.classList.toggle('btn-disabled', !cart.length || !meetsMinimum);
    checkoutButton.textContent = !cart.length
      ? 'Add items to unlock checkout'
      : meetsMinimum
        ? 'Checkout with Stripe'
        : `Add ${formatCurrency(amountRemaining)} more to checkout`;
    checkoutMessage.textContent = !cart.length
      ? 'Add a few ready-to-order items to start online checkout.'
      : meetsMinimum
        ? `You are ready to check out${fulfillmentMethod === 'shipping' ? ' with flat-rate shipping.' : ' for free local pickup.'}`
        : `Add ${formatCurrency(amountRemaining)} more in ready-to-order items to unlock online checkout.`;

    emptyState.hidden = cart.length > 0;
    cartList.hidden = cart.length === 0;
    cartList.innerHTML = '';

    cart.forEach(item => {
      const product = products.get(item.id);
      if (!product) return;
      const optionsMarkup = item.options
        ? `
          <span class="checkout-cart-item-meta">Words: ${escapeHtml(item.options.customWords)}</span>
          <span class="checkout-cart-item-meta">Colors: ${escapeHtml(item.options.primaryColor)} + ${escapeHtml(item.options.secondaryColor)}</span>
        `
        : '';

      const lineItem = document.createElement('li');
      lineItem.className = 'checkout-cart-item';
      lineItem.innerHTML = `
        <div class="checkout-cart-item-copy">
          <strong>${product.name}</strong>
          <span>${product.priceLabel} each</span>
          ${optionsMarkup}
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

      decreaseButton.addEventListener('click', () => updateQuantity(item.cartKey, -1));
      increaseButton.addEventListener('click', () => updateQuantity(item.cartKey, 1));
      removeButton.addEventListener('click', () => removeFromCart(item.cartKey));

      cartList.appendChild(lineItem);
    });
  };

  document.querySelectorAll('input[name="checkout-fulfillment"]').forEach(input => {
    input.addEventListener('change', renderCart);
  });

  checkoutButton?.addEventListener('click', async () => {
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
  updateCartSummary();
  renderCart();
})();
