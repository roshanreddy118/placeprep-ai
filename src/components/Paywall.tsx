"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, Crown, ChevronRight, Clock } from "lucide-react";
import Button from "@/components/Button";

interface PaywallProps {
  daysUsed?: number;
}

export default function Paywall({ daysUsed = 7 }: PaywallProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="p-8 rounded-2xl bg-card border border-border glow">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-accent-light" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Free Trial Ended</h2>
          <p className="text-muted mb-6">
            Your 7-day free trial has expired. Upgrade to PlacePrep Pro to
            continue your placement prep journey.
          </p>

          <div className="p-4 rounded-xl bg-background border border-border mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Trial period
              </span>
              <span className="text-sm font-medium text-danger">Expired</span>
            </div>
            <div className="h-2 bg-subtle rounded-full overflow-hidden">
              <div className="h-full w-full bg-danger/50 rounded-full" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-accent-light" />
              <span className="font-semibold">PlacePrep Pro</span>
            </div>
            <p className="text-2xl font-extrabold">
              $5<span className="text-sm font-normal text-muted">/month</span>
            </p>
            <p className="text-xs text-muted mt-1">
              Cancel anytime • Unlimited access
            </p>
          </div>

          <Link href="/pricing">
            <Button size="lg" className="w-full mb-3">
              <Crown className="w-4 h-4" />
              Upgrade to Pro
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link
            href="/dashboard"
            className="text-sm text-muted hover:text-foreground"
          >
            Back to Dashboard
          </Link>
        </div>

        <p className="text-xs text-muted mt-4">
          Your streak and progress are saved. Subscribe to continue where you
          left off.
        </p>
      </motion.div>
    </div>
  );
}
