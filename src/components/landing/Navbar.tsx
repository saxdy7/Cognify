'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, X } from 'lucide-react';
import Link from 'next/link';

export const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-8'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`relative flex items-center justify-between px-8 py-4 rounded-3xl transition-all duration-500 ${scrolled ? 'bg-white/70 dark:bg-black/70 backdrop-blur-2xl shadow-2xl border border-white/20 dark:border-white/10' : 'bg-transparent'}`}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Sparkles className="w-6 h-6 text-white dark:text-black" />
            </div>
            <span className="text-xl font-bold font-space-grotesk tracking-tight">Cognify</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {['Features', 'Testimonials', 'Pricing', 'FAQ'].map((item) => (
              <Link 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className="hidden sm:block text-sm font-bold px-6 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-2xl transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/login?mode=signup"
              className="text-sm font-bold px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:scale-105 transition-transform shadow-xl active:scale-95"
            >
              Get Started
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
              {['Features', 'Testimonials', 'Pricing', 'FAQ'].map((item) => (
                <Link 
                  key={item} 
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-bold"
                >
                  {item}
                </Link>
              ))}
              <hr className="border-zinc-100 dark:border-zinc-800" />
              <Link href="/login" className="text-lg font-bold">Sign In</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
