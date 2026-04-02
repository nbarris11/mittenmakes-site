// Question configuration for the Mitten Makes Gift Finder.
// Version 1 stays deterministic and editable so the recommendation flow
// can grow without needing a live AI service.

export const GIFT_FINDER_QUESTIONS = [
  {
    id: 'recipient',
    label: 'Who is it for?',
    type: 'single-chip',
    required: true,
    helper: 'Pick the closest fit so the ideas feel more tailored.',
    options: [
      { value: 'kid', label: 'Kid' },
      { value: 'teen', label: 'Teen' },
      { value: 'adult', label: 'Adult' },
      { value: 'parent', label: 'Parent' },
      { value: 'teacher', label: 'Teacher' },
      { value: 'coworker', label: 'Coworker' },
      { value: 'friend', label: 'Friend' },
      { value: 'other', label: 'Other' }
    ]
  },
  {
    id: 'occasion',
    label: 'Occasion',
    type: 'single-chip',
    required: true,
    helper: 'Pick the main reason you are shopping, even if it could fit more than one.',
    options: [
      { value: 'birthday', label: 'Birthday' },
      { value: 'holiday', label: 'Holiday' },
      { value: 'thank-you', label: 'Thank you' },
      { value: 'party-favor', label: 'Party favor' },
      { value: 'classroom-prize', label: 'Classroom/prize' },
      { value: 'desk-toy', label: 'Desk toy' },
      { value: 'just-because', label: 'Just because' },
      { value: 'custom-gift', label: 'Custom gift' }
    ]
  },
  {
    id: 'interests',
    label: 'Interests',
    type: 'multi-chip',
    helper: 'Pick as many as fit. The results will blend them together.',
    options: [
      { value: 'dinosaurs', label: 'Dinosaurs' },
      { value: 'dragons', label: 'Dragons' },
      { value: 'animals', label: 'Animals' },
      { value: 'pets', label: 'Pets' },
      { value: 'space-science', label: 'Space/science' },
      { value: 'bugs-nature', label: 'Bugs/nature' },
      { value: 'sports', label: 'Sports' },
      { value: 'fidgets', label: 'Fidgets' },
      { value: 'sensory-items', label: 'Sensory items' },
      { value: 'desk-accessories', label: 'Desk accessories' },
      { value: 'cute-decor', label: 'Cute decor' },
      { value: 'fantasy', label: 'Fantasy' },
      { value: 'personalized-items', label: 'Personalized items' },
      { value: 'video-games', label: 'Video games' },
      { value: 'books-reading', label: 'Books/reading' },
      { value: 'office-workspace', label: 'Office/workspace' },
      { value: 'school-classroom', label: 'School/classroom' },
      { value: 'art-design', label: 'Art/design' },
      { value: 'music', label: 'Music' },
      { value: 'travel', label: 'Travel' },
      { value: 'spooky-goth', label: 'Spooky/goth' }
    ]
  },
  {
    id: 'extraLikes',
    label: 'Anything else they like?',
    type: 'text',
    placeholder: 'Favorite colors, themes, hobbies, inside jokes, room style, team, etc.',
    helper: 'Optional, but helpful when the best idea is more custom than obvious.'
  }
];

export const GIFT_FINDER_DEFAULTS = {
  recipient: '',
  occasion: '',
  interests: [],
  extraLikes: ''
};

export const QUESTION_LABELS = Object.fromEntries(
  GIFT_FINDER_QUESTIONS.map(question => [
    question.id,
    Object.fromEntries((question.options || []).map(option => [option.value, option.label]))
  ])
);
