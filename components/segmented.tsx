interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: [Option<T>, Option<T>];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-medium tracking-wide text-ink-2">{label}</span>
      <div role="group" aria-label={label} className="grid grid-cols-2 overflow-hidden rounded-md border border-line bg-bg">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={
              "cursor-pointer px-2.5 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent " +
              (value === o.value ? "bg-accent text-accent-ink" : "text-ink-2 hover:text-ink")
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
