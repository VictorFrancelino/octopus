import { h } from "../h";
import { buildProps } from "./base";
import type { ImageProps } from "./types";

// image is special: no children, we need to normalize class/style and return <img />
export const Image = (props: ImageProps) => {
  const { className, class: cls, style, children, ...rest } = props as any;
  if (children) console.warn("Image não aceita children; serão ignorados.");
  const finalProps: Record<string, any> = buildProps({
    ...(rest || {}),
    style,
  });
  return h("img", finalProps);
};
