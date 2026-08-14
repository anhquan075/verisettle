export type SessionExpiryState = {
  expired: boolean;
  label: string;
  shortLabel: string;
  warning: boolean;
};

const WARNING_MS = 15 * 60 * 1000;

export function describeSessionExpiry(expiresAt: Date | string, now = Date.now()): SessionExpiryState {
  const end = new Date(expiresAt).getTime();
  const remaining = Math.max(0, end - now);
  if (!Number.isFinite(end) || remaining === 0) {
    return { expired: true, warning: true, shortLabel: "Renew", label: "Wallet session expired — sign in again" };
  }

  const totalMinutes = Math.ceil(remaining / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  const warning = remaining <= WARNING_MS;
  return {
    expired: false,
    warning,
    shortLabel: warning ? `Renew ${duration}` : duration,
    label: warning ? `Wallet session ends in ${duration} — sign in again soon` : `Wallet session ends in ${duration}`,
  };
}
