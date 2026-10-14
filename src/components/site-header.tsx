"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Live Dashboard" },
  { href: "/teams", label: "Teams" },
  { href: "/problems", label: "Problem Statements" },
  { href: "/schedule", label: "Schedule" },
  { href: "/announcements", label: "Announcements" },
  { href: "/live-wall", label: "Live Wall" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const panelId = useId();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-[#070b14]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-baseline gap-2 rounded-md">
          <span className="text-sm font-semibold tracking-[0.18em]">SYNAPSE</span>
          <span className="font-mono text-sm text-accent">24</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground",
                pathname === link.href && "bg-white/5 text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin/login"
            className="ml-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Admin Login
          </Link>
        </nav>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border lg:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpenPath(open ? null : pathname)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open ? (
        <nav id={panelId} className="border-t border-border px-4 py-3 lg:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className="rounded-md px-2 py-2 text-sm hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/admin/login" className="rounded-md px-2 py-2 text-sm hover:bg-white/5">
              Admin Login
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

export function HeaderFallback() {
  return <div className="h-16 border-b border-border bg-[#070b14]" />;
}
