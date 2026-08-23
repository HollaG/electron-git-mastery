import { cx } from "../../utils/cx";

/** Indeterminate ring. Inherits `currentColor`, so callers set the tone. */
export const Spinner = ({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    role="presentation"
    className={cx("shrink-0 animate-spin text-brand-600", className)}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2.5"
      opacity="0.2"
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);
