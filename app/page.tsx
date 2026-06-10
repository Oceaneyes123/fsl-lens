import Link from "next/link";
import { BookOpen, Camera, ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";

const actions = [
  {
    title: "Start Recognition",
    href: "/recognize",
    description: "Open the webcam, detect hand landmarks, and view prediction feedback.",
    icon: Camera,
  },
  {
    title: "Practice",
    href: "/practice",
    description: "Choose a sign or take a random quiz with reference guidance.",
    icon: ClipboardCheck,
  },
  {
    title: "Learn Signs",
    href: "/learn",
    description: "Browse the MVP alphabet and number sign library.",
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
            Filipino Sign Language alphabet and number practice with webcam landmarks.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            FSL Lens starts with static alphabet and number signs. Camera frames stay in the browser; the
            prototype prepares landmark samples for Supabase only from the internal capture flow.
          </p>
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
          <h2 className="text-lg font-semibold text-ink">MVP foundation</h2>
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
                  <span>
                    <span className="block text-sm font-semibold text-ink">{action.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">{action.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
