import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MovieMN",
  description: "Монгол киноны цуглуулга",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}