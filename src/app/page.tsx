'use client';

import React from 'react';
import { LandingNavbar } from '@/components/landing/Navbar';
import { LandingHero } from '@/components/landing/Hero';
import { LandingFeatures } from '@/components/landing/Features';
import { LandingFAQ } from '@/components/landing/FAQ';
import { LandingTestimonials } from '@/components/landing/Testimonials';
import { LandingFooter } from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import Link from 'next/link';


export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <LandingNavbar />

      <main>
        <LandingHero />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative z-10"
        >
          <LandingFeatures />

          {/* Social Proof / Companies Section */}
          <section className="py-24 border-y border-zinc-100 dark:border-zinc-900 overflow-hidden bg-black/50 backdrop-blur-3xl">
            <div className="container px-6 mx-auto">
              <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-16">Trusted by builders at</p>

              <div className="relative flex overflow-hidden group">
                <motion.div
                  animate={{ x: [0, -1000] }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="flex items-center gap-24 whitespace-nowrap min-w-full"
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <React.Fragment key={i}>
                      {[
                        {
                          name: 'Linear',
                          icon: (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                              <path d="M11.95 2.05A9.97 9.97 0 0 0 2.05 12c.03 2.56 1 4.93 2.62 6.78.33.38.74.77 1.13 1.12l.13.12 1.95-1.95a7.22 7.22 0 1 1 5.92-12.7L2.07 17.15c2.32 2.89 5.86 4.85 9.93 4.85 7.18 0 13-5.82 13-13S19.13 2.05 11.95 2.05z" fillOpacity="0" />
                              <path d="M2.05 12a9.97 9.97 0 0 1 9.9-9.95v2.8a7.21 7.21 0 0 0-5.1 2.1l-1.93 1.93.07.08A9.95 9.95 0 0 1 2.05 12z" />
                            </svg>
                          )
                        },
                        {
                          name: 'Vercel',
                          icon: (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10">
                              <path d="M12 1L24 22H0L12 1Z" />
                            </svg>
                          )
                        },
                        {
                          name: 'Supabase',
                          icon: (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10">
                              <path d="M12.9 22.1c.3.5-.8.9-1.3.4l-9.1-8.7A1.5 1.5 0 0 1 3.5 11h6.6C10.7 11 11 10.4 10.8 10L6.6 1.9c-.3-.6.7-1 1.2-.5l9.1 8.7a1.5 1.5 0 0 1-1 2.6h-6.6c-.6 0-.8.6-.6 1l4.2 8.4z" />
                            </svg>
                          )
                        },
                        {
                          name: 'Framer',
                          icon: (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10">
                              <path d="M4 0h16v8h-8zM4 12h8v8l-8-8zM4 8h8v4H4z" />
                            </svg>
                          )
                        },
                        {
                          name: 'Next.js',
                          icon: (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10">
                              <path d="M20.7 18.7L12 6.5l-3.2 4.5L12 18.7zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM6 12c0-3.3 2.7-6 6-6 .6 0 1.2.1 1.8.3L7.3 16.6c-2.3-2.6-2.5-6.3-1.3-4.6zM18 12c0 1.1-.3 2.1-.8 3L9 6.2c.9-.1 1.9-.2 3-.2 3.3 0 6 2.7 6 6z" />
                            </svg>
                          )
                        },
                        {
                          name: 'React',
                          icon: (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10">
                              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM12 4c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z" />
                              <circle cx="12" cy="12" r="2" />
                            </svg>
                          )
                        }
                      ].map((brand) => (
                        <span key={`${i}-${brand.name}`} className="flex items-center gap-4 text-4xl md:text-5xl font-black font-space-grotesk text-zinc-800 hover:text-orange-500 transition-colors cursor-default tracking-tighter group">
                          {brand.icon}
                          {brand.name}
                        </span>
                      ))}
                    </React.Fragment>
                  ))}
                </motion.div>

                {/* Gradient Fades */}
                <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-10" />
              </div>
            </div>
          </section>

          <LandingTestimonials />
          <LandingFAQ />

          {/* Final CTA */}
          <section className="py-32 relative overflow-hidden">
            <div className="container px-6 mx-auto relative z-10">
              <div className="max-w-5xl mx-auto p-12 md:p-24 rounded-[3rem] bg-black dark:bg-zinc-900 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />

                <h2 className="text-4xl md:text-7xl font-bold font-space-grotesk tracking-tight mb-10 relative z-10">
                  Ready to evolve your <br /> <span className="text-zinc-500">digital workflow?</span>
                </h2>
                <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto relative z-10">
                  Join 50,000+ creators who have already elevated their knowledge management to the next level.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                  <Link href="/login?mode=signup" className="inline-flex">
                    <button className="cssbuttons-io-button">
                      Get started
                      <div className="icon">
                        <svg
                          height="24"
                          width="24"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M0 0h24v24H0z" fill="none"></path>
                          <path
                            d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                            fill="currentColor"
                          ></path>
                        </svg>
                      </div>
                    </button>
                  </Link>
                  <button className="h-[2.8em] px-8 bg-transparent border border-white/20 rounded-[0.9em] font-medium text-white/90 text-[17px] hover:bg-white/5 hover:text-white transition-all backdrop-blur-sm tracking-wide flex items-center justify-center">
                    Talk to Sales
                  </button>
                </div>
              </div>
            </div>
          </section>
        </motion.div>
      </main>

      <LandingFooter />
    </div>
  );
}
