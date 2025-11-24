import { frontmatterParser } from "./frontmatterParser";
import { templateParser } from "./templateParser";
import { styleParser } from "./styleParser";
import { scriptParser } from "./scriptParser";
import type { ParsedParts } from "../types";

export function extractParts(source: string): ParsedParts {
  const result: ParsedParts = {
    frontmatter: {},
    template: "",
    style: "",
    script: { content: "", attributes: "" }
  } 
  
  let content = String(source || "");
  
  frontmatterParser(source, content, result);
  templateParser(content, result);
  styleParser(source, content, result);
  scriptParser(content, result);

  return result;
}