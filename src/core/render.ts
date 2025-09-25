import type { Node } from "./h";

// Função para evitar ataques XSS
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
  if (typeof node === "string") return escapeHtml(node);

  const { tag, props, children } = node;

  const attrs = Object.entries(props)
    .map(([k, v]) => {
      if (k === "style" && typeof v === "object" && v !== null) {
        const styleString = Object.entries(v)
          .map(([sk, sv]) => `${sk}:${sv}`)
          .join(";");
        return `style="${escapeHtml(styleString)}"`;
      }
      return `${k}="${escapeHtml(String(v))}"`;
    })
    .join(" ");

  const inner = children.map(render).join("");

  return `<${tag}${attrs ? " " + attrs : ""}>${inner}</${tag}>`;
}
