import { element } from "./base";
import type { Node } from "../h";
import type { TitleProps } from "./types";

export const Title = (props: TitleProps = {}): Node => {
  const { as = "h1", children, ...rest } = props;
  return element(as, { ...rest, children });
};
