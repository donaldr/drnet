export function preloadAssets(
  urls: string[],
  onProgress: (percent: number) => void
): Promise<void> {
  if (urls.length === 0) {
    onProgress(100);
    return Promise.resolve();
  }

  let completed = 0;
  const total = urls.length;

  return new Promise<void>((resolve) => {
    const onAssetDone = () => {
      completed++;
      onProgress(Math.round((completed / total) * 100));
      if (completed >= total) {
        resolve();
      }
    };

    urls.forEach((url) => {
      if (url.endsWith(".mp4") || url.endsWith(".webm")) {
        // Videos are handled separately (poster + preload="metadata")
        onAssetDone();
      } else {
        const img = new window.Image();
        img.onload = onAssetDone;
        img.onerror = onAssetDone;
        img.src = url;
      }
    });
  });
}
