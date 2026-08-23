import type { InputHTMLAttributes } from "react";
import { IconSearch } from "@tabler/icons-react";
import { cx } from "../../utils/cx";
import { TextInput } from "./TextInput";

/** Search field that grows to fill the toolbar row it sits in. */
export const SearchInput = ({
  wrapperClassName,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { wrapperClassName?: string }) => (
  <TextInput
    type="search"
    leftIcon={<IconSearch size={16} />}
    wrapperClassName={cx("min-w-[240px] flex-1", wrapperClassName)}
    {...rest}
  />
);
