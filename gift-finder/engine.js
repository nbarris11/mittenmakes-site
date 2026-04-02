import { GIFT_FINDER_CATALOG } from './catalog.js';
import { QUESTION_LABELS } from './questions.js';

const INTEREST_PRIORITIES = {
  dragons: ['dragon', 'fantasy', 'articulated-dragons'],
  dinosaurs: ['dino'],
  animals: ['animal', 'creature'],
  fidgets: ['fidget', 'sensory'],
  'sensory-items': ['sensory', 'fidget'],
  'personalized-items': ['personalized', 'name-sign', 'name-plate', 'photo-gift', 'bag-tag'],
  'desk-accessories': ['desk', 'office', 'organizer', 'tray', 'name-plate'],
  'office-workspace': ['desk', 'office', 'organizer', 'tray', 'name-plate'],
  fantasy: ['fantasy', 'dragon'],
  sports: ['sports'],
  'video-games': ['gamer'],
  'books-reading': ['bookmark', 'classroom']
};

const LABEL_OVERRIDES = {
  'under-10': 'under $10',
  '10-20': '$10-$20',
  '20-35': '$20-$35',
  '35-plus': '$35+',
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
  'office-workspace': 'office/workspace'
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

const complexityPenalty = {
  low: 0,
  medium: 0,
  high: 0
};

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

const labelFor = (questionId, value) => {
  if (!value) return '';
  return QUESTION_LABELS[questionId]?.[value] || LABEL_OVERRIDES[value] || value;
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
    if (hasPriorityTag(idea, relatedTags)) {
      score += 4;
    }
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

  if (answers.budget === 'under-10') {
    if (hasPriorityTag(idea, ['small-gift', 'low-print-time', 'keychain', 'bookmark', 'mini', 'fidget'])) {
      score += 4;
    }

    if (idea.complexity === 'medium') {
      score -= 3;
    }

    if (idea.complexity === 'high') {
      score -= 7;
    }
  }

  if (answers.budget === '10-20' && idea.complexity === 'high') {
    score -= 2;
  }

  if (
    (answers.occasion === 'party-favor' || answers.occasion === 'classroom-prize') &&
    idea.tags.includes('bundle-friendly')
  ) {
    score += 4;
  }

  return score;
};

const buildReasonBits = (idea, answers, matchedInterests) => {
  const bits = [];

  if (answers.recipient && idea.recipientTypes.includes(answers.recipient)) {
    bits.push(`It suits a ${labelFor('recipient', answers.recipient).toLowerCase()} gift really well.`);
  }

  if (answers.occasion && idea.occasions.includes(answers.occasion)) {
    bits.push(`It fits a ${labelFor('occasion', answers.occasion).toLowerCase()} moment.`);
  }

  if (matchedInterests.length) {
    bits.push(`It lines up with ${matchedInterests.map(interest => labelFor('interests', interest).toLowerCase()).join(', ')}.`);
  }

  if (answers.budget && idea.budgets.includes(answers.budget)) {
    bits.push(`It stays in the ${labelFor('budget', answers.budget)} range.`);
  }

  if (answers.occasion === 'custom-gift' && idea.tags.includes('custom-friendly')) {
    bits.push('It also leaves room for a more custom version if you want to personalize it further.');
  }

  if ((answers.occasion === 'party-favor' || answers.occasion === 'classroom-prize') && idea.tags.includes('bundle-friendly')) {
    bits.push('It works well in multiples, which makes it easier for bundles, class sets, or party bags.');
  }

  return bits;
};

const summarizeIdeaForResults = (idea, answers, score, matchedInterests) => ({
  ...idea,
  score,
  matchedInterests,
  whyThisFits: [idea.whyItFits, ...buildReasonBits(idea, answers, matchedInterests)].join(' ')
});

export const buildAnswersSummary = answers => {
  const lines = [
    `Who it's for: ${labelFor('recipient', answers.recipient) || 'Not specified'}`,
    `Age range: ${labelFor('ageRange', answers.ageRange) || 'Not specified'}`,
    `Occasion: ${labelFor('occasion', answers.occasion) || 'Not specified'}`,
    `Interests: ${answers.interests.length ? answers.interests.map(value => labelFor('interests', value)).join(', ') : 'Not specified'}`,
    `Budget: ${labelFor('budget', answers.budget) || 'Not specified'}`,
    `Anything else they like: ${answers.extraLikes?.trim() || 'No extra notes'}`
  ];

  return lines.join('\n');
};

export const buildRecommendationSummary = results =>
  results
    .map((idea, index) => `${index + 1}. ${idea.name} — ${idea.shortDescription} Why it fits: ${idea.whyThisFits}`)
    .join('\n');

export const recommendIdeas = (answers, limit = 4) => {
  const safeLimit = Math.min(Math.max(limit, 3), 6);
  const normalizedAnswers = {
    recipient: answers.recipient || '',
    ageRange: answers.ageRange || '',
    occasion: answers.occasion || '',
    interests: Array.isArray(answers.interests) ? answers.interests : [],
    budget: answers.budget || '',
    extraLikes: answers.extraLikes || ''
  };

  const rankedIdeas = GIFT_FINDER_CATALOG.map(idea => {
    const matchedInterests = normalizedAnswers.interests.filter(interest => idea.interests.includes(interest));
    const score =
      (normalizedAnswers.recipient && idea.recipientTypes.includes(normalizedAnswers.recipient) ? 4 : 0) +
      (normalizedAnswers.ageRange && idea.ageRanges.includes(normalizedAnswers.ageRange) ? 4 : 0) +
      (normalizedAnswers.occasion && idea.occasions.includes(normalizedAnswers.occasion) ? 3 : 0) +
      (matchedInterests.length * 5) +
      (normalizedAnswers.budget && idea.budgets.includes(normalizedAnswers.budget) ? 3 : 0) +
      getFreeTextScore(idea, normalizedAnswers) +
      (normalizedAnswers.occasion === 'custom-gift' && idea.tags.includes('custom-friendly') ? 3 : 0) +
      (['party-favor', 'classroom-prize'].includes(normalizedAnswers.occasion) && idea.tags.includes('bundle-friendly') ? 4 : 0) +
      getInterestPriorityScore(idea, normalizedAnswers) +
      getScenarioBoost(idea.id, normalizedAnswers) +
      (complexityPenalty[idea.complexity] || 0);

    return summarizeIdeaForResults(idea, normalizedAnswers, score, matchedInterests);
  });

  rankedIdeas.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (left.complexity !== right.complexity) {
      const complexityOrder = { low: 0, medium: 1, high: 2 };
      return complexityOrder[left.complexity] - complexityOrder[right.complexity];
    }
    return left.name.localeCompare(right.name);
  });

  const positiveIdeas = rankedIdeas.filter(idea => idea.score > 0);
  return (positiveIdeas.length ? positiveIdeas : rankedIdeas).slice(0, safeLimit);
};
