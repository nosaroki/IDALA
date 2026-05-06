export const PRATIQUES = [
  { value: 'yoga',                fr: 'Yoga',                  en: 'Yoga' },
  { value: 'osteotherapy',        fr: 'Ostéothérapie',         en: 'Osteotherapy' },
  { value: 'therapeutic-massage', fr: 'Massage Thérapeutique', en: 'Therapeutic Massage' },
  { value: 'acupuncture',         fr: 'Acupuncture',           en: 'Acupuncture' },
  { value: 'tai-chi',             fr: 'Tai Chi',               en: 'Tai Chi' },
  { value: 'qi-gong',             fr: 'Qi Gong',               en: 'Qi Gong' },
  { value: 'meditation',          fr: 'Méditation',            en: 'Meditation' },
  { value: 'breathwork',          fr: 'Breathwork',            en: 'Breathwork' },
  { value: 'coaching',            fr: 'Coaching',              en: 'Coaching' },
  { value: 'hypnotherapy',        fr: 'Hypnothérapie',         en: 'Hypnotherapy' },
  { value: 'reiki',               fr: 'Reiki',                 en: 'Reiki' },
  { value: 'sound-healing',       fr: 'Sound Healing',         en: 'Sound Healing' },
  { value: 'naturopathy',         fr: 'Naturopathie',          en: 'Naturopathy' },
]

// Mapping rapide slug → labels (pour des lookups O(1))
export const PRATIQUES_LABELS = PRATIQUES.reduce((acc, p) => {
  acc[p.value] = { fr: p.fr, en: p.en }
  return acc
}, {})

// Helper pour obtenir le label dans une langue
export function getPratiqueLabel(slug, lang = 'fr') {
  return PRATIQUES_LABELS[slug]?.[lang] || slug
}
