import yaml from "js-yaml";
import type { ParsedParts } from "../types";

const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;

export function frontmatterParser(source: string, content: string, result: ParsedParts) {
  const fmMatch = content.match(frontmatterRegex);
  if (fmMatch) {
    try {
      const parsed = yaml.load(fmMatch[1] ?? "");
      if (typeof parsed === "object" && parsed !== null) {
        result.frontmatter = parsed as Record<string, any>;
      }
    } catch (e) {
      console.warn("⚠️ Frontmatter YAML inválido:", e);
    }
    content = content.replace(fmMatch[0], "");
  }
}
