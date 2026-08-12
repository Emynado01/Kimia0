import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simire — Le maquillage qui vous ressemble",
  description: "Couleur, soin et confiance — les essentiels beauté signés Simire.",
  openGraph: {
    title: "Simire — Le maquillage qui vous ressemble",
    description: "Couleur, soin et confiance au quotidien.",
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
