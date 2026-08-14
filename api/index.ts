import { createApp } from "../server/_core/app";

// Vercel invokes this Express application as a Node.js serverless function.
// Static SPA assets are served from dist/public via vercel.json rewrites.
const app = createApp();

export default app;
