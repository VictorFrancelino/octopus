import { h, Fragment } from "../h";
import type { Node } from "../h";

function normalizeChildren(props: any): (Node | string)[] {
  if (!props || !props.children) return [];

  const children = props.children;

  if (Array.isArray(children)) return children;
  if (children === null || children === undefined) return [];

  return [children];
}

export function jsx(type: any, props: any, key?: any): Node | string {
  const children = normalizeChildren(props);
  const propsWithoutChildren = { ...props };
  delete propsWithoutChildren.children;

  return h(type, propsWithoutChildren, ...children);
}

export const jsxs = jsx;

export function jsxDEV(
  type: any,
  props: any,
  key?: any,
  isStaticChildren?: any,
  source?: any,
  self?: any
): Node | string {
  return jsx(type, props, key);
}

export { Fragment };
