import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alchemy Opportunity Agent",
  description: "Find the right opportunity. Know your fit. Take the next step.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
