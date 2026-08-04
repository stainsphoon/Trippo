/**
 * Utility to attach correct Korean subject/topic/object particles to words.
 * Handles Hangul final consonants (jongseong) dynamically while preventing awkward
 * placeholder suffixes like "파리은(는)".
 */
export function formatWithJosa(word: string, josaPattern: '은/는' | '이/가' | '을/를' | '과/와' | '으로/로'): string {
  if (!word || typeof word !== 'string') return word || '';
  const trimmed = word.trim();
  if (!trimmed) return '';

  const lastChar = trimmed.charAt(trimmed.length - 1);
  const code = lastChar.charCodeAt(0);

  // Check if Hangul syllable (0xAC00 ~ 0xD7A3)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const hasJongseong = (code - 0xac00) % 28 !== 0;
    switch (josaPattern) {
      case '은/는':
        return trimmed + (hasJongseong ? '은' : '는');
      case '이/가':
        return trimmed + (hasJongseong ? '이' : '가');
      case '을/를':
        return trimmed + (hasJongseong ? '을' : '를');
      case '과/와':
        return trimmed + (hasJongseong ? '과' : '와');
      case '으로/로':
        const jongseongIndex = (code - 0xac00) % 28;
        return trimmed + (hasJongseong && jongseongIndex !== 8 ? '으로' : '로');
    }
  }

  // Fallback for non-Hangul (English or Latin character names e.g. "Paris", "Tokyo"):
  // Default to vowel-style ending to maintain natural flow without ugly "(는)" placeholders
  switch (josaPattern) {
    case '은/는': return trimmed + '는';
    case '이/가': return trimmed + '가';
    case '을/를': return trimmed + '를';
    case '과/와': return trimmed + '와';
    case '으로/로': return trimmed + '로';
  }
}

/**
 * Generates natural particle-free city phrasing templates to prevent awkward particle edge cases.
 * Examples:
 * - "8월의 파리는..."
 * - "이번 도쿄 여행은..."
 * - "선택한 기간의 런던은..."
 */
export function formatCityTravelPhrase(cityName: string, startDate?: string, lang: 'ko' | 'en' = 'ko'): string {
  if (lang === 'en') return cityName;
  
  if (startDate && startDate.includes('-')) {
    const month = parseInt(startDate.split('-')[1], 10);
    if (!isNaN(month)) {
      return `${month}월의 ${cityName}`;
    }
  }
  return `이번 ${cityName} 여행`;
}
