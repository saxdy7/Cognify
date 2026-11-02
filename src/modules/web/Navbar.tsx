'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { HyperText } from '@/components/motion/hyper-text';
import { CtaButton } from '@/components/site/CtaButton';
import { CognifyLogo } from '@/modules/main/CognifyLogo';
import { ThemeToggle } from '@/modules/main/ThemeToggle';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

const LINKS = ['Features', 'Testimonials', 'FAQ'];

/** Floating pill header: logo · section links · theme · sign-in / get started. Frosts more once you scroll. */
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
      transition={{ duration: 0.7, ease: EASE_OUT }}
      className={cn('fixed top-0 right-0 left-0 z-50 transition-[padding] duration-500', scrolled ? 'py-3' : 'py-5')}
    >
      <div className="mx-auto max-w-5xl px-4">
        <div
          className={cn(
            'relative flex items-center justify-between rounded-full py-2 pr-2 pl-4 ring-1 backdrop-blur-2xl transition-[background-color,box-shadow] duration-500',
            scrolled ? 'bg-card shadow-[0_18px_50px_-20px_rgba(10,14,12,0.45)] ring-foreground/10' : 'bg-card/60 ring-foreground/[0.07]',
          )}
        >
          <Link href="/" className="group flex items-center gap-2.5" aria-label="Cognify home">
            <CognifyLogo className="size-9 transition-transform duration-500 ease-(--ease-pop) group-hover:rotate-[-8deg] group-hover:scale-105" size={36} />
            <span className="font-heading text-lg font-bold tracking-tight">Cognify</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors duration-300 hover:bg-foreground/[0.06] hover:text-foreground"
              >
                <HyperText className="text-sm font-semibold" animateOnHover={true} duration={600}>
                  {item}
                </HyperText>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Sign in
            </Link>
            <CtaButton href="/login?mode=signup" variant="brand" className="h-10 pl-5 text-sm [&>span:last-child]:size-7">
              Get started
            </CtaButton>
            <button
              className="rounded-full p-2 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="absolute top-full right-4 left-4 mt-2 rounded-3xl bg-popover p-6 shadow-2xl ring-1 ring-foreground/10 backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col gap-1">
              {[...LINKS, 'Sign in'].map((item) => (
                <Link
                  key={item}
                  href={item === 'Sign in' ? '/login' : `#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-lg font-semibold transition-colors hover:bg-foreground/[0.06]"
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
