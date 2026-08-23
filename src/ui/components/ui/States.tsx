import type { ReactNode } from "react";
import { cx } from "../../utils/cx";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

/** Nothing to show — distinct from a failure to load. */
export const EmptyState = ({
  icon,
  title,
  hint,
  className,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  className?: string;
}) => (
  <div
    className={cx(
      "flex flex-col items-center gap-3 py-20 text-center",
      className,
    )}
  >
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
      {icon}
    </div>
    <p className="text-sm font-medium text-[#333]">{title}</p>
    {hint && <p className="max-w-md text-[12.5px] text-neutral-400">{hint}</p>}
  </div>
);

export const LoadingState = ({
  message,
  className,
}: {
  message: string;
  className?: string;
}) => (
  <div
    className={cx(
      "flex h-full w-full flex-col items-center justify-center gap-2",
      className,
    )}
  >
    <Spinner size={24} />
    <p className="text-[13px] text-neutral-500">{message}</p>
  </div>
);

/** Something failed. Offers a retry whenever retrying is possible. */
export const ErrorState = ({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) => (
  <div
    className={cx(
      "flex h-full w-full flex-col items-center justify-center gap-3 text-center",
      className,
    )}
  >
    <p className="text-[13px] text-[#b42318]">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);
