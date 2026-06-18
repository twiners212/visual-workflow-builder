"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Network, ArrowRight, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await authClient.signIn.email({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Failed to sign in. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-low min-h-screen flex items-center justify-center font-body-lg text-on-surface antialiased p-lg">
      <main className="w-full max-w-md mx-auto">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] p-xl">
          {/* Logo & Brand */}
          <div className="flex flex-col items-center mb-xl text-center">
            <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center mb-md">
              <Network className="w-6 h-6 text-on-primary-container" />
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              VisualFlow
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
              Sign in to continue to Workflow Builder
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-lg p-md bg-error-container border border-error text-error text-body-md rounded-lg flex items-center gap-sm">
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-lg">
            {/* Email Input */}
            <div className="flex flex-col gap-xs">
              <label
                className="font-label-md text-label-md text-on-surface font-semibold"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow placeholder:text-on-surface-variant/30"
                id="email"
                name="email"
                placeholder="developer@company.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-xs">
              <div className="flex items-center justify-between">
                <label
                  className="font-label-md text-label-md text-on-surface font-semibold"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link
                  className="font-body-md text-body-md text-primary hover:text-primary-container transition-colors text-sm"
                  href="#"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              className="w-full bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary font-body-lg text-body-lg font-medium py-sm px-md rounded transition-colors flex items-center justify-center gap-sm disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-[18px] h-[18px]" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-xl text-center border-t border-outline-variant pt-lg">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <Link
                className="text-primary hover:text-primary-container font-medium transition-colors"
                href="/register"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
