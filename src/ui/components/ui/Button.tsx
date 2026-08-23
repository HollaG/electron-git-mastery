import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../../utils/cx";
import { Spinner } from "./Spinner";

type ButtonVariant =
  "primary" | "outline" | "secondary" | "danger" | "dangerOutline";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700",
  outline: "border border-brand-600 text-brand-700 hover:bg-brand-50",
  secondary:
    "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
  danger: "bg-[#b42318] text-white shadow-sm hover:bg-[#912018]",
  dangerOutline: "border border-[#fecdca] text-[#b42318] hover:bg-[#fef3f2]",
};

const SIZES = {
  sm: "px-2.5 py-1 text-[13px] gap-1.5",
  md: "px-3 py-1.5 text-sm gap-2",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  /** Swaps the leading icon for a spinner without resizing the button. */
  loading?: boolean;
  leftIcon?: ReactNode;
};

export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) => (
  <button
    type="button"
    disabled={disabled || loading}
    className={cx(
      "inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap hover:cursor-pointer",
      "focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:border-brand-400 focus-visible:outline-none",
      VARIANTS[variant],
      SIZES[size],
      (disabled || loading) && "pointer-events-none opacity-50",
      className,
    )}
    {...rest}
  >
    {loading ? (
      <Spinner size={14} className="text-current" />
    ) : (
      leftIcon && <span className="flex shrink-0 items-center">{leftIcon}</span>
    )}
    {children}
  </button>
);
