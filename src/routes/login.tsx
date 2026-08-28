import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppUser, UserRole } from "@/lib/types";
import * as db from "@/services/firebase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Shuraksha" },
      {
        name: "description",
        content:
          "Sign in to Shuraksha to report incidents or coordinate response resources.",
      },
      { property: "og:title", content: "Sign in — Shuraksha" },
      {
        property: "og:description",
        content: "Access the Shuraksha citizen app or authority console.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function go(userPromise: Promise<AppUser>) {
  setBusy(true);

  try {
    const authenticatedUser = await userPromise;

    toast.success("Signed in");

    navigate({
      to:
        authenticatedUser.role === "authority"
          ? "/authority"
          : "/citizen",
    });
  } catch (error) {
    console.error("Sign-in failed:", error);

    toast.error(
      error instanceof Error
        ? error.message
        : "Sign-in failed.",
    );
  } finally {
    setBusy(false);
  }
}

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <Card className="w-full max-w-md shadow-lift">
        <CardHeader className="items-center text-center">
          <Link to="/" className="mb-2">
            <Logo showTagline />
          </Link>

          <CardTitle className="font-display text-2xl">
            Welcome back
          </CardTitle>

          <CardDescription>
            Sign in to continue to your response console.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <Tabs
            value={role}
            onValueChange={(value) => {
              setRole(value as UserRole);
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="citizen">
                Citizen
              </TabsTrigger>

              <TabsTrigger value="authority">
                Authority
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();

              void go(
                db.signIn(
                  email,
                  password,
                  role,
                ),
              );
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">
                Email
              </Label>

              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  Password
                </Label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={busy}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={busy}
            >
              {busy
                ? "Signing in..."
                : `Sign in as ${role}`}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}