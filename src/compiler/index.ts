import fs from "fs";
import { extractParts } from "./templateParser";
import { CSSScoper } from "./cssScoper";
import * as cheerio from "cheerio";
import crypto from "crypto";
import { TemplateProcessor } from "./templateProcessor";

export type CompilationResult = {
  htmlBody: string;
  css: string;
  js: string;
  frontmatter: Record<string, any>;
}

function generateScopeAttr(template: string) {
  const tpl = template || "";
  return `data-v-${crypto.createHash("md5").update(tpl).digest("hex").slice(0, 6)}`;
}

async function compileTemplate(template: string, scopeAttr: string) {
  if (!template) return "";
  const $ = cheerio.load(`<body>${template}</body>`, { xmlMode: true });
  const processor = new TemplateProcessor(scopeAttr);
  const roots = $("body").contents().toArray();
  const compiled = await Promise.all(roots.map((r) => processor.processNode($, r)));
  return compiled.join("");
}

export async function compileOctopus(source: string): Promise<CompilationResult> {
  const parts = extractParts(source);
  const scopeAttr = generateScopeAttr(parts.template);

  const htmlBody = await compileTemplate(parts.template ?? "", scopeAttr);
  const css = parts.style ? CSSScoper.scopeCSS(parts.style, scopeAttr) : "";
  const js = parts.script.content ? `\n<script ${parts.script.attributes}>${parts.script.content}\n</script>` : "";

  return {
    frontmatter: parts.frontmatter ?? {},
    htmlBody,
    css: css ? `\n<style>${css}</style>` : "",
    js,
  };
}

export async function compilePage(inputPath: string): Promise<string> {
  const source = fs.readFileSync(inputPath, "utf-8");
  const compiled = await compileOctopus(source);
  return `${compiled.htmlBody}${compiled.css}${compiled.js}`
}