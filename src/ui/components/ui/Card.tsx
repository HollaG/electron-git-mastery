import type { ReactNode } from "react";
import { cx } from "../../utils/cx";

/** Solid white panel. `elevated` is for surfaces that float above content. */
export const Card = ({
  elevated = false,
  className,
  children,
}: {
  elevated?: boolean;
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={cx(
      "rounded-2xl border border-neutral-200 bg-white p-6",
      elevated && "shadow-card",
      className,
    )}
  >
    {children}
  </div>
);
