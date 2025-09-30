import * as cheerio from "cheerio";
import type { Element, Node as DomNode, Text } from "domhandler";
import { AttributeUtils } from "../utils/attributeUtils";
import { ComponentMapper } from "./componentMapper";
import { optimizeLocalImage } from "../utils/imageOptimizer";

const COMPONENT_DEFAULTS: Record<string, {
  defaultClass?: string;
  defaultStyle?: Record<string, any>
}> = {
  Center: {
    defaultClass: "center",
    defaultStyle: {
      "width": "100%",
      "min-height": "100vh",
      "display": "flex",
      "flex-direction": "column",
      "justify-content": "center",
      "align-items": "center",
    },
  },
};

function styleObjectToString(obj: Record<string, any>): string {
  return Object.entries(obj).map(([k, v]) => `${k}:${v}`).join(";");
}

export class TemplateProcessor {
  constructor(private scopeAttr: string) { }

  async processNode($: cheerio.CheerioAPI, node: DomNode): Promise<string> {
    if (node.type === "text") {
      return (node as Text).data ?? "";
    }
    if (node.type === "tag") return this.processElement($, node as Element);
    return "";
  }

  private async processElement($: cheerio.CheerioAPI, element: Element): Promise<string> {
    const tagName = element.name;
    const props = this.extractAttributes(element);

    this.validateTag(tagName);

    // image optimization hook (local images only)
    if (tagName === "Image" && props.src && typeof props.src === "string" && !props.src.startsWith("http")) {
      const quality = typeof props.quality === "number" ? props.quality : 75;
      try {
        props.src = await optimizeLocalImage(props.src, quality);
      } catch (e) {
        console.warn("[optimizeLocalImage] failed:", e);
      }
    }

    // inject component defaults (class + style) for known native components
    if (/^[A-Z]/.test(tagName)) {
      const defaults = COMPONENT_DEFAULTS[tagName];
      if (defaults) {
        if (defaults.defaultClass) props.class = `${defaults.defaultClass} ${props.class ?? ""}`.trim();
        if (defaults.defaultStyle) {
          const defStr = styleObjectToString(defaults.defaultStyle);
          if (!props.style) props.style = defStr;
          else if (typeof props.style === "string") props.style = `${defStr}; ${props.style}`;
          else props.style = `${defStr}; ${String(props.style)}`;
        }
      }
    }

    const htmlTag = /^[A-Z]/.test(tagName) ? ComponentMapper.mapToHTMLTag(tagName, props) : tagName;
    props[this.scopeAttr] = "";

    const attributes = AttributeUtils.objectToString(props);
    const children = await this.processChildren($, element);

    return `<${htmlTag}${attributes}>${children}</${htmlTag}>`;
  }

  private extractAttributes(element: Element): Record<string, any> {
    const props: Record<string, any> = {};
    const raw = element.attribs || {};
    for (const [k, v] of Object.entries(raw)) {
      if (v != null) props[k] = AttributeUtils.parseValue(v);
    }
    return props;
  }

  private validateTag(tagName: string) {
    // validation is handled at higher level (compiler) or can be added here
    return;
  }

  private isComponent(tagName: string) {
    return /^[A-Z]/.test(tagName);
  }

  private async processChildren($: cheerio.CheerioAPI, element: Element): Promise<string> {
    const nodes = $(element).contents().toArray();
    const mapped = await Promise.all(nodes.map((n) => this.processNode($, n)));
    return mapped.join("");
  }
}