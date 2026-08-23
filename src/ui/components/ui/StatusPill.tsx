import { cx } from "../../utils/cx";

const TONE_CLASSES: Record<ProgressState, string> = {
  downloaded: "border-neutral-200 bg-neutral-100 text-neutral-600",
  "in-progress": "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-brand-200 bg-brand-50 text-brand-700",
};

const STATUS_LABELS: Record<ProgressState, string> = {
  downloaded: "Downloaded",
  "in-progress": "In progress",
  completed: "Completed",
};

export const StatusPill = ({ status }: { status: ProgressState }) => {
  const label = STATUS_LABELS[status];
  return (
    <span
      title={label}
      aria-label={label}
      className={cx(
        "inline-flex shrink-0 items-center rounded border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        TONE_CLASSES[status],
      )}
    >
      {label}
    </span>
  );
};
