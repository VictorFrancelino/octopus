import { element } from "./base";
import type { Node } from "../h";
import type { LinkProps } from "./types";

export const Link = (props: LinkProps = {}): Node => {
  const { children, ...rest } = props;
  return element("a", { ...rest, children });
};
