export const ComponentMapper = {
  mapToHTMLTag(componentName: string, props: Record<string, any>): string {
    const mappings: Record<string, (props: Record<string, any>) => string> = {
      Title: (p) => {
        const tag = p.as || "h1";
        delete p.as;
        return tag;
      },
      Text: (p) => {
        const tag = p.as || "p";
        delete p.as;
        return tag;
      },
      Center: () => "div",
      Row: () => "div",
      Column: () => "div",
      Image: () => "img",
    };

    const mapper = mappings[componentName];
    if (!mapper) throw new Error(`Unknown Octopus component <${componentName}>`);
    return mapper(props);
  }
};