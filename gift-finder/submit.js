import { buildAnswersSummary, buildRecommendationSummary } from './engine.js';

export const GIFT_FINDER_SUCCESS_MESSAGE =
  'Thanks! Your ideas have been sent to Mitten Makes. I’ll review them and follow up with the best print options.';

export const updateLeadFormState = ({
  form,
  answers,
  recommendations,
  favorites
}) => {
  if (!form) return;

  const favoriteIdeas = recommendations.filter(idea => favorites.includes(idea.id));
  const selectedLabels = favoriteIdeas.length
    ? favoriteIdeas.map(idea => idea.submissionLabel)
    : ['No specific favorite selected — please help choose from the recommendations shown.'];

  const selectedSummary = form.querySelector('[data-selected-summary]');
  const selectedHidden = form.querySelector('[name="gift_finder_selected_ideas"]');
  const answersHidden = form.querySelector('[name="gift_finder_answers_summary"]');
  const resultsHidden = form.querySelector('[name="gift_finder_recommendations_summary"]');

  if (selectedSummary) {
    selectedSummary.innerHTML = selectedLabels
      .map(label => `<span>${label}</span>`)
      .join('');
  }

  if (selectedHidden) {
    selectedHidden.value = selectedLabels.join(', ');
  }

  if (answersHidden) {
    answersHidden.value = buildAnswersSummary(answers);
  }

  if (resultsHidden) {
    resultsHidden.value = buildRecommendationSummary(recommendations);
  }
};

export const wireLeadForm = ({ form, getState }) => {
  if (!form) return;

  form.addEventListener('submit', () => {
    const state = getState();
    updateLeadFormState({
      form,
      answers: state.answers,
      recommendations: state.recommendations,
      favorites: state.favorites
    });
  });
};

export const showSuccessBannerFromQuery = banner => {
  if (!banner) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get('giftFinderSent') !== '1') return;

  banner.hidden = false;
  banner.textContent = GIFT_FINDER_SUCCESS_MESSAGE;
};
