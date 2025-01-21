import { promises as fs } from "fs";
import Work from "@/app/@work/work";
import WorkIntro from "@/app/@work/workintro";
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
}

export default async function WorkItems() {
  const file = await fs.readFile(
    process.cwd() + "/src/app/@work/data.json",
    "utf8"
  );
  const data: { work: Array<WorkData> } = JSON.parse(file) as {
    work: Array<WorkData>;
  };

  return (
    <>
      <WorkIntro />
      {data.work.map(
        (work: WorkData, index: number) =>
          index < 2 && <Work key={`work${index}`} index={index} work={work} />
      )}
      <WorkNavigator works={data.work.slice(0, 2)} />
    </>
  );
}
