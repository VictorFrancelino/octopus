import { element } from "./base";
import type { Node } from "../h";
import type { InputProps } from "./types";

export const Input = (props: InputProps = {}): Node => {
  return element("input", { props } as any);
};
