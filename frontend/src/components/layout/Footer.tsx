"use client";

import { Mail, MapPin, Phone, Smartphone } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-dark)] text-white pt-15">
      {/* Main Footer */}
      <div className="site-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                <span className="text-[var(--bg-dark)] font-black text-sm">G</span>
              </div>
              <span className="font-bold text-xl">GoNext</span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-5">
              Your ultimate destination for premium products at great prices. Fast delivery across Bangladesh.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all">
                <Smartphone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { href: "/products", label: "All Products" },
                { href: "/categories", label: "Categories" },
                { href: "/products?featured=true", label: "Featured" },
                { href: "/products?sort_by=created_at&sort_order=desc", label: "New Arrivals" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5">Help & Support</h4>
            <ul className="space-y-3">
              {[
                { href: "/track", label: "Track Order" },
                { href: "/orders", label: "My Orders" },
                { href: "/wishlist", label: "Wishlist" },
                { href: "/login", label: "My Account" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/50">Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-white/40 flex-shrink-0" />
                <span className="text-sm text-white/50">+880 1700-000000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-white/40 flex-shrink-0" />
                <span className="text-sm text-white/50">support@gonext.bd</span>
              </li>
            </ul>

            {/* Payment Methods */}
            <div className="mt-6 mb-8">
              <p className="text-xs text-white/30 mb-3 uppercase tracking-wider">We Accept</p>
              <div className="flex gap-2">
                {["bKash", "Nagad", "COD"].map((method) => (
                  <span key={method} className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-[10px] font-semibold text-white/60">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="site-container py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} GoNext. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-white/35">
            <Link href="#" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
