// Line icons for the admin sidebar, drawn on a 24x24 grid and colored by the surrounding text
function Icon({ children, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const GridIcon = (props) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Icon>
);

export const CalculatorIcon = (props) => (
  <Icon {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
  </Icon>
);

export const ReceiptIcon = (props) => (
  <Icon {...props}>
    <path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5z" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </Icon>
);

export const PackageIcon = (props) => (
  <Icon {...props}>
    <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
    <path d="M3.3 7.5L12 12.5l8.7-5M12 22V12.5" />
  </Icon>
);

export const TagIcon = (props) => (
  <Icon {...props}>
    <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
    <circle cx="7.5" cy="7.5" r="1" />
  </Icon>
);

export const LayersIcon = (props) => (
  <Icon {...props}>
    <path d="M12 2l9 5-9 5-9-5z" />
    <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
  </Icon>
);

export const BarChartIcon = (props) => (
  <Icon {...props}>
    <path d="M3 3v18h18M8 17v-5M13 17V8M18 17v-9" />
  </Icon>
);

export const StoreIcon = (props) => (
  <Icon {...props}>
    <path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-6h4v6" />
  </Icon>
);
