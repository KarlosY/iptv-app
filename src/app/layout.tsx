import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "./providers";
import { RegisterSW } from "@/presentation/components/RegisterSW";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "IPTV Ykar — Live TV Worldwide",
  description:
    "Browse thousands of live TV channels from around the world powered by the IPTV-org open database.",
  keywords: ["IPTV", "live TV", "streaming", "channels", "free TV"],
  authors: [{ name: "IPTV Ykar" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "IPTV Ykar — Live TV Worldwide",
    description: "Browse thousands of live TV channels worldwide",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <RegisterSW />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
