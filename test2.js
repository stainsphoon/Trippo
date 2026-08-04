const convertTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toLowerCase();
  const isPM = cleaned.includes('pm') || cleaned.includes('오후');
  const isAM = cleaned.includes('am') || cleaned.includes('오전');
  
  const numbersOnly = cleaned.replace(/[apm오전오후\s]/g, '').trim();
  const parts = numbersOnly.split(':');
  if (parts.length === 0) return 0;
  
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
  
  if (isNaN(hours)) return 0;
  
  if (isPM) {
    if (hours < 12) {
      hours += 12;
    }
  } else if (isAM) {
    if (hours === 12) {
      hours = 0;
    }
  }
  return hours * 60 + minutes;
};
const convertMinutesToTime = (totalMinutes, language) => {
  let adjustedMins = totalMinutes;
  while (adjustedMins < 0) adjustedMins += 24 * 60;
  adjustedMins = adjustedMins % (24 * 60);
  
  let h = Math.floor(adjustedMins / 60);
  const m = Math.floor(adjustedMins % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  
  h = h % 12;
  if (h === 0) h = 12;
  
  const mStr = m.toString().padStart(2, '0');
  
  if (language === 'ko') {
    return `${ampm === 'AM' ? '오전' : '오후'} ${h}:${mStr}`;
  } else {
    return `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
  }
};
const addMinutesToTime = (timeStr, addMins, language) => {
  const currentMins = convertTimeToMinutes(timeStr);
  return convertMinutesToTime(currentMins + addMins, language);
};
console.log(addMinutesToTime("12:00 PM", 60, "ko")); // 1:00 PM (ko)
console.log(addMinutesToTime("오전 10:00", 60, "ko")); 
console.log(addMinutesToTime("오후 1:00", 60, "ko"));
