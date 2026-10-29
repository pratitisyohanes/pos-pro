// Business timezone is WIB (UTC+7)
const TIMEZONE_OFFSET = '+07:00';
const TIMEZONE_OFFSET_MS = 7 * 60 * 60 * 1000;

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const toTime = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const addMinutes = (time, minutes) => toTime(toMinutes(time) + minutes);

// Two ranges overlap when each one starts before the other ends
const isOverlapping = (startA, endA, startB, endB) => startA < endB && endA > startB;

const toDateString = (date) => (date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10));

// Convert a "YYYY-MM-DD" string into a UTC midnight Date for day arithmetic
const toDateOnly = (dateString) => new Date(`${dateString}T00:00:00Z`);

// Absolute moment a slot starts, interpreted in WIB
const toDateTime = (date, time) => new Date(`${toDateString(date)}T${time}:00${TIMEZONE_OFFSET}`);

const todayWib = () => new Date(Date.now() + TIMEZONE_OFFSET_MS).toISOString().slice(0, 10);

const addDays = (dateString, days) => {
  const date = toDateOnly(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateString(date);
};

// ISO day of week: Monday = 1 ... Sunday = 7
const isoDayOfWeek = (dateString) => toDateOnly(dateString).getUTCDay() || 7;

const diffInDays = (startDate, endDate) => Math.round((toDateOnly(endDate) - toDateOnly(startDate)) / 86400000);

// Split an opening window into back-to-back slots of the given duration
const generateSlots = (openTime, closeTime, durationMinutes) => {
  const slots = [];
  const close = toMinutes(closeTime);
  for (let start = toMinutes(openTime); start + durationMinutes <= close; start += durationMinutes) {
    slots.push({ startTime: toTime(start), endTime: toTime(start + durationMinutes) });
  }
  return slots;
};

module.exports = {
  toMinutes,
  toTime,
  addMinutes,
  isOverlapping,
  toDateString,
  toDateOnly,
  toDateTime,
  todayWib,
  addDays,
  isoDayOfWeek,
  diffInDays,
  generateSlots,
};
