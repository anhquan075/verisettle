import { createRequire } from "node:module";

// Vercel recognizes this source entry as the `/api/*` function. The required
// artifact is generated during `pnpm build` and bundles the shared Express app.
const require = createRequire(import.meta.url);
const app = require("../server/vercelFunction.cjs");

export default app;
