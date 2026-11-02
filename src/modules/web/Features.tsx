'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap, Layers, Sparkles } from 'lucide-react';
import { BlurText } from '@/components/motion/blur-text';

const features = [
  {
    title: 'Smart Spaces',
    description: 'Auto-categorize bookmarks into high-res containers using AI context.',
    icon: Layers,
    color: 'bg-orange-500',
  },
  {
    title: 'Knowledge Docs',
    description: 'Write and structure notes with a block-based editor built for deep work.',
    icon: FileText,
    color: 'bg-indigo-500',
  },
  {
    title: 'Instant Flow',
    description: 'Beautiful Microlink-powered previews for every capture.',
    icon: Zap,
    color: 'bg-orange-400',
  },
  {
    title: 'Visual Canvas',
    description: 'Drag bookmarks onto an infinite canvas and connect ideas spatially.',
    icon: Sparkles,
    color: 'bg-orange-500',
  },
];

export const LandingFeatures = () => {
  return (
    <section id="features" className="py-16 md:py-24 lg:py-32 bg-black relative overflow-hidden">
      <div className="container px-4 sm:px-6 mx-auto">
        <div className="max-w-4xl mb-24 text-center mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-7xl font-black font-space-grotesk tracking-tighter mb-8 text-white leading-[0.9]"
          >
            <BlurText
              text="Engineered for"
              className=""
              delay={100}
              animateBy="words"
              direction="bottom"
            />
            <br />
            <BlurText
              text="infinite knowledge."
              className="text-zinc-600"
              delay={150}
              animateBy="words"
              direction="bottom"
            />
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto relative z-10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] } }}
              className="p-10 rounded-[2.5rem] bg-zinc-900/40 backdrop-blur-3xl border border-white/5 hover:border-orange-500/30 transition-all group overflow-hidden relative"
            >
              <div className="flex items-center gap-8">
                <div className={`w-16 h-16 rounded-2xl ${feature.color} bg-opacity-10 flex items-center justify-center shrink-0 shadow-2xl shadow-orange-500/10`}>
                  <feature.icon className={`w-8 h-8 ${feature.color.replace('bg-', 'text-')}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-black font-space-grotesk mb-2 text-white">{feature.title}</h3>
                  <p className="text-base text-zinc-500 font-medium leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Accents */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-orange-600/5 blur-[180px] rounded-full pointer-events-none" />
    </section>
  );
};
