import type { Node } from "./h";

function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== "string") return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function render(node: Node | string): string {
  if (typeof node === "string") {
    return escapeHtml(node);
  }

  const { tag, props = {}, children } = node;

  // Constrói atributos
  const attrs = Object.entries(props)
    .filter(([key]) => key !== "children")
    .map(([key, value]) => {
      if (key === "style" && typeof value === "object" && value !== null) {
        const styleString = Object.entries(value)
          .map(([sk, sv]) => `${sk}:${sv}`)
          .join(";");
        return `style="${escapeHtml(styleString)}"`;
      }

      if (key === "className") {
        return `class="${escapeHtml(String(value))}"`;
      }

      if (value === true) {
        return key;
      }

      return `${key}="${escapeHtml(String(value))}"`;
    })
    .join(" ");

  const inner = children?.map(render).join("") ?? "";

  return `<${tag}${attrs ? " " + attrs : ""}>${inner}</${tag}>`;
}
