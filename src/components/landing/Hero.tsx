'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { EnergyBeam } from '../ui/energy-beam';
import { BlurText } from '../ui/blur-text';
import { Sparkles, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

export const LandingHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Energy Beam Background */}
      <div className="absolute inset-0 z-0">
        <EnergyBeam className="opacity-40 dark:opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-black/50 dark:to-black" />
      </div>

      <div className="container relative z-10 px-6 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-8"
        >
          <Sparkles className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">The Future of Knowledge</span>
        </motion.div>

        <BlurText
          text="Cognify Your Digital Universe"
          className="text-6xl md:text-8xl lg:text-9xl font-bold font-space-grotesk tracking-tighter mb-8 max-w-5xl mx-auto leading-[0.9]"
          delay={100}
          animateBy="words"
          direction="bottom"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Stop losing inspiration in browser tabs. Cognify transforms your bookmarks into a God-level knowledge hub with AI-powered organization and premium aesthetics.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link
            href="/login?mode=signup"
            className="group relative px-10 py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/20"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Building Now
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-black dark:from-zinc-200 dark:to-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <button className="flex items-center gap-3 px-10 py-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Play className="w-4 h-4 fill-current" />
            </div>
            Watch Demo
          </button>
        </motion.div>

        {/* Hero Stats/Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-24 pt-12 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {[
            { label: 'Users', value: '50k+' },
            { label: 'Bookmarks Saved', value: '2M+' },
            { label: 'Smart Containers', value: '150k+' },
            { label: 'AI Insights', value: '500k+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold font-space-grotesk">{stat.value}</div>
              <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
