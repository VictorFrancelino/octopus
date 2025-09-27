import { h } from "../h";
import { buildProps, normalizeChildren } from "./base";
import type { ButtonProps } from "./types";

export const Button = (props: ButtonProps = {}) => {
  const {
    children,
    type = "button",
    disabled,
    class: className,
    style,
    ...rest
  } = props;

  const finalProps = buildProps({ ...rest, class: className, style });
  finalProps.type = type;
  if (disabled) finalProps.disabled = true;

  return h("button", finalProps, ...normalizeChildren(children));
};
