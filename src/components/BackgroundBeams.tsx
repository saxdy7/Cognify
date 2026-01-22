'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const BackgroundBeams = React.memo(({ className }: { className?: string }) => {
  const paths = [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-200 -100C-200 -100 -100 300 200 400C500 500 600 900 600 900",
    "M-400 200C-400 200 -200 400 100 500C400 600 700 800 700 800",
    "M100 -200C100 -200 200 100 400 200C600 300 800 500 800 500",
    "M500 -100C500 -100 400 200 300 400C200 600 100 800 100 800",
    "M300 -300C300 -300 400 -100 500 100C600 300 700 500 700 500",
    "M-100 -400C-100 -400 0 -200 100 0C200 200 300 400 300 400",
    "M600 200C600 200 500 400 400 500C300 600 200 700 200 700",
  ];

  return (
    <div className={cn("absolute h-full w-full inset-0 pointer-events-none overflow-hidden", className)}>
      <svg
        className="z-0 h-full w-full absolute opacity-20 dark:opacity-30"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((path, index) => (
          <React.Fragment key={`beam-${index}`}>
            <motion.path
              d={path}
              stroke={`url(#linearGradient-${index})`}
              strokeOpacity="0.6"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1], 
                opacity: [0, 1, 0] 
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                ease: "easeInOut",
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
            <defs>
              <motion.linearGradient
                id={`linearGradient-${index}`}
                initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
                animate={{
                  x1: ["0%", "100%"],
                  x2: ["0%", "100%"],
                  y1: ["0%", "100%"],
                  y2: ["0%", "100%"],
                }}
                transition={{
                  duration: Math.random() * 5 + 5,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                <stop stopColor="#6366f1" stopOpacity="0" />
                <stop stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </motion.linearGradient>
            </defs>
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
});

BackgroundBeams.displayName = "BackgroundBeams";
