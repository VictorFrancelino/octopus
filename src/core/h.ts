export type Node = {
  tag: string;
  props: { [key: string]: any };
  children: (Node | string)[];
};

export function h(
  tag: string,
  props: { [key: string]: any },
  ...children: (Node | string)[]
): Node {
  return { tag, props: props || {}, children };
}
