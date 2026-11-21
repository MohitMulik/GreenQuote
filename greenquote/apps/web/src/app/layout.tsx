import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenQuote — Home Clean Energy Loan Marketplace",
  description:
    "Residential solar and heat pump financing engine embedded directly into HVAC contractor sales quotes with instant soft-pull pre-qualification.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
