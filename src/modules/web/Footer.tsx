'use client';

import React from 'react';
import { Twitter, Github, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';
import { CognifyLogo } from '@/modules/main/CognifyLogo';

const linkCls = 'inline-block text-muted-foreground transition-[color,transform] duration-300 hover:translate-x-1 hover:text-foreground';

export const LandingFooter = () => {
  return (
    <footer className="px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="container mx-auto rounded-[2.5rem] bg-card px-6 py-12 ring-1 ring-foreground/[0.08] backdrop-blur-xl sm:px-10 md:py-16">
        <div className="mb-12 grid grid-cols-1 gap-10 md:mb-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          <div className="lg:col-span-2">
            <Link href="/" className="group mb-6 flex items-center gap-3">
              <CognifyLogo className="size-10 transition-transform duration-500 ease-(--ease-pop) group-hover:rotate-[-8deg] group-hover:scale-105" size={40} />
              <span className="font-heading text-xl font-bold tracking-tight">Cognify</span>
            </Link>
            <p className="mb-8 max-w-sm text-lg leading-relaxed text-muted-foreground">
              The high-performance knowledge hub for the next generation of digital creators.
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Github, label: 'GitHub' },
                { Icon: Linkedin, label: 'LinkedIn' },
                { Icon: Mail, label: 'Email' },
              ].map(({ Icon, label }) => (
                <Link
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex size-11 items-center justify-center rounded-full bg-foreground/[0.06] transition-all duration-300 ease-(--ease-pop) hover:-translate-y-1 hover:scale-110 hover:bg-brand hover:text-brand-foreground"
                >
                  <Icon className="size-[18px]" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-bold tracking-widest text-muted-foreground uppercase">Platform</h4>
            <ul className="space-y-3.5">
              {['Features', 'Integrations', 'Changelog', 'Roadmap'].map((item) => (
                <li key={item}><Link href="#" className={linkCls}>{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-bold tracking-widest text-muted-foreground uppercase">Company</h4>
            <ul className="space-y-3.5">
              {['About', 'Privacy', 'Terms', 'Security', 'Contact'].map((item) => (
                <li key={item}><Link href="#" className={linkCls}>{item}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-foreground/[0.08] pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">© 2026 Cognify Labs. Built with passion for the digital universe.</p>
        </div>
      </div>
    </footer>
  );
};
