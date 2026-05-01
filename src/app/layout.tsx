import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://avtocitypro.uz"),
  title: {
    default: "AvtoCity Pro — Avtomobil ehtiyot qismlari",
    template: "%s | AvtoCity Pro",
  },
  description:
    "Asl va sertifikatlangan avtomobil ehtiyot qismlari. Cobalt, Spark, Lacetti, Nexia, Captiva uchun. Tezkor yetkazib berish O'zbekiston bo'ylab. 24/7 yordam.",
  keywords: [
    "avtomobil ehtiyot qismlari",
    "Cobalt ehtiyot qismi",
    "Spark ehtiyot qismi",
    "Lacetti ehtiyot qismi",
    "Nexia ehtiyot qismi",
    "Toshkent avtomobil",
    "O'zbekiston avto",
  ],
  authors: [{ name: "AvtoCity Pro" }],
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    title: "AvtoCity Pro — Avtomobil ehtiyot qismlari",
    description:
      "Asl va sertifikatlangan avtomobil ehtiyot qismlari. Tezkor yetkazib berish.",
    siteName: "AvtoCity Pro",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f1ea",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        {/* Distinctive font pairing: Fraunces (display) + Geist (sans) + JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700;9..144,900&family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
