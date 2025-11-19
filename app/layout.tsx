import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Ensure fonts are loaded with display swap
  preload: true, // Explicitly enable preload
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Ensure fonts are loaded with display swap
  preload: true, // Explicitly enable preload
});

export const metadata: Metadata = {
  title: "Amana Chat - Real-time Chat Application",
  description: "Real-time chat application built with Next.js and Ably",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
