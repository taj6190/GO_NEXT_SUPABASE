"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

const QUICK_LINKS = [
  { href: "/products", label: "All Products" },
  { href: "/categories", label: "Categories" },
  { href: "/products?featured=true", label: "Featured" },
  {
    href: "/products?sort_by=created_at&sort_order=desc",
    label: "New Arrivals",
  },
];

const SUPPORT_LINKS = [
  { href: "/track", label: "Track Order" },
  { href: "/orders", label: "My Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/login", label: "My Account" },
];

const LEGAL_LINKS = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "Refund Policy" },
];

const PAYMENTS = ["bKash", "Nagad", "Rocket", "COD"];

export default function Footer() {
  return (
    <footer className="bg-[#0e0d0b] py-10 font-['DM_Sans',sans-serif]">
      {/* ── TOP DIVIDER with brand accent ── */}
      <div className="h-px bg-linear-to-r from-transparent via-[#c9a96e] to-transparent opacity-40 mb-5" />

      {/* ── MAIN FOOTER BODY ── */}
      <div className="site-container py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10 md:gap-8">
          {/* ── Brand column ── */}
          <div>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mb-5 group w-fit">
              <div className="w-9 h-9 bg-[#c9a96e] flex items-center justify-center shrink-0 group-hover:bg-[#f5f0e8] transition-colors duration-300">
                <span className="text-[#1a1916] font-semibold text-[15px] font-['Instrument_Serif',serif]">
                  S
                </span>
              </div>
              <div>
                <span className="block text-[19px] font-normal text-[#f5f0e8] font-['Instrument_Serif',serif] leading-none">
                  ShopVerse
                </span>
                <span className="block text-[9px] font-medium tracking-[0.16em] uppercase text-[#c9a96e] mt-0.5">
                  Bangladesh
                </span>
              </div>
            </Link>

            <p className="text-[13px] text-[#6b6560] leading-[1.8] font-light mb-6 max-w-60">
              Your destination for premium products at great prices. Fast
              delivery across Bangladesh.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              <a
                href="#"
                aria-label="Facebook"
                className="w-8 h-8 border border-[#2a2824] flex items-center justify-center text-[#6b6560] hover:border-[#c9a96e] hover:text-[#c9a96e] transition-all duration-200"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-8 h-8 border border-[#2a2824] flex items-center justify-center text-[#6b6560] hover:border-[#c9a96e] hover:text-[#c9a96e] transition-all duration-200"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="0.8"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#c9a96e] mb-5">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] font-light text-[#6b6560] hover:text-[#f5f0e8] transition-colors duration-150 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-3 h-px bg-[#c9a96e] transition-all duration-200 overflow-hidden" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Support ── */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#c9a96e] mb-5">
              Help & Support
            </h4>
            <ul className="flex flex-col gap-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] font-light text-[#6b6560] hover:text-[#f5f0e8] transition-colors duration-150 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-3 h-px bg-[#c9a96e] transition-all duration-200 overflow-hidden" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact + Payments ── */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#c9a96e] mb-5">
              Contact
            </h4>
            <ul className="flex flex-col gap-3.5 mb-8">
              <li className="flex items-start gap-3">
                <MapPin className="w-3.5 h-3.5 text-[#c9a96e] mt-0.5 shrink-0" />
                <span className="text-[13px] font-light text-[#6b6560]">
                  Dhaka, Bangladesh
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-3.5 h-3.5 text-[#c9a96e] flex-shrink-0" />
                <span className="text-[13px] font-light text-[#6b6560]">
                  +880 1700-000000
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-3.5 h-3.5 text-[#c9a96e] flex-shrink-0" />
                <span className="text-[13px] font-light text-[#6b6560]">
                  support@shopverse.bd
                </span>
              </li>
            </ul>

            {/* Payment methods */}
            <div>
              <p className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-[#3a3836] mb-3">
                We Accept
              </p>
              <div className="flex flex-wrap gap-2">
                {PAYMENTS.map((method) => (
                  <span
                    key={method}
                    className="px-2.5 py-1 border border-[#2a2824] text-[10px] font-medium text-[#6b6560] tracking-[0.06em]"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="border-t border-[#1d1b18]">
        <div className="site-container py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#3a3836] font-light">
            © {new Date().getFullYear()} ShopVerse Bangladesh. All rights
            reserved.
          </p>
          <div className="flex items-center gap-5">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[11px] text-[#3a3836] hover:text-[#6b6560] transition-colors font-light"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
