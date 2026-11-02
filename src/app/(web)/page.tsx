'use client';

import React from 'react';
import { LandingNavbar } from '@/modules/web/Navbar';
import { LandingHero } from '@/modules/web/Hero';
import { LandingFeatures } from '@/modules/web/Features';
import { LogoMarquee } from '@/modules/web/LogoMarquee';
import { LandingFAQ } from '@/modules/web/FAQ';
import { LandingTestimonials } from '@/modules/web/Testimonials';
import { LandingFooter } from '@/modules/web/Footer';
import { CtaButton } from '@/components/site/CtaButton';
import { Magnetic, SplitReveal } from '@/components/motion/reveal';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen font-sans selection:bg-brand selection:text-brand-foreground">
      <LandingNavbar />

      <main>
        <LandingHero />
        <LandingFeatures />
        <LogoMarquee />
        <LandingTestimonials />
        <LandingFAQ />

        {/* Final CTA */}
        <section className="relative px-3 py-20 sm:px-4 md:py-28">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-tint-ink p-10 text-center text-tint-ink-foreground md:rounded-[3rem] md:p-24">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="orb absolute -top-24 -left-20 size-80 rounded-full bg-brand/40 blur-[100px]" />
              <div className="orb absolute -right-16 -bottom-24 size-96 rounded-full bg-ai/40 blur-[110px] [animation-delay:-8s]" />
            </div>

            <h2 className="relative z-10 mb-8 text-4xl leading-[1.02] font-bold tracking-tight md:text-7xl">
              <SplitReveal inView text="Ready to evolve your" />
              <br />
              <SplitReveal inView text="digital workflow?" delay={0.12} className="text-white/45" />
            </h2>
            <p className="relative z-10 mx-auto mb-10 max-w-2xl text-lg text-white/65 md:text-xl">
              Join 50,000+ creators who have already elevated their knowledge management to the next level.
            </p>
            <div className="relative z-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Magnetic>
                <CtaButton href="/login?mode=signup" variant="brand">Get started</CtaButton>
              </Magnetic>
              <CtaButton variant="onDark" arrow={false}>Talk to Sales</CtaButton>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
