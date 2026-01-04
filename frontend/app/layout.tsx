import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";

export const metadata: Metadata = {
  title: "Meta Ads Analytics Suite",
  description: "AI-powered analytics for Meta advertising campaigns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppSidebar>{children}</AppSidebar>
      </body>
    </html>
  );
}
