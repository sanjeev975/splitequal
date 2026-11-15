/**
 * Centralized motion constants to ensure consistency across the SplitLoL application.
 * All animations should use these tokens rather than hard-coded values.
 */

export const TRANSITION = {
  // Use for buttons, toggles, and small interactions
  spring: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
  },
  // Use for page transitions or staggered lists
  ease: {
    type: "tween" as const,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    duration: 0.4,
  },
};

export const STAGGER = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  },
};
