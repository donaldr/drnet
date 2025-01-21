"use client";
import { SplitText } from "@rigo-m/react-split-text";
import { ReactNode, memo } from "react";

function Title({
  children,
  color,
  titleOutline,
}: Readonly<{
  children: ReactNode;
  color: string;
  theme: string;
  titleOutline: boolean;
}>) {
  return (
    <h1
      className={`mt-4 overflow-hidden ${
        titleOutline && "drop-shadow-outline"
      }`}
      style={{
        fontVariationSettings: `"wdth" 100 "wght" 600`,
        color,
      }}
    >
      {
        //@ts-expect-error SplitText says it doesn't take children but it does
        <SplitText
          LetterWrapper={({ countIndex, children }: any) => (
            <span
              className="group-[.active]:animate-in group-[.not-active]:animate-out group-[.active]:slide-in-from-bottom group-[.not-active]:slide-out-to-top inline-block overflow-hidden fill-mode-both"
              style={{
                animationDelay: `${250 + countIndex * Math.random() * 10}ms`,
              }}
            >
              {children}
            </span>
          )}
        >
          {children}
        </SplitText>
      }
    </h1>
  );
}

export default memo(Title);
