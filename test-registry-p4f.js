// V17.1.2-p4f — Test imports to verify registry compiles
import { ROUTES, type RouteDef } from './src/routes/registry';

console.log(`Registry loaded with ${ROUTES.length} routes`);
console.log('Routes:', ROUTES.map(r => ({ path: r.path, title: r.title })));