const { Op } = require('sequelize');
const ApiError = require('./ApiError');
const { todayWib, addDays, toDateOnly } = require('./time');

// Resolve from/to/period query values into an inclusive WIB date range
const resolveDateRange = ({ from, to, period } = {}) => {
  const today = todayWib();

  if (period === 'today') return { start: today, end: today };

  if (period === 'this_week') {
    const start = addDays(today, -((toDateOnly(today).getUTCDay() + 6) % 7));
    return { start, end: addDays(start, 6) };
  }

  if (period === 'this_month') {
    const start = `${today.slice(0, 8)}01`;
    const nextMonth = toDateOnly(start);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    return { start, end: addDays(nextMonth.toISOString().slice(0, 10), -1) };
  }

  if (from || to) {
    if (from && to && from > to) {
      throw new ApiError(422, 'Validation failed', [{ field: 'from', message: "'from' must be on or before 'to'" }]);
    }
    return { start: from, end: to };
  }

  return null;
};

// Sequelize filter for DATEONLY columns
const toDateFilter = (range) => {
  if (!range) return undefined;
  const filter = {};
  if (range.start) filter[Op.gte] = range.start;
  if (range.end) filter[Op.lte] = range.end;
  return filter;
};

// Sequelize filter for timestamp columns using WIB day boundaries
const toTimestampFilter = (range) => {
  if (!range) return undefined;
  const filter = {};
  if (range.start) filter[Op.gte] = new Date(`${range.start}T00:00:00+07:00`);
  if (range.end) filter[Op.lt] = new Date(`${addDays(range.end, 1)}T00:00:00+07:00`);
  return filter;
};

module.exports = { resolveDateRange, toDateFilter, toTimestampFilter };
