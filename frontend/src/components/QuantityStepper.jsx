// Minus / number / plus control that keeps the value between min and max
export default function QuantityStepper({ id, value, min = 1, max = 999, onChange }) {
  const clamp = (next) => Math.min(Math.max(Number(next) || min, min), max);

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white">
      <button type="button" className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label="Decrease">
        -
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(clamp(event.target.value))}
        className="w-12 border-x border-slate-300 py-1 text-center text-sm tabular-nums focus:outline-none"
        aria-label="Quantity"
      />
      <button type="button" className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40" onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label="Increase">
        +
      </button>
    </div>
  );
}
