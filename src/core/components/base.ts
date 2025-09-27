import { h } from "../h";
import type { Node } from "../h";

/* ---------------- Helpers ---------------- */

export type Children = Node | string | (Node | string)[];

export function normalizeChildren(children?: Children): (Node | string)[] {
  if (children == null) return [];
  return Array.isArray(children) ? children : [children];
}

export function normalizeStyle(
  style?: string | Record<string, any>
): string | Record<string, any> | undefined {
  if (!style) return undefined;
  if (typeof style === "string") return style.trim() || undefined;
  return style;
}

export function camelToKebab(s: string) {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

export function styleObjectToString(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${camelToKebab(k)}:${v}`)
    .join("; ");
}

/*
 * buildProps: cria o objeto de props final que será passado para `h()`.
 * - mergeia class/className em `class`
 * - converte id para string
 * - cuida do style (string ou object)
 * - remove props internos (ex: gap) que não queremos como atributos HTML
 */
export function buildProps(original: Record<string, any> = {}) {
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

/* Aplica estilo e classe padrão (merge) no finalProps já gerado por buildProps */
export function applyDefaultStyleAndClass(
  finalProps: Record<string, any>,
  defaultStyle?: Record<string, any> | string,
  defaultClass?: string
) {
  // class
  if (defaultClass) {
    finalProps.class = `${defaultClass} ${finalProps.class ?? ""}`.trim();
  }

  // style merging
  if (!defaultStyle) return;
  if (!finalProps.style) {
    finalProps.style = defaultStyle;
    return;
  }

  if (typeof defaultStyle === "string") {
    if (typeof finalProps.style === "string") {
      finalProps.style = `${defaultStyle}; ${finalProps.style}`.trim();
    } else if (typeof finalProps.style === "object") {
      // keep user props priority
      finalProps.style = { ...finalProps.style };
      (finalProps as any).__append = defaultStyle;
    }
    return;
  }

  // defaultStyle is object
  if (typeof finalProps.style === "object") {
    finalProps.style = { ...defaultStyle, ...finalProps.style };
  } else if (typeof finalProps.style === "string") {
    const baseStr = styleObjectToString(defaultStyle);
    finalProps.style = `${baseStr}; ${finalProps.style}`;
  }
}

/* Factory leve que reduz boilerplate ao criar elementos */
export function element(
  tag: string,
  props: Record<string, any> = {},
  opts?: { defaultStyle?: Record<string, any> | string; defaultClass?: string }
): Node {
  const { defaultStyle, defaultClass } = opts ?? {};
  const { children, ...rest } = props;
  const childrenArray = normalizeChildren(children as any);
  const finalProps = buildProps(rest);
  applyDefaultStyleAndClass(finalProps, defaultStyle, defaultClass);
  return h(tag, finalProps, ...childrenArray) as Node;
}

/* Factory creator — útil para criar componentes com defaults em 1 linha */
export function createComponent(
  tag: string,
  opts?: { defaultStyle?: Record<string, any> | string; defaultClass?: string }
) {
  return (props: Record<string, any> = {}) => element(tag, props, opts);
}
