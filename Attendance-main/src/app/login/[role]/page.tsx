"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LogIn, PlusCircle } from "lucide-react";
import Link from "next/link";
import { addDoc, collection, doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { FIREBASE_SESSION_COOKIE } from "@/lib/firebase/config";
import { ALL_ROLES, ROLE_LABELS, ROLES } from "@/lib/roles";
import type { Role } from "@/lib/types";

interface RoleLoginPageProps {
  params: {
    role: string;
  };
}

function setSessionCookie(token: string) {
  document.cookie = `${FIREBASE_SESSION_COOKIE}=${token}; path=/; max-age=3600; samesite=lax`;
}

export default function RoleLoginPage({ params }: RoleLoginPageProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [name, setName] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const role = params.role as Role;
  const roleConfig = ROLES[role];

  if (!ALL_ROLES.includes(role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
        <div className="rounded-2xl border border-border bg-card px-10 py-12 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Invalid role</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a valid role from the login landing page.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
            Back to login options
          </Link>
        </div>
      </div>
    );
  }

  async function writeAuthActivity(db: Firestore, uid: string, action: "login" | "signup") {
    await addDoc(collection(db, "loginEvents"), {
      userId: uid,
      role,
      action,
      email,
      name,
      time: new Date().toISOString(),
    });
  }

  async function writeWelcomeNotification(db: Firestore, title: string, body: string) {
    await addDoc(collection(db, "notifications"), {
      title,
      body,
      type: "system",
      time: new Date().toISOString(),
      read: false,
    });
  }

  // ==========================================
  // UPDATED ONSUBMIT FUNCTION PLACED HERE
  // ==========================================
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();

      if (!auth || !db) {
        setError("Firebase is not configured. Check your environment variables.");
        return;
      }

      const firebaseDb = db as Firestore;

      if (mode === "login") {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const token = await credential.user.getIdToken();
        
        // Fix: Set cookie directly on the client side
        setSessionCookie(token);

        const profileSnapshot = await getDoc(doc(firebaseDb, "profiles", credential.user.uid));
        const profile = profileSnapshot.data() as { role?: Role; forcePasswordReset?: boolean; name?: string } | undefined;

        if (!profile?.role) {
          setError("Your account does not have a platform profile yet.");
          return;
        }

        await writeAuthActivity(firebaseDb, credential.user.uid, "login");
        await writeWelcomeNotification(
          firebaseDb,
          `Welcome back, ${profile.name ?? ROLE_LABELS[profile.role]}`,
          `Logged in successfully to your ${ROLE_LABELS[profile.role]} dashboard.`
        );

        if (profile.forcePasswordReset) {
          router.push("/change-password");
          return;
        }

        router.push(`/dashboard/${profile.role}`);
      } else {
        if (!name.trim()) {
          setError("Please enter your name to create an account.");
          return;
        }

        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });

        await setDoc(doc(firebaseDb, "profiles", credential.user.uid), {
          email,
          name,
          role,
          department: department || undefined,
          avatarColor: "#c52a58",
          forcePasswordReset: false,
          createdAt: new Date().toISOString(),
        });

        await writeAuthActivity(firebaseDb, credential.user.uid, "signup");
        await writeWelcomeNotification(
          firebaseDb,
          `Welcome to SmartCampus Attend, ${name}`,
          `Your ${ROLE_LABELS[role]} account has been created successfully.`
        );

        const token = await credential.user.getIdToken();
        
        // Fix: Set cookie directly here too
        setSessionCookie(token);
        
        router.push(`/dashboard/${role}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete the request.");
    } finally {
      setLoading(false);
    }
  }

  const accentClass = roleConfig.accent === "wine" ? "text-wine-500" : "text-amber-500";
  const actionButtonClass = roleConfig.accent === "wine" ? "bg-wine-500 hover:bg-wine-600" : "bg-amber-500 hover:bg-amber-600";

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
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className={`text-sm font-semibold ${accentClass}`}>{roleConfig.label}</p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {mode === "login" ? "Sign in" : "Create account"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{roleConfig.tagline}</p>
            </div>
            <div className="flex gap-2">
              <Button variant={mode === "login" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("login")}> 
                <LogIn className="size-4" />
                Login
              </Button>
              <Button variant={mode === "register" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("register")}> 
                <PlusCircle className="size-4" />
                Sign up
              </Button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            {mode === "register" && (
              <>
                <Input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Department (optional)"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </>
            )}
            <Input
              type="email"
              placeholder="you@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {mode === "register" && (
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button type="submit" className={`w-full ${actionButtonClass}`} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              {mode === "login" ? "Continue to dashboard" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                <Link href="/reset-password" className="text-amber-500 hover:underline">Forgot password?</Link>
                <button type="button" className="text-amber-500 hover:underline" onClick={() => setMode("register")}>Create account</button>
              </>
            ) : (
              <>
                <button type="button" className="text-amber-500 hover:underline" onClick={() => setMode("login")}>Already have an account?</button>
                <Link href="/login" className="text-amber-500 hover:underline">Back to role list</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden gradient-wine lg:block">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative flex h-full flex-col justify-center px-12 text-white">
          <h2 className="max-w-md text-3xl font-semibold leading-tight">{ROLE_LABELS[role]} workspace</h2>
          <p className="mt-4 max-w-md text-white/70">
            Access your personalized campus dashboard with secure authentication and real-time Firestore data.
          </p>
        </div>
      </div>
    </div>
  );
}