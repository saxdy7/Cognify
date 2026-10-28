'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { EnergyBeam } from '@/components/motion/energy-beam';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  
  const [mode, setMode] = useState<'login' | 'signup'>(modeParam === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (modeParam === 'signup') setMode('signup');
    else setMode('login');
  }, [modeParam]);

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
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  if (!mounted) {
    return <Loader2 className="w-10 h-10 animate-spin text-zinc-400" />;
  }

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 dark:bg-black/70 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black border border-white/15 shadow-[0_0_25px_rgba(255,107,0,0.35)] flex items-center justify-center mx-auto transition-transform group-hover:scale-105">
              <img src="/logo-mark.png" alt="Cognify" className="w-full h-full object-cover scale-105" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold font-space-grotesk tracking-tight mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Join Cognify'}
          </h1>
          <p className="text-zinc-500">
            {mode === 'login' ? 'Enter your details to access your hub' : 'Start your journey to digital organization'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                suppressHydrationWarning
                className="w-full pl-14 pr-6 py-4 bg-zinc-100/50 dark:bg-zinc-900/50 border border-transparent focus:border-black dark:focus:border-white rounded-2xl outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                suppressHydrationWarning
                className="w-full pl-14 pr-14 py-4 bg-zinc-100/50 dark:bg-zinc-900/50 border border-transparent focus:border-black dark:focus:border-white rounded-2xl outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                suppressHydrationWarning
                className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            suppressHydrationWarning
            className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>



        <p className="mt-10 text-center text-zinc-500">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            suppressHydrationWarning
            className="text-black dark:text-white font-bold hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <EnergyBeam className="opacity-30 dark:opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-black/50 dark:to-black" />
      </div>

      <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-zinc-400" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
