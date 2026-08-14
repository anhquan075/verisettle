export type WalletRecoveryAction = "connect" | "retry" | "switch";

export type WalletErrorNotice = {
  action: WalletRecoveryAction;
  detail: string;
  kind: "connection" | "extension" | "network" | "origin" | "server" | "signature" | "signature_rejected" | "challenge";
  title: string;
};

type ProviderLikeError = { code?: number; message?: string };

function messageFrom(cause: unknown) {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === "object" && cause && "message" in cause && typeof (cause as ProviderLikeError).message === "string") {
    return (cause as ProviderLikeError).message ?? "";
  }
  return "";
}

function codeFrom(cause: unknown) {
  return typeof cause === "object" && cause && "code" in cause && typeof (cause as ProviderLikeError).code === "number"
    ? (cause as ProviderLikeError).code
    : undefined;
}

export function describeWalletError(
  cause: unknown,
  fallback: string,
  preferredAction: WalletRecoveryAction = "retry",
): WalletErrorNotice {
  const message = messageFrom(cause).toLowerCase();
  const code = codeFrom(cause);

  if (code === 4001 || /rejected|denied|declined|cancelled|canceled/.test(message)) {
    return {
      kind: "signature_rejected",
      title: "Request cancelled",
      detail: "Nothing changed. Approve the next wallet request only when you are ready.",
      action: preferredAction,
    };
  }
  if (/signature could not be verified|signature does not match/.test(message)) {
    return {
      kind: "signature",
      title: "Signature not verified",
      detail: "Sign the fresh VeriSettle message with the connected account. It never authorizes a transaction.",
      action: "retry",
    };
  }
  if (/challenge.*(unavailable|expired)|nonce.*(expired|used)|already used/.test(message)) {
    return {
      kind: "challenge",
      title: "Sign-in request expired",
      detail: "For safety, wallet sign-in requests expire quickly. Request a fresh message and sign again.",
      action: "retry",
    };
  }
  if (/origin|secure origin|https/.test(message)) {
    return {
      kind: "origin",
      title: "This site is not approved for wallet sign-in",
      detail: "Open VeriSettle from its configured HTTPS address, then try again.",
      action: "retry",
    };
  }
  if (/chain|network|switch/.test(message)) {
    return {
      kind: "network",
      title: "Testnet switch needed",
      detail: "Switch to the requested testnet before continuing. No transaction will be sent during the switch.",
      action: "switch",
    };
  }
  if (/fetch|networkerror|server|internal|function_invocation/.test(message)) {
    return {
      kind: "server",
      title: "VeriSettle could not finish the request",
      detail: "Check your connection and try again. Your wallet and funds were not changed.",
      action: "retry",
    };
  }
  return {
    kind: "connection",
    title: "Wallet request did not finish",
    detail: fallback,
    action: preferredAction,
  };
}
