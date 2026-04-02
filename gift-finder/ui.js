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

  resultsMeta.innerHTML = `
    <span>${labelFor('recipient', state.answers.recipient)} gift</span>
    <span>${labelFor('occasion', state.answers.occasion)}</span>
    <span>${labelFor('budget', state.answers.budget)}</span>
    <span>${interestLabels}</span>
  `;
};

const renderResultCards = () => {
  resultsGrid.innerHTML = state.recommendations.map(idea => {
    const isSaved = state.favorites.includes(idea.id);
    const interestLine = idea.matchedInterests.length
      ? `<p class="idea-card-match">Strong matches: ${idea.matchedInterests.map(interest => labelFor('interests', interest)).join(', ')}</p>`
      : '';

    return `
      <article class="idea-card">
        <div class="idea-card-visual">
          <p class="idea-card-type">Print idea</p>
          <div class="idea-card-placeholder">${idea.imagePlaceholder}</div>
          <span class="idea-card-badge">${idea.badge}</span>
        </div>
        <div class="idea-card-copy">
          <h3>${idea.name}</h3>
          <p class="idea-card-description">${idea.shortDescription}</p>
          ${interestLine}
          <p class="idea-card-why"><strong>Why this fits:</strong> ${idea.whyThisFits}</p>
          <div class="idea-card-meta">
            <span>${idea.budgets.map(budget => labelFor('budget', budget)).join(' · ')}</span>
            <span>${idea.internalCategory.replaceAll('-', ' ')}</span>
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
  state.recommendations = recommendIdeas(state.answers, 4);
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
