'use client';
import { useCallback } from "react";
//import { usePathname, useRouter } from 'next/navigation'
import PageBase from "../pagebase";
import HomeRenderPage from "./homerenderpage"

export default function Home() {
  const pathTest = useCallback((pathname: string, thisPathName: string) => {
    return pathname == thisPathName;
  }, [])

  const thisPathName = "/";

  const render = useCallback(() => 
    <HomeRenderPage/>
  , []);

  return PageBase({thisPathName, pathTest, render, id: "home", overrideContentTop: "0"});
}
