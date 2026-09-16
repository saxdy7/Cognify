'use client';

import React from 'react';

interface FlipTextProps {
    text: string;
    className?: string;
    showNumber?: boolean;
    index?: number;
    charDelay?: number;
}

/**
 * FlipText - Animated text component with character-by-character flip effect
 * 
 * @param text - The text to display and animate
 * @param className - Additional CSS classes for the text
 * @param showNumber - Whether to show a superscript number after the text
 * @param index - The index number to display (if showNumber is true)
 * @param charDelay - Delay between each character animation in milliseconds (default: 25)
 */
export const FlipText: React.FC<FlipTextProps> = ({
    text,
    className = "text-4xl font-medium",
    showNumber = false,
    index = 0,
    charDelay = 25
}) => {
    return (
        <span className="group relative flex items-center">
            {/* Main text with flip animation */}
            <span className={`relative block overflow-hidden whitespace-nowrap ${className}`}>
                {/* Top layer (visible initially) */}
                <div className="flex">
                    {text.split("").map((char, i) => (
                        <span
                            key={`top-${i}`}
                            className="inline-block transition-transform duration-300 ease-in-out group-hover:-translate-y-[110%]"
                            style={{
                                transitionDelay: `${i * charDelay}ms`,
                            }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </span>
                    ))}
                </div>

                {/* Bottom layer (revealed on hover) */}
                <div className="absolute inset-0 flex">
                    {text.split("").map((char, i) => (
                        <span
                            key={`bottom-${i}`}
                            className="inline-block translate-y-[110%] transition-transform duration-300 ease-in-out group-hover:translate-y-0"
                            style={{
                                transitionDelay: `${i * charDelay}ms`,
                            }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </span>
                    ))}
                </div>
            </span>

            {/* Optional superscript number */}
            {showNumber && (
                <span className="ml-2 text-sm text-white/60">
                    <sup>{String(index + 1).padStart(2, '0')}</sup>
                </span>
            )}
        </span>
    );
};
