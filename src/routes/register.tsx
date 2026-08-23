import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRole } from "@/lib/types";
import * as db from "@/services/firebase";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Shuraksha" },
      { name: "description", content: "Create a Shuraksha account to report hazards or coordinate disaster response." },
      { property: "og:title", content: "Create account — Shuraksha" },
      { property: "og:description", content: "Join Shuraksha as a citizen reporter or a response authority." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <Card className="w-full max-w-md shadow-lift">
        <CardHeader className="items-center text-center">
          <Link to="/" className="mb-2">
            <Logo showTagline />
          </Link>
          <CardTitle className="font-display text-2xl">Create your account</CardTitle>
          <CardDescription>Report hazards or coordinate response teams.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="citizen">Citizen</TabsTrigger>
              <TabsTrigger value="authority">Authority</TabsTrigger>
            </TabsList>
          </Tabs>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await db.signUp(email || `demo.${role}@shuraksha.in`, name || "Demo User", role);
                toast.success("Account created");
                navigate({ to: role === "authority" ? "/authority" : "/citizen" });
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              Create {role} account
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={async () => {
              await db.signInWithGoogle(role);
              navigate({ to: role === "authority" ? "/authority" : "/citizen" });
            }}
          >
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
