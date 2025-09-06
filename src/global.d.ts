// V17.1.2-p8f2 — React-compatible JSX typings
// Align JSX.Element with React.ReactElement so React.lazy() and components typed with JSX.Element
// are assignable where React expects ReactNode / ComponentType.

import type * as React from 'react';

declare global {
    namespace JSX {
        // Make JSX.Element exactly a React element
        type Element = React.ReactElement<any, any>;

        // Allow intrinsic tags
        interface IntrinsicElements {
            [elemName: string]: any;
        }

        // Standard helpers so TS recognizes props/children on components
        interface ElementAttributesProperty { props: any }
        interface ElementChildrenAttribute { children: {} }
        interface ElementClass { render: any }
    }
}

export { };
// V17.1.2-p8f1 — JSX namespace shim for TypeScript
declare global {
    namespace JSX {
        // Allow using JSX.Element in annotations
        interface Element { }
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
export { };
