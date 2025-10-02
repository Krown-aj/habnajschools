import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { PrimeReactProvider } from "primereact/api"
import { ConfirmDialog } from "primereact/confirmdialog";
import SessionProvider from "@/components/providers/SessionProvider";

import "./globals.css";
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import 'primereact/resources/themes/lara-light-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Habnaj International School",
  description: "Habnaj International School is an academy institution located in Bauchi, Bauchi State of Niggeria. It consisted of Nursery/Primary School, Junior Secondary School and Islam School",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <PrimeReactProvider value={{ unstyled: false }}>
            {children}
            <ConfirmDialog />
          </PrimeReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
