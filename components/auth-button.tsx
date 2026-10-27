"use client";

import { useAuth } from "@/components/auth-provider";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z" />
      <path fill="#34A853" d="M12 21.86c2.63 0 4.84-.87 6.45-2.37l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.72-1.72-5.49-4.04H3.27v2.53A9.74 9.74 0 0 0 12 21.86Z" />
      <path fill="#FBBC05" d="M6.51 13.92A5.86 5.86 0 0 1 6.2 12c0-.67.12-1.32.31-1.92V7.55H3.27A9.86 9.86 0 0 0 2.22 12c0 1.6.38 3.11 1.05 4.45l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.04c1.43 0 2.71.49 3.73 1.46l2.8-2.8C16.84 3.11 14.63 2.14 12 2.14a9.74 9.74 0 0 0-8.73 5.41l3.24 2.53C7.28 7.76 9.45 6.04 12 6.04Z" />
    </svg>
  );
}

export function AuthButton() {
  const { user, loading, configured, signInWithGoogle, signOut } = useAuth();
  if (loading) return <span className="hidden text-xs text-ink-2 sm:inline">กำลังตรวจสอบบัญชี...</span>;
  if (!configured) return <button type="button" onClick={() => void signInWithGoogle()} className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:border-accent hover:text-accent sm:px-3 sm:text-sm">ตั้งค่า Login</button>;
  if (!user) return <button type="button" onClick={() => void signInWithGoogle()} className="inline-flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm ring-1 ring-line transition hover:ring-accent sm:px-3 sm:text-sm"><GoogleIcon />เข้าสู่ระบบ Google</button>;
  return <button type="button" onClick={() => void signOut()} title={user.email ?? "บัญชี KMITL"} className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:border-accent hover:text-accent sm:px-3 sm:text-sm">ออกจากระบบ</button>;
}
