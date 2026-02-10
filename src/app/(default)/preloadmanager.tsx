"use client";

import { useEffect, useRef } from "react";
import { useGlobalState } from "@/lib/state";
import { preloadAssets } from "@/lib/assetloader";

export default function PreloadManager({
  urls,
}: Readonly<{
  urls: string[];
}>) {
  const [, setLoadProgress] = useGlobalState("loadProgress");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    preloadAssets(urls, (percent) => {
      setLoadProgress(percent);
    });
  }, [urls, setLoadProgress]);

  return null;
}
