export interface WorkData {
  client: string;
  project: string;
  employer: string;
  position: string;
  roles: Array<string>;
  responsibilities: Array<string>;
  slug: string;
  date: string;
  hero: string;
  heroType: string;
  video: string;
  videoAspect: number;
  thumb: string;
  thumbStartFocus: { x: number; y: number };
  thumbStartScale: number;
  thumbEndFocus: { x: number; y: number };
  thumbEndScale: number;
  thumbSize: { width: number; height: number };
  images: Array<string>;
  primaryColor: string;
  description: string;
  theme: string;
  titleOutline?: string;
  detailTemplate: string;
  needsPadding?: boolean;
  heroBlurDataURL?: string;
  thumbBlurDataURL?: string;
  imageBlurDataURLs?: Array<string | undefined>;
  // Lean poster frames extracted from the clips (see scripts/generate-posters.sh).
  // Fall back to `thumb` when absent.
  poster?: string;
  heroPoster?: string;
  // HLS master playlists (see scripts/generate-hls.sh). When present, the player
  // streams adaptively; the mp4 `video`/`hero` stays as the no-HLS fallback.
  videoHls?: string;
  heroHls?: string;
}
