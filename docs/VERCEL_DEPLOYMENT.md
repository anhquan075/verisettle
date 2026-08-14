# Vercel Live Testnet Preview

## Scope and deployment boundary

The private GitHub repository is **`anhquan075/verisettle`**. Vercel import is user-managed at the user’s direction; this document records the configuration required for the imported project. The repository includes a Vercel-ready adapter: `api/index.ts` exports the existing Express and tRPC application as a Node.js serverless function, while `vercel.json` builds the Vite SPA into `dist/public` and rewrites `/api/*` to that function.

Vercel uses the linked Git repository to create deployments. Deploy `vercel/testnet-preview` for a non-production preview and use `main` only after the required configuration has been checked. Git-driven Vercel deployments and project environment variables are managed in the Vercel project settings. [1] [2]

> **Security boundary:** Never copy a private key, seed phrase, or the Manus project’s secret values into Git. Configure values only in the Vercel project’s encrypted Environment Variables settings. The Vercel preview is a public-testnet application, not a custody service.

## Required Vercel configuration

| Variable | Scope | Purpose | Required for |
|---|---|---|---|
| `DATABASE_URL` | Server | MySQL/TiDB connection used for users, deals, immutable events, wallet identities, and SIWE nonces. | Login, SIWE, deals, evidence export. |
| `JWT_SECRET` | Server | Signs VeriSettle’s protected session cookie. Use a high-entropy, unique value. | OAuth and SIWE sessions. |
| `VERISETTLE_APP_ORIGIN` | Server | Canonical HTTPS application origin, for example `https://your-project.vercel.app`. Rejects SIWE challenges requested for another origin. | Production wallet sign-in hardening. |
| `OAUTH_SERVER_URL` | Server | Existing fallback session/OAuth exchange endpoint. | “Use another sign-in” flow. |
| `VITE_APP_ID` | Build + client | Existing OAuth application identifier. | Fallback session flow. |
| `OWNER_OPEN_ID` | Server | Existing owner identity configuration. | Existing owner-aware server behavior. |
| `BUILT_IN_FORGE_API_URL` | Server | Existing server integration base URL. | Any enabled server Forge integration. |
| `BUILT_IN_FORGE_API_KEY` | Server | Existing server integration credential. | Any enabled server Forge integration. |
| `VITE_OAUTH_PORTAL_URL` | Build + client | Existing OAuth portal URL. | Fallback session flow. |
| `VITE_FRONTEND_FORGE_API_URL` | Build + client | Existing frontend Forge endpoint. | Any enabled frontend Forge integration. |
| `VITE_FRONTEND_FORGE_API_KEY` | Build + client | Existing frontend Forge token. Only set when the project’s existing frontend integration requires it. | Any enabled frontend Forge integration. |
| `NODE_ENV` | Server | Set to `production`. Vercel normally provides this automatically for deployments. | Production static-serving behavior. |

Create the variables in both **Preview** and **Production** environments as appropriate. Vercel encrypts project environment variables and makes them available at build or runtime according to their configured environment. [2]

## Authentication and domain checklist

The fallback OAuth callback URL must be allowed by the configured OAuth provider:

```text
https://<your-vercel-domain>/api/oauth/callback
```

The SIWE flow has no third-party redirect. Its signature challenge binds the browser origin, wallet address, chain ID, nonce, issuance time, and expiry. It will use the Vercel HTTPS origin automatically when the user selects **Sign in with wallet**.

Before public sharing, verify the following manually in Vercel:

1. The imported repository is `anhquan075/verisettle` and the configured build command is `pnpm build`.
2. The deployed application serves the landing route, `/api/trpc`, and an SPA route such as `/protocol`.
3. The Vercel environment contains a separate, testnet-only database and `JWT_SECRET` where isolation is desired.
4. The OAuth provider recognizes the Vercel callback URL if the fallback session path is enabled.
5. The wallet flow reports an unavailable extension clearly when Rabby or SubWallet is absent, then checks CC3 or Sepolia readiness before any signing action.

## Vercel platform references

[1] [Vercel — Git repositories and deployments](https://vercel.com/docs/git)

[2] [Vercel — Environment variables](https://vercel.com/docs/projects/environment-variables)

[3] [Vercel — Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js)
