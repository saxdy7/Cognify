import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { UrbanistScope } from '@/components/site/UrbanistScope';

export default function AuthCodeErrorPage() {
  return (
    <div className="app-ui flex min-h-svh items-center justify-center p-6 text-foreground">
      <UrbanistScope />
      <div className="page-enter w-full max-w-md rounded-[2.5rem] bg-card p-10 text-center shadow-[0_40px_100px_-40px_rgba(10,14,12,0.5)] ring-1 ring-foreground/10 backdrop-blur-2xl">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-tint-coral text-tint-coral-foreground">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Authentication failed</h1>
        <p className="mb-8 leading-relaxed text-muted-foreground">
          We couldn&apos;t complete the sign-in. The link may have expired or already been used.
          Please try signing in again.
        </p>
        <Link
          href="/login"
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-foreground font-semibold text-background shadow-[0_14px_34px_-14px_rgba(10,14,12,0.6)] transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
