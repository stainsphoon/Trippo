const parseTravelDuration = (durStr) => {
  if (!durStr) return 0;
  let mins = 0;
  const hMatch = durStr.match(/(\d+)\s*(h|시간)/i);
  const mMatch = durStr.match(/(\d+)\s*(m|분)/i);
  if (hMatch) mins += parseInt(hMatch[1]) * 60;
  if (mMatch) mins += parseInt(mMatch[1]);
  if (!hMatch && !mMatch) {
      const raw = parseInt(durStr);
      if (!isNaN(raw)) mins = raw;
  }
  return mins;
};
console.log(parseTravelDuration("약 30분"));
console.log(parseTravelDuration("30분"));
console.log(parseTravelDuration("1시간 30분"));
console.log(parseTravelDuration("1h 30m"));
