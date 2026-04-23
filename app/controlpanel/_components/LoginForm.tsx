"use client";

import { useState } from "react";
import { loginAction } from "@/lib/admin/actions";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result && "error" in result) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-widest text-cp-muted mb-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full bg-cp-surface border border-cp-border rounded-lg px-4 py-3 text-sm text-cp-text placeholder-cp-muted/30 focus:outline-none focus:border-cp-accent transition-colors"
          placeholder="••••••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cp-accent hover:bg-cp-accent-hover disabled:opacity-40 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
