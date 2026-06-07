"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SUPPORTED_ROLES = ALL_ROLES.filter((role) => role !== "super_admin");

export default function SuperAdminSettingsPage() {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<string>(SUPPORTED_ROLES[0]);
  const [temporaryPassword, setTemporaryPassword] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (!email || !temporaryPassword) {
      setError("Both email and temporary password are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/temp-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, temporaryPassword }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Unable to create temporary login.");
        return;
      }

      setStatus("Temporary user credential created. User will be forced to change password on next login.");
      setEmail("");
      setTemporaryPassword("");
      setTimeout(() => router.refresh(), 200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">User security</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create or reset a temporary password for campus users. The next time they log in,
          they will be redirected to change their password.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">User email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@campus.edu"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Role</label>
          <select
            className={cn(
              "h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200",
              "text-foreground"
            )}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {SUPPORTED_ROLES.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {ROLE_LABELS[roleOption as keyof typeof ROLE_LABELS]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">Temporary password</label>
          <Input
            type="text"
            value={temporaryPassword}
            onChange={(e) => setTemporaryPassword(e.target.value)}
            placeholder="TempPass1234"
            required
          />
        </div>

        {error && <p className="sm:col-span-2 text-sm text-red-400">{error}</p>}
        {status && <p className="sm:col-span-2 text-sm text-emerald-400">{status}</p>}

        <div className="sm:col-span-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            Create temporary login
          </Button>
        </div>
      </form>
    </div>
  );
}
