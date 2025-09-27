import type { Node } from "../h";
import type {
  AnchorHTMLAttributes,
  InputHTMLAttributes,
  ButtonHTMLAttributes,
  ImgHTMLAttributes,
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

export type ImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  srcSet?: string;
  sizes?: string;
  class?: string;
  style?: Record<string, any> | string;
  // Otimizações avançadas
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  // Atributos de acessibilidade
  role?: string;
  ariaLabel?: string;
}

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
