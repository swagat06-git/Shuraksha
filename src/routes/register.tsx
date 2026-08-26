import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import type { UserRole } from "@/lib/types";
import * as db from "@/services/firebase";


export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Shuraksha" },
      {
        name: "description",
        content:
          "Create a Shuraksha account to report hazards or coordinate disaster response.",
      },
      { property: "og:title", content: "Create account — Shuraksha" },
      {
        property: "og:description",
        content:
          "Join Shuraksha as a citizen reporter or a response authority.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const role: UserRole = "citizen";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <Card className="w-full max-w-md shadow-lift">
        <CardHeader className="items-center text-center">
          <Link to="/" className="mb-2">
            <Logo showTagline />
          </Link>

          <CardTitle className="font-display text-2xl">
            Create your account
          </CardTitle>

          <CardDescription>
            Report hazards or coordinate response teams.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <Tabs value="citizen">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="citizen">Citizen</TabsTrigger>
            </TabsList>
          </Tabs>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);

              try {
                await db.signUp(
                  email,
                  password,
                  name || "User",
                  role,
                  phone,
                );

                toast.success("Account created");

                navigate({
                  to: "/citizen",
                });
              } catch (error) {
                console.error("Failed to create account:", error);

                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to create account.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Mobile phone number</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91XXXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              {busy ? "Creating account..." : "Create citizen account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}