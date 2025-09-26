export type Node = {
  tag: string;
  props?: Record<string, any>;
  children?: (Node | string)[];
};

function ensureNode(result: Node | string): Node {
  if (typeof result === "string") {
    // Se for string, converte para um nó de texto
    return {
      tag: "span",
      props: {},
      children: [result],
    };
  }
  return result;
}

export function h(
  tag: string | ((props?: any) => Node | string),
  props?: Record<string, any>,
  ...children: (Node | string)[]
): Node | string {
  const safeProps = props ?? {};

  // componente (função)
  if (typeof tag === "function") {
    const componentProps = { ...safeProps };

    if (children?.length) {
      componentProps.children = children.length === 1 ? children[0] : children;
    }

    return tag(componentProps);
  }

  // elemento normal
  return {
    tag: String(tag),
    props: safeProps,
    children: children.length ? children : undefined,
  };
}

export function hNode(
  tag: string | ((props?: any) => Node | string),
  props?: Record<string, any>,
  ...children: (Node | string)[]
): Node {
  const result = h(tag, props, ...children);
  return ensureNode(result);
}
