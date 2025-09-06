// V17.1.2-p8f5c — neutral JSX shim (avoid duplicate JSX identifiers)
declare namespace JSX {
  interface Element extends React.ReactElement<any, any> {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export {};
