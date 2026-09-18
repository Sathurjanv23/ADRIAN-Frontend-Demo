import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { InstallPrompt } from "@/components/shared/InstallPrompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ADRIAN — AI Disaster Response & Intelligent Assistance Network",
    template: "%s | ADRIAN Emergency Response",
  },
  description:
    "ADRIAN is an AI-powered disaster management platform transforming citizen emergency reports into coordinated rescue and relief operations in real-time.",
  keywords: [
    "emergency response",
    "AI disaster management",
    "Sri Lanka",
    "flood monitoring",
    "rescue coordination",
    "ADRIAN",
    "disaster relief",
  ],
  openGraph: {
    title: "ADRIAN — AI Disaster Response & Intelligent Assistance Network",
    description: "From Emergency Reports to Coordinated Action — in Seconds.",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ADRIAN",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#D32F2F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased bg-em-bg text-em-text font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
        <InstallPrompt />
        <Toaster
          theme="light"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              color: '#0D1B2A',
              boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            classNames: {
              success: 'border-l-4 !border-l-[#2E7D32]',
              error:   'border-l-4 !border-l-[#D32F2F]',
              warning: 'border-l-4 !border-l-[#F57C00]',
              info:    'border-l-4 !border-l-[#1565C0]',
            },
          }}
          position="top-right"
        />
      </body>
    </html>
  );
}
