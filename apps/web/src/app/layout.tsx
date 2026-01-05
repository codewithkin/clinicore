import type { Metadata } from "next";
import localFont from "next/font/local";
import "../index.css";
import Providers from "@/components/providers";

// Use a local font with system fallbacks to avoid network issues during build
const inter = localFont({
  src: [
    {
      path: "../fonts/Inter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Inter-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Inter-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/Inter-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

// SEO Metadata
export const metadata: Metadata = {
  title: "Clinicore – The Core of Clinic Management",
  description:
    "Clinicore centralizes your patient records, appointments, and billing, helping clinics operate efficiently and reliably.",
  openGraph: {
    title: "Clinicore – The Core of Clinic Management",
    description:
      "Clinicore centralizes your patient records, appointments, and billing, helping clinics operate efficiently and reliably.",
    url: "https://clinicore.space",
    siteName: "Clinicore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clinicore – The Core of Clinic Management",
    description:
      "Clinicore centralizes your patient records, appointments, and billing, helping clinics operate efficiently and reliably.",
    site: "@Clinicore",
  },
  metadataBase: new URL("https://clinicore.space"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="grid grid-rows-[auto_1fr] h-svh">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}