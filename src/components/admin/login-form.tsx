"use client";

import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/fields";
import type { ActionState } from "@/lib/types";

const initial: ActionState = { ok: false, message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="mt-1" />
      </div>
      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
