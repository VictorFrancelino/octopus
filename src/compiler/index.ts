import fs from "fs"
import { extractParts } from "./parsers";
import { compileTemplate, generateScopeAttr } from "./processors/cheerioProcessor";
import type { CompilationResult, KeyedContent } from "./types";

const pageKeyMap: {
  html: KeyedContent[],
  css: KeyedContent[],
} = {
  html: [],
  css: []
}

/**
 * Função principal para compilar um arquivo Octopus completo.
 */
export function compileOctopus(source: string): CompilationResult {
  const parts = extractParts(source);
  const scopeAttr = generateScopeAttr(parts.template);

  const frontmatter = parts.frontmatter ?? {}

  const body = compileTemplate(parts.template ?? "", scopeAttr);
  pageKeyMap.html.push({key: scopeAttr, content: body});

  const css = parts.style ? `<style>${parts.style}</style>` : "";
  pageKeyMap.css.push({ key: scopeAttr, content: css });

  const js = parts.script.content ? `\n<script ${parts.script.attributes}>${parts.script.content}\n</script>` : "";

  console.log(pageKeyMap);

  return { frontmatter, body, css, js, };
}

export function compilePage(inputPath: string): string {
  const source = fs.readFileSync(inputPath, "utf-8");
  const compiled = compileOctopus(source);
  return `${compiled.body}${compiled.css}${compiled.js}`
}