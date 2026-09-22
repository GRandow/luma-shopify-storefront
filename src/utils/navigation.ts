/**
 * Full-page navigation to another origin (Shopify's sign-in and sign-out
 * pages). Kept in one place so tests can replace it: jsdom cannot navigate.
 */
export function redirectTo(url: string): void {
  window.location.assign(url);
}
