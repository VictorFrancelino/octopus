import { element } from "./base";
import type { ComponentProps } from "./types";

export const Column = (props: ComponentProps = {}) => {
  const { children, style, class: className, ...rest } = props;
  const base = { display: "flex", flexDirection: "column" };
  return element(
    "div",
    { class: className, style, children, ...rest },
    { defaultStyle: base, defaultClass: "column" }
  );
};
