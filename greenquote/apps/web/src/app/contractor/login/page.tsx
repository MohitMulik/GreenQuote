"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@greenquote/ui";
import { apiFetch } from "@/lib/api";

export default function ContractorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mfaToken) {
        const res = await apiFetch("/v1/auth/mfa/verify", {
          method: "POST",
          body: JSON.stringify({ mfaToken, code }),
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.message ?? "MFA verification failed.");
        }
        router.push("/contractor/pipeline");
        return;
      }

      const res = await apiFetch("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message ?? "Sign-in failed.");
      }
      if (body.mfaRequired) {
        setMfaToken(body.mfaToken);
        return;
      }
      router.push("/contractor/pipeline");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contractor sign in</h1>
        <p className="mt-1 text-sm text-slate-600">
          Email and password, then authenticator MFA. Session is stored in an httpOnly cookie.
        </p>
      </div>
      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          {!mfaToken ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <Input
                  className="mt-1"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Password
                <Input
                  className="mt-1"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </>
          ) : (
            <label className="block text-sm font-medium text-slate-700">
              Authenticator code
              <Input
                className="mt-1"
                inputMode="numeric"
                pattern="\d{6}"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Please wait…" : mfaToken ? "Verify MFA" : "Continue"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
