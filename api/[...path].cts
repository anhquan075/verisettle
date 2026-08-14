// Vercel recognizes this source entry as the `/api/*` function. The required
// artifact is generated during `pnpm build` and bundles the shared Express app.
module.exports = require("../server/vercelFunction.cjs");
