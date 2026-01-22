'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Brain, Globe, Shield, Sparkles } from 'lucide-react';

const features = [
  {
    title: 'Smart Containers',
    description: 'Auto-categorize your bookmarks into dynamic containers based on content and context.',
    icon: Layers,
    color: 'bg-blue-500',
  },
  {
    title: 'Instant Previews',
    description: 'Beautiful Microlink-powered previews for every link, giving you context without clicking.',
    icon: Zap,
    color: 'bg-yellow-500',
  },
  {
    title: 'AI Analysis',
    description: 'Summarize articles and extract key insights directly within your knowledge hub.',
    icon: Brain,
    color: 'bg-purple-500',
  },
  {
    title: 'Global Search',
    description: 'Search through your entire digital universe with lightning speed and precision.',
    icon: Globe,
    color: 'bg-green-500',
  },
  {
    title: 'Privacy First',
    description: 'Your data is encrypted and secure. You own your knowledge, we just help you see it.',
    icon: Shield,
    color: 'bg-red-500',
  },
  {
    title: 'Premium Aesthetics',
    description: 'A God-level UI designed for focus, inspiration, and pure digital delight.',
    icon: Sparkles,
    color: 'bg-pink-500',
  },
];

export const LandingFeatures = () => {
  return (
    <section id="features" className="py-32 bg-white dark:bg-black relative overflow-hidden">
      <div className="container px-6 mx-auto">
        <div className="max-w-3xl mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold font-space-grotesk tracking-tight mb-8"
          >
            Engineered for the modern <span className="text-zinc-400">knowledge worker.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-500 leading-relaxed"
          >
            Cognify isn't just a bookmark manager. It's a high-performance engine for your digital life, designed to keep you inspired and organized.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="p-10 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 transition-all group"
            >
              <div className={`w-16 h-16 rounded-2xl ${feature.color} bg-opacity-10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-8 h-8 ${feature.color.replace('bg-', 'text-')}`} />
              </div>
              <h3 className="text-2xl font-bold font-space-grotesk mb-4">{feature.title}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Accents */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />
    </section>
  );
};
