"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/follow-ups", label: "Follow-ups" },
  { href: "/capture", label: "Capture" },
  { href: "/trends", label: "Trends" },
  { href: "/demo/dashboard", label: "Demo" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/conversations/");
  }

  if (href === "/demo/dashboard") {
    return pathname.startsWith("/demo");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-shell nav-scroll grid w-full grid-cols-3 gap-1 rounded-[1.4rem] p-1 text-sm font-medium sm:flex sm:items-center sm:rounded-full">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            data-active={active ? "true" : "false"}
            className={cn(
              "nav-link-pill flex min-w-0 items-center justify-center text-center",
              active && "is-active",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
