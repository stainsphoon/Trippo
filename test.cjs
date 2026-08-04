const formatDurationByLanguage = (durationStr, language) => {
  if (!durationStr) return language === 'ko' ? '-' : '-';
  
  const cleaned = durationStr.trim().toLowerCase();
  let totalMins = 0;
  
  const hourMatchKo = cleaned.match(/(\d+)\s*시간/);
  if (hourMatchKo) totalMins += parseInt(hourMatchKo[1], 10) * 60;
  
  const minMatchKo = cleaned.match(/(\d+)\s*분/);
  if (minMatchKo) totalMins += parseInt(minMatchKo[1], 10);
  
  const hourMatchEn = cleaned.match(/(\d+)\s*(h|hour)/);
  if (hourMatchEn && !hourMatchKo) totalMins += parseInt(hourMatchEn[1], 10) * 60;
  
  const minMatchEn = cleaned.match(/(\d+)\s*(m|min|minute)/);
  if (minMatchEn && !minMatchKo) totalMins += parseInt(minMatchEn[1], 10);
  
  if (totalMins === 0) {
    const numMatch = cleaned.match(/(\d+)/);
    if (numMatch) totalMins = parseInt(numMatch[1], 10);
  }
  
  if (totalMins === 0) return durationStr; // fallback to original string if no numbers parsed
  
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  
  if (language === 'ko') {
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  } else {
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
};

console.log(formatDurationByLanguage("1시간 30분", "en"));
console.log(formatDurationByLanguage("45m", "ko"));
console.log(formatDurationByLanguage("1h 20m", "ko"));
