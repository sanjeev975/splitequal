"use client";

import { motion } from "framer-motion";
import { STAGGER, TRANSITION } from "@/lib/motion";

/**
 * A client-side wrapper to provide staggered entrance animations
 */
export function DashboardClient({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={STAGGER.container}
      initial="hidden"
      animate="visible"
      transition={TRANSITION.ease}
    >
      {children}
    </motion.div>
  );
}
