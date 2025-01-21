"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePrevious } from "@/lib/customhooks";
import clsx from "clsx";

export default function Header() {
  const pathname = usePathname();
  const previousPathName = usePrevious(pathname);
  const [workClasses, setWorkClasses] = useState("mt-2");
  const [resumeClasses, setResumeClasses] = useState("mt-2");
  const [contactClasses, setContactClasses] = useState("mt-2");

  useEffect(() => {
    if (pathname.startsWith("/work")) {
      setWorkClasses(
        clsx({
          "duration-1000 transition-[color,fill] mt-2": true,
          "animate-boldify": true,
        })
      );
    } else if (previousPathName && previousPathName.startsWith("/work")) {
      setWorkClasses(
        clsx({
          "duration-1000 transition-[color,fill] mt-2": true,
          "animate-unboldify": true,
        })
      );
    }
    if (pathname.startsWith("/resume")) {
      setResumeClasses(
        clsx({
          "duration-1000 transition-[color,fill] mt-2": true,
          "animate-boldify": true,
        })
      );
    } else if (previousPathName && previousPathName.startsWith("/resume")) {
      setResumeClasses(
        clsx({
          "duration-1000 transition-[color,fill] mt-2": true,
          "animate-unboldify": true,
        })
      );
    }
    if (pathname.startsWith("/contact")) {
      setContactClasses(
        clsx({
          "duration-1000 transition-[color,fill] mt-2": true,
          "animate-boldify": true,
        })
      );
    } else if (previousPathName && previousPathName?.startsWith("/contact")) {
      setContactClasses(
        clsx({
          "duration-1000 transition-[color,fill] mt-2": true,
          "animate-unboldify": true,
        })
      );
    }
  }, [previousPathName, pathname]);

  return (
    <>
      <header className="fixed h-header w-full z-50 flex justify-between items-center px-[5vw]">
        <div className="flex gap-8">
          <Link href="/" shallow={true} scroll={false}>
            <div className="h-[4em] py-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                id="Layer_1"
                viewBox="0 0 100 100"
                className="auto h-[2em] object-left transition-[fill] duration-1000"
              >
                <defs>
                  <style>
                    {
                      ".bg,.fg{fill:var(--foreground)}.bg{opacity:.125}.fg{opacity:.5}"
                    }
                  </style>
                </defs>
                <path
                  d="M0 0h18.14v100H0z"
                  className="bg transition-[fill] duration-1000"
                />
                <path
                  d="M54.57 0h18.14v100H54.57z"
                  className="bg transition-[fill] duration-1000"
                />
                <path
                  d="M81.86 0H100v100H81.86z"
                  className="bg transition-[fill] duration-1000"
                />
                <path
                  d="M0 45.81h18.14V100H0z"
                  className="fg transition-[fill] duration-1000"
                />
                <path
                  d="M27.29 0h18.14v100H27.29z"
                  className="fg transition-[fill] duration-1000"
                />
                <path
                  d="M54.57 30.3h18.14V100H54.57z"
                  className="fg transition-[fill] duration-1000"
                />
                <path
                  d="M81.86 30.3H100v25H81.86z"
                  className="fg transition-[fill] duration-1000"
                />
              </svg>
            </div>
          </Link>
          <h1></h1>
        </div>
        <div className="flex gap-8">
          <Link
            className={workClasses}
            href="/work"
            shallow={true}
            scroll={false}
          >
            Work
          </Link>
          <Link
            className={resumeClasses}
            href="/resume"
            shallow={true}
            scroll={false}
          >
            Resume
          </Link>
          <Link
            className={contactClasses}
            href="/contact"
            shallow={true}
            scroll={false}
          >
            Contact
          </Link>
        </div>
      </header>
    </>
  );
}
