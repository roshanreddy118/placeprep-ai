"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Code2,
  MessageSquare,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ProgressRing from "@/components/ProgressRing";
import CodeEditor from "@/components/CodeEditor";

const iconMap: Record<string, typeof Brain> = {
  aptitude: Brain,
  coding: Code2,
  interview: MessageSquare,
  communication: TrendingUp,
  industry: Sparkles,
};

const colorMap: Record<string, string> = {
  aptitude: "from-purple-500 to-indigo-500",
  coding: "from-blue-500 to-cyan-500",
  interview: "from-green-500 to-emerald-500",
  communication: "from-orange-500 to-amber-500",
  industry: "from-pink-500 to-rose-500",
};

interface CodingData {
  title: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: { python: string; javascript: string };
  testCases: { input: string; expected: string; hidden?: boolean }[];
}

interface ChallengeData {
  id: string;
  category: string;
  question: string;
  options?: string[];
  correct?: number;
  explanation: string;
  hint: string;
  difficulty: string;
  xp: number;
  coding?: CodingData;
}

export default function ChallengePage() {
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<number>>(
    new Set()
  );
  const [earnedXP, setEarnedXP] = useState(0);
  const [direction, setDirection] = useState(0);
  const [resultMap, setResultMap] = useState<
    Map<number, { challengeId: string; category: string; correct: boolean; xpEarned: number }>
  >(new Map());
  const [saved, setSaved] = useState(false);

  // Fetch challenges from AI
  useEffect(() => {
    async function fetchChallenges() {
      try {
        const res = await fetch("/api/generate");
        const data = await res.json();
        if (data.challenges) {
          setChallenges(data.challenges);
        }
      } catch (err) {
        console.error("Failed to fetch challenges:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchChallenges();
  }, []);

  // Auto-save progress when all challenges are complete
  useEffect(() => {
    const allDone = challenges.length > 0 && completedChallenges.size === challenges.length;
    if (allDone && !saved && resultMap.size === challenges.length) {
      setSaved(true);
      const results = Array.from(resultMap.values());
      const totalXP = results.reduce((sum, r) => sum + r.xpEarned, 0);
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results, totalXP }),
      }).catch(console.error);
    }
  }, [completedChallenges.size, saved, resultMap, challenges.length]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent-light" />
        <p className="text-muted">Generating today&apos;s challenges with AI...</p>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted">Failed to load challenges. Try refreshing.</p>
      </div>
    );
  }

  const current = challenges[currentIndex];
  const Icon = iconMap[current.id] || Brain;
  const color = colorMap[current.id] || "from-gray-500 to-gray-600";
  const isCoding = current.id === "coding" && current.coding;
  const isCompleted = completedChallenges.has(currentIndex);

  const handleAnswer = (index: number) => {
    if (showResult || isCompleted) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    const isCorrect = selectedAnswer === current.correct;
    const xpGained = isCorrect ? current.xp : 0;
    if (isCorrect) {
      setEarnedXP((prev) => prev + current.xp);
    }
    setCompletedChallenges((prev) => new Set(prev).add(currentIndex));
    setResultMap((prev) => {
      const m = new Map(prev);
      m.set(currentIndex, {
        challengeId: current.id,
        category: current.id,
        correct: isCorrect,
        xpEarned: xpGained,
      });
      return m;
    });
  };

  const handleCodingPassed = () => {
    setEarnedXP((prev) => prev + current.xp);
    setCompletedChallenges((prev) => new Set(prev).add(currentIndex));
    setResultMap((prev) => {
      const m = new Map(prev);
      m.set(currentIndex, {
        challengeId: current.id,
        category: current.id,
        correct: true,
        xpEarned: current.xp,
      });
      return m;
    });
  };

  const handleCodingSubmit = (passedCount: number, totalCount: number) => {
    const partialXP = Math.round(current.xp * (passedCount / totalCount));
    setEarnedXP((prev) => prev + partialXP);
    setCompletedChallenges((prev) => new Set(prev).add(currentIndex));
    setResultMap((prev) => {
      const m = new Map(prev);
      m.set(currentIndex, {
        challengeId: current.id,
        category: current.id,
        correct: passedCount === totalCount,
        xpEarned: partialXP,
      });
      return m;
    });
  };

  const handleNext = () => {
    if (currentIndex < challenges.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    }
  };

  const progress = (completedChallenges.size / challenges.length) * 100;
  const allComplete = completedChallenges.size === challenges.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Daily Challenge</h1>
          <p className="text-sm text-muted">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-accent-light">
              +{earnedXP} XP
            </p>
            <p className="text-xs text-muted">earned today</p>
          </div>
          <ProgressRing progress={progress} size={56} strokeWidth={4}>
            <span className="text-xs font-bold">
              {completedChallenges.size}/5
            </span>
          </ProgressRing>
        </div>
      </div>

      {/* Challenge Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {challenges.map((c, i) => {
          const isActive = i === currentIndex;
          const isDone = completedChallenges.has(i);
          const TabIcon = iconMap[c.id] || Brain;
          return (
            <button
              key={c.id}
              onClick={() => {
                setDirection(i > currentIndex ? 1 : -1);
                setCurrentIndex(i);
                setSelectedAnswer(null);
                setShowResult(false);
                setShowHint(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-accent/20 text-accent-light border border-accent/30"
                  : isDone
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <TabIcon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{c.category}</span>
            </button>
          );
        })}
      </div>

      {/* Challenge Card */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card glow className="mb-6">
            {/* Challenge Header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">
                  {isCoding ? current.coding!.title : current.category}
                </h2>
                <p className="text-sm text-muted">
                  +{current.xp} XP • {current.difficulty}
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent-light border border-accent/20">
                  {currentIndex + 1} of {challenges.length}
                </span>
              </div>
            </div>

            {/* CODING CHALLENGE */}
            {isCoding ? (
              <div>
                {/* Problem Description */}
                <div className="mb-6">
                  <p className="text-foreground leading-relaxed whitespace-pre-line mb-4">
                    {current.coding!.description}
                  </p>

                  {/* Examples */}
                  <div className="space-y-3 mb-4">
                    {current.coding!.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-background border border-border"
                      >
                        <p className="text-sm font-semibold mb-1">
                          Example {i + 1}:
                        </p>
                        <div className="text-sm font-mono space-y-1">
                          <p>
                            <span className="text-muted">Input: </span>
                            {ex.input}
                          </p>
                          <p>
                            <span className="text-muted">Output: </span>
                            {ex.output}
                          </p>
                          {ex.explanation && (
                            <p className="text-muted text-xs">
                              {ex.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Constraints */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold mb-2">Constraints:</p>
                    <ul className="text-sm text-muted space-y-1">
                      {current.coding!.constraints.map((c, i) => (
                        <li key={i} className="font-mono text-xs">
                          • {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Hint */}
                {!isCompleted && (
                  <div className="mb-4">
                    {!showHint ? (
                      <button
                        onClick={() => setShowHint(true)}
                        className="text-sm text-accent-light hover:underline flex items-center gap-1"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Show hint
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-4 rounded-xl bg-accent/5 border border-accent/10"
                      >
                        <p className="text-sm text-accent-light flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                          {current.hint}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Code Editor */}
                <CodeEditor
                  starterCode={current.coding!.starterCode}
                  testCases={current.coding!.testCases}
                  onAllPassed={handleCodingPassed}
                  onSubmit={handleCodingSubmit}
                />

                {/* Explanation after completing */}
                {isCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl mt-4 ${
                      resultMap.get(currentIndex)?.correct
                        ? "bg-success/5 border border-success/20"
                        : "bg-accent/5 border border-accent/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className={`w-5 h-5 ${resultMap.get(currentIndex)?.correct ? "text-success" : "text-accent-light"}`} />
                      <span className={`font-semibold ${resultMap.get(currentIndex)?.correct ? "text-success" : "text-accent-light"}`}>
                        {resultMap.get(currentIndex)?.correct
                          ? `Solved! +${current.xp} XP`
                          : `Submitted! +${resultMap.get(currentIndex)?.xpEarned || 0} XP (partial)`}
                      </span>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">
                      {current.explanation}
                    </p>
                  </motion.div>
                )}
              </div>
            ) : (
              /* MCQ CHALLENGE */
              <div>
                {/* Question */}
                <div className="mb-6">
                  <p className="text-foreground leading-relaxed whitespace-pre-line">
                    {current.question}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                  {current.options?.map((option, i) => {
                    let optionClass =
                      "bg-background border border-border hover:border-accent/30 hover-subtle";

                    if (selectedAnswer === i && !showResult) {
                      optionClass =
                        "bg-accent/10 border border-accent/40 ring-1 ring-accent/25";
                    }

                    if (showResult) {
                      if (i === current.correct) {
                        optionClass =
                          "bg-success/10 border border-success/40 ring-1 ring-success/25";
                      } else if (
                        selectedAnswer === i &&
                        i !== current.correct
                      ) {
                        optionClass =
                          "bg-danger/10 border border-danger/40 ring-1 ring-danger/25";
                      } else {
                        optionClass =
                          "bg-background border border-border opacity-50";
                      }
                    }

                    return (
                      <motion.button
                        key={i}
                        whileHover={
                          !showResult && !isCompleted ? { scale: 1.01 } : {}
                        }
                        whileTap={
                          !showResult && !isCompleted ? { scale: 0.99 } : {}
                        }
                        onClick={() => handleAnswer(i)}
                        disabled={showResult || isCompleted}
                        className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-3 ${optionClass}`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center text-sm font-semibold shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm">{option}</span>
                        {showResult && i === current.correct && (
                          <CheckCircle2 className="w-5 h-5 text-success ml-auto shrink-0" />
                        )}
                        {showResult &&
                          selectedAnswer === i &&
                          i !== current.correct && (
                            <XCircle className="w-5 h-5 text-danger ml-auto shrink-0" />
                          )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Hint */}
                {!showResult && !isCompleted && (
                  <div className="mb-4">
                    {!showHint ? (
                      <button
                        onClick={() => setShowHint(true)}
                        className="text-sm text-accent-light hover:underline flex items-center gap-1"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Show hint
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-4 rounded-xl bg-accent/5 border border-accent/10"
                      >
                        <p className="text-sm text-accent-light flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                          {current.hint}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl mb-4 ${
                      selectedAnswer === current.correct
                        ? "bg-success/5 border border-success/20"
                        : "bg-danger/5 border border-danger/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {selectedAnswer === current.correct ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-success" />
                          <span className="font-semibold text-success">
                            Correct! +{current.xp} XP
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-danger" />
                          <span className="font-semibold text-danger">
                            Not quite right
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted leading-relaxed">
                      {current.explanation}
                    </p>
                  </motion.div>
                )}

                {/* Submit Button for MCQ */}
                {!showResult && !isCompleted && (
                  <div className="mb-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={selectedAnswer === null}
                      className="w-full"
                    >
                      Submit Answer
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentIndex < challenges.length - 1 ? (
                <Button onClick={handleNext}>
                  Next Challenge
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : allComplete ? (
                <Button variant="success">
                  <CheckCircle2 className="w-4 h-4" />
                  All Complete!
                </Button>
              ) : null}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Completion Banner */}
      {allComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card
            glow
            className="text-center bg-gradient-to-br from-accent/10 to-blue-500/10 border-accent/20"
          >
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">
              Daily Challenge Complete!
            </h3>
            <p className="text-muted mb-4">
              You earned{" "}
              <span className="text-accent-light font-bold">
                +{earnedXP} XP
              </span>{" "}
              today. Your streak continues!
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => (window.location.href = "/leaderboard")}
              >
                View Leaderboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
