import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlacePrep AI — Daily Placement Coach",
  description: "Your AI-powered daily placement preparation companion. Aptitude, coding, interviews, and more.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GV0S8DS3LZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GV0S8DS3LZ');
          `}
        </Script>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2835350083353400"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme') || 'dark';
              document.documentElement.classList.remove('dark', 'light');
              document.documentElement.classList.add(theme);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
