/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuthStore } from "@/store";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const PERKS = [
  { title: "Track every order", sub: "Real-time updates across Bangladesh" },
  { title: "Pay your way", sub: "bKash, Rocket, Nagad, Cash On Delivery" },
  { title: "Exclusive member deals", sub: "Early access to sales and offers" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName, form.phone);
      toast.success("Account created!");
      router.push("/");
    } catch (error) {
      const err = error as any;
      toast.error(err.response?.data?.error || "Registration failed");
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
          <span className="text-[#c9a96e] text-[13px] font-medium tracking-[0.14em] uppercase [font-family:'DM_Sans',sans-serif]">
            ShopVerse BD
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 flex flex-col gap-6 py-10">
          <p className="flex items-center gap-2.5 text-[#c9a96e] text-[11px] tracking-[0.18em] uppercase font-normal">
            <span className="inline-block w-7 h-px bg-[#c9a96e]" />
            Join us today
          </p>
          <h1 className="text-[clamp(3rem,5.5vw,4.75rem)] font-normal leading-[1.08] tracking-[-0.02em] text-[#f5f0e8] [font-family:'Instrument_Serif',serif] m-0">
            Your journey
            <br />
            <em className="italic text-[#c9a96e]">starts here.</em>
          </h1>
          <p className="text-[15px] font-light leading-[1.8] text-[#a09a8e] max-w-[320px] [font-family:'DM_Sans',sans-serif]">
            Create a free account and unlock the full ShopVerse experience —
            faster checkout, order tracking, and exclusive deals.
          </p>
        </div>

        {/* Perks list */}
        <ul className="relative z-10 flex flex-col gap-4 list-none m-0 p-0">
          {PERKS.map((perk) => (
            <li key={perk.title} className="flex items-start gap-3">
              <div className="w-7 h-7 flex-shrink-0 rounded-[6px] bg-[#1d1b18] border border-[#2a2824] flex items-center justify-center mt-0.5">
                <Check className="w-[13px] h-[13px] text-[#c9a96e] stroke-[2.5]" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium text-[#f5f0e8] leading-snug [font-family:'DM_Sans',sans-serif]">
                  {perk.title}
                </span>
                <span className="text-[12px] font-light text-[#6b6560] leading-snug [font-family:'DM_Sans',sans-serif]">
                  {perk.sub}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex flex-col items-center justify-center min-h-screen lg:min-h-0 bg-[#faf8f5] px-6 py-14 lg:px-16">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-[5px] rounded-full bg-[#f0e9db] border border-[#e0d5c4] text-[#8b7355] text-[11px] font-medium tracking-[0.12em] uppercase mb-5 [font-family:'DM_Sans',sans-serif]">
              <span className="w-[5px] h-[5px] rounded-full bg-[#c9a96e]" />
              Free forever
            </span>
            <h2 className="text-[2.4rem] font-normal leading-[1.15] tracking-[-0.02em] text-[#1a1916] [font-family:'Instrument_Serif',serif] m-0 mb-1.5">
              Create account
            </h2>
            <p className="text-[14px] font-light text-[#8a8278] m-0 leading-relaxed [font-family:'DM_Sans',sans-serif]">
              Takes less than a minute to get started.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name + Phone — two column row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#6b6258] [font-family:'DM_Sans',sans-serif]">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#b0a898] pointer-events-none" />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    placeholder="Your name"
                    required
                    className="w-full h-[50px] pl-9 pr-3 bg-white border-[1.5px] border-[#e8e2d9] rounded-[10px] text-[13px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all duration-150 focus:border-[#c9a96e] focus:ring-[3px] focus:ring-[#c9a96e]/10 [font-family:'DM_Sans',sans-serif]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#6b6258] [font-family:'DM_Sans',sans-serif]">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#b0a898] pointer-events-none" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="+880 17…"
                    className="w-full h-[50px] pl-9 pr-3 bg-white border-[1.5px] border-[#e8e2d9] rounded-[10px] text-[13px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all duration-150 focus:border-[#c9a96e] focus:ring-[3px] focus:ring-[#c9a96e]/10 [font-family:'DM_Sans',sans-serif]"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#6b6258] [font-family:'DM_Sans',sans-serif]">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#b0a898] pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  className="w-full h-[50px] pl-10 pr-4 bg-white border-[1.5px] border-[#e8e2d9] rounded-[10px] text-[14px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all duration-150 focus:border-[#c9a96e] focus:ring-[3px] focus:ring-[#c9a96e]/10 [font-family:'DM_Sans',sans-serif]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#6b6258] [font-family:'DM_Sans',sans-serif]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#b0a898] pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full h-[50px] pl-10 pr-11 bg-white border-[1.5px] border-[#e8e2d9] rounded-[10px] text-[14px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all duration-150 focus:border-[#c9a96e] focus:ring-[3px] focus:ring-[#c9a96e]/10 [font-family:'DM_Sans',sans-serif]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0a898] hover:text-[#6b6258] transition-colors duration-150 p-1"
                >
                  {showPass ? (
                    <EyeOff className="w-[15px] h-[15px]" />
                  ) : (
                    <Eye className="w-[15px] h-[15px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full h-[52px] mt-1 bg-[#1a1916] hover:bg-[#2d2b28] disabled:opacity-60 disabled:cursor-not-allowed rounded-[10px] flex items-center justify-center gap-2.5 text-[14px] font-medium tracking-[0.04em] text-[#f5f0e8] overflow-hidden transition-all duration-150 hover:-translate-y-px active:translate-y-0 [font-family:'DM_Sans',sans-serif]"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#c9a96e]/15 pointer-events-none" />
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-[#f5f0e8]/30 border-t-[#f5f0e8] animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-[15px] h-[15px]" />
                </>
              )}
            </button>

            {/* Terms */}
            <p className="text-center text-[11px] text-[#b0a898] leading-relaxed [font-family:'DM_Sans',sans-serif]">
              By signing up you agree to our{" "}
              <Link
                href="/terms"
                className="text-[#8a8278] underline underline-offset-2 hover:text-[#1a1916] transition-colors duration-150"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-[#8a8278] underline underline-offset-2 hover:text-[#1a1916] transition-colors duration-150"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center">
            <p className="text-[13px] text-[#8a8278] [font-family:'DM_Sans',sans-serif]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#1a1916] font-medium border-b border-[#c9a96e] hover:opacity-70 transition-opacity duration-150"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
