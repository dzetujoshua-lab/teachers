import Link from "next/link";
import {
  ArrowRight,
  QrCode,
  MapPin,
  ShieldCheck,
  UtensilsCrossed,
  BarChart3,
  Bell,
  Building2,
  GraduationCap,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Counter } from "@/components/dashboard/counter";

const features = [
  { icon: QrCode, title: "Live attendance", body: "QR, PIN, GPS, ID scan and biometric-ready check-in with automatic timestamps." },
  { icon: MapPin, title: "Campus location tracking", body: "Building occupancy, geofencing, and a live heatmap of attendance activity." },
  { icon: ShieldCheck, title: "Fraud prevention", body: "GPS spoof detection, duplicate-device fingerprinting, and full audit logs." },
  { icon: UtensilsCrossed, title: "Meal operations", body: "Capture pepper / pepper-free / alternative meals during attendance, in real time." },
  { icon: BarChart3, title: "Real-time analytics", body: "Department comparisons, trends, and AI insights updated as attendance happens." },
  { icon: Bell, title: "Smart notifications", body: "Low-attendance alerts, meal confirmations, and emergency broadcasts." },
];

const stats = [
  { label: "Institutions", value: 48 },
  { label: "Students managed", value: 186000 },
  { label: "Daily requests", value: 4200000 },
  { label: "Uptime", value: 99.98, suffix: "%", format: false },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#platform" className="hover:text-foreground">Platform</a>
            <a href="#stats" className="hover:text-foreground">Why us</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Live demo</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center">
          <Badge variant="default" className="mx-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Enterprise campus operations
          </Badge>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            The operating system for{" "}
            <span className="bg-gradient-to-r from-amber-400 to-wine-500 bg-clip-text text-transparent">
              modern campuses
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Track live attendance, monitor your campus, prevent fraud, and run meal
            operations — all from one real-time platform built for institutions.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button size="lg">
                Explore the platform <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">Book a demo</Button>
            </Link>
          </div>

          {/* Floating preview */}
          <Card className="glass mx-auto mt-16 max-w-4xl overflow-hidden p-2 shadow-2xl">
            <div className="rounded-lg border border-border bg-card/60 p-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { l: "Present", v: "7,742", c: "text-amber-500" },
                  { l: "Attendance", v: "91.4%", c: "text-emerald-400" },
                  { l: "Live sessions", v: "186", c: "text-wine-400" },
                  { l: "Flagged", v: "4", c: "text-red-400" },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg border border-border bg-background/50 p-4 text-left">
                    <p className={`text-2xl font-semibold tabular-nums ${s.c}`}>{s.v}</p>
                    <p className="text-xs text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-border bg-card/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                <Counter to={s.value} suffix={s.suffix} format={s.format} />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything campus operations need
          </h2>
          <p className="mt-3 text-muted-foreground">
            One platform replacing spreadsheets, paper registers, and disconnected tools.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="group p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-charcoal-950">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Platform / roles */}
      <section id="platform" className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="wine">Role-aware</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                A tailored workspace for every role
              </h2>
              <p className="mt-3 text-muted-foreground">
                From super admins managing multiple campuses to campus teams coordinating
                operations — every role has a focused, permission-scoped dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Super Admin", "Campus Admin", "Facilitator", "Kitchen Manager", "Security Officer"].map((r) => (
                  <span key={r} className="rounded-lg border border-border bg-background/50 px-3 py-1.5 text-sm">
                    {r}
                  </span>
                ))}
              </div>
              <Link href="/dashboard" className="mt-8 inline-block">
                <Button>
                  Open the demo <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Building2, t: "Multi-campus", d: "Manage every site centrally" },
                { icon: GraduationCap, t: "Role-based control", d: "Secure workflows for every campus team" },
                { icon: BarChart3, t: "AI insights", d: "Predictive attendance trends" },
                { icon: ShieldCheck, t: "Audit-ready", d: "Every action logged" },
              ].map((c) => (
                <Card key={c.t} className="p-5">
                  <c.icon className="size-5 text-wine-400" />
                  <p className="mt-3 font-medium">{c.t}</p>
                  <p className="text-xs text-muted-foreground">{c.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <Card className="relative overflow-hidden gradient-wine p-12 text-center text-white">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Transform your campus operations
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">
              See SmartCampus Attend live — no setup required.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link href="/dashboard">
                <Button size="lg" variant="default">
                  Start exploring <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Book a demo
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SmartCampus Attend. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}