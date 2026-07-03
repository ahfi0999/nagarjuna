import { redirect } from 'next/navigation';

import { LoginButton } from '@/features/auth/components/login-button';
import { auth0 } from '@/features/auth/server/auth0';

export default async function LoginPage() {
  const session = await auth0.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-6">
      <section className="w-full max-w-sm rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">NAG CRM</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to access the read-only CRM portal.
        </p>
        <LoginButton className="mt-6" />
      </section>
    </main>
  );
}
