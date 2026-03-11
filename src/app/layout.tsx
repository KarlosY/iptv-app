import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IPTV Ykar — Live TV Worldwide",
  description:
    "Browse thousands of live TV channels from around the world powered by the IPTV-org open database.",
  keywords: ["IPTV", "live TV", "streaming", "channels", "free TV"],
  authors: [{ name: "IPTV Ykar" }],
  openGraph: {
    title: "IPTV Ykar — Live TV Worldwide",
    description: "Browse thousands of live TV channels worldwide",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
