import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "FR33",
  description: "Decentralised payments architecture ",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/android-chrome-512x512.png', // Optional: for older browsers
    apple: '/apple-touch-icon.png', // Optional: for Apple devices
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
