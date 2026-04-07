const EMOJI_COLORS: Record<string, string> = {
  // Vibes & Feelings
  '😎': '#FF9800', '🥺': '#90CAF9', '😡': '#F44336', '🥳': '#FF80AB',
  '😭': '#29B6F6', '🤯': '#FF4081', '😴': '#90A4AE', '🤪': '#FF6D00',
  '🤠': '#D7CCC8', '👽': '#69F0AE', '😈': '#BC00FF', '😇': '#FFF9C4',
  '😍': '#FF4081', '🤩': '#FFD740', '🫠': '#80DEEA', '🙃': '#CE93D8',
  '🤔': '#BCAAA4', '🥶': '#90CAF9', '🥵': '#FF5722', '🤢': '#69F0AE',
  '🤮': '#A5D6A7', '🤒': '#EF9A9A', '🤕': '#CFD8DC', '🤑': '#43A047',

  // Activities & Sports
  '🏄‍♂️': '#00BCD4', '🧗‍♀️': '#8D6E63', '🏂': '#78909C', '🧘‍♀️': '#CE93D8',
  '🎮': '#5E35B1', '🚗': '#EF5350', '🚀': '#651FFF', '✈️': '#1565C0',
  '⛵': '#4FC3F7', '⚽': '#37474F', '🏀': '#FF6D00', '🏈': '#BF360C',
  '🎾': '#CDDC39', '🥊': '#E53935', '🥋': '#EF5350', '🤿': '#0097A7',
  '🎣': '#0288D1', '🎯': '#D32F2F', '🎰': '#FDD835', '🎟️': '#FF8A65',
  '🎭': '#7E57C2', '🎢': '#FF4081',

  // Nature & Location
  '🏔️': '#90A4AE', '🌋': '#FF3D00', '⛺': '#558B2F', '🏖️': '#FFD54F',
  '🏜️': '#FF8A65', '🏝️': '#00ACC1', '🏙️': '#455A64', '🌃': '#283593',
  '🌉': '#1A237E', '🌌': '#311B92', '🌧️': '#5C9BD6', '⚡': '#FFD700',
  '🔥': '#FF4500', '🌊': '#0099FF', '🌴': '#00897B', '🌲': '#2E7D32',
  '🌵': '#558B2F', '🌻': '#FFD54F', '🌸': '#FF80AB', '🍂': '#E65100',
  '🍁': '#E64A19', '🍄': '#BF360C', '🌍': '#1565C0', '🪐': '#CE93D8',

  // Food & Drink
  '☕': '#6D4C41', '🍵': '#A5D6A7', '🍷': '#880E4F', '🥂': '#FFF9C4',
  '🍻': '#F9A825', '🍹': '#FF8A65', '🍕': '#FF7043', '🍔': '#A1887F',
  '🍟': '#FDD835', '🌮': '#FFB300', '🍣': '#EF9A9A', '🍦': '#F8BBD0',
  '🍩': '#FFCCBC', '🍪': '#D7CCC8', '🎂': '#F48FB1', '🍿': '#FFF9C4',
  '🍓': '#E53935', '🍉': '#EF5350', '🥑': '#558B2F', '🌶️': '#F44336',
  '🧀': '#FDD835', '🥩': '#E53935', '🍳': '#FF8F00', '🥞': '#FFCC80',

  // Music & Art
  '🎸': '#FF6E40', '🎧': '#7C4DFF', '🎹': '#E0E0E0', '🎨': '#FF4081',
  '🎬': '#212121', '🎤': '#E040FB', '🥁': '#FF7043', '🎷': '#FFB300',
  '📱': '#455A64', '💿': '#90A4AE', '📼': '#546E7A', '📻': '#78909C',
  '🎻': '#A1887F', '🎺': '#FFD54F', '🎼': '#5C6BC0', '🎵': '#00F2FF',
  '🎶': '#00BCD4', '📓': '#4CAF50', '📚': '#1565C0', '🖋️': '#37474F',
  '🖌️': '#FF6D00', '🖍️': '#FF8A65', '📸': '#9E9E9E', '📽️': '#37474F',
};

export function getGradientFromEmojis(emojiString: string): readonly [string, string, ...string[]] {
  let segments: string[] = [];
  try {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    segments = [...segmenter.segment(emojiString)].map(s => s.segment);
  } catch {
    segments = [...emojiString];
  }

  const emojis = segments.filter(s => s.trim() !== '' && (s.codePointAt(0) ?? 0) > 127);

  const colors = emojis
    .map(e => EMOJI_COLORS[e] ?? EMOJI_COLORS[e.replace(/\uFE0F/g, '')] ?? EMOJI_COLORS[e + '\uFE0F'])
    .filter(Boolean) as string[];

  if (colors.length === 0) return ['#1E293B', '#0F172A'];
  if (colors.length === 1) return [colors[0], darken(colors[0])];

  return colors.slice(0, 4) as unknown as readonly [string, string, ...string[]];
}

function darken(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - 60);
  const g = Math.max(0, ((n >> 8) & 0xff) - 60);
  const b = Math.max(0, (n & 0xff) - 60);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
