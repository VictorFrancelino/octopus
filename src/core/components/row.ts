import { element } from "./base";
import type { RowProps } from "./types";

export const Row = (props: RowProps = {}) => {
  const {
    children,
    style,
    class: className,
    justify,
    items,
    gap,
    ...rest
  } = props;

  const justifyMap: Record<string, string> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between",
    around: "space-around",
    evenly: "space-evenly",
  };
  const itemsMap: Record<string, string> = {
    stretch: "stretch",
    "flex-start": "flex-start",
    "flex-end": "flex-end",
    center: "center",
    baseline: "baseline",
    start: "start",
    end: "end",
    normal: "normal",
  };

  const baseStyleObj: Record<string, any> = { display: "flex" };
  if (justify) {
    const val = justifyMap[justify] ?? justify;
    baseStyleObj.justifyContent = val;
  }
  if (items) {
    const val = itemsMap[items] ?? items;
    baseStyleObj.alignItems = val;
  }

  return element(
    "div",
    { class: className, style, gap, children, ...rest },
    { defaultStyle: baseStyleObj, defaultClass: "row" }
  );
};
