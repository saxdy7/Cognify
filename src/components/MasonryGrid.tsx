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
      "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6",
      className
    )}>
      {React.Children.map(children, (child) => (
        <div className="break-inside-avoid">
          {child}
        </div>
      ))}
    </div>
  );
};
