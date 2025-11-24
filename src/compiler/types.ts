export type KeyedContent = {
  key: string;
  content: string;
}

export type CompilationResult = {
  body: string;
  css: string;
  js: string;
  frontmatter: Record<string, any>;
}

export type ParsedScript = {
  content: string;
  attributes: string;
}

export type ParsedParts = {
  frontmatter: Record<string, any>;
  template: string;
  style: string;
  script: ParsedScript;
}