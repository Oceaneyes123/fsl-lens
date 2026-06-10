import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FSL Lens",
  description: "Practice static Filipino Sign Language alphabet and number signs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
