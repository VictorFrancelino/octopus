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
    if (v == null) continue;
    if (v === "") {
      pairs.push(`${k}`)
    } else {
      pairs.push(`${k}="${escapeAttr(v)}"`);
    }
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

function addScopeToSimpleSegment(segment: string, attr: string): string {
  if (!segment || segment.startsWith(":") || segment === "*") return segment;

  const pseudoIndex = segment.indexOf(":");
  const main = pseudoIndex === -1 ? segment : segment.slice(0, pseudoIndex)
  const pseudo = pseudoIndex === -1 ? "" : segment.slice(pseudoIndex)

  if (!main) return segment

  return `${main}[${attr}]${pseudo}`
}

function scopeSelector(selector: string, attr: string): string {
  const parts = selector.split(/(\s+|>|\+|~)/g)
  return parts
    .map(part => {
      if (/^\s+$/.test(part) || part === ">" || part === "+" || part === "~") return part
      return addScopeToSimpleSegment(part.trim(), attr)
    })
    .join("")
}

function scopeCss(css: string, attr: string): string {
  let out = "";
  let i = 0;
  const len = css.length;

  while (i < len) {
    const idx = css.indexOf("{", i);
    if (idx === -1) {
      out += css.slice(i);
      break;
    }

    const selectorText = css.slice(i, idx).trim();

    let j = idx + 1;
    let depth = 1;
    while (j < len && depth > 0) {
      const ch = css[j];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      j++;
    }
    const blockContent = css.slice(idx + 1, j - 1);

    if (selectorText.startsWith("@")) {
      const atRuleName = selectorText.split(/\s+/)[0] ?? "";
      if (/^@keyframes/.test(atRuleName)) {
        out += selectorText + "{" + blockContent + "}";
      } else {
        out += selectorText + "{" + scopeCss(blockContent, attr) + "}";
      }
    } else {
      const selectors = selectorText.split(",").map(s => s.trim()).filter(Boolean);
      const scoped = selectors.map(s => scopeSelector(s, attr)).join(", ");
      out += scoped + "{" + blockContent + "}";
    }

    i = j;
  }

  return out;
}

// Constrói HTML recursivamente: retorna string HTML
function nodeToHtml($: cheerio.CheerioAPI, node: Node, scopeAttr: string): string {
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

    props[scopeAttr] = "";

    const attrsStr = attrsObjToString(props);

    const children = $(el)
      .contents()
      .toArray()
      .map((child) => nodeToHtml($, child, scopeAttr))
      .join("");

    return `<${outTag}${attrsStr}>${children}</${outTag}>`;
  }

  return "";
}

// ---- Função principal pública (compila um arquivo .oct para um módulo JS string) ----
export function compileOctopus(source: string): string {
  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/);
  const styleMatch = source.match(/<style>([\s\S]*?)<\/style>/);
  const scriptMatch = source.match(/<script([^>]*)>([\s\S]*?)<\/script>/i)

  const template = templateMatch?.[1]?.trim() ?? "";
  const style = styleMatch?.[1]?.trim() ?? ""

  const scriptAttrsRaw = scriptMatch?.[1]?.trim() ?? ""
  const scriptContent = scriptMatch?.[2] ?? ""

  const scopeHash = crypto.createHash("md5").update(template).digest("hex").slice(0, 6)
  const scopeAttr = `data-v-${scopeHash}`

  const $ = cheerio.load(`<body>${template}</body>`, { xmlMode: true });
  const rootChildren = $("body").contents().toArray();
  const html = rootChildren.map((n) => nodeToHtml($, n, scopeAttr)).join("") || "";

  const finalCss = style ? scopeCss(style, `data-v-${scopeHash}`) : ""
  const cssTag = finalCss ? `\n<style>${finalCss}</style>` : ""

  const scriptTag = scriptContent
    ? `\n<script${scriptAttrsRaw ? " " + scriptAttrsRaw : ""}>\n${scriptContent}\n</script>`
    : ""

  return `${html}${cssTag}${scriptTag}`
}

// Versão assíncrona baseada em fs.promises:
export async function compilePage(inputPath: string): Promise<string> {
  const source = fs.readFileSync(inputPath, "utf-8")
  return compileOctopus(source);
}
