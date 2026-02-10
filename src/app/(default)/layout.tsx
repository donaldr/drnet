import type { Viewport, Metadata } from "next";
import { promises as fs } from "fs";
import "./globals.css";
import Content from "./content";
import Header from "./header";
import Loading from "./loading";
import PreloadManager from "./preloadmanager";

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

async function getCriticalAssetUrls(): Promise<string[]> {
  try {
    const assetsFile = await fs.readFile(
      `${process.cwd()}/src/app/(default)/@work/data.${
        process.env.NODE_ENV == "production" ? "prod" : "dev"
      }.json`,
      "utf8"
    );
    const assetsData = JSON.parse(assetsFile) as {
      work: Array<{ hero?: string; thumb?: string }>;
    };
    const urls: string[] = [];
    // Preload first hero image and first few thumbnails
    if (assetsData.work[0]?.hero && !assetsData.work[0].hero.endsWith(".mp4")) {
      urls.push(assetsData.work[0].hero);
    }
    for (let i = 0; i < Math.min(3, assetsData.work.length); i++) {
      if (assetsData.work[i]?.thumb) {
        urls.push(assetsData.work[i].thumb!);
      }
    }
    return urls;
  } catch {
    return [];
  }
}

export default async function RootLayout({
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
  const criticalUrls = await getCriticalAssetUrls();

  return (
    <html lang="en">
      <body className="antialiased">
        <Header />

        <Loading />
        <PreloadManager urls={criticalUrls} />
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
