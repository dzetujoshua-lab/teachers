import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="text-center">
        <Logo className="mx-auto justify-center" />
        <p className="mt-8 text-6xl font-semibold tracking-tight text-amber-500">404</p>
        <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/">
            <Button>Back home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Open dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
