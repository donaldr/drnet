"use client";
import { useCallback } from "react";
import PageBase from "../pagebase";
import ContactRenderPage from "./contactrenderpage";

export default function Contact() {
  const pathTest = useCallback((pathname: string, thisPathName: string) => {
    return pathname == thisPathName;
  }, []);

  const thisPathName = "/contact";

  const render = useCallback(() => <ContactRenderPage />, []);

  return PageBase({
    thisPathName,
    pathTest,
    render,
    id: "contact",
    overrideContentTop: "0",
    overridePaddingBottom: "0",
  });
}
