"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Flame,
  Zap,
  Brain,
  Code2,
  MessageSquare,
  TrendingUp,
  Trophy,
  Target,
  ChevronRight,
  Star,
  Users,
  BarChart3,
  Shield,
  Sparkles,
  Send,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";
import Button from "@/components/Button";
import { useTheme } from "@/components/ThemeProvider";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const dailyItems = [
  {
    icon: Brain,
    title: "Aptitude Question",
    desc: "Sharpen logical & quantitative skills",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Code2,
    title: "Coding Problem",
    desc: "DSA problems from real interviews",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: MessageSquare,
    title: "Interview Question",
    desc: "Behavioral & technical prep",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: TrendingUp,
    title: "Communication Tip",
    desc: "Professional soft skills daily",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Sparkles,
    title: "Industry Update",
    desc: "Stay current with tech trends",
    color: "from-pink-500 to-rose-500",
  },
];

const features = [
  {
    icon: Flame,
    title: "Daily Streaks",
    desc: "Build consistency with addictive streak tracking. Don't break the chain!",
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    desc: "Compete with peers. Top performers earn exclusive badges.",
  },
  {
    icon: Target,
    title: "Adaptive Difficulty",
    desc: "AI adjusts to your level. Always challenging, never overwhelming.",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    desc: "Track your growth across all placement dimensions.",
  },
  {
    icon: Shield,
    title: "AI-Powered Content",
    desc: "Fresh questions daily, aligned with current industry standards.",
  },
  {
    icon: Users,
    title: "Community",
    desc: "Learn alongside thousands preparing for placements.",
  },
];

interface FeedbackItem {
  _id: string;
  name: string;
  message: string;
  rating: number;
  createdAt: string;
}

export default function LandingPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [fbName, setFbName] = useState("");
  const [fbEmail, setFbEmail] = useState("");
  const [fbMessage, setFbMessage] = useState("");
  const [fbRating, setFbRating] = useState(5);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbSent, setFbSent] = useState(false);
  const [fbError, setFbError] = useState("");
  const [siteStats, setSiteStats] = useState({ users: 0, challenges: 0, completionRate: 0 });
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((d) => { if (d.feedbacks) setFeedbacks(d.feedbacks); })
      .catch(() => {});
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setSiteStats(d))
      .catch(() => {});
  }, []);

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFbLoading(true);
    setFbError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fbName, email: fbEmail, message: fbMessage, rating: fbRating }),
      });
      const data = await res.json();
      if (!res.ok) { setFbError(data.error); }
      else {
        setFbSent(true);
        setFeedbacks((prev) => [{ _id: Date.now().toString(), name: fbName, message: fbMessage, rating: fbRating, createdAt: new Date().toISOString() }, ...prev]);
      }
    } catch { setFbError("Something went wrong"); }
    finally { setFbLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center logo-icon-glow">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <span className="font-extrabold text-xl logo-glow">
                PlacePrep AI
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-accent/10 text-muted hover:text-foreground transition-colors"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="secondary" size="sm">
                  Pricing
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent-light text-sm mb-8"
            >
              <Sparkles className="w-4 h-4" />
              Like Duolingo, but for Placements
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6"
            >
              Ace Your
              <span className="gradient-text"> Placement</span>
              <br />
              in 10 Min/Day
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10"
            >
              5 AI-powered daily challenges covering aptitude, coding,
              interviews, communication & industry trends. Build streaks, earn
              XP, and get placement-ready.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register">
                <Button size="lg">
                  Start Your Streak
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/challenge">
                <Button variant="secondary" size="lg">
                  Try Today&apos;s Challenge
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex items-center justify-center gap-8 mt-16 text-sm"
            >
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">{siteStats.users}</div>
                <div className="text-muted">Active Users</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">{siteStats.challenges}</div>
                <div className="text-muted">Questions</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">{siteStats.completionRate}%</div>
                <div className="text-muted">Completion Rate</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Daily Items */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              5 Challenges.{" "}
              <span className="gradient-text">Every Day.</span>
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              Each morning, your AI coach serves 5 fresh challenges tailored to
              current industry standards.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {dailyItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative p-6 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted">{item.desc}</p>
                <div className="absolute top-4 right-4 text-2xl font-bold text-white/5">
                  {i + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Students{" "}
              <span className="gradient-text">Love It</span>
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              Gamification meets placement prep. Stay motivated, stay ahead.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-accent-light" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Sign Up",
                desc: "Create your free account in 30 seconds",
                icon: "🚀",
              },
              {
                step: "02",
                title: "Daily Challenges",
                desc: "Complete 5 AI-curated challenges each day",
                icon: "🎯",
              },
              {
                step: "03",
                title: "Get Placed",
                desc: "Track progress, build streaks, ace interviews",
                icon: "🏆",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="text-sm font-mono text-accent-light mb-2">
                  Step {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-20 border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What Students{" "}
              <span className="gradient-text">Say</span>
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              Real feedback from real users
            </p>
          </motion.div>

          {/* Feedback Cards */}
          {feedbacks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {feedbacks.slice(0, 6).map((fb, i) => (
                <motion.div
                  key={fb._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border glow"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className={`w-4 h-4 ${j < fb.rating ? "fill-yellow-500 text-yellow-500" : "text-border"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted mb-6 leading-relaxed">
                    &ldquo;{fb.message}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center text-sm font-bold">
                      {fb.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{fb.name}</div>
                      <div className="text-xs text-muted">
                        {new Date(fb.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Feedback Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto"
          >
            <div className="p-8 rounded-2xl bg-card border border-border glow">
              <h3 className="text-xl font-bold mb-2 text-center">Share Your Experience</h3>
              <p className="text-sm text-muted text-center mb-6">
                Your feedback helps us improve and inspires others
              </p>

              {fbSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                  <p className="font-semibold mb-1">Thank you!</p>
                  <p className="text-sm text-muted">Your feedback has been submitted.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleFeedback} className="space-y-4">
                  {fbError && (
                    <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                      {fbError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={fbName}
                      onChange={(e) => setFbName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                    />
                    <input
                      type="email"
                      value={fbEmail}
                      onChange={(e) => setFbEmail(e.target.value)}
                      placeholder="Your email"
                      required
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                    />
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">Rating:</span>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFbRating(s)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${s <= fbRating ? "fill-yellow-500 text-yellow-500" : "text-border"}`}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={fbMessage}
                    onChange={(e) => setFbMessage(e.target.value)}
                    placeholder="Tell us about your experience..."
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none"
                  />

                  <Button type="submit" loading={fbLoading} className="w-full">
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-6xl mb-6">🔥</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
              Start Your Streak{" "}
              <span className="gradient-text">Today</span>
            </h2>
            <p className="text-muted text-lg mb-8">
              Join our growing community of students getting placement-ready. Free forever.
            </p>
            <Link href="/register">
              <Button size="lg">
                Begin Your Journey
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center logo-icon-glow">
                <Flame className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-sm font-semibold logo-glow">
                PlacePrep AI
              </span>
            </div>
            <a href="https://www.foundrlist.com/product/placeprepai?utm_source=badge&utm_medium=embed" target="_blank" rel="noopener">
              <img src="https://www.foundrlist.com/api/badge/placeprepai" alt="Featured on FoundrList" width={150} height={48} />
            </a>
            <p className="text-xs text-muted">
              © 2026 PlacePrep AI. Built with ❤️ by someone who&apos;s felt the placement pressure — so you don&apos;t have to struggle alone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
