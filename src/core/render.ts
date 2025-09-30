import type { Node } from "./h";
import { escape as heEscape } from "he";
import { htmlVoidElements } from "html-void-elements";

const voidSet = new Set(htmlVoidElements.map((t: string) => t.toLowerCase()));
const styleCache = new WeakMap();

// small helper: is valid HTML attribute name (simple conservative check)
function isValidAttrName(name: string): boolean {
  return /^[a-zA-Z_:][a-zA-Z0-9:._\-]*$/.test(name);
}

/**
 * Escape text for safe insertion into HTML content/attributes.
 * This function MUST be used for any user-provided text by default.
 */
function escapeHtml(value: unknown) {
  return heEscape(value == null ? "" : String(value));
}

/**
 * Convert a JS style object into a CSS string.
 * Example: { fontSize: "12px" } -> "font-size:12px"
 */
function styleObjectToString(styleObj: Record<string, any>): string {
  const toKebab = (s: string) =>
    s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
  return Object.entries(styleObj)
    .map(([k, v]) => `${toKebab(k)}:${v}`)
    .join(";");
}

/**
 * Lazy initializer for DOMPurify + JSDOM sanitizer.
 * Initialize only when needed to avoid JSDOM cost at startup.
 * If DOMPurify or JSDOM is not available, sanitizer stays null and we fall back to escapeHtml.
 */
let sanitizer: ((html: string) => string) | null = null;
let triedInit = false;

async function initSanitizerIfNeeded(): Promise<void> {
  if (triedInit) return;
  triedInit = true;

  try {
    const { JSDOM } = await import("jsdom");
    const createDOMPurify = (await import("dompurify")).default;

    const window = new JSDOM("").window;
    const DOMPurify = createDOMPurify(window);
    sanitizer = (html: string) => DOMPurify.sanitize(html);
  } catch (e) {
    console.warn(
      "DOMPurify/jsdom não pôde ser carregado. O fallback para escape HTML será usado.",
      e
    );
    sanitizer = null;
  }
}

/**
 * Sanitize HTML if possible, otherwise escape.
 * Use this ONLY when developer explicitly provided raw HTML (dangerous).
 */
function sanitizeHtmlOrEscape(html: string): string {
  if (!html) return "";
  initSanitizerIfNeeded();
  if (sanitizer) return sanitizer(html);
  return escapeHtml(html); // safer fallback
}

/**
 * Sanitize URL for use in href or src attributes.
 */
function sanitizeUrl(url: string): string {
  // Remove dangerous protocols: javascript:, data:, vbscript:, etc.
  const dangerousPatterns = /^(javascript:|data:|vbscript:)/i;
  if (dangerousPatterns.test(url.trim())) {
    return "";
  }
  return url;
}

/**
 * Render a VNode (Node) or text into HTML string.
 * - All text and attribute values are escaped by default.
 * - To allow raw HTML inside an element, pass:
 *     dangerouslySetInnerHTML: { __html: "<b>raw</b>" }
 *   That HTML will be sanitized via DOMPurify (if available) or escaped otherwise.
 */
export function render(node: Node | string): string {
  if (typeof node === "string") return escapeHtml(node);

  let { tag, props = {}, children } = node;
  const tagName = String(tag).toLowerCase();
  const parts = [];

  // handle dangerouslySetInnerHTML (explicit opt-in for raw HTML)
  let innerHtml = "";
  const dsih = (props as any).dangerouslySetInnerHTML;
  if (dsih && typeof dsih === "object" && dsih.__html != null) {
    innerHtml = sanitizeHtmlOrEscape(String(dsih.__html));
  } else {
    // render children recursively (safe: children are escaped in recursive calls)
    innerHtml = (children || []).map(render).join("");
  }

  // build attributes string
  const attrs = Object.entries(props)
    .filter(([key]) => key !== "children" && key !== "dangerouslySetInnerHTML")
    .map(([key, value]) => {
      // Allow data-* and aria-* attributes without validation
      const isDataAttr = key.startsWith("data-");
      const isAriaAttr = key.startsWith("aria-");

      // skip invalid attribute names
      if (!isValidAttrName(key) && !isDataAttr && !isAriaAttr) return "";

      // ignore un-serializable props
      if (typeof value === "function" || typeof value === "symbol") return "";

      // skip null/undefined/false
      if (value == null || value === false) return "";

      // Sanitize URLs in href and src attributes
      if ((key === "href" || key === "src") && typeof value === "string") {
        value = sanitizeUrl(value);
      }

      // allow style object
      if (key === "style" && typeof value === "object" && value !== null) {
        let styleString;
        if (styleCache.has(value)) {
          styleString = styleCache.get(value);
        } else {
          styleString = styleObjectToString(value);
          styleCache.set(value, styleString);
        }
        return `style="${escapeHtml(styleString)}"`;
      }

      // boolean attribute (true) -> attribute without value
      if (value === true) {
        return key;
      }

      // numbers or strings
      return `${key}="${escapeHtml(String(value))}"`;
    })
    .filter(Boolean)
    .join(" ");

  parts.push(`<${tagName}`);
  if (attrs) {
    parts.push(" ");
    parts.push(attrs);
  }
  parts.push(">");

  if (!voidSet.has(tagName)) {
    parts.push(innerHtml);
    parts.push(`</${tagName}>`);
  }

  return parts.join("");
}
