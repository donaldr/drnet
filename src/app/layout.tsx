import type { Viewport, Metadata } from "next";
import "./globals.css";
import Content from "./content";
import Header from "./header";
import { Suspense } from "react";
import Loading from "./loading";
import NoSSR from "react-no-ssr";

export const metadata: Metadata = {
  title: "Donald Richardson",
  description: "Donald Richardson's Portfolio Website",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  maximumScale: 1,
};

export default function RootLayout({
  home,
  work,
  resume,
  contact,
}: Readonly<{
  children: React.ReactNode;
  home: React.ReactNode;
  work: React.ReactNode;
  resume: React.ReactNode;
  contact: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Header />

        <Loading />
        <Content>
          {home}
          {work}
          {resume}
          {contact}
        </Content>
      </body>
    </html>
  );
}
