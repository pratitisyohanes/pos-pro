import { Input, Select } from './ui/FormField';
import { PERIOD_OPTIONS } from '../utils/constants';

// A quick period and a custom from/to range are mutually exclusive on the backend
export default function DateRangeFilter({ filters, setFilters, idPrefix = 'range', periodOptions = PERIOD_OPTIONS }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Select
        id={`${idPrefix}-period`}
        aria-label="Period"
        options={periodOptions}
        value={filters.period || ''}
        onChange={(event) => setFilters({ period: event.target.value, from: '', to: '' })}
      />
      <Input
        id={`${idPrefix}-from`}
        type="date"
        aria-label="From date"
        value={filters.from || ''}
        max={filters.to || undefined}
        onChange={(event) => setFilters({ from: event.target.value, period: '' })}
      />
      <Input
        id={`${idPrefix}-to`}
        type="date"
        aria-label="To date"
        value={filters.to || ''}
        min={filters.from || undefined}
        onChange={(event) => setFilters({ to: event.target.value, period: '' })}
      />
    </div>
  );
}
