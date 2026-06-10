"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { ROLE_LABELS } from "@/lib/roles";
import { createPlatformUserId } from "@/lib/user-ids";
import type { Role } from "@/lib/types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

async function mockCreateSession(idToken: string) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Unable to create a secure session.");
  }
}

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

      if (USE_MOCK) {
        const { loginMockUser, createMockSession } = await import("@/lib/firebase/mock");
        let user;
        try {
          user = loginMockUser(email, password);
        } catch (err) {
          const error = err as Error;
          if (error.message === "user-not-found") {
            setError("No account found with that email.");
          } else if (error.message === "wrong-password") {
            setError("Incorrect password.");
          } else {
            setError(error.message || "Unable to sign in.");
          }
          setLoading(false);
          return;
        }
        if (user.role !== role) {
          setError(`This account belongs to ${ROLE_LABELS[user.role]}. Use that role's login page.`);
          setLoading(false);
          return;
        }
        const token = createMockSession(user);
        await mockCreateSession(token);
        setStatus(`Signed in as ${user.platformUserId}. Redirecting...`);
        if (user.role === "facilitator") {
          router.push(`/dashboard/facilitator/${user.platformUserId}`);
        } else {
          router.push(`/dashboard/${user.role}`);
        }
        return;
      }

      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      if (!auth || !db) {
        setError("Firebase is not configured. Check your environment variables.");
        setLoading(false);
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const token = await credential.user.getIdToken();

      const profileSnapshot = await getDoc(doc(db, "profiles", credential.user.uid));
      const profile = profileSnapshot.data() as { role?: Role; forcePasswordReset?: boolean; platformUserId?: string } | undefined;

      if (!profile?.role) {
        setError("Your account does not have a platform profile yet.");
        setLoading(false);
        return;
      }

      if (profile.role !== role) {
        setError(`This account belongs to ${ROLE_LABELS[profile.role]}. Use that role's login page.`);
        setLoading(false);
        return;
      }

      if (profile.forcePasswordReset) {
        router.push("/change-password");
        return;
      }

      await createSession(token);
      setStatus(`Signed in as ${profile.platformUserId ?? credential.user.uid}. Redirecting...`);
      if (profile.role === "facilitator") {
        router.push(`/dashboard/facilitator/${profile.platformUserId ?? credential.user.uid}`);
      } else {
        router.push(`/dashboard/${profile.role}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unable to sign in.";
      // Handle specific Firebase errors
      if (errorMessage.includes("user-not-found")) {
        setError("No account found with that email.");
      } else if (errorMessage.includes("wrong-password")) {
        setError("Incorrect password.");
      } else if (errorMessage.includes("too-many-requests")) {
        setError("Too many failed login attempts. Try again later.");
      } else {
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

      if (USE_MOCK) {
        const { createMockUser, createMockSession } = await import("@/lib/firebase/mock");
        let platformUserId: string;
        try {
          const result = createMockUser({
            name,
            email,
            password,
            role,
            department,
            institutionId,
          });
          platformUserId = result.platformUserId;
        } catch (err) {
          const error = err as Error;
          if (error.message === "email-already-in-use") {
            setError("An account with that email already exists.");
          } else {
            setError(error.message || "Unable to create account.");
          }
          setLoading(false);
          return;
        }
        const mockUser = {
          uid: platformUserId,
          platformUserId,
          email: email.toLowerCase().trim(),
          role,
          name: name.trim(),
          password: "",
          createdAt: new Date().toISOString(),
        };
        const token = createMockSession(mockUser);
        await mockCreateSession(token);
        setStatus(`Account created with ID ${platformUserId}. Redirecting...`);
        if (role === "facilitator") {
          router.push(`/dashboard/facilitator/${platformUserId}`);
        } else {
          router.push(`/dashboard/${role}`);
        }
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
      const errorMessage = err instanceof Error ? err.message : "Unable to create account.";
      // Handle specific Firebase errors
      if (errorMessage.includes("email-already-in-use")) {
        setError("An account with that email already exists.");
      } else if (errorMessage.includes("weak-password")) {
        setError("Password is too weak. Use at least 8 characters with uppercase and numbers.");
      } else if (errorMessage.includes("invalid-email")) {
        setError("Invalid email format.");
      } else {
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
