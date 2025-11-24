import type { ParsedParts } from "../types";

const templateRegex = /<template\b([^>]*)>([\s\S]*?)<\/template>/i;

export function templateParser(content: string, result: ParsedParts) {
  const templateMatch = content.match(templateRegex);
  if (templateMatch) {
    result.template = (templateMatch[2] ?? "").trim();
  } else {
    const remaining = content.trim();
    if (remaining) result.template = remaining;
  }
}