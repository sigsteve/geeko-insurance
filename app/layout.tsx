import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Geeko Insurance",
  description: "Geeko Insurance",
  icons: {
    icon: [
      {
        url: '/favicon.png',
        type: 'image/png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
