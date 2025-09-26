import fs from "fs";
import * as cheerio from "cheerio";
import type { Node, Element, Text } from "domhandler";
import crypto from "crypto";

const allowedHtmlTags = new Set([
  "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "a", "img", "button", "section", "article",
  "header", "footer", "main", "nav", "form", "input", "label",
  "textarea", "small", "strong", "em", "br", "hr"
])

const nativeComponents = new Set(["Title", "Text", "Row", "Column"])

// escapador básico para valores de atributos
function escapeAttr(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

// Converte um objeto de atributos para string HTML: { id: "x", class: "y" } → ' id="x" class="y"'
function attrsObjToString(attrs: Record<string, string | undefined>): string {
  const pairs: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === "") continue;
    pairs.push(`${k}="${escapeAttr(v)}"`);
  }
  return pairs.length ? " " + pairs.join(" ") : "";
}

// Mapeamento simples de componentes nativos → tag HTML defaults
function componentToTag(componentName: string, props: Record<string, string | undefined>) {
  switch (componentName) {
    case "Title": {
      const as = props["as"] ?? "h1";
      delete props["as"];
      return as;
    }
    case "Text": {
      const as = props["as"] ?? "p";
      delete props["as"];
      return as;
    }
    case "Row":
    case "Column": {
      return "div";
    }
    default:
      return null;
  }
}

// Constrói HTML recursivamente: retorna string HTML
function nodeToHtml($: cheerio.CheerioAPI, node: Node): string {
  if (node.type === "text") {
    const textNode = node as Text;
    return textNode.data ?? "";
  }

  if (node.type === "tag") {
    const el = node as Element;
    const tagName = el.name;

    const rawAttrs = el.attribs || {};
    const props: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(rawAttrs)) {
      props[k] = v?.trim();
    }

    const isComponent = /^[A-Z]/.test(tagName);

    if (isComponent) {
      if (!nativeComponents.has(tagName)) {
        throw new Error(`Unknown Octopus component <${tagName}>`);
      }
    } else {
      if (!allowedHtmlTags.has(tagName)) {
        throw new Error(`HTML tag <${tagName}> is not allowed in Octopus templates`);
      }
    }

    let outTag = tagName
    if (isComponent) {
      const mapped = componentToTag(tagName, props);
      if (!mapped) throw new Error(`No mapping for component <${tagName}>`);
      outTag = mapped;
    }

    const attrsStr = attrsObjToString(props);

    const children = $(el)
      .contents()
      .toArray()
      .map((child) => nodeToHtml($, child))
      .join("");

    return `<${outTag}${attrsStr}>${children}</${outTag}>`;
  }

  return "";
}

// ---- Função principal pública (compila um arquivo .oct para um módulo JS string) ----
export function compileOctopus(source: string): string {
  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/);
  const template = templateMatch?.[1]?.trim() ?? "";

  const $ = cheerio.load(`<body>${template}</body>`, { xmlMode: true });
  const rootChildren = $("body").contents().toArray();

  const html = rootChildren.map((n) => nodeToHtml($, n)).join("") || "";
  return html
}

// Se preferir versão assíncrona baseada em fs.promises:
export async function compilePage(inputPath: string): Promise<string> {
  return compileOctopus(inputPath);
}
