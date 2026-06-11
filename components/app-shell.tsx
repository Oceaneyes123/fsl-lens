import Link from "next/link";
import { BookOpen, Camera, Database, Gauge, Hand, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/recognize", label: "Recognize", icon: Camera },
  { href: "/practice", label: "Practice", icon: Gauge },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/capture", label: "Capture", icon: Database },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-teal text-white">
              <Hand className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xl font-semibold leading-6 text-ink">FSL Lens</span>
            </span>
          </Link>

          <nav className="flex flex-wrap gap-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-700 transition hover:bg-mist hover:text-teal"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
