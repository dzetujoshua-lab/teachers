"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { updatePassword } from "firebase/auth";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { USE_MOCK } from "@/lib/firebase/config";

export default function ChangePasswordPage() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      if (USE_MOCK) {
        setSuccess("Password updated in demo mode.");
        setTimeout(() => router.push("/dashboard"), 1200);
        return;
      }

      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        setError("Please sign in again before changing your password.");
        return;
      }

      await updatePassword(auth.currentUser, password);
      setSuccess("Password changed successfully. Redirecting to your dashboard...");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen items-center bg-background px-6 py-12 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Change your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set a new password to secure your account. This is required after a temporary reset.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              showPasswordToggle
            />
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              showPasswordToggle
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-emerald-400">{success}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
