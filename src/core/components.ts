import { h } from "./h";
import type { Node } from "./h";

type ComponentProps = {
  id?: string;
  as?: string;
  class?: string;
  className?: string;
  style?: Record<string, any>;
  children?: Node | string | (Node | string)[];
  [key: string]: any;
};

type TitleProps<T extends keyof HTMLTitleElement> = {
  as?: T;
  children?: Node | string | (Node | string)[];
} & Omit<HTMLTitleElement[T], "children">
type TextProps = ComponentProps & { as?: "p" | "span" | "small" };
type LinkProps = ComponentProps;
type InputProps = ComponentProps;
type RowProps = ComponentProps & { justify?: "start" | "center" | "end" | "evenly" | "between" | "around" } & { items?: "stretch" | "flex-start" | "flex-end" | "center" | "baseline" | "start" | "end" | "normal" };
type ButtonProps = ComponentProps & { type?: "button" | "submit" | "reset"; disabled?: boolean };

type Children = Node | string | (Node | string)[]

function normalizeChildren(children?: Children): (Node | string)[] {
  if (children == null) return []
  return Array.isArray(children) ? children : [children]
}

function normalizeStyle(style?: string | Record<string, any>): string | Record<string, any> | undefined {
  if (!style) return undefined;
  if (typeof style === "string") return style.trim() || undefined;
  return style;
}

function camelToKebab(s: string) {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

function styleObjectToString(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${camelToKebab(k)}:${v}`)
    .join("; ");
}

/**
 * buildProps: cria o objeto de props final que será passado para `h()`.
 * - mergeia class/className em `class`
 * - converte id para string
 * - cuida do style (string ou object)
 * - remove props internos (ex: gap) que não queremos como atributos HTML
 */
function buildProps(original: Record<string, any> = {}) {
  const { id, class: cls, className, style, gap, ...rest } = original;
  const props: Record<string, any> = { ...rest };

  if (id != null) props.id = String(id);
  const classValue = cls ?? className;
  if (classValue) props.class = String(classValue);

  const normalizedStyle = normalizeStyle(style);
  if (normalizedStyle) props.style = normalizedStyle;

  // if gap is provided, convert to style gap (prefers explicit style object)
  if (gap != null) {
    const gapValue = typeof gap === "number" ? `${gap}px` : String(gap);
    if (typeof props.style === "object" && props.style !== null) {
      props.style = { gap: gapValue, ...props.style };
    } else if (typeof props.style === "string") {
      props.style = `${props.style}; gap:${gapValue}`;
    } else {
      props.style = { gap: gapValue };
    }
  }

  return props;
}

/* ---------------- Components ---------------- */

export const Title = <T extends keyof HTMLTitleElement>(props: TitleProps<T>): Node => {
  const { children, as = "h1", ...rest } = props;
  const childrenArray = normalizeChildren(children)
  const finalProps = buildProps(rest)
  return h(as, finalProps, ...childrenArray) as Node;
};

export const Text = (props: TextProps = {}): Node => {
  const { children, as = "p", ...rest } = props;
  const childrenArray = normalizeChildren(children)
  const finalProps = buildProps(rest)
  return h(as, finalProps, ...childrenArray) as Node;
}

export const Link = (props: LinkProps = {}): Node => {
  const { children, ...rest } = props
  const childrenArray = normalizeChildren(children)
  const finalProps = buildProps(rest)
  return h("a", finalProps, ...childrenArray) as Node
}

export const Input = (props: InputProps = {}): Node => {
  const { children, ...rest } = props
  const childrenArray = normalizeChildren(children)
  const finalProps = buildProps(rest)
  return h("input", finalProps, ...childrenArray) as Node
}

export const Row = (props: RowProps = {}): Node => {
  const {
    children,
    style,
    class: className,
    justify, // 'start' | 'center' | ...
    items, // align-items aliases
    gap,
    ...rest
  } = props;

  const childrenArray = normalizeChildren(children);
  // buildProps recebe apenas o resto (não passa justify/items/gap)
  const finalProps = buildProps({ ...rest, class: className, style, gap });

  // mapear valores amigáveis para CSS
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

  // merge/serialize style depending on tipo
  if (!finalProps.style) {
    finalProps.style = baseStyleObj;
  } else if (typeof finalProps.style === "object") {
    finalProps.style = { ...baseStyleObj, ...finalProps.style }; // user overrides
  } else if (typeof finalProps.style === "string") {
    const baseStr = styleObjectToString(baseStyleObj);
    finalProps.style = `${baseStr}; ${finalProps.style}`;
  }

  // add a default row class
  finalProps.class = `${(finalProps.class ?? "")}`.trim() ? `row ${finalProps.class}`.trim() : `row`;
  return h("div", finalProps, ...childrenArray) as Node;
};

export const Column = (props: ComponentProps = {}): Node => {
  const { children, style, class: className, ...rest } = props;
  const childrenArray = normalizeChildren(children);
  const finalProps = buildProps({ ...rest, class: className, style });
  if (!finalProps.style) finalProps.style = { display: "flex", flexDirection: "column" };
  else if (typeof finalProps.style === "object")
    finalProps.style = { display: "flex", flexDirection: "column", ...finalProps.style };
  else if (typeof finalProps.style === "string")
    finalProps.style = `display:flex; flex-direction:column; ${finalProps.style}`;
  finalProps.class = `${(finalProps.class ?? "")}`.trim()
    ? `column ${finalProps.class}`.trim()
    : `column`;
  return h("div", finalProps, ...childrenArray) as Node;
};

export const Button = (props: ButtonProps = {}): Node => {
  const { children, type = "button", disabled, style, class: className, ...rest } = props;
  const childrenArray = normalizeChildren(children);
  const finalProps = buildProps({ ...rest, class: className, style });
  finalProps.type = type;
  if (disabled) finalProps.disabled = true;
  // accessibility hint: role/button already implied by <button>
  return h("button", finalProps, ...childrenArray) as Node;
};

/* ---------------- exports ---------------- */

export default {
  Title,
  Text,
  Link,
  Input,
  Row,
  Column,
  Button,
};
