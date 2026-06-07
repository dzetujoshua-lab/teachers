import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <Image
          src="/images/dti-infrastructure.jpg"
          alt="DTI Attendance Platform"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Welcome to the DTI Attendance Platform
          </h1>
<p className="mt-6 max-w-2xl text-balance text-lg text-white/80">
             Track, manage, and monitor attendance with ease
           </p>
           <Link href="/login" className="mt-8">
             <Button size="lg">Get Started</Button>
           </Link>
         </div>
      </section>
    </div>
  );
}