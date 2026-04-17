import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Contact Management System",
  description: "Manage contacts and email templates for your business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 selection:bg-indigo-100">
        {/* App Shell */}
        <div className="flex min-h-screen flex-col">
          {/* Navigation */}
          <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
            <Navigation />
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-sm text-gray-500 text-center sm:text-left">
                  © {new Date().getFullYear()} Contact Management System
                </p>

                <p className="text-xs text-gray-400">
                  Built for productivity & clarity
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}