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
          <div className={`relative flex items-center justify-between px-8 py-4 rounded-3xl transition-all duration-500 ${scrolled ? 'bg-black/80 dark:bg-black/80 backdrop-blur-2xl shadow-2xl border border-white/10' : 'bg-transparent'}`}>
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black font-space-grotesk tracking-tight text-white">Cognify</span>
            </Link>

            <div className="hidden md:flex items-center gap-10">
              {/* Simplified Navigation */}
            </div>

            <div className="flex items-center gap-4">
              <Link 
                href="/login?mode=signup"
                className="group relative px-8 py-3 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest overflow-hidden transition-all hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(249,115,22,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 animate-gradient-x" />
                <span className="relative z-10">Get Started</span>
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
    </nav>
  );
};
