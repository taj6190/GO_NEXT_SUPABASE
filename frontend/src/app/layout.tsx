import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/Providers";
import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GoNext — Premium eCommerce",
    template: "%s | GoNext",
  },
  description: "Discover premium products with the best deals. Fast delivery across Bangladesh with bKash, Nagad & COD payment options.",
  keywords: "ecommerce, shopping, bangladesh, online store, gonext, bkash, nagad, cod, premium products",
  authors: [{ name: "GoNext" }],
  openGraph: {
    title: "GoNext — Premium eCommerce",
    description: "Shop premium products at unbeatable prices. Fast delivery across Bangladesh.",
    type: "website",
    locale: "en_BD",
    siteName: "GoNext",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: {
                iconTheme: {
                  primary: "var(--success)",
                  secondary: "white",
                },
              },
              error: {
                iconTheme: {
                  primary: "var(--danger)",
                  secondary: "white",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
