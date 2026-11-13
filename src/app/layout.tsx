import type { Metadata } from "next";
import { Fredoka, Geist } from "next/font/google";

import { SiteFooterSlot } from "@/components/site-footer-slot";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Headings only. Fredoka is the closest open-licence match to the rounded,
// geometric lettering in the team logo. It is a variable font, so no weight
// list is needed - the whole range comes down in one file.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Momentum Hub - the hub for FTC and FLL teams",
    template: "%s | Momentum Hub",
  },
  description:
    "One account per team, FTC or FLL: publish your events, find scrimmages and workshops near you, and talk to the other teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fredoka.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooterSlot />
      </body>
    </html>
  );
}
