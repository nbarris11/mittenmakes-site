import {
  GIFT_FINDER_DEFAULTS,
  GIFT_FINDER_QUESTIONS,
  QUESTION_LABELS
} from './questions.js';
import { recommendIdeas } from './engine.js';
import {
  showSuccessBannerFromQuery,
  updateLeadFormState,
  wireLeadForm
} from './submit.js';

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
  throw new Error('Gift Finder UI is missing required markup.');
}

const state = {
  answers: { ...GIFT_FINDER_DEFAULTS },
  recommendations: [],
  favorites: []
};

const labelFor = (questionId, value) =>
  QUESTION_LABELS[questionId]?.[value] || value;

const IDEA_ARTWORK_RULES = [
  {
    className: 'art-dragon',
    icon: '🐉',
    label: 'Fantasy creature concept',
    match: idea => idea.tags.includes('dragon') || idea.tags.includes('fantasy')
  },
  {
    className: 'art-dino',
    icon: '🦖',
    label: 'Dino-friendly print idea',
    match: idea => idea.tags.includes('dino')
  },
  {
    className: 'art-fidget',
    icon: '✨',
    label: 'Tactile fidget direction',
    match: idea => idea.tags.includes('fidget') || idea.tags.includes('sensory') || idea.tags.includes('clicker')
  },
  {
    className: 'art-bookmark',
    icon: '📚',
    label: 'Reading-themed extra',
    match: idea => idea.tags.includes('bookmark')
  },
  {
    className: 'art-photo',
    icon: '🖼️',
    label: 'Photo-based keepsake',
    match: idea => idea.tags.includes('photo-gift') || idea.tags.includes('lithophane')
  },
  {
    className: 'art-sign',
    icon: '✏️',
    label: 'Personalized display idea',
    match: idea => idea.tags.includes('name-sign') || idea.tags.includes('name-plate') || idea.tags.includes('personalized')
  },
  {
    className: 'art-desk',
    icon: '🗂️',
    label: 'Desk-ready print idea',
    match: idea => idea.tags.includes('desk') || idea.tags.includes('office') || idea.tags.includes('organizer') || idea.tags.includes('tray')
  },
  {
    className: 'art-keychain',
    icon: '🔑',
    label: 'Clip-on gift idea',
    match: idea => idea.tags.includes('keychain') || idea.tags.includes('bag-tag')
  },
  {
    className: 'art-space',
    icon: '🚀',
    label: 'Space or science pick',
    match: idea => idea.tags.includes('space') || idea.tags.includes('science') || idea.tags.includes('rocket') || idea.tags.includes('moon')
  },
  {
    className: 'art-sports',
    icon: '🏅',
    label: 'Sports-themed concept',
    match: idea => idea.tags.includes('sports')
  },
  {
    className: 'art-music',
    icon: '🎵',
    label: 'Music-inspired idea',
    match: idea => idea.tags.includes('music') || idea.tags.includes('note')
  },
  {
    className: 'art-spooky',
    icon: '🕸️',
    label: 'Moody collectible vibe',
    match: idea => idea.tags.includes('spooky') || idea.tags.includes('goth')
  },
  {
    className: 'art-bundle',
    icon: '🎉',
    label: 'Set or bundle direction',
    match: idea => idea.tags.includes('bundle-friendly') || idea.tags.includes('tokens')
  },
  {
    className: 'art-animal',
    icon: '🐾',
    label: 'Creature gift direction',
    match: idea => idea.tags.includes('animal') || idea.tags.includes('creature')
  }
];

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
  custom-friendly: 'customizable'
};

const getIdeaArtwork = idea => {
  const match = IDEA_ARTWORK_RULES.find(rule => rule.match(idea));
  const className = match?.className || 'art-default';
  const icon = match?.icon || '🎁';
  const label = match?.label || 'Made-to-order print idea';
  const tokens = idea.tags
    .map(tag => IDEA_TAG_LABELS[tag])
    .filter(Boolean)
    .filter((tag, index, tags) => tags.indexOf(tag) === index)
    .slice(0, 3);

  return { className, icon, label, tokens };
};

