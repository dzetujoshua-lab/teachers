"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";

function isFirebaseError(error: unknown): error is { code: string; message: string } {
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
}
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { ROLE_LABELS } from "@/lib/roles";
import { createPlatformUserId } from "@/lib/user-ids";
import type { Role } from "@/lib/types";

interface RoleLoginClientProps {
  role: Role;
}

export function RoleLoginClient({ role }: RoleLoginClientProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [institutionId, setInstitutionId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function createSession(idToken: string) {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Unable to create a secure session.");
    }
  }

  // Validate email format
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  function validatePassword(pwd: string): string | null {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number.";
    }
    return null;
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      if (!isValidEmail(email)) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }

      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      if (!auth || !db) {
        setError("Firebase is not configured. Check your environment variables.");
        setLoading(false);
        return;
      }

      console.log("onLogin: attempting signInWithEmailAndPassword for", email);
      const credential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      console.log("onLogin: signIn succeeded", credential.user.uid);
      const token = await credential.user.getIdToken();
      console.log("onLogin: obtained idToken (trimmed)", token?.slice?.(0, 8));

      // Create a secure server-side session first to avoid client Firestore permission
      // issues (server will read the profile using admin privileges and redirect appropriately).
      console.log("onLogin: creating server session");
      await createSession(token);
      console.log("onLogin: server session created");

      // Redirect directly to the correct dashboard path to avoid extra redirects or 404s
      setStatus(`Signed in as ${credential.user.uid}. Redirecting...`);
      if (role === "facilitator") {
        router.push(`/dashboard/facilitator/${credential.user.uid}`);
      } else {
        router.push(`/dashboard/${role}`);
      }
    } catch (err) {
      console.error("Login request failed:", err);
      if (isFirebaseError(err)) {
        if (err.code === "auth/user-not-found") {
          setError("No account found with that email.");
        } else if (err.code === "auth/wrong-password") {
          setError("Incorrect password.");
        } else if (err.code === "auth/too-many-requests") {
          setError("Too many failed login attempts. Try again later.");
        } else if (err.code === "auth/permission-denied") {
          setError("Permission denied. Confirm your Firebase security rules and auth claims.");
        } else {
          setError(`Firebase auth error: ${err.code}. ${err.message}`);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : "Unable to sign in.";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      if (!name.trim()) {
        setError("Please enter your full name.");
        setLoading(false);
        return;
      }

      if (!isValidEmail(email)) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      if (!auth || !db) {
        setError("Firebase is not configured. Check your environment variables.");
        setLoading(false);
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const uid = credential.user.uid;
      const platformUserId = createPlatformUserId(role, uid);
      const avatarColor = role === "super_admin" || role === "kitchen_manager" || role === "security_officer" ? "#c52a58" : "#f59e0b";

      await updateProfile(credential.user, { displayName: name.trim() });
      
      await setDoc(doc(db, "profiles", uid), {
        uid,
        platformUserId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        department: department.trim() || null,
        institutionId: institutionId.trim() || "accra-main-campus",
        avatarColor,
        forcePasswordReset: false,
        authProvider: "password",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, "roleUsers", role, "users", uid), {
        uid,
        platformUserId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        department: department.trim() || null,
        institutionId: institutionId.trim() || "accra-main-campus",
        createdAt: serverTimestamp(),
      });

      const token = await credential.user.getIdToken(true);
      await createSession(token);

      setStatus(`Account created with ID ${platformUserId}. Redirecting...`);
      if (role === "facilitator") {
        router.push(`/dashboard/facilitator/${platformUserId}`);
      } else {
        router.push(`/dashboard/${role}`);
      }
    } catch (err) {
      console.error("Signup request failed:", err);
      if (isFirebaseError(err)) {
        if (err.code === "auth/email-already-in-use") {
          setError("An account with that email already exists.");
        } else if (err.code === "auth/weak-password") {
          setError("Password is too weak. Use at least 8 characters with uppercase and numbers.");
        } else if (err.code === "auth/invalid-email") {
          setError("Invalid email format.");
        } else {
          setError(`Firebase auth error: ${err.code}. ${err.message}`);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : "Unable to create account.";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Sign in" : "Create account"} as {ROLE_LABELS[role]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every {ROLE_LABELS[role]} account gets a Firebase profile and a unique platform ID.
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setStatus(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                mode === "login" ? "bg-amber-500 text-charcoal-950" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setStatus(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                mode === "signup" ? "bg-amber-500 text-charcoal-950" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={mode === "login" ? onLogin : onSignup} className="mt-4 space-y-3">
            {mode === "signup" && (
              <>
                <Input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
<Input
                  type="text"
                  placeholder="Department / unit"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={loading}
                />
                <Input
                  type="text"
                  placeholder="Institution ID"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  required
                  disabled={loading}
                />
              </>
            )}
            <Input
              type="email"
              placeholder="you@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              showPasswordToggle
            />
            {mode === "signup" && (
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                showPasswordToggle
              />
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
            {status && <p className="text-xs text-emerald-400">{status}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "login" ? (
                <ArrowRight className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {mode === "login" ? "Continue" : "Create account"}
            </Button>
          </form>
        </div>
      </div>

      <div className="relative hidden overflow-hidden gradient-wine lg:block">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative flex h-full flex-col justify-center px-12 text-white">
          <h2 className="max-w-md text-3xl font-semibold leading-tight">{ROLE_LABELS[role]} Access</h2>
          <p className="mt-4 max-w-md text-white/70">
            Secure, role-aware access with dedicated login pages for every campus user.
          </p>
        </div>
      </div>
    </div>
  );
}
