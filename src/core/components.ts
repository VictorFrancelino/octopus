import { h } from "./h";
import type { Node } from "./h";

type ComponentProps = {
  id?: string;
  class?: string;
  className?: string;
  style?: Record<string, any>;
  children?: Node | string | (Node | string)[];
  [key: string]: any;
};

export const Title = (props: ComponentProps): Node => {
  const { children, ...restProps } = props;

  const childrenArray = Array.isArray(children)
    ? children
    : children
    ? [children]
    : [];

  return h("h1", restProps, ...childrenArray) as Node;
};

export const Row = (props: ComponentProps): Node => {
  const { children, style, class: className, ...restProps } = props;

  const childrenArray = Array.isArray(children)
    ? children
    : children
    ? [children]
    : [];

  return h(
    "div",
    {
      ...restProps,
      class: `row ${className || ""}`.trim(),
      style: { display: "flex", ...style },
    },
    ...childrenArray
  ) as Node;
};
