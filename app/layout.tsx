import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InstaFlow | AI Voice Agents That Answer Every Call Instantly',
  description: 'Enterprise-grade AI voice automation for businesses.',
  icons: {
    icon: '/assets/round_logo.png',
    shortcut: '/assets/round_logo.png',
    apple: '/assets/round_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="text-slate-100 overflow-x-hidden antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
