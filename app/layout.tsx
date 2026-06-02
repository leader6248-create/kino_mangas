import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

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
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
