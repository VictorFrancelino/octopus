/**
 * Utility class for safe handling and serialization of HTML attributes.
 * Focuses on efficiency and security (XSS prevention).
 */
export const AttributeUtils = {
  /**
   * Mapa de substituição para caracteres especiais HTML.
   * Usado na função replacer para percorrer a string apenas uma vez.
   */
  _escapeMap: {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  } as Record<string, string>,

  /**
   * Escape HTML text for safe insertion into attributes/content.
   * Utiliza uma única chamada replace com função replacer para maior eficiência.
   */
  escape(value: unknown): string {
    if (value == null) return "";

    const s = String(value);
    if (!/[&<>"']/.test(s)) return s;

    return s.replace(/[&<>"']/g, (m) => this._escapeMap[m] || m);
  },

  /**
   * Parse frontmatters / attribute string values to js primitives when possible.
   * "true" -> true, "false" -> false, "123" -> 123, otherwise returns original string.
   */
  parseValue(value: string): string | number | boolean {
    if (value == null) return "";
    const v = String(value).trim();

    if (v === "true") return true;
    if (v === "false") return false;

    // Verifica se é número, mas evita converter string vazia para 0
    if (v !== "" && !Number.isNaN(Number(v))) return Number(v);

    return v;
  },

  /**
   * Convert an object of attributes to a string suitable for insertion into an HTML tag.
   * Example: { id: "foo", hidden: true } -> ' id="foo" hidden'
   */
  objectToString(attrs: Record<string, string | number | boolean | undefined>): string {
    let result = "";

    // Cache local da função para evitar lookup repetido
    const escape = this.escape.bind(this);

    for (const key in attrs) {
      const value = attrs[key];

      if (value == null) continue;

      if (value === true) {
        // Atributos booleanos (ex: hidden, checked)
        result += ` ${key}`;
      } else if (value === "") {
        // Atributos vazios
        result += ` ${key}`;
      } else if (typeof value === "number") {
        // Números são seguros
        result += ` ${key}="${value}"`;
      } else {
        // Strings devem ser escapadas
        result += ` ${key}="${escape(value)}"`;
      }
    }

    return result;
  }
};