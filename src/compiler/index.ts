import fs from "fs";
import crypto from "crypto";
import * as cheerio from "cheerio";
import { extractParts } from "./templateParser";
import { TemplateProcessor } from "./templateProcessor";
import { CSSScoper } from "./cssScoper";

const CONFIG = {
  SCOPE_HASH_LENGTH: 6,
};

function generateScopeAttr(template: string) {
  const hash = crypto.createHash("md5").update(template).digest("hex").slice(0, CONFIG.SCOPE_HASH_LENGTH);
  return `data-v-${hash}`;
}

async function compileTemplate(template: string, scopeAttr: string) {
  if (!template) return "";
  const $ = cheerio.load(`<body>${template}</body>`, { xmlMode: true });
  const processor = new TemplateProcessor(scopeAttr);
  const roots = $("body").contents().toArray();
  const compiled = await Promise.all(roots.map((r) => processor.processNode($, r)));
  return compiled.join("");
}

export async function compileOctopus(source: string): Promise<string> {
  const parts = extractParts(source);
  const scopeAttr = generateScopeAttr(parts.template);
  const html = await compileTemplate(parts.template, scopeAttr);
  const css = parts.style ? CSSScoper.scopeCSS(parts.style, scopeAttr) : "";
  const js = parts.script.content ? `\n<script ${parts.script.attributes}>${parts.script.content}\n</script>` : "";
  const cssTag = css ? `\n<style>${css}</style>` : "";
  return `${html}${cssTag}${js}`;
}

export async function compilePage(inputPath: string): Promise<string> {
  const source = fs.readFileSync(inputPath, "utf-8");
  return compileOctopus(source);
}