"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { LegalFooter } from "@/components/LegalPage";
import { STAGGER, TRANSITION } from "@/lib/motion";

export default function Landing() {
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={STAGGER.container}
      transition={TRANSITION.ease}
      className="mx-auto max-w-4xl px-4 py-6"
    >
      <motion.header variants={STAGGER.item} className="flex items-center justify-between">
        <Logo />
        <Link href="/login" className="btn">Sign in</Link>
      </motion.header>

      <section className="mt-8 md:mt-12 grid gap-5 md:gap-8 md:grid-cols-2 items-center">
        <motion.div variants={STAGGER.item}>
          <h1 className="font-display text-5xl font-bold text-fg leading-tight">
            Every expense.<br/>
            <span className="text-accent">Fairly shared.</span>
          </h1>
          <p className="mt-4 text-lg text-muted">Trips, rent, groceries and bills — split exactly, down to the last paisa.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/login" className="btn btn-lime mt-4 inline-block">Start a group</Link>
            <Link href="/guest" className="btn mt-4 inline-block bg-inset text-fg border border-border">Try without an account</Link>
          </div>
        </motion.div>

        <motion.div variants={STAGGER.item} className="receipt">
          <p className="font-bold">GOA TRIP — DINNER</p>
          <p>Total ........ ₹3,000.00</p>
          <p>Asha paid</p>
          <p>Split 3 ways ..... ₹1,000.00</p>
          <p className="mt-2 text-good font-bold">Ravi owes Asha ₹1,000.00</p>
          <p className="text-xs mt-2 opacity-60">(illustrative sample)</p>
        </motion.div>
      </section>

      <motion.div variants={STAGGER.item}>
        <LegalFooter />
      </motion.div>
    </motion.main>
  );
}
