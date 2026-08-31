export function ReaderSwitch<T extends string>({
  value,
  items,
  onChange,
}: {
  value: T;
  items: Array<{ value: T; label: string; disabled?: boolean }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          disabled={item.disabled}
          onClick={() => onChange(item.value)}
          className={`rounded-md px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${value === item.value ? "bg-white shadow-sm dark:bg-zinc-800" : "text-zinc-500"}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
