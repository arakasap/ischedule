"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SchedulePage } from "@/components/schedule-page";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace("/my");
  }, [loading, router, user]);

  if (loading || user) return null;
  return <SchedulePage />;
}
