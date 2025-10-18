import type { Metadata } from "next";
import { Jersey_15, Mansalva } from "next/font/google";
import "./globals.css";

const jersey15 = Jersey_15({
  weight: "400",
  variable: "--font-jersey",
  subsets: ["latin"],
});

const mansalva = Mansalva({
  weight: "400",
  variable: "--font-mansalva",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "THROWBACK - Connect Across Generations",
  description: "Connect across generations, one story at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jersey15.variable} ${mansalva.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
