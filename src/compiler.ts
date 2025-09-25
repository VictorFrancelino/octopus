import fs from "fs";
import * as cheerio from "cheerio";
import type { Node, Element, Text } from "domhandler";
import crypto from "crypto";

function hash(str: string) {
  return crypto.createHash("md5").update(str).digest("hex").slice(0, 6);
}

function camelToKebab(s: string) {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

// Parse estilinho JS-like { fontSize: "32px", color: 'red' } → "font-size:32px; color:red;"
function parseJsStyleObject(objStr: string): string {
  // Remove { } e possíveis trailing commas
  const inner = objStr.replace(/^\s*\{\s*/, "").replace(/\s*\}\s*$/, "");
  const pairs: string[] = [];
  // Regex simples para key: value (value pode estar entre " ' ou sem aspas)
  const re = /([a-zA-Z0-9_$-]+)\s*:\s*(?:(["'])(.*?)\2|([^,]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner)) !== null) {
    const key = m[1];
    const rawVal = m[3] ?? m[4] ?? "";
    const val = String(rawVal).trim();
    pairs.push(`${camelToKebab(key)}:${val}`);
  }
  return pairs.join("; ");
}

// Recebe value que pode ser:
// - CSS string: "font-size: 12px; color:red"
// - JS-object-like: "{ fontSize: '12px' }" or "{{ ... }}" (curly braces from template)
// Retorna string CSS para inserir em style attr
function normalizeStyleAttr(value: string): string {
  if (!value) return "";
  const v = value.trim();
  // já string CSS (ex: "color: red;")
  if (!v.startsWith("{")) {
    return v.replace(/\s*;\s*$/, ""); // remove ; final se quiser
  }
  // se parece objeto JS { ... } ou {{ ... }}
  // remove possiveis duplas {{ ... }} → { ... }
  const single = v.replace(/^\{\{/, "{").replace(/\}\}$/, "}");
  try {
    // usar parser simples via regex (não eval)
    return parseJsStyleObject(single);
  } catch (e) {
    return "";
  }
}

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
function nodeToHtml($: cheerio.CheerioAPI, node: Node, scopeHash: string): string {
  if (node.type === "text") {
    const textNode = node as Text;
    const text = textNode.data ?? "";
    // não trimamos aqui para preservar espaços intencionais; mas remove excesso de newlines se quiser
    return text;
  }

  if (node.type === "tag") {
    const el = node as Element;
    const tagName = el.name; // ex: "div" ou "Row"

    // clone attributes
    const rawAttrs = el.attribs || {};
    const props: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(rawAttrs)) {
      // remove surrounding whitespace
      props[k] = v?.trim();
    }

    // Decide se é componente nativo (inicia com maiúscula e está no seu conjunto)
    const isComponent = /^[A-Z]/.test(tagName);
    let outTag = tagName;
    if (isComponent) {
      const mapped = componentToTag(tagName, props);
      if (mapped) outTag = mapped;
      else {
        // Se componente desconhecido, caímos pro div por segurança
        outTag = "div";
      }
    }

    // Trate classes padrão de Row / Column
    if (tagName === "Row") {
      const existing = props["class"] ?? "";
      props["class"] = ["row", existing].filter(Boolean).join(" ").trim();
      // style default
      const styleFromProps = normalizeStyleAttr(props["style"] ?? "");
      const defaultStyle = "display:flex";
      props["style"] = [defaultStyle, styleFromProps].filter(Boolean).join("; ");
    } else if (tagName === "Column") {
      const existing = props["class"] ?? "";
      props["class"] = ["column", existing].filter(Boolean).join(" ").trim();
      const styleFromProps = normalizeStyleAttr(props["style"] ?? "");
      const defaultStyle = "display:flex; flex-direction:column";
      props["style"] = [defaultStyle, styleFromProps].filter(Boolean).join("; ");
    } else {
      // para Title/Text, processar style attr se existir (obj-like ou css string)
      if (props["style"]) {
        props["style"] = normalizeStyleAttr(props["style"]);
      }
    }

    // REMOVE atributos JS-like para não aparecerem no HTML: por ex as={{...}} já processamos
    // também removemos atributos vazios
    // adiciona attribute de escopo
    props[`data-v-${scopeHash}`] = "";

    // montar string de attributes
    const attrsStr = attrsObjToString(props);

    // children
    const children = $(el)
      .contents()
      .toArray()
      .map((child) => nodeToHtml($, child, scopeHash))
      .join("");

    // Self-closing tags (input, img, br...) — trata como normal aqui (fechamos)
    return `<${outTag}${attrsStr}>${children}</${outTag}>`;
  }

  return "";
}

// ---- Função principal pública (compila um arquivo .oct para um módulo JS string) ----
export function compileOctopus(filePath: string): string {
  const source = fs.readFileSync(filePath, "utf-8");

  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/);
  const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
  const styleMatch = source.match(/<style>([\s\S]*?)<\/style>/);

  const template = templateMatch?.[1]?.trim() ?? "";
  const script = scriptMatch?.[1]?.trim() ?? "";
  const style = styleMatch?.[1]?.trim() ?? "";

  // scope hash
  const scopeHash = hash(template);

  // parse template via cheerio for HTML → we'll render to HTML string
  const $ = cheerio.load(`<body>${template}</body>`, { xmlMode: true });
  const rootChildren = $("body").contents().toArray();

  const html = rootChildren.map((n) => nodeToHtml($, n, scopeHash)).join("") || "";

  // process scoped css: garante que seletores tenham [data-v-hash]
  const scopedCss = (style || "").replace(/([^\r\n,{}]+)(?=\s*{)/g, (selector) => {
    if (selector.trim().startsWith("@")) return selector;
    return `${selector}[data-v-${scopeHash}]`;
  });

  // monta módulo final (renderTemplate retorna string HTML)
  const out = `// Código gerado pelo Octopus Compiler
import { renderPage } from "./core/page";

// Script original
${script}

// Estilos gerados (injetar no renderPage ou no servidor)
const pageStyles = ${JSON.stringify(scopedCss)};

// Função de renderização (retorna HTML string)
export function render(props) {
  const body = ${JSON.stringify(html)};
  return renderPage(body);
}
`;

  return out;
}

// Se preferir versão assíncrona baseada em fs.promises:
export async function compilePage(inputPath: string): Promise<string> {
  return compileOctopus(inputPath);
}
