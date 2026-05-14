"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Paywall from "@/components/Paywall";

function AppContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/subscription")
        .then((res) => res.json())
        .then((data) => {
          setSubStatus(data.status);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else if (status === "unauthenticated") {
      router.replace("/login");
    } else {
      // loading session
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-light" />
          </div>
        </main>
      </>
    );
  }

  // Show paywall if subscription expired
  if (subStatus === "expired" || subStatus === "cancelled") {
    return (
      <>
        <Navbar />
        <main className="flex-1">
          <Paywall />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppContent>{children}</AppContent>
    </SessionProvider>
  );
}
