'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Brain, Globe, Shield, Sparkles } from 'lucide-react';

const features = [
  {
    title: 'Smart Containers',
    description: 'Auto-categorize your bookmarks into dynamic containers based on content and context.',
    icon: Layers,
    color: 'bg-orange-500',
  },
  {
    title: 'Instant Previews',
    description: 'Beautiful Microlink-powered previews for every link, giving you context without clicking.',
    icon: Zap,
    color: 'bg-orange-400',
  },
  {
    title: 'AI Analysis',
    description: 'Summarize articles and extract key insights directly within your knowledge hub.',
    icon: Brain,
    color: 'bg-orange-600',
  },
  {
    title: 'Global Search',
    description: 'Search through your entire digital universe with lightning speed and precision.',
    icon: Globe,
    color: 'bg-orange-500',
  },
  {
    title: 'Privacy First',
    description: 'Your data is encrypted and secure. You own your knowledge, we just help you see it.',
    icon: Shield,
    color: 'bg-orange-400',
  },
  {
    title: 'Premium Aesthetics',
    description: 'A God-level UI designed for focus, inspiration, and pure digital delight.',
    icon: Sparkles,
    color: 'bg-orange-600',
  },
];

export const LandingFeatures = () => {
  return (
    <section id="features" className="py-48 bg-black relative overflow-hidden">
      <div className="container px-6 mx-auto">
        <div className="max-w-4xl mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8 backdrop-blur-md"
          >
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">Features</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-8xl font-black font-space-grotesk tracking-tighter mb-10 text-white leading-[0.85]"
          >
            Engineered for the <br /> <span className="text-zinc-600">future of knowledge.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-zinc-400 leading-relaxed font-medium max-w-2xl"
          >
            Cognify isn't just a bookmark manager. It's a high-performance engine for your digital life, designed to keep you inspired and organized.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="p-12 rounded-[3rem] bg-zinc-900/40 backdrop-blur-3xl border border-white/5 hover:border-orange-500/30 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/20 transition-colors" />
              
              <div className={`w-20 h-20 rounded-2xl ${feature.color} bg-opacity-10 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-2xl shadow-orange-500/10`}>
                <feature.icon className={`w-10 h-10 ${feature.color.replace('bg-', 'text-')}`} />
              </div>
              <h3 className="text-3xl font-black font-space-grotesk mb-6 text-white">{feature.title}</h3>
              <p className="text-lg text-zinc-400 leading-relaxed font-medium">
                {feature.description}
              </p>
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
