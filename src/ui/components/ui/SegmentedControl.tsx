import type { ReactNode } from "react";
import { cx } from "../../utils/cx";

export type SegmentedItem<T extends string> = {
  value: T;
  label: ReactNode;
};

/** Pill segmented control used as the top-level view switch. */
export const SegmentedControl = <T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  items: SegmentedItem<T>[];
  className?: string;
}) => (
  <div
    className={cx("inline-flex rounded-full bg-neutral-100 p-0.5", className)}
  >
    {items.map((item) => {
      const active = item.value === value;
      return (
        <button
          key={item.value}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(item.value)}
          className={cx(
            "rounded-full px-3 py-1.5 text-[13px] font-medium whitespace-nowrap",
            "focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:outline-none",
            active
              ? "bg-brand-600 text-white shadow-sm"
              : "text-neutral-600 hover:text-neutral-900",
          )}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);
