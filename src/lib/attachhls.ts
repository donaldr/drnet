// Attach an HLS source to a <video>.
//
// Strategy (progressive enhancement, canonical hls.js pattern):
//   1. Safari / iOS play HLS natively  -> just set video.src to the .m3u8
//   2. Everyone else                   -> dynamically import hls.js (MSE) and attach
//
// hls.js is imported lazily so it never lands in the initial bundle — it only
// loads when a video is actually about to play (driven by predictive preload).
//
// Returns a handle whose destroy() tears down hls.js / clears the native src.
// Callers should keep MP4 as the element's default `src` so the video still
// works if HLS data is absent or the import fails.

export type HlsHandle = { destroy: () => void };

export async function attachHls(
  video: HTMLVideoElement,
  src: string
): Promise<HlsHandle> {
  // 1. Native HLS (Safari, iOS).
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = src;
    return {
      destroy: () => {
        video.removeAttribute("src");
        video.load();
      },
    };
  }

  // 2. hls.js via Media Source Extensions.
  try {
    const { default: Hls } = await import("hls.js");
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      return { destroy: () => hls.destroy() };
    }
  } catch {
    // fall through to MP4 fallback already on the element
  }

  // 3. Neither path available — leave the element's existing MP4 src in place.
  return { destroy: () => {} };
}
