import { Node as VNode } from "../h";

declare global {
  namespace JSX {
    interface Element extends VNode {}
    interface IntrinsicElements {
      [elemName: string]: Record<string, any>;
    }
  }
}