const renderQuestion = question => {
  if (question.type === 'single-chip') {
    return `
      <section class="gift-finder-question" data-question="${question.id}">
        <div class="gift-finder-question-head">
          <h3>${question.label}</h3>
          ${question.helper ? `<p>${question.helper}</p>` : ''}
        </div>
        <div class="gift-choice-group" role="group" aria-label="${question.label}">
          ${question.options.map(option => `
            <button
              type="button"
              class="gift-choice-chip"
              data-question-id="${question.id}"
              data-value="${option.value}"
              aria-pressed="false"
            >
              ${option.label}
            </button>
          `).join('')}
        </div>
      </section>
    `;
  }

  if (question.type === 'multi-chip') {
    return `
      <section class="gift-finder-question gift-finder-question-wide" data-question="${question.id}">
        <div class="gift-finder-question-head">
          <h3>${question.label}</h3>
          ${question.helper ? `<p>${question.helper}</p>` : ''}
        </div>
        <div class="gift-choice-group" role="group" aria-label="${question.label}">
          ${question.options.map(option => `
            <button
              type="button"
              class="gift-choice-chip gift-choice-chip-soft"
              data-question-id="${question.id}"
              data-value="${option.value}"
              aria-pressed="false"
            >
              ${option.label}
            </button>
          `).join('')}
        </div>
      </section>
    `;
  }

  if (question.type === 'select') {
    return `
      <label class="gift-finder-question" data-question="${question.id}">
        <span class="gift-finder-question-title">${question.label}</span>
        <select class="gift-finder-select" name="${question.id}">
          <option value="">Choose one</option>
          ${question.options.map(option => `
            <option value="${option.value}">${option.label}</option>
          `).join('')}
        </select>
      </label>
    `;
  }

  if (question.type === 'text') {
    return `
      <label class="gift-finder-question gift-finder-question-wide" data-question="${question.id}">
        <span class="gift-finder-question-title">${question.label}</span>
        <textarea
          class="gift-finder-textarea"
          name="${question.id}"
          rows="3"
          placeholder="${question.placeholder || ''}"
        ></textarea>
        ${question.helper ? `<small>${question.helper}</small>` : ''}
      </label>
    `;
  }

  return '';
};

const renderQuiz = () => {
  quizFields.innerHTML = GIFT_FINDER_QUESTIONS.map(renderQuestion).join('');
};

