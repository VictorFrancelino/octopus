import fs from "fs";
import * as cheerio from "cheerio";
import type { Node, Element, Text } from "domhandler";
import crypto from "crypto";
import { optimizeLocalImage } from "./utils/imageOptimizer";

// ===== CONSTANTES E CONFIGURAÇÕES =====
const CONFIG = {
  ALLOWED_HTML_TAGS: new Set([
    "div",
    "span",
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "button",
    "section",
    "article",
    "header",
    "footer",
    "main",
    "nav",
    "form",
    "input",
    "label",
    "textarea",
    "small",
    "strong",
    "em",
    "br",
    "hr",
  ]),
  NATIVE_COMPONENTS: new Set(["Title", "Text", "Row", "Column", "Image"]),
  SCOPE_HASH_LENGTH: 6,
} as const;

// ===== TIPOS =====
interface TemplateParts {
  template: string;
  style: string;
  script: {
    content: string;
    attributes: string;
  };
}

interface CompilationResult {
  html: string;
  css: string;
  js: string;
}

// ===== UTILITÁRIOS =====
class AttributeUtils {
  static escape(value: any): string {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  static parseValue(value: string): string | number | boolean {
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(Number(value)) && value.trim() !== "") return Number(value);
    return value;
  }

  static objectToString(
    attrs: Record<string, string | number | boolean | undefined>
  ): string {
    const pairs: string[] = [];

    for (const [key, value] of Object.entries(attrs)) {
      if (value == null) continue;

      if (value === true) {
        pairs.push(key);
      } else if (typeof value === "number") {
        pairs.push(`${key}="${value}"`);
      } else if (value === "") {
        pairs.push(key);
      } else {
        pairs.push(`${key}="${this.escape(value)}"`);
      }
    }

    return pairs.length ? ` ${pairs.join(" ")}` : "";
  }
}

class ComponentMapper {
  static mapToHTMLTag(
    componentName: string,
    props: Record<string, any>
  ): string {
    const mappings: Record<string, (props: Record<string, any>) => string> = {
      Title: (props) => {
        const tag = props.as || "h1";
        delete props.as;
        return tag;
      },
      Text: (props) => {
        const tag = props.as || "p";
        delete props.as;
        return tag;
      },
      Row: () => "div",
      Column: () => "div",
      Image: () => "img",
    };

    const mapper = mappings[componentName];
    if (!mapper) {
      throw new Error(`Unknown Octopus component <${componentName}>`);
    }

    return mapper(props);
  }
}

class CSSScoper {
  static addScopeToSegment(segment: string, attr: string): string {
    if (!segment || segment.startsWith(":") || segment === "*") return segment;

    const pseudoIndex = segment.indexOf(":");
    const main = pseudoIndex === -1 ? segment : segment.slice(0, pseudoIndex);
    const pseudo = pseudoIndex === -1 ? "" : segment.slice(pseudoIndex);

    return main ? `${main}[${attr}]${pseudo}` : segment;
  }

  static scopeSelector(selector: string, attr: string): string {
    const parts = selector.split(/(\s+|>|\+|~)/g);
    return parts
      .map((part) =>
        /^\s+$/.test(part) || [">", "+", "~"].includes(part)
          ? part
          : this.addScopeToSegment(part.trim(), attr)
      )
      .join("");
  }

  static scopeCSS(css: string, attr: string): string {
    let result = "";
    let position = 0;

    while (position < css.length) {
      const blockStart = css.indexOf("{", position);
      if (blockStart === -1) {
        result += css.slice(position);
        break;
      }

      const selectorText = css.slice(position, blockStart).trim();
      const blockEnd = this.findMatchingBrace(css, blockStart);

      if (blockEnd === -1) {
        result += css.slice(position);
        break;
      }

      const blockContent = css.slice(blockStart + 1, blockEnd);

      if (selectorText.startsWith("@")) {
        result += this.processAtRule(selectorText, blockContent, attr);
      } else {
        result += this.processRegularRule(selectorText, blockContent, attr);
      }

      position = blockEnd + 1;
    }

    return result;
  }

  private static findMatchingBrace(css: string, start: number): number {
    let depth = 1;
    for (let i = start + 1; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;

      if (depth === 0) return i;
    }
    return -1;
  }

  private static processAtRule(
    rule: string,
    content: string,
    attr: string
  ): string {
    const ruleName = rule.split(/\s+/)[0] || "";

    if (ruleName.startsWith("@keyframes")) {
      return `${rule}{${content}}`;
    } else {
      return `${rule}{${this.scopeCSS(content, attr)}}`;
    }
  }

  private static processRegularRule(
    selectors: string,
    content: string,
    attr: string
  ): string {
    const scopedSelectors = selectors
      .split(",")
      .map((selector) => this.scopeSelector(selector.trim(), attr))
      .join(", ");

    return `${scopedSelectors}{${content}}`;
  }
}

// ===== PROCESSADOR DE TEMPLATE =====
class TemplateProcessor {
  constructor(private scopeAttr: string) {}

  async processNode($: cheerio.CheerioAPI, node: Node): Promise<string> {
    if (node.type === "text") {
      return (node as Text).data ?? "";
    }

    if (node.type === "tag") {
      return await this.processElement($, node as Element);
    }

    return "";
  }

