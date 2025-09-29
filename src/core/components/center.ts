import { element } from "./base"

export const Center = (props: any = {}) => {
  const { children, style, class: cls, ...rest } = props;

  const base = {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }

  return element(
    "div",
    { children, class: cls, style, ...rest },
    { defaultStyle: base, defaultClass: "center" }
  )
}