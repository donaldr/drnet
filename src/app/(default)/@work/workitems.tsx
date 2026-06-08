import { promises as fs } from "fs";
import path from "path";
import Work from "@/app/(default)/@work/work";
import WorkIntro from "@/app/(default)/@work/workintro";
import WorkNavigator from "./worknavigator";
import { getPlaiceholder } from "plaiceholder";
import type { WorkData } from "./types";
export type { WorkData };

const BLUR_CACHE_PATH = path.join(
  process.cwd(),
  "src/app/(default)/@work/.blur-cache.json"
);

type BlurCache = Record<string, string>;

async function loadBlurCache(): Promise<BlurCache> {
  try {
    const data = await fs.readFile(BLUR_CACHE_PATH, "utf8");
    return JSON.parse(data) as BlurCache;
  } catch {
    return {};
  }
}

async function saveBlurCache(cache: BlurCache): Promise<void> {
  await fs.writeFile(BLUR_CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function getImageBuffer(src: string): Promise<Buffer | null> {
  try {
    if (src.startsWith("http")) {
      const res = await fetch(src);
      return Buffer.from(await res.arrayBuffer());
    } else {
      return await fs.readFile(process.cwd() + "/public" + src);
    }
  } catch {
    return null;
  }
}

async function getBlurDataURL(
  src: string,
  cache: BlurCache
): Promise<string | undefined> {
  if (!src || src.endsWith(".mp4") || src.endsWith(".webm")) return undefined;
  if (cache[src]) return cache[src];
  const buffer = await getImageBuffer(src);
  if (!buffer) return undefined;
  try {
    const { base64 } = await getPlaiceholder(buffer, { size: 10 });
    cache[src] = base64;
    return base64;
  } catch {
    return undefined;
  }
}

export default async function WorkItems() {
  const baseFile = await fs.readFile(
    process.cwd() + "/src/app/(default)/@work/data.base.json",
    "utf8"
  );
  const assetsFile = await fs.readFile(
    `${process.cwd()}/src/app/(default)/@work/data.${
      process.env.NODE_ENV == "production" ? "prod" : "dev"
    }.json`,
    "utf8"
  );
  const baseData: { work: Array<Partial<WorkData>> } = JSON.parse(baseFile) as {
    work: Array<Partial<WorkData>>;
  };
  const assetsData: { work: Array<Partial<WorkData>> } = JSON.parse(
    assetsFile
  ) as {
    work: Array<Partial<WorkData>>;
  };

  const data: { work: Array<WorkData> } = {
    work: baseData.work.map((work, index) =>
      Object.assign({}, work, assetsData.work[index])
    ) as Array<WorkData>,
  };

  // Load cached blur data URLs (avoids re-processing ~70 images on every dev request)
  const blurCache = await loadBlurCache();
  const prevSize = Object.keys(blurCache).length;

  // Generate blur data URLs for all image assets in parallel
  await Promise.all(
    data.work.map(async (work) => {
      const [heroBlur, thumbBlur, ...imageBlurs] = await Promise.all([
        getBlurDataURL(work.hero, blurCache),
        getBlurDataURL(work.thumb, blurCache),
        ...(work.images || []).map((img) => getBlurDataURL(img, blurCache)),
      ]);
      work.heroBlurDataURL = heroBlur;
      work.thumbBlurDataURL = thumbBlur;
      work.imageBlurDataURLs = imageBlurs;
    })
  );

  // Save cache if new entries were generated
  if (Object.keys(blurCache).length > prevSize) {
    await saveBlurCache(blurCache);
  }

  return (
    <>
      <WorkIntro />
      {data.work.map(
        (work: WorkData, index: number) =>
          index < 10 && <Work key={`work${index}`} index={index} work={work} />
      )}
      <WorkNavigator works={data.work.slice(0, 10)} />
    </>
  );
}
