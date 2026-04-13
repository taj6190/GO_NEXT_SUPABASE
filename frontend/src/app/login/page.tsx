/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuthStore } from "@/store";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (error) {
      const err = error as any;
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0e0d0b]">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#0e0d0b] relative overflow-hidden">
        {/* Geometric SVG background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 600 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <polygon points="0,900 600,400 600,900" fill="#1a1815" />
          <polygon
            points="0,900 600,395 600,412 0,917"
            fill="#c9a96e"
            opacity="0.22"
          />
          <polygon points="600,0 600,230 370,0" fill="#1d1b18" />
          <circle
            cx="460"
            cy="770"
            r="130"
            stroke="#c9a96e"
            strokeWidth="0.75"
            opacity="0.13"
          />
          <circle
            cx="460"
            cy="770"
            r="85"
            stroke="#c9a96e"
            strokeWidth="0.5"
            opacity="0.09"
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="900"
            stroke="#2a2824"
            strokeWidth="1"
          />
          <line
            x1="300"
            y1="0"
            x2="300"
            y2="900"
            stroke="#2a2824"
            strokeWidth="0.5"
            strokeDasharray="4 8"
            opacity="0.35"
          />
        </svg>

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c9a96e]" />
          <span className="text-[#c9a96e] text-[13px] font-medium tracking-[0.14em] uppercase font-['DM_Sans',sans-serif]">
            ShopVerse BD
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 flex flex-col gap-6 py-10">
          <p className="flex items-center gap-2.5 text-[#c9a96e] text-[11px] tracking-[0.18em] uppercase font-normal">
            <span className="inline-block w-7 h-px bg-[#c9a96e]" />
            Your marketplace
          </p>
          <h1 className="text-[clamp(3rem,5.5vw,4.75rem)] font-normal leading-[1.08] tracking-[-0.02em] text-[#f5f0e8] font-['Instrument_Serif',serif] m-0">
            Shop smarter,
            <br />
            <em className="italic text-[#c9a96e]">live better.</em>
          </h1>
          <p className="text-[15px] font-light leading-[1.8] text-[#a09a8e] max-w-[320px] font-['DM_Sans',sans-serif]">
            Discover thousands of products, from everyday essentials to premium
            finds — delivered across Bangladesh.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex items-center gap-0">
          {[
            { num: "50k+", label: "Products" },
            { num: "bKash", label: "& more" },
            { num: "Fast", label: "Delivery" },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center">
              {i > 0 && <div className="w-px h-9 bg-[#2a2824] mx-6" />}
              <div className="flex flex-col gap-0.5">
                <span className="text-[#f5f0e8] text-[1.5rem] leading-none font-['Instrument_Serif',serif]">
                  {s.num}
                </span>
                <span className="text-[#6b6560] text-[11px] uppercase tracking-widest font-normal font-['DM_Sans',sans-serif]">
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex flex-col items-center justify-center min-h-screen lg:min-h-0 bg-[#faf8f5] px-6 py-14 lg:px-16">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-9">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.25 rounded-full bg-[#f0e9db] border border-[#e0d5c4] text-[#8b7355] text-[11px] font-medium tracking-[0.12em] uppercase mb-5 font-['DM_Sans',sans-serif]">
              <span className="w-1.25 h-1.25 rounded-full bg-[#c9a96e]" />
              Secure login
            </span>
            <h2 className="text-[2.4rem] font-normal leading-[1.15] tracking-[-0.02em] text-[#1a1916] font-['Instrument_Serif',serif] m-0 mb-1.5">
              Welcome back
            </h2>
            <p className="text-[14px] font-light text-[#8a8278] m-0 leading-relaxed font-['DM_Sans',sans-serif]">
              Sign in to continue to your account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#6b6258] font-['DM_Sans',sans-serif]">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.75 h-3.75 text-[#b0a898] pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full h-12.5 pl-10 pr-4 bg-white border-[1.5px] border-[#e8e2d9] rounded-[10px] text-[14px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all duration-150 focus:border-[#c9a96e] focus:ring-[3px] focus:ring-[#c9a96e]/10 font-['DM_Sans',sans-serif]"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#6b6258] font-['DM_Sans',sans-serif]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.75 h-3.75 text-[#b0a898] pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-12.5 pl-10 pr-11 bg-white border-[1.5px] border-[#e8e2d9] rounded-[10px] text-[14px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all duration-150 focus:border-[#c9a96e] focus:ring-[3px] focus:ring-[#c9a96e]/10 font-['DM_Sans',sans-serif]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0a898] hover:text-[#6b6258] transition-colors duration-150 p-1"
                >
                  {showPass ? (
                    <EyeOff className="w-3.75 h-3.75" />
                  ) : (
                    <Eye className="w-3.75 h-3.75" />
                  )}
                </button>
              </div>
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-[12px] text-[#c9a96e] hover:opacity-70 transition-opacity duration-150 font-['DM_Sans',sans-serif]"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full h-13 mt-1 bg-[#1a1916] hover:bg-[#2d2b28] disabled:opacity-60 disabled:cursor-not-allowed rounded-[10px] flex items-center justify-center gap-2.5 text-[14px] font-medium tracking-[0.04em] text-[#f5f0e8] overflow-hidden transition-all duration-150 hover:-translate-y-px active:translate-y-0 font-['DM_Sans',sans-serif]"
            >
              <span className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-[#c9a96e]/15 pointer-events-none" />
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-[#f5f0e8]/30 border-t-[#f5f0e8] animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-3.75 h-3.75" />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-7 flex flex-col items-center gap-3">
            <p className="text-[13px] text-[#8a8278] font-['DM_Sans',sans-serif]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[#1a1916] font-medium border-b border-[#c9a96e] hover:opacity-70 transition-opacity duration-150"
              >
                Create one
              </Link>
            </p>

            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-[#e8e2d9]" />
              <span className="text-[11px] text-[#c4bcb2] tracking-[0.06em] uppercase font-['DM_Sans',sans-serif]">
                or
              </span>
              <div className="flex-1 h-px bg-[#e8e2d9]" />
            </div>

            <Link
              href="/products"
              className="flex items-center gap-1 text-[12px] text-[#b0a898] hover:text-[#6b6258] transition-colors duration-150 font-['DM_Sans',sans-serif]"
            >
              Continue as guest
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
