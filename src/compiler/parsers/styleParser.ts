import type { ParsedParts } from "../types";

const styleRegex = /<style\b([^>]*)>([\s\S]*?)<\/style>/i;

export function styleParser(source: string, content: string, result: ParsedParts) {
  const styleMatch = content.match(styleRegex);
  if (styleMatch) {
    result.style = (styleMatch[2] ?? "").trim();
    content = content.replace(styleMatch[0], "");
  }
}