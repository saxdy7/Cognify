'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { SplitReveal, Magnetic } from '@/components/motion/reveal';
import { CtaButton } from '@/components/site/CtaButton';
import { HeroPreview } from '@/modules/web/HeroPreview';
import { EASE_OUT } from '@/lib/motion';

export const LandingHero = () => {
  const reduce = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE_OUT },
  });

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* drifting colour orbs over the mesh */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
        <div className="orb absolute -top-24 left-[8%] size-[420px] rounded-full bg-tint-lime/60 blur-[110px]" />
        <div className="orb absolute top-40 -right-20 size-[460px] rounded-full bg-tint-sky/60 blur-[120px] [animation-delay:-6s]" />
        <div className="orb absolute bottom-10 left-1/3 size-[380px] rounded-full bg-brand/25 blur-[120px] [animation-delay:-12s]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center sm:px-6">
        <motion.div
          {...fade(0.05)}
          className="mb-8 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 ring-1 ring-foreground/[0.08] backdrop-blur-xl"
        >
          <Sparkles className="size-4 text-brand" />
          <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">The Future of Knowledge</span>
        </motion.div>

        <h1 className="mx-auto mb-7 max-w-4xl text-5xl leading-[0.98] font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem]">
          <SplitReveal text="Configure Your" delay={0.15} />
          <br />
          <SplitReveal text="Digital Universe" delay={0.3} className="text-brand" />
        </h1>

        <motion.p {...fade(0.6)} className="mx-auto mb-10 max-w-2xl text-base leading-relaxed font-medium text-muted-foreground md:text-lg">
          Stop losing inspiration in browser tabs. Cognify turns your bookmarks into a single knowledge hub with{' '}
          <span className="font-bold text-brand">AI-powered organization</span>, a{' '}
          <span className="font-bold text-ai">visual canvas</span>, and a place to write it all down.
        </motion.p>

        <motion.div {...fade(0.75)} className="mb-16 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 md:mb-20">
          <Magnetic>
            <CtaButton href="/login?mode=signup" variant="brand">Get started</CtaButton>
          </Magnetic>
          <CtaButton variant="ghost" arrow={false}>Talk to Sales</CtaButton>
        </motion.div>

        <HeroPreview />
      </div>
    </section>
  );
};
