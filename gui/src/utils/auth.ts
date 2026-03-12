/**
 * Get the current auth token from localStorage.
 * Called as a function (not a module-level constant) so it always returns
 * the latest value — important when tokens are refreshed or the user re-logs in.
 */
export function getAuthToken(): string {
  return localStorage.getItem('boluo_auth_token') || ''
}
