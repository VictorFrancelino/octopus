export const CSSScoper = {
  addScopeToSegment(segment: string, attr: string): string {
    if (!segment || segment.startsWith(":") || segment === "*") return segment;
    const pseudoIndex = segment.indexOf(":");
    const main = pseudoIndex === -1 ? segment : segment.slice(0, pseudoIndex);
    const pseudo = pseudoIndex === -1 ? "" : segment.slice(pseudoIndex);
    return main ? `${main}[${attr}]${pseudo}` : segment;
  },

  scopeSelector(selector: string, attr: string): string {
    const parts = selector.split(/(\s+|>|\+|~)/g);
    return parts
      .map((part) =>
        /^\s+$/.test(part) || [">", "+", "~"].includes(part)
          ? part
          : this.addScopeToSegment(part.trim(), attr)
      )
      .join("");
  },

  scopeCSS(css: string, attr: string): string {
    if (!css) return "";
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
  },

  findMatchingBrace(css: string, start: number): number {
    let depth = 1;
    for (let i = start + 1; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      if (depth === 0) return i;
    }
    return -1;
  },

  processAtRule(rule: string, content: string, attr: string): string {
    const ruleName = rule.split(/\s+/)[0] || "";
    if (ruleName.startsWith("@keyframes")) return `${rule}{${content}}`;
    return `${rule}{${this.scopeCSS(content, attr)}}`;
  },

  processRegularRule(selectors: string, content: string, attr: string): string {
    const scopedSelectors = selectors
      .split(",")
      .map((selector) => this.scopeSelector(selector.trim(), attr))
      .join(", ");
    return `${scopedSelectors}{${content}}`;
  }
};