'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, User } from 'lucide-react';
import { BlurText } from '@/components/motion/blur-text';

const testimonials = [
    {
        name: 'Alex Rivera',
        role: 'Product Designer',
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
        content: "Cognify completely transformed how I organize my design inspiration. The AI context categorization actually understands what I'm saving.",
        rating: 5
    },
    {
        name: 'Priya Nair',
        role: 'Research Scientist',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
        content: "The neural sync feature saves me hours every week. It's not just a bookmark manager; it's a second brain that actually works.",
        rating: 5
    },
    {
        name: 'Marcus Thorne',
        role: 'Indie Developer',
        image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
        content: "Finally, a tool that keeps up with my browsing speed. The instant flow previews are buttery smooth. Absolute game changer.",
        rating: 5
    }
];

export const LandingTestimonials = () => {
    return (
        <section id="testimonials" className="py-16 md:py-24 lg:py-32 bg-zinc-950 relative overflow-hidden">
            <div className="container px-4 sm:px-6 mx-auto relative z-10">
                <div className="max-w-4xl mb-20 text-center mx-auto">
                    <h2 className="text-4xl md:text-7xl font-black font-space-grotesk tracking-tighter mb-8 text-white leading-[0.9]">
                        <BlurText
                            text="Loved by"
                            className=""
                            delay={100}
                            animateBy="words"
                            direction="bottom"
                        />
                        <br />
                        <BlurText
                            text="obsessive creators."
                            className="text-zinc-600"
                            delay={150}
                            animateBy="words"
                            direction="bottom"
                        />
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="p-8 rounded-[2rem] bg-zinc-900/50 border border-white/5 hover:border-orange-500/20 transition-all relative group"
                        >
                            {/* Quote Icon */}
                            <div className="absolute top-8 right-8 text-zinc-800 group-hover:text-orange-500/20 transition-colors">
                                <Quote className="w-10 h-10 fill-current" />
                            </div>

                            {/* Stars */}
                            <div className="flex gap-1 mb-6">
                                {Array.from({ length: testimonial.rating }).map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-orange-500 fill-orange-500" />
                                ))}
                            </div>

                            {/* Content */}
                            <p className="text-lg text-zinc-300 font-medium leading-relaxed mb-8 relative z-10">
                                "{testimonial.content}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-orange-500 transition-colors">
                                    <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-bold text-white font-space-grotesk">{testimonial.name}</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{testimonial.role}</div>
                                </div>
                            </div>

                            {/* Card Glow */}
                            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Decorative Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[500px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
        </section>
    );
};
