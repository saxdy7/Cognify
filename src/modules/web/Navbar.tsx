'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { HyperText } from '@/components/motion/hyper-text';

export const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20);
  });

  return (
    <motion.nav
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-3' : 'py-6'}`}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className={`relative flex items-center justify-between pl-4 pr-2 py-2 rounded-full transition-all duration-500 border ${scrolled ? 'bg-black/70 backdrop-blur-2xl shadow-2xl border-white/10' : 'bg-white/[0.04] backdrop-blur-xl border-white/[0.08]'}`}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-white/15 shadow-[0_0_20px_rgba(255,107,0,0.4)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(255,107,0,0.6)] flex items-center justify-center">
              <img src="/logo-mark.png" alt="Cognify" className="w-full h-full object-cover scale-105" />
            </div>
            <span className="text-xl font-black font-space-grotesk tracking-tight text-white">Cognify</span>
          </Link>

          <div className="hidden md:flex items-center gap-9">
            {['Features', 'Testimonials', 'FAQ'].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-bold text-white/80 hover:text-white transition-colors"
              >
                <HyperText
                  className="text-sm font-bold"
                  animateOnHover={true}
                  duration={600}
                >
                  {item}
                </HyperText>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login?mode=signup">
              <button className="cssbuttons-io-button scale-75 origin-right">
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
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-6 right-6 mt-4 p-8 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 md:hidden"
          >
            <div className="flex flex-col gap-6">
              {['Features', 'Testimonials', 'FAQ'].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-bold"
                >
                  {item}
                </Link>
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
