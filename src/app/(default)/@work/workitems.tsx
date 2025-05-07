import { promises as fs } from "fs";
import Work from "@/app/(default)/@work/work";
import WorkIntro from "@/app/(default)/@work/workintro";
import WorkNavigator from "./worknavigator";

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
