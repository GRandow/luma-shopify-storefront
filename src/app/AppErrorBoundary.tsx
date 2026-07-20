import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error boundary caught an error', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  override render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-sand p-6 dark:bg-ink-950">
          <div className="surface max-w-lg rounded-3xl border p-8 text-center shadow-soft">
            <AlertTriangle className="mx-auto size-9 text-coral" aria-hidden="true" />
            <h1 className="font-display mt-5 text-3xl font-semibold">Something went off course</h1>
            <p className="mt-3 text-ink-500 dark:text-ink-400">
              The storefront hit an unexpected error. Your saved cart and wishlist are still intact.
            </p>
            <Button className="mt-6" onClick={this.reset}>
              Return home
            </Button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
