import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

// Google Fonts
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "700"], // Regular, Medium, Bold
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
        className={`${montserrat.variable} ${inter.variable} antialiased`}
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