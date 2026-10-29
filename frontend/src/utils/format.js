const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

// Prices arrive as strings like "75000.00"
export const formatRupiah = (value) => rupiahFormatter.format(Number(value || 0));

// Parse YYYY-MM-DD as a local date so the day never shifts because of time zones
const parseDateOnly = (value) => new Date(`${value}T00:00:00`);

export const formatDate = (value, options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? parseDateOnly(value).toLocaleDateString('en-GB', options) : '-';

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
    : '-';

export const formatTimeRange = (start, end) => `${start} - ${end}`;

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

export const toDateString = (date) => {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const addDays = (dateString, days) => {
  const date = parseDateOnly(dateString);
  date.setDate(date.getDate() + days);
  return toDateString(date);
};

export const today = () => toDateString(new Date());
