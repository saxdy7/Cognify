import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black text-zinc-100">
      <div className="w-full max-w-md text-center bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-2xl">
        <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold font-space-grotesk tracking-tight mb-2">
          Authentication failed
        </h1>
        <p className="text-zinc-500 mb-8 leading-relaxed">
          We couldn&apos;t complete the sign-in. The link may have expired or already been used.
          Please try signing in again.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full py-4 bg-white text-black rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
