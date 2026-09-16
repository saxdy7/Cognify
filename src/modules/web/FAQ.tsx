'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { BlurText } from '@/components/motion/blur-text';

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

const FAQItem = ({ question, answer, index }: { question: string, answer: string, index: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="border-b border-zinc-100 dark:border-zinc-800"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-8 flex items-center justify-between text-left group"
      >
        <span className="text-xl font-bold font-space-grotesk group-hover:text-zinc-500 transition-colors">{question}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-black dark:bg-white text-white dark:text-black rotate-180' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-zinc-500 dark:text-zinc-400 leading-relaxed text-lg">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const LandingFAQ = () => {
  return (
    <section id="faq" className="py-16 md:py-24 lg:py-32 bg-white dark:bg-black">
      <div className="container px-4 sm:px-6 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 lg:gap-24">
          <div>
            <BlurText
              text="Frequently Asked Questions."
              className="text-4xl md:text-6xl font-bold font-space-grotesk tracking-tight mb-8"
              delay={150}
              animateBy="words"
              direction="bottom"
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-zinc-500 leading-relaxed"
            >
              Everything you need to know about the platform and how it can supercharge your productivity.
            </motion.p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} {...faq} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
