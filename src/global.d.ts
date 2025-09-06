// V17.1.2-p8f1 — JSX namespace shim for TypeScript
declare global {
  namespace JSX {
    // Allow using JSX.Element in annotations
    interface Element {}
    // Allow any intrinsic tag names (div, span, etc.)
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    // Standard helpers so TS recognizes children/props
    interface ElementAttributesProperty { props: any }
    interface ElementChildrenAttribute { children: {} }
    interface ElementClass { render: any }
  }
}
export {};
