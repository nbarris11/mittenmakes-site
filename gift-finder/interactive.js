(function () {
  const quizForm = document.querySelector('[data-gift-finder-quiz]');
  const quizFields = document.querySelector('[data-gift-finder-fields]');
  const quizMessage = document.querySelector('[data-gift-finder-message]');
  const resultsSection = document.querySelector('[data-gift-finder-results]');
  const resultsGrid = document.querySelector('[data-gift-finder-results-grid]');
  const resultsMeta = document.querySelector('[data-gift-finder-results-meta]');
  const fallbackCopy = document.querySelector('[data-gift-finder-fallback]');
  const leadPanel = document.querySelector('[data-gift-finder-lead]');
  const leadForm = document.querySelector('[data-gift-finder-lead-form]');
  const successBanner = document.querySelector('[data-gift-finder-success]');

  if (!quizForm || !quizFields || !resultsSection || !resultsGrid || !leadPanel || !leadForm) {
    return;
  }

  const QUESTION_LABELS = {
    recipient: {
      kid: 'Kid',
      teen: 'Teen',
      adult: 'Adult',
      parent: 'Parent',
      teacher: 'Teacher',
      coworker: 'Coworker',
      friend: 'Friend',
      other: 'Other'
    },
    occasion: {
      birthday: 'Birthday',
      holiday: 'Holiday',
      'thank-you': 'Thank you',
      'party-favor': 'Party favor',
      'classroom-prize': 'Classroom/prize',
      'desk-toy': 'Desk toy',
      'just-because': 'Just because',
      'custom-gift': 'Custom gift'
    },
    interests: {
      dinosaurs: 'Dinosaurs',
      dragons: 'Dragons',
      animals: 'Animals',
      pets: 'Pets',
      'space-science': 'Space/science',
      'bugs-nature': 'Bugs/nature',
      sports: 'Sports',
      fidgets: 'Fidgets',
      'sensory-items': 'Sensory items',
      'desk-accessories': 'Desk accessories',
      'cute-decor': 'Cute decor',
      fantasy: 'Fantasy',
      'personalized-items': 'Personalized items',
      'video-games': 'Video games',
      'books-reading': 'Books/reading',
      'office-workspace': 'Office/workspace',
      'school-classroom': 'School/classroom',
      'art-design': 'Art/design',
      music: 'Music',
      travel: 'Travel',
      'spooky-goth': 'Spooky/goth'
    }
  };

  const LABEL_OVERRIDES = {
    'party-favor': 'party favor',
    'classroom-prize': 'classroom/prize',
    'desk-toy': 'desk toy',
    'just-because': 'just because',
    'custom-gift': 'custom gift',
    'thank-you': 'thank you',
    'sensory-items': 'sensory items',
    'personalized-items': 'personalized items',
    'video-games': 'video games',
    'books-reading': 'books/reading',
    'office-workspace': 'office/workspace',
    'space-science': 'space/science',
    'bugs-nature': 'bugs/nature',
    'school-classroom': 'school/classroom',
    'art-design': 'art/design',
    'spooky-goth': 'spooky/goth'
  };

  const INTEREST_PRIORITIES = {
    dragons: ['dragon', 'fantasy', 'articulated-dragons'],
    dinosaurs: ['dino'],
    animals: ['animal', 'creature'],
    pets: ['animal', 'bag-tag', 'keychain', 'custom-friendly'],
    fidgets: ['fidget', 'sensory'],
    'sensory-items': ['sensory', 'fidget'],
    'personalized-items': ['personalized', 'name-sign', 'name-plate', 'photo-gift', 'bag-tag'],
    'desk-accessories': ['desk', 'office', 'organizer', 'tray', 'name-plate'],
    'office-workspace': ['desk', 'office', 'organizer', 'tray', 'name-plate'],
    'space-science': ['space', 'science', 'rocket', 'moon', 'bookmark', 'desk'],
    'bugs-nature': ['nature', 'bug', 'animal', 'bookmark', 'small-gift'],
    fantasy: ['fantasy', 'dragon'],
    sports: ['sports'],
    'video-games': ['gamer'],
    'books-reading': ['bookmark', 'classroom'],
    'school-classroom': ['classroom', 'teacher', 'tokens', 'bookmark', 'bundle-friendly'],
    'art-design': ['art', 'design', 'pattern', 'bookmark', 'desk', 'decor'],
    music: ['music', 'note', 'bookmark', 'desk'],
    travel: ['bag-tag', 'keychain', 'small-gift'],
    'spooky-goth': ['spooky', 'goth', 'creature', 'decor', 'bookmark']
  };

  const SCENARIO_BOOSTS = [
    {
      when: answers => answers.recipient === 'kid' && answers.interests.includes('dinosaurs'),
      ids: ['pocket-dino-fidget', 'mini-dino-keychain', 'dino-bookmark', 'dino-desk-buddy']
    },
    {
      when: answers => answers.recipient === 'kid' && (answers.interests.includes('dragons') || answers.interests.includes('fantasy')),
      ids: ['mini-articulated-dragon', 'fantasy-themed-bookmark', 'dragon-egg-desk-buddy']
    },
    {
      when: answers => answers.recipient === 'kid' && (answers.interests.includes('sensory-items') || answers.interests.includes('fidgets')),
      ids: ['sensory-fidget-clicker', 'infinity-cube-desk-fidget', 'party-favor-mini-fidget-set', 'flexi-animal-keychain']
    },
    {
      when: answers => answers.recipient === 'teen' && answers.interests.includes('video-games'),
      ids: ['gamer-desk-accessory', 'custom-initial-key-tag', 'infinity-cube-desk-fidget', 'custom-shelf-name-display']
    },
    {
      when: answers => answers.recipient === 'adult' && answers.interests.includes('desk-accessories'),
      ids: ['modular-pencil-cup-organizer', 'desktop-catchall-tray', 'teacher-desk-name-plate', 'cute-desk-buddy-creature']
    },
    {
      when: answers => answers.recipient === 'coworker' && answers.occasion === 'desk-toy',
      ids: ['infinity-cube-desk-fidget', 'teacher-desk-name-plate', 'desktop-catchall-tray', 'funny-desk-decor-creature']
    },
    {
      when: answers => answers.recipient === 'teacher' && answers.occasion === 'classroom-prize',
      ids: ['party-favor-mini-fidget-set', 'classroom-reward-token-set', 'classroom-bookmark-bundle', 'teacher-desk-name-plate']
    },
    {
      when: answers => answers.recipient === 'teacher' && answers.occasion === 'thank-you',
      ids: ['teacher-desk-name-plate', 'animal-bookmark', 'modular-pencil-cup-organizer', 'simple-custom-door-sign']
    },
    {
      when: answers => answers.recipient === 'parent' && answers.occasion === 'custom-gift',
      ids: ['photo-lithophane-gift', 'personalized-kids-name-sign', 'personalized-name-keychain', 'custom-shelf-name-display']
    },
    {
      when: answers => answers.recipient === 'friend' && answers.interests.includes('cute-decor'),
      ids: ['cute-desk-buddy-creature', 'custom-shelf-name-display', 'animal-bookmark', 'personalized-name-keychain']
    }
  ];

  const IDEA_ARTWORK_RULES = [
    { key: 'art-dragon', src: '/assets/gift-finder/art-dragon.png', label: 'Fantasy creature concept', match: idea => idea.tags.includes('dragon') || idea.tags.includes('fantasy') },
    { key: 'art-dino', src: '/assets/gift-finder/art-dino.png', label: 'Dino-friendly print idea', match: idea => idea.tags.includes('dino') },
    { key: 'art-fidget', src: '/assets/gift-finder/art-fidget.png', label: 'Tactile fidget direction', match: idea => idea.tags.includes('fidget') || idea.tags.includes('sensory') || idea.tags.includes('clicker') },
    { key: 'art-bookmark', src: '/assets/gift-finder/art-bookmark.png', label: 'Reading-themed extra', match: idea => idea.tags.includes('bookmark') },
    { key: 'art-photo', src: '/assets/gift-finder/art-photo.png', label: 'Photo-based keepsake', match: idea => idea.tags.includes('photo-gift') || idea.tags.includes('lithophane') },
    { key: 'art-sign', src: '/assets/gift-finder/art-sign.png', label: 'Personalized display idea', match: idea => idea.tags.includes('name-sign') || idea.tags.includes('name-plate') || idea.tags.includes('personalized') },
    { key: 'art-desk', src: '/assets/gift-finder/art-desk.png', label: 'Desk-ready print idea', match: idea => idea.tags.includes('desk') || idea.tags.includes('office') || idea.tags.includes('organizer') || idea.tags.includes('tray') },
    { key: 'art-keychain', src: '/assets/gift-finder/art-keychain.png', label: 'Clip-on gift idea', match: idea => idea.tags.includes('keychain') || idea.tags.includes('bag-tag') },
    { key: 'art-space', src: '/assets/gift-finder/art-space.png', label: 'Space or science pick', match: idea => idea.tags.includes('space') || idea.tags.includes('science') || idea.tags.includes('rocket') || idea.tags.includes('moon') },
    { key: 'art-sports', src: '/assets/gift-finder/art-sports.png', label: 'Sports-themed concept', match: idea => idea.tags.includes('sports') },
    { key: 'art-music', src: '/assets/gift-finder/art-music.png', label: 'Music-inspired idea', match: idea => idea.tags.includes('music') || idea.tags.includes('note') },
    { key: 'art-spooky', src: '/assets/gift-finder/art-spooky.png', label: 'Moody collectible vibe', match: idea => idea.tags.includes('spooky') || idea.tags.includes('goth') },
    { key: 'art-bundle', src: '/assets/gift-finder/art-bundle.png', label: 'Set or bundle direction', match: idea => idea.tags.includes('bundle-friendly') || idea.tags.includes('tokens') },
    { key: 'art-animal', src: '/assets/gift-finder/art-animal.png', label: 'Creature gift direction', match: idea => idea.tags.includes('animal') || idea.tags.includes('creature') }
  ];

  const DEFAULT_ARTWORK = {
    key: 'art-default',
    src: '/assets/gift-finder/art-default.png',
    label: 'Made-to-order print idea'
  };

  const IDEA_ARTWORK_OVERRIDES = {
    'mini-articulated-dragon': {
      key: 'idea-mini-articulated-dragon',
      src: '/assets/gift-finder/001-warm-studio-product-photo-of-a-small-articulated-3d-printed-.png',
      label: 'Fantasy dragon gift idea'
    },
    'dragon-egg-desk-buddy': {
      key: 'idea-dragon-egg-desk-buddy',
      src: '/assets/gift-finder/002-warm-shelf-product-photo-of-a-3d-printed-dragon-egg-desk-bud.png',
      label: 'Dragon desk buddy concept'
    },
    'pocket-dino-fidget': {
      key: 'idea-pocket-dino-fidget',
      src: '/assets/gift-finder/003-warm-product-photo-of-a-small-pocket-sized-3d-printed-dinosa.png',
      label: 'Pocket dino fidget idea'
    },
    'mini-dino-keychain': {
      key: 'idea-mini-dino-keychain',
      src: '/assets/gift-finder/004-warm-flat-lay-of-a-tiny-3d-printed-dinosaur-keychain-in-terr.png',
      label: 'Mini dino keychain idea'
    },
    'dino-bookmark': {
      key: 'idea-dino-bookmark',
      src: '/assets/gift-finder/005-warm-studio-flat-lay-of-a-3d-printed-dinosaur-bookmark-with-.png',
      label: 'Dinosaur bookmark concept'
    },
    'dino-desk-buddy': {
      key: 'idea-dino-desk-buddy',
      src: '/assets/gift-finder/006-warm-desk-scene-with-a-small-3d-printed-dinosaur-desk-buddy-.png',
      label: 'Dino desk buddy idea'
    },
    'flexi-animal-keychain': {
      key: 'idea-flexi-animal-keychain',
      src: '/assets/gift-finder/007-warm-product-photo-of-a-bendy-articulated-animal-keychain-in.png',
      label: 'Animal keychain concept'
    },
    'sensory-fidget-clicker': {
      key: 'idea-sensory-fidget-clicker',
      src: '/assets/gift-finder/008-warm-minimalist-product-photo-of-a-3d-printed-sensory-fidget.png',
      label: 'Sensory clicker idea'
    },
    'infinity-cube-desk-fidget': {
      key: 'idea-infinity-cube-desk-fidget',
      src: '/assets/gift-finder/009-warm-product-photo-of-a-3d-printed-infinity-cube-desk-fidget.png',
      label: 'Desk fidget concept'
    },
    'cute-desk-buddy-creature': {
      key: 'idea-cute-desk-buddy-creature',
      src: '/assets/gift-finder/010-warm-cheerful-desk-scene-with-a-cute-3d-printed-desk-buddy-c.png',
      label: 'Cute creature desk gift'
    },
    'personalized-name-keychain': {
      key: 'idea-personalized-name-keychain',
      src: '/assets/gift-finder/011-warm-flat-lay-of-a-3d-printed-personalized-name-keychain-in-.png',
      label: 'Name keychain concept'
    },
    'custom-initial-key-tag': {
      key: 'idea-custom-initial-key-tag',
      src: '/assets/gift-finder/012-warm-flat-lay-of-a-3d-printed-custom-initial-key-tag-in-terr.png',
      label: 'Initial key tag idea'
    },
    'teacher-desk-name-plate': {
      key: 'idea-teacher-name-plate',
      src: '/assets/gift-finder/idea-teacher-name-plate.png',
      label: 'Teacher desk gift idea'
    },
    'personalized-kids-name-sign': {
      key: 'idea-kids-name-sign',
      src: '/assets/gift-finder/idea-kids-name-sign.png',
      label: 'Kids room name sign idea'
    },
    'fantasy-themed-bookmark': {
      key: 'idea-fantasy-themed-bookmark',
      src: '/assets/gift-finder/013-warm-reading-themed-flat-lay-of-a-3d-printed-fantasy-bookmar.png',
      label: 'Fantasy bookmark concept'
    },
    'animal-bookmark': {
      key: 'idea-animal-bookmark',
      src: '/assets/gift-finder/014-warm-studio-flat-lay-of-a-3d-printed-animal-bookmark-with-pl.png',
      label: 'Animal bookmark idea'
    },
    'photo-lithophane-gift': {
      key: 'idea-photo-lithophane-gift',
      src: '/assets/gift-finder/015-warm-glowing-product-photo-of-a-3d-printed-photo-lithophane-.png',
      label: 'Photo lithophane gift concept'
    },
    'lit-photo-nightlight-insert': {
      key: 'idea-lit-photo-nightlight-insert',
      src: '/assets/gift-finder/016-warm-bedside-product-photo-of-a-3d-printed-photo-nightlight-.png',
      label: 'Photo nightlight keepsake'
    },
    'custom-shelf-name-display': {
      key: 'idea-shelf-name-display',
      src: '/assets/gift-finder/idea-shelf-name-display.png',
      label: 'Shelf-ready personalized display'
    },
    'personalized-bag-tag': {
      key: 'idea-bag-tag-travel',
      src: '/assets/gift-finder/idea-bag-tag-travel.png',
      label: 'Travel-friendly bag tag idea'
    },
    'modular-pencil-cup-organizer': {
      key: 'idea-modular-organizer',
      src: '/assets/gift-finder/idea-modular-organizer.png',
      label: 'Modular organizer concept'
    },
    'desktop-catchall-tray': {
      key: 'idea-catchall-tray',
      src: '/assets/gift-finder/idea-catchall-tray.png',
      label: 'Desk catchall gift idea'
    },
    'gamer-desk-accessory': {
      key: 'idea-gamer-desk',
      src: '/assets/gift-finder/idea-gamer-desk.png',
      label: 'Gaming desk setup idea'
    },
    'sports-themed-keychain': {
      key: 'idea-sports-themed-keychain',
      src: '/assets/gift-finder/017-warm-flat-lay-of-a-3d-printed-sports-themed-keychain-in-terr.png',
      label: 'Sports keychain concept'
    },
    'party-favor-mini-fidget-set': {
      key: 'idea-party-favor-mini-fidget-set',
      src: '/assets/gift-finder/018-warm-celebratory-flat-lay-of-a-3d-printed-mini-fidget-set-fo.png',
      label: 'Party favor fidget set'
    },
    'classroom-reward-token-set': {
      key: 'idea-classroom-tokens',
      src: '/assets/gift-finder/idea-classroom-tokens.png',
      label: 'Classroom reward set idea'
    },
    'science-token-mini-set': {
      key: 'idea-classroom-tokens',
      src: '/assets/gift-finder/idea-classroom-tokens.png',
      label: 'Science reward set idea'
    },
    'desk-decor-creature-set': {
      key: 'idea-desk-decor-creature-set',
      src: '/assets/gift-finder/019-warm-desk-display-of-a-small-3d-printed-creature-set-in-eart.png',
      label: 'Desk creature set concept'
    },
    'office-cable-buddy': {
      key: 'idea-office-cable-buddy',
      src: '/assets/gift-finder/idea-office-cable-buddy.png',
      label: 'Desk cable helper idea'
    },
    'funny-desk-decor-creature': {
      key: 'idea-funny-desk-creature',
      src: '/assets/gift-finder/idea-funny-desk-creature.png',
      label: 'Funny desk decor idea'
    },
    'simple-custom-door-sign': {
      key: 'idea-simple-custom-door-sign',
      src: '/assets/gift-finder/020-warm-studio-product-photo-of-a-simple-custom-3d-printed-door.png',
      label: 'Simple door sign idea'
    },
    'mini-creature-prize-bundle': {
      key: 'idea-mini-creature-bundle',
      src: '/assets/gift-finder/idea-mini-creature-bundle.png',
      label: 'Mini bundle gift set'
    },
    'classroom-bookmark-bundle': {
      key: 'idea-classroom-bookmark-bundle',
      src: '/assets/gift-finder/021-warm-classroom-flat-lay-of-a-3d-printed-bookmark-bundle-in-e.png',
      label: 'Classroom bookmark bundle'
    },
    'sports-locker-bag-tag': {
      key: 'idea-bag-tag-travel',
      src: '/assets/gift-finder/idea-bag-tag-travel.png',
      label: 'Sports bag tag idea'
    },
    'rocket-desk-buddy': {
      key: 'idea-rocket-space-gift',
      src: '/assets/gift-finder/idea-rocket-space-gift.png',
      label: 'Space-themed gift concept'
    },
    'moon-phase-bookmark': {
      key: 'idea-moon-phase-bookmark',
      src: '/assets/gift-finder/022-warm-reading-themed-flat-lay-of-a-3d-printed-moon-phase-book.png',
      label: 'Moon phase bookmark idea'
    },
    'pet-name-bag-tag': {
      key: 'idea-pet-name-tag',
      src: '/assets/gift-finder/idea-pet-name-tag.png',
      label: 'Pet lover tag idea'
    },
    'music-note-bookmark': {
      key: 'idea-music-note-bookmark',
      src: '/assets/gift-finder/023-warm-reading-themed-flat-lay-of-a-3d-printed-music-note-book.png',
      label: 'Music bookmark concept'
    },
    'pattern-play-bookmark-set': {
      key: 'idea-pattern-bookmarks',
      src: '/assets/gift-finder/idea-pattern-bookmarks.png',
      label: 'Art-forward bookmark set'
    },
    'spooky-shelf-creature': {
      key: 'idea-spooky-creature',
      src: '/assets/gift-finder/idea-spooky-creature.png',
      label: 'Spooky collectible idea'
    }
  };

  const IDEA_TAG_LABELS = {
    dragon: 'dragon',
    fantasy: 'fantasy',
    dino: 'dino',
    fidget: 'tactile',
    sensory: 'sensory',
    personalized: 'custom',
    keychain: 'clip-on',
    bookmark: 'reading',
    desk: 'desk-ready',
    office: 'workspace',
    organizer: 'organized',
    tray: 'catchall',
    'photo-gift': 'photo gift',
    'name-sign': 'name sign',
    'name-plate': 'name plate',
    'bag-tag': 'bag tag',
    sports: 'sports',
    space: 'space',
    science: 'science',
    rocket: 'rocket',
    moon: 'moon',
    spooky: 'spooky',
    music: 'music',
    note: 'music',
    animal: 'animal',
    creature: 'creature',
    'bundle-friendly': 'set-ready',
    tokens: 'class set',
    'custom-friendly': 'customizable'
  };

  const state = {
    catalog: [],
    recommendations: [],
    favorites: []
  };

  const labelFor = (questionId, value) =>
    QUESTION_LABELS[questionId] && QUESTION_LABELS[questionId][value]
      ? QUESTION_LABELS[questionId][value]
      : LABEL_OVERRIDES[value] || value || '';

  const normalizeText = value =>
    (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const extractKeywords = text => {
    const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'they', 'them', 'like', 'this', 'gift', 'something', 'from', 'into']);
    return Array.from(new Set(normalizeText(text).split(' ').filter(word => word.length > 2 && !stopWords.has(word))));
  };

  const searchableString = idea =>
    normalizeText([
      idea.name,
      idea.shortDescription,
      idea.whyItFits,
      idea.internalCategory,
      idea.badge,
      idea.tags.join(' '),
      idea.interests.join(' ')
    ].join(' '));

  const hasPriorityTag = (idea, tags) =>
    tags.some(tag => idea.tags.includes(tag) || idea.internalCategory.includes(tag));

  const getScenarioBoost = (ideaId, answers) =>
    SCENARIO_BOOSTS.reduce((score, scenario) => {
      if (!scenario.when(answers)) return score;
      return scenario.ids.includes(ideaId) ? score + 8 : score;
    }, 0);

  const getFreeTextScore = (idea, answers) => {
    const keywords = extractKeywords(answers.extraLikes);
    if (!keywords.length) return 0;
    const searchBlob = searchableString(idea);
    return keywords.reduce((sum, keyword) => sum + (searchBlob.includes(keyword) ? 2 : 0), 0);
  };

  const getInterestPriorityScore = (idea, answers) => {
    let score = 0;
    answers.interests.forEach(interest => {
      const relatedTags = INTEREST_PRIORITIES[interest] || [];
      if (hasPriorityTag(idea, relatedTags)) score += 4;
    });

    if (
      (answers.recipient === 'coworker' || answers.recipient === 'teacher' || answers.interests.includes('office-workspace')) &&
      hasPriorityTag(idea, ['desk', 'office', 'organizer', 'tray', 'name-plate'])
    ) {
      score += 4;
    }

    if (
      answers.occasion === 'custom-gift' &&
      hasPriorityTag(idea, ['lithophane', 'photo-gift', 'name-sign', 'personalized'])
    ) {
      score += 5;
    }

    if (
      (answers.occasion === 'party-favor' || answers.occasion === 'classroom-prize') &&
      idea.tags.includes('bundle-friendly')
    ) {
      score += 4;
    }

    return score;
  };

  const getCombinationScore = (idea, answers, matchedInterests) => {
    let score = 0;
    if (matchedInterests.length >= 2) score += 5 + matchedInterests.length;

    if (matchedInterests.includes('desk-accessories') && matchedInterests.includes('personalized-items') && hasPriorityTag(idea, ['desk', 'name-plate', 'name-sign', 'organizer'])) {
      score += 5;
    }
    if (matchedInterests.includes('fidgets') && matchedInterests.includes('sensory-items') && hasPriorityTag(idea, ['fidget', 'sensory', 'clicker'])) {
      score += 5;
    }
    if (matchedInterests.includes('dragons') && matchedInterests.includes('fantasy') && hasPriorityTag(idea, ['dragon', 'fantasy'])) {
      score += 5;
    }
    if (matchedInterests.includes('dinosaurs') && matchedInterests.includes('fidgets') && hasPriorityTag(idea, ['dino', 'fidget'])) {
      score += 5;
    }

    return score;
  };

  const buildReasonBits = (idea, answers, matchedInterests) => {
    const bits = [];
    if (answers.recipient && idea.recipientTypes.includes(answers.recipient)) {
      bits.push('It suits a ' + labelFor('recipient', answers.recipient).toLowerCase() + ' gift really well.');
    }
    if (answers.occasion && idea.occasions.includes(answers.occasion)) {
      bits.push('It fits a ' + labelFor('occasion', answers.occasion).toLowerCase() + ' moment.');
    }
    if (matchedInterests.length) {
      bits.push('It lines up with ' + matchedInterests.map(interest => labelFor('interests', interest).toLowerCase()).join(', ') + '.');
    }
    if (answers.occasion === 'custom-gift' && idea.tags.includes('custom-friendly')) {
      bits.push('It also leaves room for a more custom version if you want to personalize it further.');
    }
    if ((answers.occasion === 'party-favor' || answers.occasion === 'classroom-prize') && idea.tags.includes('bundle-friendly')) {
      bits.push('It works well in multiples, which makes it easier for bundles, class sets, or party bags.');
    }
    return bits;
  };

  const getIdeaArtwork = idea => {
    const directArtwork = IDEA_ARTWORK_OVERRIDES[idea.id];
    if (directArtwork) {
      const tokens = idea.tags
        .map(tag => IDEA_TAG_LABELS[tag])
        .filter(Boolean)
        .filter((tag, index, tags) => tags.indexOf(tag) === index)
        .slice(0, 3);
      return { key: directArtwork.key, src: directArtwork.src, label: directArtwork.label, tokens };
    }

    const match = IDEA_ARTWORK_RULES.find(rule => rule.match(idea));
    const tokens = idea.tags
      .map(tag => IDEA_TAG_LABELS[tag])
      .filter(Boolean)
      .filter((tag, index, tags) => tags.indexOf(tag) === index)
      .slice(0, 3);
    const artwork = match || DEFAULT_ARTWORK;
    return { key: artwork.key, src: artwork.src, label: artwork.label, tokens };
  };

  const buildAnswersSummary = answers => [
    "Who it's for: " + (labelFor('recipient', answers.recipient) || 'Not specified'),
    'Occasion: ' + (labelFor('occasion', answers.occasion) || 'Not specified'),
    'Interests: ' + (answers.interests.length ? answers.interests.map(value => labelFor('interests', value)).join(', ') : 'Not specified'),
    'Anything else they like: ' + (answers.extraLikes && answers.extraLikes.trim() ? answers.extraLikes.trim() : 'No extra notes')
  ].join('\n');

  const buildRecommendationSummary = results =>
    results
      .map((idea, index) => (index + 1) + '. ' + idea.name + ' — ' + idea.shortDescription + ' Why it fits: ' + idea.whyThisFits)
      .join('\n');

  const readAnswersFromDom = () => ({
    recipient: quizFields.querySelector('input[name="recipient"]:checked')?.value || '',
    occasion: quizFields.querySelector('input[name="occasion"]:checked')?.value || '',
    interests: Array.from(quizFields.querySelectorAll('input[name="interests"]:checked')).map(input => input.value),
    extraLikes: quizFields.querySelector('textarea[name="extraLikes"]')?.value || ''
  });

  const updateLeadFormState = answers => {
    const favoriteIdeas = state.recommendations.filter(idea => state.favorites.includes(idea.id));
    const selectedLabels = favoriteIdeas.length
      ? favoriteIdeas.map(idea => idea.submissionLabel)
      : ['No specific favorite selected — please help choose from the recommendations shown.'];

    const selectedSummary = leadForm.querySelector('[data-selected-summary]');
    const selectedHidden = leadForm.querySelector('[name="gift_finder_selected_ideas"]');
    const answersHidden = leadForm.querySelector('[name="gift_finder_answers_summary"]');
    const resultsHidden = leadForm.querySelector('[name="gift_finder_recommendations_summary"]');

    if (selectedSummary) {
      selectedSummary.innerHTML = selectedLabels.map(label => '<span>' + label + '</span>').join('');
    }
    if (selectedHidden) selectedHidden.value = selectedLabels.join(', ');
    if (answersHidden) answersHidden.value = buildAnswersSummary(answers);
    if (resultsHidden) resultsHidden.value = buildRecommendationSummary(state.recommendations);
  };

  const renderResultsMeta = answers => {
    const interestLabels = answers.interests.length
      ? answers.interests.map(value => labelFor('interests', value)).join(', ')
      : 'Open-ended ideas';

    resultsMeta.innerHTML = [
      '<span>' + labelFor('recipient', answers.recipient) + ' gift</span>',
      '<span>' + labelFor('occasion', answers.occasion) + '</span>',
      '<span>' + interestLabels + '</span>'
    ].join('');
  };

  const renderResultCards = () => {
    resultsGrid.innerHTML = state.recommendations.map(idea => {
      const isSaved = state.favorites.includes(idea.id);
      const artwork = getIdeaArtwork(idea);
      const interestLine = idea.matchedInterests.length
        ? '<p class="idea-card-match">Strong matches: ' + idea.matchedInterests.map(interest => labelFor('interests', interest)).join(', ') + '</p>'
        : '';

      return (
        '<article class="idea-card">' +
          '<div class="idea-card-visual">' +
            '<p class="idea-card-type">Print idea</p>' +
            '<div class="idea-card-placeholder idea-card-photo">' +
              '<img src="' + artwork.src + '" alt="' + idea.name + ' concept image" loading="lazy">' +
            '</div>' +
            '<div class="idea-card-art-copy">' +
              '<span class="idea-card-art-label">' + artwork.label + '</span>' +
              '<div class="idea-card-art-tags">' +
                artwork.tokens.map(token => '<span>' + token + '</span>').join('') +
              '</div>' +
            '</div>' +
            '<span class="idea-card-badge">' + idea.badge + '</span>' +
          '</div>' +
          '<div class="idea-card-copy">' +
            '<h3>' + idea.name + '</h3>' +
            '<p class="idea-card-description">' + idea.shortDescription + '</p>' +
            interestLine +
            '<p class="idea-card-why"><strong>Why this fits:</strong> ' + idea.whyThisFits + '</p>' +
            '<div class="idea-card-meta">' +
              '<span>' + idea.internalCategory.replaceAll('-', ' ') + '</span>' +
              '<span>' + idea.customizationLevel + ' customization</span>' +
            '</div>' +
            '<button type="button" class="btn ' + (isSaved ? 'btn-primary' : 'btn-secondary') + ' idea-select-button" data-favorite-idea="' + idea.id + '">' +
              (isSaved ? 'Saved idea' : 'Save this idea') +
            '</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  };

  const validateAnswers = answers => {
    const missing = [];
    if (!answers.recipient) missing.push('who it is for');
    if (!answers.occasion) missing.push('the occasion');

    if (!missing.length) {
      quizMessage.hidden = true;
      return true;
    }

    quizMessage.textContent = 'Pick ' + missing.join(' and ') + ' so I can narrow the ideas down in a useful way.';
    quizMessage.hidden = false;
    return false;
  };

  const loadCatalog = async () => {
    if (state.catalog.length) return state.catalog;

    const response = await fetch('gift-finder/catalog.js?v=20260402d', { credentials: 'same-origin' });
    if (!response.ok) throw new Error('Unable to load gift finder catalog.');

    const text = await response.text();
    const start = text.indexOf('[');
    const end = text.lastIndexOf('];');
    if (start === -1 || end === -1) throw new Error('Gift finder catalog could not be parsed.');

    const arraySource = text.slice(start, end + 1);
    state.catalog = Function('"use strict"; return (' + arraySource + ');')();
    return state.catalog;
  };

  const recommendIdeas = (catalog, answers, limit) => {
    const safeLimit = Math.min(Math.max(limit, 3), 6);

    const rankedIdeas = catalog.map(idea => {
      const matchedInterests = answers.interests.filter(interest => idea.interests.includes(interest));
      const score =
        (answers.recipient && idea.recipientTypes.includes(answers.recipient) ? 4 : 0) +
        (answers.occasion && idea.occasions.includes(answers.occasion) ? 3 : 0) +
        (matchedInterests.length * 5) +
        getFreeTextScore(idea, answers) +
        (answers.occasion === 'custom-gift' && idea.tags.includes('custom-friendly') ? 3 : 0) +
        (['party-favor', 'classroom-prize'].includes(answers.occasion) && idea.tags.includes('bundle-friendly') ? 4 : 0) +
        getCombinationScore(idea, answers, matchedInterests) +
        getInterestPriorityScore(idea, answers) +
        getScenarioBoost(idea.id, answers);

      return {
        ...idea,
        score,
        matchedInterests,
        whyThisFits: [idea.whyItFits].concat(buildReasonBits(idea, answers, matchedInterests)).join(' ')
      };
    });

    rankedIdeas.sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.name.localeCompare(right.name);
    });

    const positiveIdeas = rankedIdeas.filter(idea => idea.score > 0);
    const candidateIdeas = positiveIdeas.length ? positiveIdeas : rankedIdeas;
    const selectedIdeas = [];
    const usedCategories = new Set();
    const coveredInterests = new Set();

    while (selectedIdeas.length < safeLimit && selectedIdeas.length < candidateIdeas.length) {
      let bestIdea = null;
      let bestAdjustedScore = -Infinity;

      candidateIdeas.forEach(idea => {
        if (selectedIdeas.some(selected => selected.id === idea.id)) return;

        let adjustedScore = idea.score;
        const uncoveredMatches = idea.matchedInterests.filter(interest => !coveredInterests.has(interest));

        adjustedScore += uncoveredMatches.length * 2;
        if (!usedCategories.has(idea.internalCategory)) adjustedScore += 1.5;
        if (usedCategories.has(idea.internalCategory) && selectedIdeas.length && !idea.matchedInterests.length) adjustedScore -= 2;

        if (adjustedScore > bestAdjustedScore) {
          bestAdjustedScore = adjustedScore;
          bestIdea = idea;
        }
      });

      if (!bestIdea) break;

      selectedIdeas.push(bestIdea);
      usedCategories.add(bestIdea.internalCategory);
      bestIdea.matchedInterests.forEach(interest => coveredInterests.add(interest));
    }

    return selectedIdeas;
  };

  const showSuccessBannerFromQuery = () => {
    if (!successBanner) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('giftFinderSent') !== '1') return;
    successBanner.hidden = false;
    successBanner.textContent = 'Thanks! Your ideas have been sent to Mitten Makes. I’ll review them and follow up with the best print options.';
  };

  quizForm.addEventListener('submit', async event => {
    event.preventDefault();
    const answers = readAnswersFromDom();
    if (!validateAnswers(answers)) return;

    try {
      const catalog = await loadCatalog();
      const desiredCount = answers.interests.length >= 3 ? 5 : 4;
      state.recommendations = recommendIdeas(catalog, answers, desiredCount);
      state.favorites = state.recommendations.length ? [state.recommendations[0].id] : [];

      renderResultsMeta(answers);
      renderResultCards();
      updateLeadFormState(answers);

      fallbackCopy.hidden = false;
      leadPanel.hidden = false;
      resultsSection.hidden = false;
      quizMessage.hidden = true;
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      console.error(error);
      quizMessage.textContent = 'The Gift Finder ran into a loading issue. Please refresh the page and try again.';
      quizMessage.hidden = false;
    }
  });

  quizForm.addEventListener('reset', event => {
    event.preventDefault();
    quizFields.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
      input.checked = false;
    });
    quizFields.querySelectorAll('textarea').forEach(textarea => {
      textarea.value = '';
    });
    state.recommendations = [];
    state.favorites = [];
    quizMessage.hidden = true;
    resultsSection.hidden = true;
    leadPanel.hidden = true;
    fallbackCopy.hidden = true;
  });

  resultsGrid.addEventListener('click', event => {
    const rawTarget = event.target;
    const target = rawTarget instanceof Element ? rawTarget : rawTarget && rawTarget.parentElement;
    const button = target && target.closest('[data-favorite-idea]');
    if (!button) return;

    const favoriteIdea = button.dataset.favoriteIdea;
    if (!favoriteIdea) return;

    if (state.favorites.includes(favoriteIdea)) {
      state.favorites = state.favorites.filter(id => id !== favoriteIdea);
    } else {
      state.favorites = state.favorites.concat(favoriteIdea);
    }

    renderResultCards();
    updateLeadFormState(readAnswersFromDom());
  });

  leadForm.addEventListener('submit', () => {
    updateLeadFormState(readAnswersFromDom());
  });

  showSuccessBannerFromQuery();
})();
