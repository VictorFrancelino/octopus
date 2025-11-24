import path from "path";
import { compileOctopus } from "../../compiler";
import { indexHtml } from "../../utils/paths";

// Cache em memória para evitar ler o disco a cada requisição
let templateCache: string | null = null;

/**
 * Utilitário nativo para escapar HTML (substitui a lib 'he').
 * Mais leve e rápido para o caso de uso simples.
 */
function escapeHtml(unsafe: unknown): string {
  return String(unsafe ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Lê o template principal (index.html) de forma assíncrona.
 */
async function readIndexTemplate(): Promise<string> {
  if (templateCache) return templateCache;

  const file = Bun.file(indexHtml);

  if (!await file.exists()) {
    console.error(`⚠️ Layout template not found at: ${indexHtml}. Using default fallback.`);
    return templateCache = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        {{style}}
        <title>{{title}}</title>
      </head>
      <body>
        {{body}}
      </body>
      </html>`
    ;
  }

  const source = await file.text();
  if (!source.includes("{{body}}")) console.warn("⚠️ AVISO: O seu index.html não tem {{body}}. A página aparecerá em branco.");
  
  templateCache = source;
  return source;
}

/**
 * Renderiza uma página .oct compilada dentro do esqueleto index.html.
 */
export async function renderPageFromOct(
  filePath: string, 
  meta: { title?: string; description?: string } = {}, 
  params?: Record<string, string>
): Promise<string> {
  const absPath = path.resolve(filePath);
  const octFile = Bun.file(absPath);
  
  // 1. Paralelismo: Verifica existência do arquivo E lê o template ao mesmo tempo
  const [exists, template] = await Promise.all([
    octFile.exists(),
    readIndexTemplate()
  ]);

  if (!exists) throw new Error(`Octopus Page not found: ${absPath}`);

  // 2. Leitura e Compilação
  const source = await octFile.text();

  const compiled = compileOctopus(source);

  // 3. Preparação dos Dados
  const fm = compiled.frontmatter || {};
  const title = fm.title ?? meta.title ?? path.basename(filePath).replace(/\.oct$/, "");
  const description = fm.description ?? meta.description ?? "";
  const lang = fm.lang ?? "en"

  const paramsScript = params && Object.keys(params).length
    ? `<script>window.__OCTO_PARAMS__ = ${JSON.stringify(params)}</script>`
    : "";

  const bodyContent = `${paramsScript}${compiled.body}${compiled.js}`;
  const cssContent = compiled.css || ""

  let html = template
    .replace(/{{lang}}/gi, escapeHtml(lang))
    .replace(/{{title}}/gi, escapeHtml(title))
    .replace(/{{description}}/gi, escapeHtml(description))
    .replace(/{{body}}/gi, bodyContent)
    .replace(/{{style}}/gi, cssContent)

  return html;
}