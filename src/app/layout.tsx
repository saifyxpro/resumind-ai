import type { Metadata } from "next";
import "./globals.css";

import CustomCursor from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "Resumind - AI Resume Analyzer",
  description: "Get AI-powered feedback on your resume to land your dream job",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning>
        <CustomCursor />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
