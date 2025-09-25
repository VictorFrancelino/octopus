import { render } from "./render";
import type { Node } from "./h";

export interface PageMeta {
  title?: string;
  description?: string;
  lang?: string;
}

export function renderPage(body: Node | string, meta: PageMeta = {}): string {
  const title = meta.title || "Octopus App";
  const description =
    meta.description || "Uma página gerada com o framework Octopus.";
  const lang = meta.lang || "pt-BR";

  return `
  <!DOCTYPE html>
  <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="${description}">
      <title>${title}</title>
    </head>
    <body>
      ${render(body)}
    </body>
  </html>
  `;
}
