import type { Metadata } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const ibm = IBM_Plex_Mono({ weight: '400', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Thermo',
  description: 'Wifi-enabled thermostat',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className='dark'>
      <body className={`${ibm.className}`}>{children}</body>
    </html>
  );
}
