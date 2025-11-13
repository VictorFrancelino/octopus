import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

/**
 * Scope CSS by injecting an attribute (eg. data-v-abc123) into selectors.
 * - preserves @keyframes (no scoping inside)
 * - basic handling for :global(...) (inner selector remains unscoped)
 *
 * Returns transformed CSS string.
 */
export function scopeCSS(css: string, attr: string): string {
  if (!css) return "";

  const root = postcss.parse(css);

  root.walkRules((rule: any) => {
    // skip rules inside @keyframes
    const parent = rule.parent;
    if (parent && parent.type === "atrule" && String((parent as any).name).includes("keyframes")) {
      return;
    }

    const selectorText = rule.selector || "";
    try {
      const transformed = selectorParser((selectors: any) => {
        // walk every node, handle selector nodes explicitly
        selectors.walk((node: any) => {
          if (node.type !== "selector") return;
          const sel = node as any;

          const selStr = sel.toString().trim();

          // whole-selector :global(...) -> replace selector with inner and skip scoping
          const globalAllMatch = selStr.match(/^:global\(([\s\S]+)\)$/);
          if (globalAllMatch && globalAllMatch[1]) {
            const inner = selectorParser().astSync(globalAllMatch[1]);
            sel.replaceWith(...(inner.nodes || []));
            return;
          }

          // replace :global(...) occurrences inside selector with their inner content
          sel.walkPseudos((p: any) => {
            if (typeof p.value === "string" && p.value.startsWith(":global")) {
              const innerNodes = p.nodes?.[0]?.nodes;
              if (innerNodes && innerNodes.length) {
                p.replaceWith(...innerNodes);
              } else {
                const innerText = p.nodes?.[0]?.toString() ?? "";
                if (innerText) {
                  const parsed = selectorParser().astSync(innerText);
                  p.replaceWith(...(parsed.nodes || []));
                }
              }
            }
          });

          // find last "real" node (not combinator, not pseudo)
          let lastReal: any = null;
          for (let i = sel.nodes.length - 1; i >= 0; i--) {
            const n = sel.nodes[i];
            if (!n) continue;
            if (n.type === "combinator") continue;
            if (n.type === "pseudo") continue;
            lastReal = n;
            break;
          }

          // prefer building attribute node via AST parsing
          const attrAst = selectorParser().astSync(`[${attr}]`);
          const attrNode = attrAst.nodes?.[0]?.nodes?.[0] ?? null;

          if (attrNode) {
            const nodeToInsert = attrNode.clone ? attrNode.clone() : attrNode;
            if (lastReal && lastReal.parent) lastReal.parent.insertAfter(lastReal, nodeToInsert);
            else sel.append(nodeToInsert);
          } else {
            // fallback: construct attribute node with required fields to satisfy types
            const fallbackAttr = selectorParser.attribute({ attribute: attr, raws: {} as any, value: undefined as any } as any);
            if (lastReal && lastReal.parent) lastReal.parent.insertAfter(lastReal, fallbackAttr);
            else sel.append(fallbackAttr);
          }
        });
      }).processSync(selectorText);

      rule.selector = transformed;
    } catch (err) {
      // safe fallback: keep original selector if parser chokes
      // console.warn("[scopeCSS] failed to parse selector:", selectorText, err);
    }
  });

  return root.toString();
}