import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "\u843d\u5b50\u590d\u76d8 - Rapfi \u4e94\u5b50\u68cb\u5b9e\u65f6\u5206\u6790",
  description: "Rapfi \u672c\u5730\u5f15\u64ce\u5b9e\u65f6\u590d\u76d8\uff0c\u663e\u793a\u672a\u6765\u4e94\u624b\u6700\u4f73\u8def\u7ebf\u3002",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
