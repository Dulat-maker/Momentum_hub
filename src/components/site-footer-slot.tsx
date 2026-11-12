"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "./site-footer";

/**
 * The home page ends with the full-height cinematic footer, so the plain one
 * would stack underneath it. Every other route keeps the normal footer.
 */
export function SiteFooterSlot() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return <SiteFooter />;
}
