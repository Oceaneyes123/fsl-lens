import Link from "next/link";
import { BookOpen, Camera, ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";

const actions = [
  {
    title: "Start Recognition",
    href: "/recognize",
    icon: Camera,
  },
  {
    title: "Practice",
    href: "/practice",
    icon: ClipboardCheck,
  },
  {
    title: "Learn Signs",
    href: "/learn",
    icon: BookOpen,
  },
];

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-line bg-white p-8 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Private MVP Prototype</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-ink">
            Filipino Sign Language practice.
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/recognize"
              className="inline-flex h-11 items-center rounded-md bg-teal px-5 text-sm font-semibold text-white"
            >
              Start Recognition
            </Link>
            <Link
              href="/capture"
              className="inline-flex h-11 items-center rounded-md border border-line px-5 text-sm font-semibold text-ink"
            >
              Capture Dataset
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Modes</h2>
          <div className="mt-5 space-y-4">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex gap-4 rounded-md border border-line p-4 transition hover:border-teal hover:bg-mist"
                >
                  <Icon className="mt-1 h-5 w-5 text-teal" aria-hidden="true" />
                  <span className="block text-sm font-semibold text-ink">{action.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
