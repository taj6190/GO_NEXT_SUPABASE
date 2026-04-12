"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User as UserIcon, Phone, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 page-enter">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-[var(--text-secondary)]">Join GoNext and start shopping</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input-field pl-10" placeholder="Your name" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field pl-10" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field pl-10" placeholder="+880 1700-000000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field pl-10 pr-10" placeholder="Min 6 characters" required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? "Creating account..." : "Create Account"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--accent-light)] hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
