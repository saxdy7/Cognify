'use client';

import React, { useState, Suspense } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, Check, Layers, Bookmark, FileText } from 'lucide-react';
import Link from 'next/link';
import { CountUp, SplitReveal } from '@/components/motion/reveal';
import { CognifyLogo } from '@/modules/main/CognifyLogo';
import { ThemeToggle } from '@/modules/main/ThemeToggle';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

const fieldCls =
  'h-13 w-full rounded-2xl border border-transparent bg-foreground/[0.05] pr-5 pl-12 text-[15px] font-medium outline-none transition-[background-color,border-color,box-shadow] duration-300 placeholder:text-muted-foreground/70 hover:bg-foreground/[0.07] focus:border-brand/60 focus:bg-background focus:ring-4 focus:ring-brand/15';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const reduce = useReducedMotion();

  const [mode, setMode] = useState<'login' | 'signup'>(modeParam === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next);
    setError(null);
    setSent(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
        className="rounded-[2.5rem] bg-card p-7 shadow-[0_40px_100px_-40px_rgba(10,14,12,0.5)] ring-1 ring-foreground/10 backdrop-blur-2xl sm:p-10"
      >
        <Link href="/" className="group mb-8 inline-flex items-center gap-2.5" aria-label="Cognify home">
          <CognifyLogo className="size-11 transition-transform duration-500 ease-(--ease-pop) group-hover:rotate-[-8deg] group-hover:scale-105" size={44} />
          <span className="font-heading text-xl font-bold tracking-tight">Cognify</span>
        </Link>

        <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="py-4 text-center"
              role="status"
            >
              <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-tint-lime text-tint-lime-foreground">
                <Check className="size-8" />
              </span>
              <h1 className="mb-2 text-3xl font-bold tracking-tight">Check your email</h1>
              <p className="mb-8 text-muted-foreground">
                We sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>. Open it to finish creating your account.
              </p>
              <button
                onClick={() => switchMode('login')}
                className="inline-flex h-12 items-center justify-center rounded-full bg-foreground/[0.07] px-8 font-semibold transition-[background-color,transform] hover:bg-foreground/[0.12] active:scale-95"
              >
                Back to sign in
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {/* Sign in / Sign up switch with a sliding chip */}
              <div className="relative mb-8 grid grid-cols-2 rounded-full bg-foreground/[0.06] p-1" role="tablist" aria-label="Authentication mode">
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-background shadow-sm transition-transform duration-500 dark:bg-white/15 ease-(--ease-pop)',
                    mode === 'signup' && 'translate-x-full',
                  )}
                />
                {(['login', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    suppressHydrationWarning
                    className={cn('relative z-10 h-10 rounded-full text-sm font-semibold transition-colors duration-300', mode === m ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {m === 'login' ? 'Sign in' : 'Sign up'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className="mb-8"
                >
                  <h1 className="mb-1.5 text-3xl font-bold tracking-tight sm:text-4xl">{mode === 'login' ? 'Welcome back' : 'Join Cognify'}</h1>
                  <p className="text-muted-foreground">
                    {mode === 'login' ? 'Enter your details to access your hub' : 'Start your journey to digital organization'}
                  </p>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="overflow-hidden"
                    role="alert"
                  >
                    <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive ring-1 ring-destructive/20">
                      <AlertCircle className="size-5 shrink-0" />
                      <p>{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleAuth} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="ml-1 text-sm font-semibold">Email address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      suppressHydrationWarning
                      className={fieldCls}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="ml-1 text-sm font-semibold">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      suppressHydrationWarning
                      className={cn(fieldCls, 'pr-12')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      suppressHydrationWarning
                      className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  suppressHydrationWarning
                  className="group flex h-13 w-full items-center justify-center gap-3 rounded-full bg-foreground font-semibold text-background shadow-[0_14px_34px_-14px_rgba(10,14,12,0.6)] transition-[transform,box-shadow,opacity] duration-300 ease-(--ease-out) hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign in' : 'Create account'}
                      <ArrowRight className="size-5 transition-transform duration-300 ease-(--ease-pop) group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/** Left panel (desktop): what you get, in the same tint-card language as the app. */
function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden rounded-[2.5rem] bg-tint-ink p-12 text-tint-ink-foreground lg:flex lg:flex-col lg:justify-between">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="orb absolute -top-24 -left-24 size-96 rounded-full bg-brand/40 blur-[110px]" />
        <div className="orb absolute -right-24 -bottom-24 size-[28rem] rounded-full bg-ai/40 blur-[120px] [animation-delay:-9s]" />
      </div>

      <span className="relative z-10 text-xs font-bold tracking-[0.3em] text-white/50 uppercase">The Future of Knowledge</span>

      <div className="relative z-10">
        <h2 className="mb-5 text-5xl leading-[1.02] font-bold tracking-tight xl:text-6xl">
          <SplitReveal text="Your knowledge," delay={0.2} />
          <br />
          <SplitReveal text="one calm workspace." delay={0.35} className="text-white/45" />
        </h2>
        <p className="mb-10 max-w-md text-lg text-white/65">Links, boards and docs — organised by AI, in sync everywhere you work.</p>

        <div className="grid max-w-md grid-cols-3 gap-3">
          {[
            { icon: Bookmark, label: 'Links', value: 121, tone: 'bg-tint-lime text-tint-lime-foreground' },
            { icon: Layers, label: 'Boards', value: 14, tone: 'bg-tint-coral text-tint-coral-foreground' },
            { icon: FileText, label: 'Pages', value: 38, tone: 'bg-tint-sky text-tint-sky-foreground' },
          ].map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.6 + i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
              className={cn('flex h-28 flex-col justify-between rounded-3xl p-4', t.tone)}
            >
              <t.icon className="size-4 opacity-70" />
              <div>
                <p className="text-3xl leading-none font-bold tabular-nums"><CountUp value={t.value} delay={0.9 + i * 0.1} /></p>
                <p className="mt-1 text-xs font-semibold opacity-75">{t.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <figure className="relative z-10 max-w-md rounded-3xl bg-white/[0.07] p-6 ring-1 ring-white/10 backdrop-blur-xl">
        <blockquote className="mb-4 text-base leading-relaxed font-medium text-white/85">
          &ldquo;It&rsquo;s not just a bookmark manager; it&rsquo;s a second brain that actually works.&rdquo;
        </blockquote>
        <figcaption className="text-sm font-bold">Priya Nair <span className="font-medium text-white/50">· Research Scientist</span></figcaption>
      </figure>
    </aside>
  );
}

export default function LoginPage() {
  return (
    <div className="relative grid min-h-svh gap-4 overflow-hidden p-3 sm:p-4 lg:grid-cols-2">
      <div className="absolute top-5 right-5 z-20 rounded-full bg-card p-1 ring-1 ring-foreground/[0.07] backdrop-blur-xl sm:top-7 sm:right-7">
        <ThemeToggle />
      </div>

      <BrandPanel />

      <div className="relative flex items-center justify-center py-16 lg:py-0">
        <div aria-hidden className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="orb absolute -top-10 left-0 size-72 rounded-full bg-tint-lime/60 blur-[100px]" />
          <div className="orb absolute right-0 bottom-0 size-72 rounded-full bg-tint-sky/60 blur-[100px] [animation-delay:-7s]" />
        </div>
        <Suspense fallback={<Loader2 className="size-10 animate-spin text-muted-foreground" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
