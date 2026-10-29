const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Build CSV text from rows using [{ header, value: (row) => any }] column definitions
const toCsv = (rows, columns) => {
  const header = columns.map((column) => escapeCell(column.header)).join(',');
  const lines = rows.map((row) => columns.map((column) => escapeCell(column.value(row))).join(','));
  return [header, ...lines].join('\n');
};

module.exports = toCsv;
