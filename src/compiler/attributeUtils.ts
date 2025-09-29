export const AttributeUtils = {
  escape(value: any): string {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  parseValue(value: string): string | number | boolean {
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(Number(value)) && value.trim() !== "") return Number(value);
    return value;
  },

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
