import matter from "gray-matter";

export type Frontmatter = Record<string, any>;

export function parseFrontmatter(source: string): { frontmatter: Frontmatter, body: string } {
  const parsed = matter(source, { excerpt: false });
  return { frontmatter: parsed.data ?? {}, body: parsed.content ?? "" };
}