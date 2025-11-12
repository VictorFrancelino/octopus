import { readIndexTemplate, escapeForHtml } from "./templates";
import { compileFileCached } from "./compileCache";
import path from "path";

/**
 * Render a compiled .oct page into the index.html skeleton.
 * - uses frontmatter (title, description) if present
 * - injects params as window.__OCTO_PARAMS__
 */
export async function renderPageFromOct(file: string, meta: { title?: string; description?: string } = {}, params?: Record<string, string>): Promise<string> {
  const template = readIndexTemplate();
  const compiled = await compileFileCached(file);

  const fm = compiled.frontmatter || {};
  const title = fm.title ?? meta.title ?? path.basename(file).replace(/\.oct$/, "");
  const description = fm.description ?? meta.description ?? "";

  const paramsScript = params && Object.keys(params).length ? `<script>window.__OCTO_PARAMS__ = ${JSON.stringify(params)}</script>` : "";

  const body = `${paramsScript}${compiled.htmlBody}${compiled.css}${compiled.js}`;

  return template
    .replace("{{title}}", escapeForHtml(title))
    .replace("{{description}}", escapeForHtml(description))
    .replace("{{body}}", body);
}