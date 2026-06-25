"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, Camera, Database, Gauge, Hand, HeartHandshake, PlayCircle, Settings, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/recognize", label: "Recognize", icon: Camera },
  { href: "/practice", label: "Practice", icon: PlayCircle },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/capture", label: "Capture", icon: Database },
  { href: "/contribute", label: "Contribute", icon: HeartHandshake },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background font-body text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-line bg-panel px-4 py-6 shadow-soft lg:flex">
        <Link href="/" className="mb-10 flex items-center gap-3 px-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white">
            <Hand className="h-6 w-6" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-heading text-xl font-bold leading-6 text-primary">FSL Lens</span>
            <span className="block text-xs font-medium leading-4 text-muted">ML Research Platform</span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
                  active ? "bg-secondaryContainer text-white" : "text-muted hover:bg-panelSoft hover:text-primary"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/capture"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          Start Recording
        </Link>
      </aside>

      <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur lg:fixed lg:left-[260px] lg:right-0">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-6">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <Hand className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="font-heading text-lg font-bold text-primary">FSL Lens</span>
          </Link>
          <div className="hidden items-center gap-2 text-sm font-semibold lg:flex">
            <span className="text-primary">Research Portal</span>
            <span className="text-line">/</span>
            <span className="text-muted">Dashboard Overview</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-panelSoft px-3 py-1.5 text-xs font-medium text-ink sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Model Loaded
            </span>
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-panelSoft hover:text-primary" type="button" aria-label="Notifications">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </button>
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-panelSoft hover:text-primary" type="button" aria-label="Settings">
              <Settings className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-6 sm:px-6 lg:ml-[260px] lg:pt-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-panel px-2 py-2 shadow-floating lg:hidden" aria-label="Mobile navigation">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold hover:bg-panelSoft hover:text-primary ${active ? "text-primary" : "text-muted"}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
