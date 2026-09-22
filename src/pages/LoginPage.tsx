import { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, MailCheck, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/auth-store';
import { isCustomerAccountsEnabled } from '@/services/customer-account/config';
import { beginLogin } from '@/services/customer-account/oauth';

/**
 * Sign-in is delegated to Shopify: this page starts the OAuth flow and
 * Shopify's hosted page sends the customer a one-time code by email. The
 * tokens come back through `AuthCallbackGate`.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [redirecting, setRedirecting] = useState(false);
  const from = (location.state as { from?: string } | null)?.from ?? '/profile';
  const accountsEnabled = isCustomerAccountsEnabled();

  useEffect(() => {
    if (isAuthenticated) void navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  async function signIn() {
    setRedirecting(true);
    try {
      await beginLogin(from);
    } catch (error) {
      setRedirecting(false);
      toast.error(error instanceof Error ? error.message : 'Sign-in could not be started.');
    }
  }

  return (
    <div className="page-shell grid min-h-[72vh] place-items-center py-14">
      <div className="surface w-full max-w-md rounded-[2rem] border p-7 shadow-soft sm:p-9">
        <div className="grid size-12 place-items-center rounded-2xl bg-moss-100 text-moss-800 dark:bg-moss-900 dark:text-moss-200">
          <LockKeyhole className="size-5" />
        </div>
        <h1 className="font-display mt-6 text-3xl font-semibold tracking-tight">Your account</h1>
        <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
          Sign in to see your orders, saved addresses and a checkout with your details filled in.
        </p>
        {accountsEnabled ? (
          <>
            <ul className="mt-6 space-y-3 text-sm text-ink-600 dark:text-ink-300">
              <li className="flex gap-3">
                <MailCheck className="mt-0.5 size-4 shrink-0 text-moss-700 dark:text-moss-300" />
                Shopify emails you a one-time code. There is no password to remember.
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-moss-700 dark:text-moss-300" />
                Your details stay with Shopify; this storefront only receives a session token.
              </li>
            </ul>
            <Button
              className="mt-7 w-full"
              size="lg"
              loading={redirecting}
              icon={<ArrowRight className="size-4" />}
              onClick={() => void signIn()}
            >
              Sign in with Shopify
            </Button>
            <div className="mt-6 rounded-2xl bg-ink-50 p-4 text-xs leading-5 text-ink-600 dark:bg-white/5 dark:text-ink-300">
              <strong>Demo store</strong>
              <br />
              Use any email address you can read; the code arrives within a minute. New addresses
              become a customer of the demo store.
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-2xl bg-ink-50 p-4 text-sm leading-6 text-ink-600 dark:bg-white/5 dark:text-ink-300">
            Customer accounts need a Shopify store. This build runs against the mock.shop sandbox,
            which has no customers: point the app at a development store and set{' '}
            <code>VITE_SHOPIFY_SHOP_ID</code> and{' '}
            <code>VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID</code> to enable sign-in.
          </div>
        )}
      </div>
    </div>
  );
}
