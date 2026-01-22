'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { EnergyBeam } from '../ui/energy-beam';
import { BlurText } from '../ui/blur-text';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { HyperText } from '../ui/hyper-text';

export const LandingHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-black">
      {/* God-level Orange Animation Background */}
      <div className="absolute inset-0 z-0">
        <EnergyBeam className="opacity-100 dark:opacity-100" />

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


        <div className="mb-10 text-center">
          <BlurText
            text="Configure Your Digital Universe"
            className="text-3xl md:text-5xl lg:text-6xl font-black font-space-grotesk tracking-tighter max-w-5xl mx-auto leading-[0.85] text-white whitespace-nowrap"
            delay={100}
            animateBy="words"
            direction="bottom"
          />
        </div>

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
          <Link href="/login?mode=signup">
            <button className="cssbuttons-io-button">
              Get started
              <div className="icon">
                <svg
                  height="24"
                  width="24"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 0h24v24H0z" fill="none"></path>
                  <path
                    d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                    fill="currentColor"
                  ></path>
                </svg>
              </div>
            </button>
          </Link>
          <button className="h-[2.8em] px-8 bg-transparent border border-white/20 rounded-[0.9em] font-medium text-white/90 text-[17px] hover:bg-white/5 hover:text-white transition-all backdrop-blur-sm tracking-wide">
            Talk to Sales
          </button>
        </motion.div>


        {/* Hero Stats/Social Proof */}
        <div className="mt-24 pt-12 border-t border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { label: 'Users', value: '50k+' },
            { label: 'Bookmarks Saved', value: '2M+' },
            { label: 'Smart Containers', value: '150k+' },
            { label: 'AI Insights', value: '500k+' },
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <HyperText
                className="text-2xl font-bold font-space-grotesk text-white inline-block"
                startOnView={true}
                animateOnHover={false}
                duration={1000}
                delay={index * 100}
              >
                {stat.value}
              </HyperText>
              <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
