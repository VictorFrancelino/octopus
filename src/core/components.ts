import { h } from "./h";
import type { Node } from "./h";

// Tipagem para as propriedades dos componentes
type ComponentProps = { [key: string]: any };

export const FirstTitle = (
  props: ComponentProps,
  ...children: (Node | string)[]
) => h("h1", {}, ...children);

export const Row = (props: ComponentProps, ...children: (Node | string)[]) =>
  h(
    "div",
    {
      class: `row ${props.class || ""}`.trim(), // Permite adicionar mais classes
      style: { display: "flex", ...props.style }, // Permite sobrescrever ou adicionar estilos
      ...props,
    },
    ...children
  );

export const Col = (props: ComponentProps, ...children: (Node | string)[]) =>
  h(
    "div",
    {
      class: `col ${props.class || ""}`.trim(),
      style: { display: "flex", flexDirection: "column", ...props.style },
      ...props,
    },
    ...children
  );

export const Button = (props: ComponentProps, ...children: (Node | string)[]) =>
  h("button", props, ...children);
