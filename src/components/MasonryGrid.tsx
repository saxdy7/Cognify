'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MasonryGridProps {
  children: React.ReactNode;
  className?: string;
}

export const MasonryGrid = ({ children, className }: MasonryGridProps) => {
  return (
    <div className={cn(
      "columns-1 sm:columns-2 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-8 space-y-8 pb-32",
      className
    )}>
      {React.Children.map(children, (child) => (
        <div className="break-inside-avoid-column mb-8">
          {child}
        </div>
      ))}
    </div>
  );
};
