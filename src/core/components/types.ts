import type { Node } from "../h";
import type {
  AnchorHTMLAttributes,
  InputHTMLAttributes,
  ButtonHTMLAttributes,
} from "react";

/*
 * Props base comum para componentes "container" (aceitam children).
 */
export type ComponentProps = {
  id?: string;
  as?: string;
  class?: string;
  style?: Record<string, any> | string;
  children?: Node | string | (Node | string)[];
  [key: string]: any;
};

/* Title/text-like */
export type TitleProps = ComponentProps & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};
export type TextProps = ComponentProps & { as?: "p" | "span" | "small" };

export type LinkProps = Omit<
  AnchorHTMLAttributes<HTMLLinkElement>,
  "children"
> & {
  class?: string;
  children?: Node | string | (Node | string)[];
};

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children"
> & { class?: string };

/* Row + layout helpers */
export type RowProps = ComponentProps & {
  justify?: "start" | "center" | "end" | "evenly" | "between" | "around";
  items?:
  | "stretch"
  | "flex-start"
  | "flex-end"
  | "center"
  | "baseline"
  | "start"
  | "end"
  | "normal";
};
export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & { class?: string; children?: Node | string | (Node | string)[] };
