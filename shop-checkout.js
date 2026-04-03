(async () => {
  const CART_STORAGE_KEY = 'mitten-makes-cart-v1';
  const cartRoot = document.getElementById('online-checkout');
  const cartSummaryLinks = Array.from(document.querySelectorAll('[data-cart-link]'));
  const cartSummaryCounts = Array.from(document.querySelectorAll('[data-cart-count]'));
  const checkoutPanelPresent = Boolean(cartRoot);
  const featuredActions = document.querySelector('.featured-gift-copy .order-actions');
  let cartToastTimeout;

  const response = await fetch('checkout-products.json?v=20260403h');
  if (!response.ok) return;

  const checkoutConfig = await response.json();
  const products = new Map(checkoutConfig.products.map(product => [product.id, product]));
  const minimumSubtotalCents = checkoutConfig.minimumSubtotalCents;
  const shippingCents = checkoutConfig.shippingCents;
  const finishStyleOptions = checkoutConfig.finishStyleOptions || [];
  const finishStyleMap = new Map(finishStyleOptions.map(option => [option.id, option]));
  const solidColorOptions = checkoutConfig.solidColorOptions || [];
  const silkColorOptions = checkoutConfig.silkColorOptions || [];

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

  const getCustomizationSummary = (productId, options) => {
    const customization = getProductCustomization(productId);
    if (!customization || !options) return '';

    if (customization.kind === 'golf-ball-holder') {
      return `${options.customWords} · ${options.primaryColor} + ${options.secondaryColor}`;
    }

    if (customization.kind === 'bookmarks') {
      return `${options.palette} · ${options.patternStyle}`;
    }

    return '';
  };

  const getFinishSummary = options => {
    if (!options?.finishStyle) return '';
    const finishStyle = finishStyleMap.get(options.finishStyle);
    if (!finishStyle) return '';
    return options.solidColor
      ? `${finishStyle.label} · ${options.solidColor}`
      : options.silkColor
        ? `${finishStyle.label} · ${options.silkColor}`
      : finishStyle.label;
  };

  const getItemUnitPrice = item => {
    const product = products.get(item.id);
    if (!product) return 0;
    const finishStyle = item.options?.finishStyle ? finishStyleMap.get(item.options.finishStyle) : null;
    return product.priceCents + (finishStyle?.priceDeltaCents || 0);
  };

  const buildCartKey = (productId, options = null) => {
    if (!options) return productId;
    const segments = [productId];
    if (options.finishStyle) segments.push(options.finishStyle);
    if (options.solidColor) segments.push(options.solidColor);
    if (options.silkColor) segments.push(options.silkColor);
    if (options.customWords) segments.push(options.customWords.trim().toLowerCase());
    if (options.primaryColor) segments.push(options.primaryColor);
    if (options.secondaryColor) segments.push(options.secondaryColor);
    if (options.palette) segments.push(options.palette);
    if (options.patternStyle) segments.push(options.patternStyle);
    return segments.join('::');
  };

  const normalizeOptions = (productId, rawOptions = null) => {
    const customization = getProductCustomization(productId);
    if (!customization) {
      const noOptionsProvided = !rawOptions || Object.keys(rawOptions).length === 0;
      const finishStyle = finishStyleMap.has(rawOptions?.finishStyle) ? rawOptions.finishStyle : 'solid';
      const solidColor = finishStyle === 'solid'
        ? (
            solidColorOptions.includes(rawOptions?.solidColor)
              ? rawOptions.solidColor
              : (noOptionsProvided ? (solidColorOptions[0] || '') : '')
          )
        : '';
      const silkColor = finishStyle === 'silk'
        ? (
            silkColorOptions.includes(rawOptions?.silkColor)
              ? rawOptions.silkColor
              : ''
          )
        : '';

      if (finishStyle === 'solid' && !solidColor) {
        return null;
      }
      if (finishStyle === 'silk' && !silkColor) {
        return null;
      }

      return {
        finishStyle,
        ...(solidColor ? { solidColor } : {}),
        ...(silkColor ? { silkColor } : {})
      };
    }

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

    if (customization.kind === 'bookmarks') {
      const allowedPalettes = customization.paletteOptions || [];
      const allowedPatternStyles = customization.patternOptions || [];
      const palette = allowedPalettes.includes(rawOptions?.palette) ? rawOptions.palette : '';
      const patternStyle = allowedPatternStyles.includes(rawOptions?.patternStyle) ? rawOptions.patternStyle : '';

      if (!palette || !patternStyle) {
        return null;
      }

      return { palette, patternStyle };
    }

    return null;
  };

  const normalizeCartItem = rawItem => {
    const product = products.get(rawItem?.id);
    const quantity = Number(rawItem?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1) return null;

    const options = normalizeOptions(rawItem.id, rawItem.options || {});
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
      return sum + (getItemUnitPrice(item) * item.quantity);
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
      cartButton.textContent = product.customization ? 'Customize & add' : 'Choose color & add';
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
    cartButton.textContent = 'Choose color & add';
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
          <p class="order-eyebrow" data-option-eyebrow>Before we add it</p>
          <h2 data-option-title>Customize your item</h2>
          <p data-option-description>Pick a finish and color before adding it to your cart.</p>
        </div>
        <div class="product-option-grid product-option-grid-single">
          <label data-option-finish-wrap>
            Finish & color style
            <select name="finishStyle"></select>
          </label>
          <label data-option-solid-wrap>
            Solid color
            <select name="solidColor"></select>
          </label>
          <label data-option-silk-wrap hidden>
            Silk color
            <select name="silkColor"></select>
          </label>
        </div>
        <label data-option-words-wrap hidden>
          Words on the front
          <input type="text" name="customWords" maxlength="24" placeholder="Dad's League">
        </label>
        <div class="product-option-grid" data-option-bookmark-grid hidden>
          <label data-option-palette-wrap>
            Color palette
            <select name="bookmarkPalette"></select>
          </label>
          <label data-option-pattern-wrap>
            Bookmark set style
            <select name="bookmarkPattern"></select>
          </label>
        </div>
        <div class="product-option-grid" data-option-golf-colors hidden>
          <label data-option-primary-wrap>
            Main color
            <select name="primaryColor"></select>
          </label>
          <label data-option-secondary-wrap>
            Accent color
            <select name="secondaryColor"></select>
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
    const dialog = ensureCustomizationDialog();
    const form = dialog.querySelector('form');
    const titleNode = form.querySelector('[data-option-title]');
    const descriptionNode = form.querySelector('[data-option-description]');
    const finishWrap = form.querySelector('[data-option-finish-wrap]');
    const solidWrap = form.querySelector('[data-option-solid-wrap]');
    const silkWrap = form.querySelector('[data-option-silk-wrap]');
    const wordsWrap = form.querySelector('[data-option-words-wrap]');
    const bookmarkGrid = form.querySelector('[data-option-bookmark-grid]');
    const golfColorsWrap = form.querySelector('[data-option-golf-colors]');
    const finishSelect = form.elements.finishStyle;
    const solidSelect = form.elements.solidColor;
    const silkSelect = form.elements.silkColor;
    const wordsInput = form.elements.customWords;
    const paletteSelect = form.elements.bookmarkPalette;
    const patternSelect = form.elements.bookmarkPattern;
    const primarySelect = form.elements.primaryColor;
    const secondarySelect = form.elements.secondaryColor;
    const errorNode = form.querySelector('[data-option-error]');
    const cancelButton = form.querySelector('[data-option-cancel]');

    const finishMarkup = finishStyleOptions
      .map(option => `<option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>`)
      .join('');
    const solidMarkup = ['<option value="">Choose a color</option>']
      .concat(solidColorOptions.map(color => `<option value="${escapeHtml(color)}">${escapeHtml(color)}</option>`))
      .join('');
    const silkMarkup = ['<option value="">Choose a silk color</option>']
      .concat(silkColorOptions.map(color => `<option value="${escapeHtml(color)}">${escapeHtml(color)}</option>`))
      .join('');
    const golfColorMarkup = ['<option value="">Choose a color</option>']
      .concat(((customization?.colorOptions) || []).map(color => `<option value="${escapeHtml(color)}">${escapeHtml(color)}</option>`))
      .join('');
    const bookmarkPaletteMarkup = ['<option value="">Choose a palette</option>']
      .concat(((customization?.paletteOptions) || []).map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`))
      .join('');
    const bookmarkPatternMarkup = ['<option value="">Choose a style</option>']
      .concat(((customization?.patternOptions) || []).map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`))
      .join('');

    const toggleFinishFields = () => {
      const isSolid = finishSelect.value === 'solid';
      const isSilk = finishSelect.value === 'silk';
      solidWrap.hidden = !isSolid;
      solidSelect.disabled = !isSolid;
      solidSelect.required = isSolid;
      silkWrap.hidden = !isSilk;
      silkSelect.disabled = !isSilk;
      silkSelect.required = isSilk;
      if (!isSolid) {
        solidSelect.value = '';
      }
      if (!isSilk) {
        silkSelect.value = '';
      }
    };

    finishSelect.innerHTML = finishMarkup;
    solidSelect.innerHTML = solidMarkup;
    silkSelect.innerHTML = silkMarkup;
    primarySelect.innerHTML = golfColorMarkup;
    secondarySelect.innerHTML = golfColorMarkup;
    paletteSelect.innerHTML = bookmarkPaletteMarkup;
    patternSelect.innerHTML = bookmarkPatternMarkup;
    wordsInput.value = '';
    finishSelect.value = '';
    solidSelect.value = '';
    silkSelect.value = '';
    primarySelect.value = '';
    secondarySelect.value = '';
    paletteSelect.value = '';
    patternSelect.value = '';

    if (customization?.kind === 'golf-ball-holder') {
      titleNode.textContent = 'Customize your golf ball holder';
      descriptionNode.textContent = 'Choose the words for the front, then pick two colors for the print.';
      finishWrap.hidden = true;
      solidWrap.hidden = true;
      silkWrap.hidden = true;
      wordsWrap.hidden = false;
      bookmarkGrid.hidden = true;
      golfColorsWrap.hidden = false;
      finishSelect.disabled = true;
      solidSelect.disabled = true;
      silkSelect.disabled = true;
      wordsInput.required = true;
      wordsInput.disabled = false;
      paletteSelect.required = false;
      paletteSelect.disabled = true;
      patternSelect.required = false;
      patternSelect.disabled = true;
      primarySelect.required = true;
      primarySelect.disabled = false;
      secondarySelect.required = true;
      secondarySelect.disabled = false;
      finishSelect.required = false;
      solidSelect.required = false;
      silkSelect.required = false;
      finishSelect.value = '';
      solidSelect.value = '';
      silkSelect.value = '';
      paletteSelect.value = '';
      patternSelect.value = '';
    } else if (customization?.kind === 'bookmarks') {
      titleNode.textContent = 'Customize your bookmark set';
      descriptionNode.textContent = 'Pick the overall palette and whether you want mixed or matching patterns in the set.';
      finishWrap.hidden = true;
      solidWrap.hidden = true;
      silkWrap.hidden = true;
      wordsWrap.hidden = true;
      bookmarkGrid.hidden = false;
      golfColorsWrap.hidden = true;
      finishSelect.disabled = true;
      solidSelect.disabled = true;
      silkSelect.disabled = true;
      wordsInput.disabled = true;
      primarySelect.disabled = true;
      secondarySelect.disabled = true;
      wordsInput.required = false;
      primarySelect.required = false;
      secondarySelect.required = false;
      paletteSelect.required = true;
      paletteSelect.disabled = false;
      patternSelect.required = true;
      patternSelect.disabled = false;
      finishSelect.required = false;
      solidSelect.required = false;
      silkSelect.required = false;
      finishSelect.value = '';
      solidSelect.value = '';
      silkSelect.value = '';
      wordsInput.value = '';
      primarySelect.value = '';
      secondarySelect.value = '';
      paletteSelect.value = '';
      patternSelect.value = '';
    } else {
      titleNode.textContent = 'Pick your finish';
      descriptionNode.textContent = 'Choose a simple solid color, pick Surprise me, or upgrade to a silk or rainbow finish for $2 more.';
      finishWrap.hidden = false;
      solidWrap.hidden = false;
      silkWrap.hidden = true;
      wordsWrap.hidden = true;
      bookmarkGrid.hidden = true;
      golfColorsWrap.hidden = true;
      finishSelect.disabled = false;
      wordsInput.disabled = true;
      silkSelect.disabled = false;
      paletteSelect.disabled = true;
      patternSelect.disabled = true;
      primarySelect.disabled = true;
      secondarySelect.disabled = true;
      wordsInput.required = false;
      paletteSelect.required = false;
      patternSelect.required = false;
      primarySelect.required = false;
      secondarySelect.required = false;
      finishSelect.required = true;
      finishSelect.value = 'solid';
      solidSelect.value = '';
      silkSelect.value = '';
      wordsInput.value = '';
      primarySelect.value = '';
      secondarySelect.value = '';
      paletteSelect.value = '';
      patternSelect.value = '';
      toggleFinishFields();
    }

    finishSelect.value = customization?.kind === 'golf-ball-holder' || customization?.kind === 'bookmarks' ? finishSelect.value : 'solid';
    errorNode.hidden = true;
    errorNode.textContent = '';

    return new Promise(resolve => {
      const closeDialog = result => {
        form.removeEventListener('submit', handleSubmit);
        cancelButton.removeEventListener('click', handleCancel);
        dialog.removeEventListener('cancel', handleCancel);
        finishSelect.removeEventListener('change', toggleFinishFields);
        dialog.close();
        resolve(result);
      };

      const handleCancel = event => {
        event?.preventDefault?.();
        closeDialog(null);
      };

      const handleSubmit = event => {
        event.preventDefault();
        const options = customization?.kind === 'golf-ball-holder'
          ? normalizeOptions(productId, {
              customWords: wordsInput.value,
              primaryColor: primarySelect.value,
              secondaryColor: secondarySelect.value
            })
          : customization?.kind === 'bookmarks'
            ? normalizeOptions(productId, {
                palette: paletteSelect.value,
                patternStyle: patternSelect.value
              })
          : normalizeOptions(productId, {
              finishStyle: finishSelect.value,
              solidColor: solidSelect.value,
              silkColor: silkSelect.value
            });

        if (!options) {
          errorNode.textContent = customization?.kind === 'golf-ball-holder'
            ? 'Add the words and choose two different colors before continuing.'
            : customization?.kind === 'bookmarks'
              ? 'Choose a color palette and a bookmark set style before continuing.'
            : 'Choose a finish style. Solid color needs an exact color, and silk finish needs a silk color choice.';
          errorNode.hidden = false;
          return;
        }

        closeDialog(options);
      };

      form.addEventListener('submit', handleSubmit);
      cancelButton.addEventListener('click', handleCancel);
      dialog.addEventListener('cancel', handleCancel);
      finishSelect.addEventListener('change', toggleFinishFields);
      dialog.showModal();
      (
        customization?.kind === 'golf-ball-holder'
          ? wordsInput
          : customization?.kind === 'bookmarks'
            ? paletteSelect
            : finishSelect
      ).focus();
    });
  };

  const addToCart = async productId => {
    const product = products.get(productId);
    const options = await requestProductOptions(productId);
    if (!options) {
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
      const finishStyle = item.options?.finishStyle ? finishStyleMap.get(item.options.finishStyle) : null;
      const unitPrice = getItemUnitPrice(item);
      const lineTotal = unitPrice * item.quantity;
      const optionsMarkup = item.options
        ? `
          ${item.options.customWords ? `<span class="checkout-cart-item-meta">Words: ${escapeHtml(item.options.customWords)}</span>` : ''}
          ${item.options.primaryColor ? `<span class="checkout-cart-item-meta">Colors: ${escapeHtml(item.options.primaryColor)} + ${escapeHtml(item.options.secondaryColor)}</span>` : ''}
          ${item.options.palette ? `<span class="checkout-cart-item-meta">Bookmark set: ${escapeHtml(getCustomizationSummary(item.id, item.options))}</span>` : ''}
          ${finishStyle ? `<span class="checkout-cart-item-meta">Finish: ${escapeHtml(getFinishSummary(item.options))}${finishStyle.priceDeltaCents ? ` (+${formatCurrency(finishStyle.priceDeltaCents)})` : ''}</span>` : ''}
        `
        : '';

      const lineItem = document.createElement('li');
      lineItem.className = 'checkout-cart-item';
      lineItem.innerHTML = `
        <div class="checkout-cart-item-copy">
          <strong>${product.name}</strong>
          <span>${formatCurrency(unitPrice)} each · ${formatCurrency(lineTotal)} total</span>
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
