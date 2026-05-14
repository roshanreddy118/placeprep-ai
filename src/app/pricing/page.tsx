"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Flame,
  Check,
  Crown,
  Sparkles,
  Shield,
  Zap,
  ChevronRight,
  Star,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";
import Button from "@/components/Button";
import { useTheme } from "@/components/ThemeProvider";

const freeFeatures = [
  "5 daily AI challenges for 7 days",
  "LeetCode-style coding editor",
  "Aptitude, Interview & Communication Q's",
  "Industry updates",
  "Streak tracking",
  "Basic leaderboard access",
];

const proFeatures = [
  "Everything in Free Trial, plus:",
  "Unlimited daily challenges forever",
  "Adaptive difficulty (AI learns your level)",
  "Detailed performance analytics",
  "Full badge collection",
  "Priority AI-generated content",
  "Complete challenge history",
  "Ad-free experience",
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Home
              </Link>
              <Link href="/" className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center logo-icon-glow">
                  <Flame className="w-7 h-7 text-white" />
                </div>
                <span className="font-extrabold text-xl logo-glow">
                  PlacePrep AI
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-accent/10 text-muted hover:text-foreground transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent-light text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              Simple Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Start Free. <span className="gradient-text">Go Pro.</span>
            </h1>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Try everything free for 7 days. Then upgrade to Pro for just $5/month — less than a cup of coffee.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Trial */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card border border-border p-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-subtle flex items-center justify-center">
                <Zap className="w-5 h-5 text-muted" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Free Trial</h3>
                <p className="text-xs text-muted">7 days, no card required</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-extrabold">$0</span>
              <span className="text-muted ml-1">/7 days</span>
            </div>

            <Link href="/register">
              <Button variant="secondary" size="lg" className="w-full mb-8">
                Start Free Trial
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>

            <ul className="space-y-3">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <span className="text-muted">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card border border-accent/30 p-8 relative glow"
          >
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="px-4 py-1 rounded-full bg-gradient-to-r from-accent to-blue-500 text-white text-xs font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" />
                MOST POPULAR
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-accent-light" />
              </div>
              <div>
                <h3 className="font-bold text-lg">PlacePrep Pro</h3>
                <p className="text-xs text-muted">Unlimited access</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-extrabold">$5</span>
              <span className="text-muted ml-1">/month</span>
            </div>

            <Button
              size="lg"
              className="w-full mb-8"
              loading={loading}
              onClick={handleSubscribe}
            >
              Subscribe Now
              <ChevronRight className="w-4 h-4" />
            </Button>

            <ul className="space-y-3">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-accent-light shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure payments via Stripe
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Cancel anytime
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Instant access
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-border bg-card/50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "What happens after the 7-day free trial?",
                a: "After your trial ends, you'll need to subscribe to PlacePrep Pro ($5/month) to continue accessing daily challenges. Your streak and progress are saved — just subscribe to pick up where you left off.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes! Cancel with one click from your profile. You'll keep access until the end of your billing period. No questions asked.",
              },
              {
                q: "Do I need a credit card for the free trial?",
                a: "No! Just sign up with your email and start immediately. We only ask for payment info when you decide to subscribe.",
              },
              {
                q: "What if I miss a day during my trial?",
                a: "No worries — the trial is 7 calendar days from signup, not 7 active days. New challenges are generated daily whether you complete them or not.",
              },
              {
                q: "Is the coding editor like LeetCode?",
                a: "Yes! You get a Monaco editor (same as VS Code) with Python and JavaScript support. Write your solution, run it against test cases, and see pass/fail results in real time.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="p-5 rounded-xl bg-card border border-border"
              >
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold gradient-text">
                PlacePrep AI
              </span>
            </div>
            <p className="text-xs text-muted">
              © 2026 PlacePrep AI. Built for students, by students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
