import * as cheerio from "cheerio";
import crypto from "crypto";
import type { Element, Node as DomNode, Text as DomText } from "domhandler";
import { AttributeUtils } from "../utils/attributeUtils";

/**
 * Processa um nó de forma síncrona (texto ou elemento).
 */
export function processNode($: cheerio.CheerioAPI, node: DomNode): string {
  if (node.type === "text") return (node as DomText).data ?? "";
  
  if (node.type === "tag") return processElement($, node as Element);

  return "";
}

/**
 * Processa um elemento HTML padrão.
 */
export function processElement($: cheerio.CheerioAPI, element: Element): string {
  const tagName = element.name;
  const rawProps = extractAttributes(element);
  const attributes = AttributeUtils.objectToString(rawProps);
  const children = processChildren($, element);
  return `<${tagName}${attributes}>${children}</${tagName}>`;
}

export function extractAttributes(element: Element): Record<string, any> {
  const props: Record<string, any> = {};
  const raw = element.attribs || {};

  for (const [k, v] of Object.entries(raw)) {
    if (v != null) props[k] = AttributeUtils.parseValue(v);
  }

  return props;
}

export function processChildren($: cheerio.CheerioAPI, element: Element): string {
  const nodes = $(element).contents().toArray();
  const mapped = nodes.map(n => processNode($, n));
  return mapped.join("");
}

/**
 * Gera um atributo de escopo CSS único baseado no hash do template.
 */
export function generateScopeAttr(template: string): string {
  const tpl = template || "";
  return `data-v-${crypto.createHash("md5").update(tpl).digest("hex").slice(0, 6)}`;
}

/**
 * Compila a string de template (HTML/Octopus) em HTML puro com atributos de escopo.
 */
export function compileTemplate(template: string, scopeAttr: string): string {
  if (!template) return "";
  
  const $ = cheerio.load(`<body>${template}</body>`, { xmlMode: true });
  
  const roots = $("body").contents().toArray(); 
  
  const compiled = roots.map((r) => processNode($, r));
  
  return compiled.join("");
}