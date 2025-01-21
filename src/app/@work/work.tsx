'use client';
import { useCallback } from "react";
import { WorkData } from "@/app/@work/workitems";
import PageBase from "../pagebase";
import WorkRenderPage from "./workrenderpage";

export default function WorkComponent({
  work,
  index
}:
Readonly<{
  work: WorkData;
  index: number;
}>)
{
  const pathTest = useCallback((pathname: string, thisPathName: string, index?: number) => {
    return pathname == thisPathName;
  }, [])

  const thisPathName = `/work/${work.slug}`;
  const render = useCallback(({index}: {index?: number}) => 
    (<WorkRenderPage {...{index: index!, work}} />)
  , [work]);

  return PageBase({index, thisPathName, pathTest, render, id: `work-${index}`, overrideContentTop: "0", overridePaddingBottom: "100vh"});
}