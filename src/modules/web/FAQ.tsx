'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SplitReveal, Stagger, StaggerItem } from '@/components/motion/reveal';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'How does Cognify organize my bookmarks?',
    answer: 'Cognify uses advanced metadata extraction and AI analysis to understand the content of your links. It then suggests or automatically places them into Smart Containers based on your workspace structure.',
  },
  {
    question: 'Is my data private and secure?',
    answer: 'Absolutely. We use industry-standard encryption and Supabase Secure Auth. Your knowledge hub is yours alone. We never sell your data or use it for advertising.',
  },
  {
    question: 'Can I import my existing browser bookmarks?',
    answer: 'Yes! Cognify supports bulk importing via HTML files or direct browser extension sync, making it easy to transition your entire digital library.',
  },
  {
    question: 'What makes Cognify different from other bookmark managers?',
    answer: 'Cognify is built for high-performance knowledge workers who care about aesthetics as much as utility. It combines a Pinterest-level visual experience with powerful organizational tools.',
  },
];

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <StaggerItem>
      <div className={cn('rounded-3xl bg-card ring-1 backdrop-blur-xl transition-[box-shadow,background-color] duration-300', isOpen ? 'ring-brand/40' : 'ring-foreground/[0.08] hover:ring-foreground/20')}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="group flex w-full items-center justify-between gap-4 rounded-3xl px-6 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:px-8 md:py-6"
        >
          <span className="text-lg font-bold md:text-xl">{question}</span>
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-500 ease-(--ease-pop)',
              isOpen ? 'rotate-45 bg-brand text-brand-foreground' : 'bg-foreground/[0.07] group-hover:bg-foreground/[0.12]',
            )}
          >
            <Plus className="size-4" />
          </span>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <p className="px-6 pb-6 text-base leading-relaxed text-muted-foreground md:px-8 md:pb-8 md:text-lg">{answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StaggerItem>
  );
};

export const LandingFAQ = () => {
  return (
    <section id="faq" className="py-20 md:py-28 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-2">
            <h2 className="mb-6 text-4xl leading-[1.02] font-bold tracking-tight md:text-6xl">
              <SplitReveal inView text="Frequently Asked" />
              <br />
              <SplitReveal inView text="Questions." delay={0.1} className="text-muted-foreground" />
            </h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.7, ease: EASE_OUT }}
              className="text-lg leading-relaxed text-muted-foreground"
            >
              Everything you need to know about the platform and how it can supercharge your productivity.
            </motion.p>
          </div>
          <Stagger className="space-y-3 lg:col-span-3" gap={0.08}>
            {faqs.map((faq) => (
              <FAQItem key={faq.question} {...faq} />
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
};
