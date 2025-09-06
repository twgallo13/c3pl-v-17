// V17.1.2-p8f5c — active version store
let active = 'V17.0.0';
export function setActiveVersion(v: string) { active = v; }
export function getActiveVersion() { return active; }
