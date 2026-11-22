/* Matches Gift Finder answers to ready-to-order products.
   Names, prices and photos come from checkout-products.json; only the matching tags live here.
   When you add a product to the catalog, add a line here so the quiz can recommend it. */
(function () {
  // product id: [interests, recipients, extra search words]
  var MATCHES = {
    'love-from-michigan': [['cute-decor'], ['adult', 'parent', 'teacher', 'coworker', 'friend'], 'michigan home'],
    'thankful-for-our-michigan': [['cute-decor'], ['parent', 'teacher', 'adult'], 'michigan home thanksgiving'],
    'detroit-lions': [['sports', 'cute-decor'], ['adult', 'parent', 'friend', 'teen', 'coworker'], 'lions football detroit'],
    'detroit-red-wings-hockeytown': [['sports', 'cute-decor'], ['adult', 'parent', 'friend', 'teen'], 'hockey wings detroit'],
    'detroit-tigers': [['sports', 'cute-decor'], ['adult', 'parent', 'friend', 'teen'], 'tigers baseball detroit'],
    'detroit-pistons': [['sports', 'cute-decor'], ['adult', 'friend', 'teen'], 'pistons basketball detroit'],
    'custom-golf-ball-holder': [['sports', 'personalized-items', 'desk-accessories'], ['adult', 'parent', 'coworker'], 'golf dad'],
    'dual-color-star-fidget': [['fidgets', 'desk-accessories'], ['kid', 'teen', 'coworker', 'friend', 'other'], 'star fidget sensory'],
    'flexi-playful-star': [['fidgets'], ['kid', 'teen', 'other'], 'star fidget sensory'],
    'bun-slime-fidget': [['fidgets'], ['kid', 'teen', 'friend'], 'slime squishy sensory cute'],
    'fidget-switch': [['fidgets', 'desk-accessories'], ['teen', 'coworker', 'kid'], 'clicker sensory gamer'],
    'crystal-dragon': [['dragons'], ['kid', 'teen', 'friend', 'adult', 'other'], 'dragon fantasy crystal'],
    'bone-dragon': [['dragons'], ['teen', 'friend'], 'dragon fantasy spooky goth skeleton'],
    'water-dragon': [['dragons'], ['kid', 'teen'], 'dragon fantasy water'],
    'cookie-dragon-keychain-figure': [['dragons', 'animals'], ['kid', 'teen'], 'dragon keychain stocking'],
    'tiny-t-rex': [['dinosaurs'], ['kid', 'teen'], 'dino dinosaur trex'],
    'whale-shark': [['animals'], ['kid', 'teen', 'friend'], 'shark whale ocean fish'],
    'void-octopus': [['animals'], ['teen', 'friend'], 'octopus ocean space'],
    'penguin-articulated-keychain': [['animals'], ['kid', 'teacher', 'friend'], 'penguin keychain winter stocking'],
    'elephant-articulated-keychain': [['animals'], ['kid', 'parent', 'friend'], 'elephant keychain'],
    'fleggy-flexi-egg-buddy': [['animals', 'fidgets'], ['kid', 'friend'], 'egg cute funny'],
    'cable-monster-desk-helper': [['desk-accessories'], ['coworker', 'teacher', 'teen', 'adult'], 'desk office cable gamer'],
    'bookmarks-3-pack': [['desk-accessories', 'personalized-items'], ['teacher', 'parent', 'other'], 'book books reading bookmark'],
    'flirty-heart-photo-card-display': [['cute-decor'], ['parent', 'friend', 'adult'], 'heart love photo card']
  };
  var SMALL_GIFT_OCCASIONS = ['party-favor', 'classroom-prize'];
  var LIMIT = 4;

  function pick(products, answers) {
    var words = String(answers.extraLikes || '').toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length > 2; });

    var ranked = products.filter(function (p) { return MATCHES[p.id]; }).map(function (p) {
      var match = MATCHES[p.id];
      var terms = match[2].split(' ');
      var hits = answers.interests.filter(function (i) { return match[0].indexOf(i) !== -1; }).length;
      var wordHits = words.filter(function (w) { return terms.indexOf(w) !== -1; }).length;
      var score = hits * 10 + wordHits * 8 + (match[1].indexOf(answers.recipient) !== -1 ? 3 : 0);
      if (SMALL_GIFT_OCCASIONS.indexOf(answers.occasion) !== -1 && p.priceCents <= 1000) score += 4;
      return { product: p, score: score, interests: match[0] };
    }).sort(function (a, b) { return b.score - a.score; });

    // Give each chosen interest a slot before filling the rest by score.
    var picked = [];
    answers.interests.forEach(function (interest) {
      if (picked.length >= LIMIT) return;
      var best = ranked.find(function (r) { return r.interests.indexOf(interest) !== -1 && picked.indexOf(r) === -1; });
      if (best) picked.push(best);
    });
    ranked.forEach(function (r) {
      if (picked.length < LIMIT && picked.indexOf(r) === -1) picked.push(r);
    });

    return picked.sort(function (a, b) { return b.score - a.score; }).map(function (r) { return r.product; });
  }

  function card(product) {
    var el = document.createElement('article');
    el.className = 'gift-match';

    var img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.width = 300;
    img.height = 300;

    var name = document.createElement('h4');
    name.textContent = product.name;

    var price = document.createElement('p');
    price.className = 'gift-match-price';
    price.textContent = '$' + (product.priceCents / 100).toFixed(product.priceCents % 100 ? 2 : 0);

    var button = document.createElement('a');
    button.className = 'btn btn-primary';
    button.href = 'shop.html#' + product.id;
    button.dataset.addProduct = product.id; // handled in shop-checkout.js
    button.textContent = 'Add to cart';

    el.append(img, name, price, button);
    return el;
  }

  var catalog;

  // Resolves to true when products were shown, false when the catalog couldn't load.
  async function render(host, answers) {
    try {
      if (!catalog) {
        var response = await fetch('checkout-products.json?v=20260523a');
        if (!response.ok) return false;
        catalog = (await response.json()).products;
      }
      var matches = pick(catalog, answers);
      host.replaceChildren.apply(host, matches.map(card));
      return matches.length > 0;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  window.giftFinderProducts = { pick: pick, render: render };
})();
