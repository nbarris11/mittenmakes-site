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
    id: 'ageRange',
    label: 'Age range',
    type: 'select',
    required: true,
    options: [
      { value: '3-5', label: '3-5' },
      { value: '6-8', label: '6-8' },
      { value: '9-12', label: '9-12' },
      { value: '13-17', label: '13-17' },
      { value: '18-29', label: '18-29' },
      { value: '30-49', label: '30-49' },
      { value: '50+', label: '50+' }
    ]
  },
  {
    id: 'occasion',
    label: 'Occasion',
    type: 'select',
    required: true,
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
    helper: 'Pick a few. The more specific you get, the more useful the ideas become.',
    options: [
      { value: 'dinosaurs', label: 'Dinosaurs' },
      { value: 'dragons', label: 'Dragons' },
      { value: 'animals', label: 'Animals' },
      { value: 'sports', label: 'Sports' },
      { value: 'fidgets', label: 'Fidgets' },
      { value: 'sensory-items', label: 'Sensory items' },
      { value: 'desk-accessories', label: 'Desk accessories' },
      { value: 'cute-decor', label: 'Cute decor' },
      { value: 'fantasy', label: 'Fantasy' },
      { value: 'personalized-items', label: 'Personalized items' },
      { value: 'video-games', label: 'Video games' },
      { value: 'books-reading', label: 'Books/reading' },
      { value: 'office-workspace', label: 'Office/workspace' }
    ]
  },
  {
    id: 'budget',
    label: 'Budget',
    type: 'single-chip',
    required: true,
    options: [
      { value: 'under-10', label: 'Under $10' },
      { value: '10-20', label: '$10-$20' },
      { value: '20-35', label: '$20-$35' },
      { value: '35-plus', label: '$35+' }
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
  ageRange: '',
  occasion: '',
  interests: [],
  budget: '',
  extraLikes: ''
};

export const QUESTION_LABELS = Object.fromEntries(
  GIFT_FINDER_QUESTIONS.map(question => [
    question.id,
    Object.fromEntries((question.options || []).map(option => [option.value, option.label]))
  ])
);
