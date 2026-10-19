// The three books the library starts with.
// Edit this file to change the starting collection. Once the app has run in a
// browser, the collection lives in that browser's localStorage (see storage.js),
// so changes here only show up after "Reset library" or in a fresh browser.
//
// `teachings` is plain text: one teaching per line.
// `reflections` is left empty on purpose — that page is yours to write.

export const DEFAULT_BOOKS = [
  {
    id: 'self-compassion',
    title: 'Self-Compassion',
    author: 'Kristin Neff',
    theme: { cover: '#d99ea4', accent: '#e2bd72' },
    size: { height: 0.7, thickness: 0.15 },
    teachings: [
      'Self-compassion has three parts: self-kindness instead of harsh self-judgment, a sense of common humanity instead of isolation, and mindfulness instead of over-identifying with painful thoughts.',
      'Unlike self-esteem, it does not depend on being special or above average — it is there for you most when you fail.',
      'Treating yourself the way you would treat a good friend is not self-indulgence; it makes it easier to own mistakes and try again.',
      'Imperfection is part of the shared human experience — struggling does not mean something is uniquely wrong with you.',
      'A short "self-compassion break" in a hard moment: name that this hurts, remember others feel this too, and offer yourself a kind word.',
    ].join('\n'),
    reflections: '',
    createdAt: '2026-10-19T00:00:00.000Z',
  },
  {
    id: 'attached',
    title: 'Attached',
    author: 'Amir Levine & Rachel Heller',
    theme: { cover: '#1d5c75', accent: '#8fd8cc' },
    size: { height: 0.66, thickness: 0.13 },
    teachings: [
      'Adult attachment tends to fall into three broad styles: secure, anxious and avoidant — and none of them is a character flaw.',
      'Needing closeness is normal. Feeling safely connected to a partner lets people be more independent, not less.',
      'Anxious and avoidant patterns can lock into a cycle: one pursues, the other withdraws, and both feel worse.',
      '"Protest behaviour" (keeping score, withdrawing, trying to make someone jealous) is a bid for connection that usually backfires.',
      'Effective communication means stating needs plainly and calmly — the response tells you whether they can be met.',
      'Partners with a secure style can help others feel safer over time.',
    ].join('\n'),
    reflections: '',
    createdAt: '2026-10-19T00:00:01.000Z',
  },
  {
    id: 'mans-search-for-meaning',
    title: "Man's Search for Meaning",
    author: 'Viktor E. Frankl',
    theme: { cover: '#24452f', accent: '#d1ad62' },
    size: { height: 0.62, thickness: 0.11 },
    teachings: [
      'Frankl survived Nazi concentration camps and saw that those who held on to a reason to live were better able to endure.',
      'Even when everything else is taken away, a person keeps the freedom to choose their attitude toward their circumstances.',
      'Logotherapy holds that our deepest drive is the will to meaning, not pleasure or power.',
      'Meaning can be found in three ways: through creating or doing something, through loving someone or experiencing something, and through the stance we take toward suffering we cannot avoid.',
      'Meaning is not something to invent in the abstract — life asks us questions, and we answer by how we act.',
    ].join('\n'),
    reflections: '',
    createdAt: '2026-10-19T00:00:02.000Z',
  },
]
