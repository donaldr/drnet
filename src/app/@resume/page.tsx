"use client";
import { useCallback } from "react";
import PageBase from "../pagebase";
import ResumeRenderPage from "./resumerenderpage";

export default function Resume() {
  const pathTest = useCallback((pathname: string, thisPathName: string) => {
    return pathname == thisPathName;
  }, []);

  const thisPathName = "/resume";

  const render = useCallback(() => <ResumeRenderPage />, []);

  return PageBase({
    thisPathName,
    pathTest,
    render,
    id: "resume",
    overrideContentTop: "0",
  });
}
