import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/shared/logo';
import { DEV_AUTH_CREDENTIALS, useAuthStore } from '@/store/auth';

interface LoginLocationState {
  from?: {
    pathname?: string;
  };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState<string>(DEV_AUTH_CREDENTIALS.username);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const state = location.state as LoginLocationState | null;
  const returnTo = state?.from?.pathname ?? '/admin/tickets';

  if (isAuthenticated) {
    return <Navigate to={returnTo} replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const didLogin = login(username, password);

    if (!didLogin) {
      setError('Use the dev credentials shown below.');
      return;
    }

    navigate(returnTo, { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,hsl(var(--brand-purple)/0.28),transparent_38%)]" />
      <Card className="w-full max-w-[420px] border-brand-gold/15 bg-card/95 shadow-2xl shadow-black/25">
        <CardHeader className="space-y-5 text-center">
          <Logo variant="dark" className="mx-auto" />
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md border border-brand-gold/20 bg-brand-gold/10 text-brand-gold">
            <LockKeyhole size={20} />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">Admin login</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to open the evogirl admin dashboard.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="username">
                Username
              </label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
              />
            </div>

            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}

            <Button className="w-full gap-2" type="submit">
              <LogIn size={16} />
              Enter dashboard
            </Button>
          </form>

          <div className="mt-5 rounded-md border border-border bg-muted/45 p-3 text-sm">
            <p className="font-semibold text-foreground">Dev mode credentials</p>
            <p className="mt-2 text-muted-foreground">
              Username:{' '}
              <span className="font-mono text-foreground">
                {DEV_AUTH_CREDENTIALS.username}
              </span>
            </p>
            <p className="text-muted-foreground">
              Password:{' '}
              <span className="font-mono text-foreground">
                {DEV_AUTH_CREDENTIALS.password}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
