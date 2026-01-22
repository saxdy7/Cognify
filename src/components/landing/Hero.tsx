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
            text="Configure Your Digital Universe"
            className="text-3xl md:text-5xl lg:text-6xl font-black font-space-grotesk tracking-tighter mb-10 max-w-5xl mx-auto leading-[0.85] text-white"
            delay={100}
            animateBy="words"
            direction="bottom"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto mb-16 leading-relaxed font-medium"
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
              className="group relative px-14 py-7 bg-orange-500 text-white rounded-[2rem] font-black text-2xl overflow-hidden transition-all hover:scale-110 active:scale-95 shadow-[0_0_100px_rgba(249,115,22,0.6)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 animate-gradient-x" />
              <span className="relative z-10 flex items-center gap-4">
                Get Started
                <ArrowRight className="w-8 h-8 transition-transform group-hover:translate-x-2" />
              </span>
              
              {/* God-level Animated Border */}
              <div className="absolute inset-0 rounded-[2rem] p-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 animate-shimmer" />
              </div>
              
              {/* God-level Glow Pulse */}
              <div className="absolute -inset-8 bg-orange-400/30 blur-3xl animate-pulse group-hover:bg-orange-400/50 transition-colors" />
            </Link>
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
