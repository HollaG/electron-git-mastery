import type { InputHTMLAttributes, Ref } from "react";
import { cx } from "../../utils/cx";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Callers read `.checked` off this on submit rather than tracking state. */
  ref?: Ref<HTMLInputElement>;
};

export const Checkbox = ({ label, className, ref, ...rest }: CheckboxProps) => (
  <label
    className={cx("flex items-center gap-2 text-sm text-[#333]", className)}
  >
    <input
      ref={ref}
      type="checkbox"
      className="h-4 w-4 shrink-0 rounded border-neutral-300 accent-[#2d864e] focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:outline-none"
      {...rest}
    />
    {label}
  </label>
);
