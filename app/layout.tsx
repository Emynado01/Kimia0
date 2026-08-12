import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ÉCLAT — La beauté, en mouvement",
  description: "Une maison de beauté contemporaine aux gestes essentiels.",
  openGraph: {
    title: "ÉCLAT — La beauté, en mouvement",
    description: "La lumière vous va si bien.",
    images: ["/og.png"],
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
