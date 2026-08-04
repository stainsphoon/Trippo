const plan = {
  days: [
    { dayNumber: 1, date: "2024-10-15", items: [] }
  ]
};

const sheetDayNum = 1;
const itemData = { id: "item1", time: "10:00 AM", title: "Test" };
const language = 'en';

const convertTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const isPM = timeStr.toLowerCase().includes('pm');
  const [time] = timeStr.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (isNaN(h)) h = 0;
  if (isNaN(m)) m = 0;
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return h * 60 + m;
};

const sortItemsByTime = (items) => {
  return [...items].sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time));
};

const recalculateSchedulesForDay = (items) => {
  return items;
};

let updatedDays = [...plan.days];
let foundDay = false;
updatedDays = updatedDays.map((day) => {
  if (Number(day.dayNumber) !== Number(sheetDayNum)) return day;
  foundDay = true;
  const sorted = sortItemsByTime([...day.items, itemData]);
  return {
    ...day,
    items: recalculateSchedulesForDay(sorted, language)
  };
});

console.log(JSON.stringify(updatedDays, null, 2));
