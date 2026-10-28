"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function HomeAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); if (!loading && user) router.replace("/my"); }, [loading, router, user]);
  if (mounted && (loading || user)) return null;
  return children;
}
