"use client";

import {
  generateWhatsAppLink,
  getProductWhatsAppUrl,
  type ProductInfo,
} from "@/lib/whatsapp";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface WhatsAppButtonProps {
  product?: ProductInfo;
  variant?: "floating" | "inline";
  className?: string;
}

export default function WhatsAppButton({
  product,
  variant = "floating",
  className = "",
}: WhatsAppButtonProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");

  useEffect(() => {
    setIsMounted(true);

    const phoneNumber = "8801625456190";

    if (product) {
      // Product context - include product details and link
      const url = getProductWhatsAppUrl(phoneNumber, product);
      setWhatsappUrl(url);
    } else {
      // General inquiry
      const url = generateWhatsAppLink(
        phoneNumber,
        "হ্যালো! আমার একটি প্রশ্ন আছে।",
      );
      setWhatsappUrl(url);
    }
  }, [product]);

  if (!isMounted || !whatsappUrl) return null;

  // Floating variant (bottom-right corner for all pages)
  if (variant === "floating") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`fixed bottom-6 right-6 z-40 ${className}`}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative"
        >
          {/* Pulse ring effect */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-[#25d366] rounded-full"
          ></motion.div>

          {/* WhatsApp Button */}
          <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-14 h-14 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 relative z-10 group"
            title="আমাদের সাথে WhatsApp এ চ্যাট করুন"
          >
            <MessageCircle className="w-6 h-6" />

            {/* Tooltip on hover */}
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              <div className="bg-[#1a1916] text-white text-xs py-2 px-3 rounded shadow-lg">
                <span className="block font-semibold">
                  আমাদের সাথে চ্যাট করুন
                </span>
                <span className="block text-[#25d366] text-[10px] mt-1">
                  {product
                    ? "পণ্য সম্পর্কে জিজ্ঞাসা করুন"
                    : "সাধারণত ২ ঘণ্টায় উত্তর"}
                </span>
              </div>
              <div className="absolute top-full right-3 w-2 h-2 bg-[#1a1916] transform rotate-45"></div>
            </div>
          </Link>

          {/* Mobile-only label */}
          <div className="md:hidden absolute bottom-full right-full mr-3 mb-2 bg-[#1a1916] text-white text-xs px-3 py-1.5 rounded whitespace-nowrap pointer-events-none">
            সাপোর্ট
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Inline variant (for button in product page)
  return (
    <Link
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#20ba5a] text-white px-6 py-3 font-semibold tracking-[0.05em] transition-all duration-300 ${className}`}
      title="আমাদের সাথে WhatsApp এ চ্যাট করুন"
    >
      <MessageCircle className="w-5 h-5" />
      WhatsApp এ জিজ্ঞাসা করুন
    </Link>
  );
}
