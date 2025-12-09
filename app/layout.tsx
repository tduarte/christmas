import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Family Christmas",
  description: "Organize family dinners and White Elephant gifts",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://xmas-berndt.vercel.app'),
  openGraph: {
    title: "Family Christmas",
    description: "Organize family dinners and White Elephant gifts",
    url: "/",
    siteName: "Family Christmas",
    images: [
      {
        url: "https://xvmeoczosoteqlvghrbg.supabase.co/storage/v1/object/public/static-assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "Family Christmas",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Family Christmas",
    description: "Organize family dinners and White Elephant gifts",
    images: ["https://xvmeoczosoteqlvghrbg.supabase.co/storage/v1/object/public/static-assets/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/og-image.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = stored === 'dark' || (!stored && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
