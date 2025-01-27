"use client";
import { useCallback } from "react";
import PageBase from "../pagebase";
import WorkIntroRenderPage from "./workintrorenderpage";

export default function WorkComponent() {
  const pathTest = useCallback(
    (pathname: string, thisPathName: string) => pathname == thisPathName,
    []
  );

  const thisPathName = `/work`;
  const render = useCallback(
    ({}: { index?: number }) => <WorkIntroRenderPage />,
    []
  );

  return PageBase({
    thisPathName,
    pathTest,
    render,
    id: "work-intro",
    overridePaddingBottom: "50dvh",
    overrideContentTop: "0",
    intersectionOffset: 0.5,
  });
}
