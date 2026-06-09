/**
 * @file PageTransition.tsx
 * @description Framer Motion page transition wrapper.
 * Handles entering and exiting page animations (fade-in, slide-up, slide-down exit)
 * to ensure smooth routing flows.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' } 
      }}
      exit={{ 
        opacity: 0, 
        y: -10,
        transition: { duration: 0.3, ease: 'easeIn' } 
      }}
      className="w-full flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}