const updateChipStates = () => {
  quizFields.querySelectorAll('[data-question-id]').forEach(button => {
    const questionId = button.dataset.questionId;
    const value = button.dataset.value;
    const answer = state.answers[questionId];
    const isActive = Array.isArray(answer)
      ? answer.includes(value)
      : answer === value;

    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  quizFields.querySelectorAll('select').forEach(select => {
    select.value = state.answers[select.name] || '';
  });

  quizFields.querySelectorAll('textarea').forEach(textarea => {
    textarea.value = state.answers[textarea.name] || '';
  });
};

const validateAnswers = () => {
  const missing = GIFT_FINDER_QUESTIONS
    .filter(question => question.required)
    .filter(question => {
      const value = state.answers[question.id];
      return Array.isArray(value) ? value.length === 0 : !value;
    });

  if (!missing.length) return true;

  quizMessage.textContent = `Pick ${missing
    .map(question => question.label.toLowerCase())
    .join(', ')} so I can narrow the ideas down in a useful way.`;
  quizMessage.hidden = false;
  return false;
};

const renderResultsMeta = () => {
  const interestLabels = state.answers.interests.length
    ? state.answers.interests.map(value => labelFor('interests', value)).join(', ')
    : 'Open-ended ideas';

  resultsMeta.innerHTML = [
    `<span>${labelFor('recipient', state.answers.recipient)} gift</span>`,
    `<span>${labelFor('occasion', state.answers.occasion)}</span>`,
    `<span>${interestLabels}</span>`
  ].join('');
};

const renderResultCards = () => {
  resultsGrid.innerHTML = state.recommendations.map(idea => {
    const isSaved = state.favorites.includes(idea.id);
    const artwork = getIdeaArtwork(idea);
    const interestLine = idea.matchedInterests.length
      ? `<p class="idea-card-match">Strong matches: ${idea.matchedInterests.map(interest => labelFor('interests', interest)).join(', ')}</p>`
      : '';

    return `
      <article class="idea-card">
        <div class="idea-card-visual">
          <p class="idea-card-type">Print idea</p>
          <div class="idea-card-placeholder ${artwork.className}">
            <span class="idea-card-art-icon" aria-hidden="true">${artwork.icon}</span>
            <span class="idea-card-art-label">${artwork.label}</span>
            <div class="idea-card-art-tags">
              ${artwork.tokens.map(token => `<span>${token}</span>`).join('')}
            </div>
          </div>
          <span class="idea-card-badge">${idea.badge}</span>
        </div>
        <div class="idea-card-copy">
          <h3>${idea.name}</h3>
          <p class="idea-card-description">${idea.shortDescription}</p>
          ${interestLine}
          <p class="idea-card-why"><strong>Why this fits:</strong> ${idea.whyThisFits}</p>
          <div class="idea-card-meta">
            <span>${idea.internalCategory.replaceAll('-', ' ')}</span>
            <span>${idea.customizationLevel} customization</span>
          </div>
          <button
            type="button"
            class="btn ${isSaved ? 'btn-primary' : 'btn-secondary'} idea-select-button"
            data-favorite-idea="${idea.id}"
          >
            ${isSaved ? 'Saved idea' : 'Save this idea'}
          </button>
        </div>
      </article>
    `;
  }).join('');
};

const syncLeadArea = () => {
  updateLeadFormState({
    form: leadForm,
    answers: state.answers,
    recommendations: state.recommendations,
    favorites: state.favorites
  });

  fallbackCopy.hidden = false;
  leadPanel.hidden = false;
};

const applyRecommendations = () => {
  const desiredCount = state.answers.interests.length >= 3 ? 5 : 4;
  state.recommendations = recommendIdeas(state.answers, desiredCount);
  state.favorites = state.recommendations.length ? [state.recommendations[0].id] : [];

  renderResultsMeta();
  renderResultCards();
  syncLeadArea();

  resultsSection.hidden = false;
  quizMessage.hidden = true;
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const clearFinder = () => {
  state.answers = { ...GIFT_FINDER_DEFAULTS };
  state.recommendations = [];
  state.favorites = [];
  quizMessage.hidden = true;
  resultsSection.hidden = true;
  leadPanel.hidden = true;
  fallbackCopy.hidden = true;
  renderQuiz();
  updateChipStates();
};

quizFields.addEventListener('click', event => {
  const button = event.target.closest('[data-question-id]');
  if (!button) return;

  const { questionId, value } = button.dataset;
  const question = GIFT_FINDER_QUESTIONS.find(item => item.id === questionId);
  if (!question) return;

  if (question.type === 'multi-chip') {
    const current = new Set(state.answers[questionId]);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    state.answers[questionId] = Array.from(current);
  } else {
    state.answers[questionId] = value;
  }

  updateChipStates();
});

quizFields.addEventListener('change', event => {
  const field = event.target;
  if (!(field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
  state.answers[field.name] = field.value;
});

quizForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateAnswers()) return;
  applyRecommendations();
});

quizForm.addEventListener('reset', event => {
  event.preventDefault();
  clearFinder();
});

resultsGrid.addEventListener('click', event => {
  const button = event.target.closest('[data-favorite-idea]');
  if (!button) return;

  const { favoriteIdea } = button.dataset;
  if (!favoriteIdea) return;

  if (state.favorites.includes(favoriteIdea)) {
    state.favorites = state.favorites.filter(id => id !== favoriteIdea);
  } else {
    state.favorites = [...state.favorites, favoriteIdea];
  }

  renderResultCards();
  syncLeadArea();
});

wireLeadForm({
  form: leadForm,
  getState: () => state
});

renderQuiz();
updateChipStates();
showSuccessBannerFromQuery(successBanner);
