"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function PasswordChange() {
  const [pw, setPw] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function update(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setPw("");
      setStatus("success");
    }
  }

  return (
    <section className="card max-w-md space-y-3">
      <h2 className="h-card">Security</h2>
      <form onSubmit={update} className="space-y-2">
        <label className="block text-sm">New password
          <input
            className="field"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </label>
        <button className="btn" disabled={status === "submitting"}>
          {status === "submitting" ? "Updating..." : "Update password"}
        </button>
      </form>
      {status === "success" && <p className="text-sm text-good">Password updated successfully.</p>}
      {status === "error" && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}
