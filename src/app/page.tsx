'use client';

import React from 'react';
import { LandingNavbar } from '@/components/landing/Navbar';
import { LandingHero } from '@/components/landing/Hero';
import { LandingFeatures } from '@/components/landing/Features';
import { LandingFAQ } from '@/components/landing/FAQ';
import { LandingFooter } from '@/components/landing/Footer';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <LandingNavbar />
      
      <main>
        <LandingHero />
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative z-10"
        >
          <LandingFeatures />
          
          {/* Social Proof / Companies Section */}
          <section className="py-24 border-y border-zinc-100 dark:border-zinc-900 overflow-hidden bg-black/50 backdrop-blur-3xl">
            <div className="container px-6 mx-auto">
              <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-16">Trusted by builders at</p>
              
              <div className="relative flex overflow-hidden group">
                <motion.div 
                  animate={{ x: [0, -1000] }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="flex items-center gap-24 whitespace-nowrap min-w-full"
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <React.Fragment key={i}>
                      {['Linear', 'Vercel', 'Supabase', 'Framer', 'Next.js', 'React'].map((name) => (
                        <span key={`${i}-${name}`} className="text-4xl md:text-5xl font-black font-space-grotesk text-zinc-800 hover:text-orange-500 transition-colors cursor-default tracking-tighter">
                          {name}
                        </span>
                      ))}
                    </React.Fragment>
                  ))}
                </motion.div>
                
                {/* Gradient Fades */}
                <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-10" />
              </div>
            </div>
          </section>

          <LandingFAQ />
          
          {/* Final CTA */}
          <section className="py-32 relative overflow-hidden">
            <div className="container px-6 mx-auto relative z-10">
              <div className="max-w-5xl mx-auto p-12 md:p-24 rounded-[3rem] bg-black dark:bg-zinc-900 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
                
                <h2 className="text-4xl md:text-7xl font-bold font-space-grotesk tracking-tight mb-10 relative z-10">
                  Ready to evolve your <br /> <span className="text-zinc-500">digital workflow?</span>
                </h2>
                <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto relative z-10">
                  Join 50,000+ creators who have already elevated their knowledge management to the next level.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                  <button className="px-12 py-6 bg-white text-black rounded-2xl font-bold text-xl hover:scale-105 transition-transform active:scale-95 shadow-2xl">
                    Get Started for Free
                  </button>
                  <button className="px-12 py-6 bg-transparent border border-white/20 rounded-2xl font-bold text-xl hover:bg-white/5 transition-all">
                    Talk to Sales
                  </button>
                </div>
              </div>
            </div>
          </section>
        </motion.div>
      </main>

      <LandingFooter />
    </div>
  );
}
