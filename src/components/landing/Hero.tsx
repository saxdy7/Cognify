'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { EnergyBeam } from '../ui/energy-beam';
import { BlurText } from '../ui/blur-text';
import { Sparkles, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

export const LandingHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-black">
      {/* God-level Orange Animation Background */}
      <div className="absolute inset-0 z-0">
        <EnergyBeam className="opacity-60 dark:opacity-80 scale-110" />
        
        {/* Cinematic Orange Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-600/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-400/10 blur-[100px] rounded-full" />
        
        {/* Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
      </div>

      <div className="container relative z-10 px-6 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-12 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">The Future of Knowledge</span>
        </motion.div>

        <BlurText
          text="Cognify Your Digital Universe"
          className="text-6xl md:text-8xl lg:text-[10rem] font-black font-space-grotesk tracking-tighter mb-10 max-w-6xl mx-auto leading-[0.85] text-white"
          delay={100}
          animateBy="words"
          direction="bottom"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-16 leading-relaxed font-medium"
        >
          Stop losing inspiration in browser tabs. Cognify transforms your bookmarks into a <span className="text-orange-400 font-bold">God-level</span> knowledge hub with AI-powered organization.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-8"
        >
          <Link
            href="/login?mode=signup"
            className="group relative px-12 py-6 bg-orange-500 text-white rounded-2xl font-black text-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(249,115,22,0.4)]"
          >
            <span className="relative z-10 flex items-center gap-3">
              Get Started
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <button className="group flex items-center gap-4 px-12 py-6 bg-white/5 border border-white/10 rounded-2xl font-black text-xl text-white hover:bg-white/10 transition-all backdrop-blur-xl">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-orange-500 text-orange-500 ml-1" />
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
