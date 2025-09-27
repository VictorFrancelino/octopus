import { element } from "./base";
import type { Node } from "../h";
import type { TextProps } from "./types";

export const Text = (props: TextProps = {}): Node => {
  const { as = "p", children, ...rest } = props;
  return element(as, { ...rest, children });
};
