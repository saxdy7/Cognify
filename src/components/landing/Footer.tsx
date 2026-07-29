'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Twitter, Github, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';

export const LandingFooter = () => {
  return (
    <footer className="py-12 md:py-16 lg:py-24 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
      <div className="container px-4 sm:px-6 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16 mb-12 md:mb-16 lg:mb-24">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-8 group">
              <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
                <Sparkles className="w-6 h-6 text-white dark:text-black" />
              </div>
              <span className="text-xl font-bold font-space-grotesk tracking-tight">Cognify</span>
            </Link>
            <p className="text-xl text-zinc-500 max-w-sm leading-relaxed mb-10">
              The high-performance knowledge hub for the next generation of digital creators.
            </p>
            <div className="flex items-center gap-6">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <Link key={i} href="#" className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest mb-8 text-zinc-400">Platform</h4>
              <ul className="space-y-4">
                {['Features', 'Integrations', 'Changelog', 'Roadmap'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-8 text-zinc-400">Company</h4>
            <ul className="space-y-4">
              {['About', 'Privacy', 'Terms', 'Security', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-zinc-500 text-sm">
            © 2026 Cognify Labs. Built with passion for the digital universe.
          </p>
        </div>
      </div>
    </footer>
  );
};
