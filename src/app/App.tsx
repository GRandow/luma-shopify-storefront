import { RouterProvider } from 'react-router-dom';
import { toast } from 'sonner';
import { AppErrorBoundary } from '@/app/AppErrorBoundary';
import { AppProviders } from '@/app/AppProviders';
import { router } from '@/app/router';
import { AuthCallbackGate } from '@/features/auth/components/AuthCallbackGate';

function continueAfterSignIn(returnTo: string) {
  void router.navigate(returnTo, { replace: true });
}

function reportSignInFailure(error: Error) {
  toast.error(error.message);
  void router.navigate('/login', { replace: true });
}

export function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <AuthCallbackGate onSignedIn={continueAfterSignIn} onFailed={reportSignInFailure}>
          <RouterProvider router={router} />
        </AuthCallbackGate>
      </AppProviders>
    </AppErrorBoundary>
  );
}
