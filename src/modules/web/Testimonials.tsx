'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { SplitReveal, Stagger, StaggerItem } from '@/components/motion/reveal';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

const testimonials = [
  {
    name: 'Alex Rivera',
    role: 'Product Designer',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
    content: "Cognify completely transformed how I organize my design inspiration. The AI context categorization actually understands what I'm saving.",
    rating: 5,
  },
  {
    name: 'Priya Nair',
    role: 'Research Scientist',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
    content: "The neural sync feature saves me hours every week. It's not just a bookmark manager; it's a second brain that actually works.",
    rating: 5,
  },
  {
    name: 'Marcus Thorne',
    role: 'Indie Developer',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
    content: 'Finally, a tool that keeps up with my browsing speed. The instant flow previews are buttery smooth. Absolute game changer.',
    rating: 5,
  },
];

export const LandingTestimonials = () => {
  return (
    <section id="testimonials" className="relative py-20 md:py-28 lg:py-32">
      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="mx-auto mb-16 max-w-4xl text-center md:mb-20">
          <h2 className="text-4xl leading-[1] font-bold tracking-tight md:text-7xl">
            <SplitReveal inView text="Loved by" />
            <br />
            <SplitReveal inView text="obsessive creators." delay={0.12} className="text-muted-foreground" />
          </h2>
        </div>

        <Stagger className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3 md:gap-5" gap={0.1}>
          {testimonials.map((t, index) => {
            const ink = index === 1;
            return (
              <StaggerItem key={t.name} variant="pop">
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.45, ease: EASE_OUT } }}
                  className={cn(
                    'group relative flex h-full flex-col rounded-[2rem] p-8 ring-1 backdrop-blur-xl',
                    ink ? 'bg-tint-ink text-tint-ink-foreground ring-white/10' : 'bg-card ring-foreground/[0.08]',
                  )}
                >
                  <Quote className="absolute top-8 right-8 size-10 fill-current opacity-[0.07] transition-all duration-500 group-hover:rotate-6 group-hover:text-brand group-hover:opacity-30" />

                  <div className="mb-6 flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="size-5 fill-brand text-brand" />
                    ))}
                  </div>

                  <p className="relative z-10 mb-8 flex-1 text-lg leading-relaxed font-medium">&ldquo;{t.content}&rdquo;</p>

                  <div className="flex items-center gap-4">
                    <div className="size-12 overflow-hidden rounded-full ring-2 ring-foreground/10 transition-all duration-300 group-hover:ring-brand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.image} alt={t.name} className="size-full object-cover" />
                    </div>
                    <div>
                      <div className="font-bold">{t.name}</div>
                      <div className="text-xs font-semibold tracking-wide uppercase opacity-60">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
};
