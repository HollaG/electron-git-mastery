import { cx } from "../../utils/cx";

export type TabItem<T extends string> = {
  value: T;
  label: string;
  /** Rendered muted after the label, e.g. "All (42)". */
  count?: number;
};

/** Underlined filter tabs. Selecting one filters immediately — there is no apply step. */
export const Tabs = <T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  items: TabItem<T>[];
  className?: string;
}) => (
  <div
    role="tablist"
    className={cx("flex gap-1 border-b border-neutral-200", className)}
  >
    {items.map((item) => {
      const active = item.value === value;
      return (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(item.value)}
          className={cx(
            "-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap focus-visible:outline-none",
            active
              ? "border-brand-600 font-medium text-brand-700"
              : "border-transparent text-neutral-600 hover:text-neutral-900",
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="text-neutral-400"> ({item.count})</span>
          )}
        </button>
      );
    })}
  </div>
);
