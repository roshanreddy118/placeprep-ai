"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Flame, CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token provided");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setErrorMsg(data.error || "Verification failed");
        } else {
          setStatus("success");
        }
      } catch {
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">
              PlacePrep AI
            </span>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          {status === "loading" && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-accent-light mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                Verifying your email...
              </h2>
              <p className="text-sm text-muted">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Email Verified!</h2>
              <p className="text-sm text-muted mb-6">
                Your email has been verified successfully. You can now sign in to
                your account.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Sign In
              </Link>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <XCircle className="w-12 h-12 text-danger mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                Verification Failed
              </h2>
              <p className="text-sm text-muted mb-6">{errorMsg}</p>
              <Link
                href="/register"
                className="text-sm text-accent-light hover:underline font-medium"
              >
                Try registering again
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-accent-light" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
