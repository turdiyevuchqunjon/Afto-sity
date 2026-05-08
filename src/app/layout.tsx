import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://avtocitypro.uz"),
  title: {
    default: "AvtoCity Pro — Avtomobil ehtiyot qismlari",
    template: "%s | AvtoCity Pro",
  },
  description:
    "Asl va sertifikatlangan avtomobil ehtiyot qismlari. Cobalt, Spark, Lacetti, Nexia, Captiva uchun. Tezkor yetkazib berish O'zbekiston bo'ylab.",
  keywords: [
    "avtomobil ehtiyot qismlari",
    "Cobalt ehtiyot qismi",
    "Spark ehtiyot qismi",
    "Lacetti ehtiyot qismi",
    "Nexia ehtiyot qismi",
    "Toshkent avtomobil",
  ],
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    title: "AvtoCity Pro — Avtomobil ehtiyot qismlari",
    description: "Asl va sertifikatlangan avtomobil ehtiyot qismlari.",
    siteName: "AvtoCity Pro",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f1ea",
};

const PIXEL_ID = process.env.META_PIXEL_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
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

        {/* META PIXEL — browser-side tracking.*/}
        {PIXEL_ID && (
          <>
            <Script id="fb-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}