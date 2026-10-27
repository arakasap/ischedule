"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const ALLOWED_DOMAIN = "@kmitl.ac.th";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isAllowed(user: User) {
  return user.email?.toLowerCase().endsWith(ALLOWED_DOMAIN) ?? false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(client));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;
    const acceptSession = async (session: Session | null) => {
      const nextUser = session?.user ?? null;
      if (nextUser && !isAllowed(nextUser)) {
        await client.auth.signOut();
        if (active) {
          setUser(null);
          setError("ระบบนี้อนุญาตเฉพาะบัญชี Google ของ KMITL (@kmitl.ac.th) เท่านั้น");
        }
        return;
      }
      if (active) {
        setUser(nextUser);
        setError("");
        setLoading(false);
      }
    };

    void client.auth.getSession().then(({ data }) => acceptSession(data.session));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { void acceptSession(session); });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    configured: Boolean(client),
    error,
    async signInWithGoogle() {
      if (!client) {
        setError("ยังไม่ได้ตั้งค่า Supabase Auth กรุณาใส่ค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY");
        return;
      }
      setError("");
      const { error: authError } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
          queryParams: { hd: "kmitl.ac.th", prompt: "select_account" },
        },
      });
      if (authError) setError(authError.message);
    },
    async signOut() {
      if (client) await client.auth.signOut();
      setUser(null);
    },
  }), [client, error, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
