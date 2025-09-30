export const AttributeUtils = {
  escape(value: unknown): string {
    /**
     * Escape HTML text for safe insertion into attributes/content.
     */
    const s = value === null ? "" : String(value)
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  /**
   * Parse frontmatters / attribute string values to js primitives when possible.
   * "true" -> true, "false" -> false, "123" -> 123, otherwise returns original string.
   */
  parseValue(value: string): string | number | boolean {
    const v = value === null ? "" : String(value).trim();
    if (v === "true") return true;
    if (v === "false") return false;
    if (v !== "" && !Number.isNaN(Number(v))) return Number(v);
    return v;
  },

  /**
   * Convert an object of attributes to a string suitable for insertion into an HTML tag.
   * Example: { id: "foo", hidden: true } -> ' id="foo" hidden'
   */
  objectToString(attrs: Record<string, string | number | boolean | undefined>): string {
    const pairs: string[] = [];
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null) continue;
      if (value === true) pairs.push(key);
      else if (typeof value === "number") pairs.push(`${key}="${value}"`);
      else if (value === "") pairs.push(key);
      else pairs.push(`${key}="${this.escape(value)}"`);
    }
    return pairs.length ? ` ${pairs.join(" ")}` : "";
  }
};