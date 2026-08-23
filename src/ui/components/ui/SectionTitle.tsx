import type { ReactNode } from "react";
import { cx } from "../../utils/cx";

/** Serif group header with a hairline underline and optional trailing actions. */
export const SectionTitle = ({
  children,
  actions,
  className,
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) => (
  <div
    className={cx(
      "mb-1.5 flex items-end justify-between gap-3 border-b border-neutral-200 pb-2",
      className,
    )}
  >
    <h2 className="font-heading text-[1.45rem]/[1.35] font-semibold text-[#333]">
      {children}
    </h2>
    {actions}
  </div>
);
