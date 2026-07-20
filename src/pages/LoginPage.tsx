import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/features/auth/auth-store';

const loginSchema = z.object({
  username: z.string().trim().min(2, 'Enter your username'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const from = (location.state as { from?: string } | null)?.from ?? '/profile';
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: 'emilys', password: 'emilyspass' },
  });
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginForm) => authService.login(credentials),
    onSuccess: (user) => {
      setUser(user);
      toast.success(`Welcome back, ${user.firstName}`);
      void navigate(from, { replace: true });
    },
    onError: () => toast.error('Those credentials were not accepted. Try the demo account.'),
  });

  useEffect(() => {
    if (isAuthenticated) void navigate('/profile', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="page-shell grid min-h-[72vh] place-items-center py-14">
      <div className="surface w-full max-w-md rounded-[2rem] border p-7 shadow-soft sm:p-9">
        <div className="grid size-12 place-items-center rounded-2xl bg-moss-100 text-moss-800 dark:bg-moss-900 dark:text-moss-200">
          <LockKeyhole className="size-5" />
        </div>
        <h1 className="font-display mt-6 text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
          Sign in to check out, view orders, and manage saved addresses.
        </p>
        <form
          className="mt-7 space-y-5"
          onSubmit={(event) => {
            void form.handleSubmit((values) => loginMutation.mutate(values))(event);
          }}
          noValidate
        >
          <FormField
            id="username"
            label="Username"
            autoComplete="username"
            error={form.formState.errors.username?.message}
            {...form.register('username')}
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />
          <Button
            className="w-full"
            size="lg"
            type="submit"
            loading={loginMutation.isPending}
            icon={<ArrowRight className="size-4" />}
          >
            Sign in
          </Button>
        </form>
        <div className="mt-6 rounded-2xl bg-ink-50 p-4 text-xs leading-5 text-ink-600 dark:bg-white/5 dark:text-ink-300">
          <strong>Demo account</strong>
          <br />
          Username: emilys · Password: emilyspass
        </div>
      </div>
    </div>
  );
}
