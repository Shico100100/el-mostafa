import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { CommandPalette } from "@/components/CommandPalette";
import { BackButtonProvider } from "@/components/BackButton";
import { AuthProvider } from "@/components/AuthProvider";
import ChatbotWidget from "@/components/ChatbotWidget";
import GlobalSidebar from "@/components/GlobalSidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "نظام المصطفى",
  description: "نظام إدارة المصانع المتكامل",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "نظام المصطفى",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider />
        <CommandPalette />
        <AuthProvider>
          <BackButtonProvider>
            <GlobalSidebar>{children}</GlobalSidebar>
            <ChatbotWidget />
          </BackButtonProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