  private async processElement(
    $: cheerio.CheerioAPI,
    element: Element
  ): Promise<string> {
    const tagName = element.name;
    const props = this.extractAttributes(element);

    this.validateTag(tagName);

    // ===== LÓGICA DE OTIMIZAÇÃO DE IMAGEM =====
    // Intercepta o componente Image antes de renderizar
    if (
      tagName === "Image" &&
      props.src &&
      typeof props.src === "string" &&
      !props.src.startsWith("http")
    ) {
      console.log(`[Compiler] Otimizando imagem local: ${props.src}`);
      // Chama o otimizador e espera pelo novo caminho
      const quality = typeof props.quality === "number" ? props.quality : 75;
      props.src = await optimizeLocalImage(props.src, quality);
    }

    const htmlTag = this.isComponent(tagName)
      ? ComponentMapper.mapToHTMLTag(tagName, props)
      : tagName;

    props[this.scopeAttr] = "";

    const attributes = AttributeUtils.objectToString(props);
    const children = await this.processChildren($, element);

    return `<${htmlTag}${attributes}>${children}</${htmlTag}>`;
  }

  private extractAttributes(element: Element): Record<string, any> {
    const props: Record<string, any> = {};
    const rawAttrs = element.attribs || {};

    for (const [key, value] of Object.entries(rawAttrs)) {
      if (value != null) {
        props[key] = AttributeUtils.parseValue(value);
      }
    }

    return props;
  }

  private validateTag(tagName: string): void {
    const isComponent = this.isComponent(tagName);

    if (isComponent && !CONFIG.NATIVE_COMPONENTS.has(tagName)) {
      throw new Error(`Unknown Octopus component <${tagName}>`);
    } else if (!isComponent && !CONFIG.ALLOWED_HTML_TAGS.has(tagName)) {
      throw new Error(
        `HTML tag <${tagName}> is not allowed in Octopus templates`
      );
    }
  }

  private isComponent(tagName: string): boolean {
    return /^[A-Z]/.test(tagName);
  }

  private async processChildren(
    $: cheerio.CheerioAPI,
    element: Element
  ): Promise<string> {
    const childNodes = $(element).contents().toArray();
    const childrenHtml = await Promise.all(
      childNodes.map((child) => this.processNode($, child))
    );
    return childrenHtml.join("");
  }
}

// ===== EXTRATOR DE PARTES DO TEMPLATE =====
class TemplateParser {
  static extractParts(source: string): TemplateParts {
    return {
      template: this.extractTagContent(source, "template"),
      style: this.extractTagContent(source, "style"),
      script: {
        content: this.extractTagContent(source, "script"),
        attributes: this.extractScriptAttributes(source),
      },
    };
  }

  private static extractTagContent(source: string, tag: string): string {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`, "i");
    const match = source.match(regex);
    return match?.[1]?.trim() ?? "";
  }

  private static extractScriptAttributes(source: string): string {
    const match = source.match(/<script([^>]*)>/i);
    return match?.[1]?.trim() ?? "";
  }
}

// ===== COMPILADOR PRINCIPAL =====
class OctopusCompiler {
  static async compile(source: string): Promise<string> {
    const parts = TemplateParser.extractParts(source);
    const scopeAttr = this.generateScopeAttr(parts.template);

    const result = {
      html: await this.compileTemplate(parts.template, scopeAttr),
      css: this.compileCSS(parts.style, scopeAttr),
      js: this.compileScript(parts.script),
    };

    return this.assembleFinalOutput(result);
  }

  private static generateScopeAttr(template: string): string {
    const hash = crypto
      .createHash("md5")
      .update(template)
      .digest("hex")
      .slice(0, CONFIG.SCOPE_HASH_LENGTH);

    return `data-v-${hash}`;
  }

  private static async compileTemplate(
    template: string,
    scopeAttr: string
  ): Promise<string> {
    if (!template) return "";

    const $ = cheerio.load(`<body>${template}</body>`, { xmlMode: true });
    const processor = new TemplateProcessor(scopeAttr);
    const rootChildren = $("body").contents().toArray();

    const compiledNode = await Promise.all(
      rootChildren.map((node) => processor.processNode($, node))
    );

    return compiledNode.join("");
  }

  private static compileCSS(style: string, scopeAttr: string): string {
    return style ? CSSScoper.scopeCSS(style, scopeAttr) : "";
  }

  private static compileScript(script: {
    content: string;
    attributes: string;
  }): string {
    if (!script.content) return "";

    const attrs = script.attributes ? ` ${script.attributes}` : "";
    return `\n<script${attrs}>\n${script.content}\n</script>`;
  }

  private static assembleFinalOutput(result: CompilationResult): string {
    const cssTag = result.css ? `\n<style>${result.css}</style>` : "";
    return `${result.html}${cssTag}${result.js}`;
  }
}

// ===== API PÚBLICA =====
export async function compileOctopus(source: string): Promise<string> {
  return OctopusCompiler.compile(source);
}

export async function compilePage(inputPath: string): Promise<string> {
  const source = fs.readFileSync(inputPath, "utf-8");
  return compileOctopus(source);
}
