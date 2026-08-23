import { cx } from "../../utils/cx";

export type StatusTone = "neutral" | "success" | "danger" | "warning" | "info";

const TONES: Record<StatusTone, string> = {
  neutral: "border-neutral-200 bg-neutral-100 text-neutral-600",
  success: "border-brand-200 bg-brand-50 text-brand-700",
  danger: "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
  warning: "border-[#fedf89] bg-[#fffaeb] text-[#b54708]",
  info: "border-[#bae6fd] bg-[#f0f9ff] text-[#0369a1]",
};

/**
 * Semantic state chip. The label is always visible text, so colour is never the
 * only signal.
 */
export const StatusPill = ({
  tone = "neutral",
  children,
  title,
  className,
}: {
  tone?: StatusTone;
  children: string;
  title?: string;
  className?: string;
}) => (
  <span
    title={title ?? children}
    className={cx(
      "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
      TONES[tone],
      className,
    )}
  >
    {children}
  </span>
);
