"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HyperTextProps {
    children: string;
    className?: string;
    duration?: number;
    delay?: number;
    startOnView?: boolean;
    animateOnHover?: boolean;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+kM".split("");

export function HyperText({
    children,
    className = "",
    duration = 800,
    delay = 0,
    startOnView = false,
    animateOnHover = false,
}: HyperTextProps) {
    const [displayText, setDisplayText] = useState(children);
    const [hasAnimated, setHasAnimated] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number | null>(null);

    const scramble = useCallback(() => {
        if (hasAnimated && !animateOnHover) return;

        const startTime = Date.now();
        const originalText = children;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const newText = originalText
                .split("")
                .map((char, index) => {
                    if (char === " ") return " ";

                    const charProgress = (progress * originalText.length - index) / 2;

                    if (charProgress >= 1) {
                        return char;
                    } else if (charProgress > 0) {
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    } else {
                        return char;
                    }
                })
                .join("");

            setDisplayText(newText);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                setDisplayText(originalText);
                setHasAnimated(true);
            }
        };

        frameRef.current = requestAnimationFrame(animate);
    }, [children, duration, hasAnimated, animateOnHover]);

    useEffect(() => {
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!startOnView && !animateOnHover) {
            const timer = setTimeout(scramble, delay);
            return () => clearTimeout(timer);
        }

        if (startOnView && elementRef.current) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setTimeout(scramble, delay);
                        observer.disconnect();
                    }
                },
                { threshold: 0.1 }
            );

            observer.observe(elementRef.current);
            return () => observer.disconnect();
        }
    }, [delay, startOnView, animateOnHover, hasAnimated, scramble]);

    return (
        <motion.div
            ref={elementRef}
            className={cn("inline-block", className)}
            onMouseEnter={animateOnHover ? scramble : undefined}
        >
            {displayText}
        </motion.div>
    );
}
