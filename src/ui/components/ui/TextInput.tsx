import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "../../utils/cx";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: ReactNode;
  wrapperClassName?: string;
};

export const TextInput = ({
  leftIcon,
  wrapperClassName,
  className,
  ...rest
}: TextInputProps) => (
  <div className={cx("relative", wrapperClassName)}>
    {leftIcon && (
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
        {leftIcon}
      </span>
    )}
    <input
      className={cx(
        "h-9 w-full rounded-xl border border-neutral-200 bg-white py-2 text-sm text-[#333]",
        "placeholder:text-neutral-400",
        "focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none",
        leftIcon ? "pr-3 pl-9" : "px-3",
        className,
      )}
      {...rest}
    />
  </div>
);
