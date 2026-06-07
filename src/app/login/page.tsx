import Link from "next/link";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";

export const metadata = { title: "Choose your login page" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-6 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-medium text-amber-500 tracking-wide uppercase">Role-based access</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose your role portal</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Every campus role has a dedicated login and signup flow backed by Firebase Auth and Firestore profiles.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_ROLES.map((role) => (
            <Link 
              key={role} 
              href={`/login/${role}`}
              className={cn(
                "group rounded-3xl border border-border bg-card/50 p-6 backdrop-blur-sm transition-all duration-300",
                "hover:-translate-y-1 hover:border-amber-500/30 hover:bg-gradient-to-b hover:from-card hover:to-amber-500/[0.02]",
                "hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]",
                "flex flex-col justify-between gap-6 min-h-[160px]"
              )}
            >
              <div>
                <p className="text-sm font-semibold tracking-tight transition-colors group-hover:text-amber-500">
                  {ROLE_LABELS[role]}
                </p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  {role.replace("_", " ")} Portal
                </p>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/80 transition-transform duration-300 group-hover:translate-x-1">
                Open portal →
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}