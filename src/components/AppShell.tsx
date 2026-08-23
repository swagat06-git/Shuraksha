import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import * as db from "@/services/firebase";

const CITIZEN_NAV = [
  { to: "/citizen", label: "Dashboard" },
  { to: "/report", label: "Report incident" },
  { to: "/my-reports", label: "My reports" },
] as const;

const AUTHORITY_NAV = [
  { to: "/authority", label: "Operations" },
  { to: "/citizen", label: "Live incidents" },
] as const;

export function AppShell({ children, fullBleed = false }: { children: ReactNode; fullBleed?: boolean }) {
  const { user } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = user?.role === "authority" ? AUTHORITY_NAV : CITIZEN_NAV;

  async function handleSignOut() {
    await db.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-[1000] border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4">
          <Link to="/" aria-label="Shuraksha home">
            <Logo />
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-primary/10 text-primary" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-right text-xs leading-tight sm:block">
                  <span className="block font-semibold">{user.displayName}</span>
                  <span className="block capitalize text-muted-foreground">{user.role}</span>
                </span>
                <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
                  <LogOut className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/report">Report now</Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={open}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>

        {open ? (
          <nav className="border-t border-border bg-card px-4 py-2 md:hidden" aria-label="Mobile">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-primary/10 text-primary" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className={cn("flex-1", fullBleed ? "" : "mx-auto w-full max-w-7xl px-4 py-6 md:py-10")}>
        {children}
      </main>
    </div>
  );
}
