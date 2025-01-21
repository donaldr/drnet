import { SplitText } from "@rigo-m/react-split-text";
import { useRef } from "react";
import React from "react";
import clsx from "clsx";
import seedrandom from "seedrandom";

function Description({
  children,
  theme
}:
Readonly<{
  children: React.ReactNode;
  theme: string;
}>)
{
    const seedRef = useRef<number>(seedrandom(Math.random().toString())());
    const paragraphs = Array.isArray(children) ? children : [children];
    
    return (
        <>
            {paragraphs.map((paragraph: string, index: number) => 
                //@ts-expect-error SplitText says it doesn't take children but it does
                <SplitText 
                    key={`paragraph-${index}`}
                    //@ts-expect-error LineWrapper says it doesn't have children parameter but it does
                    LineWrapper={({children}) => {
                        return <div className="whitespace-pre">{children}</div>
                    }}
                    WordWrapper={({ countIndex, children }: any) => {
                    const i = Math.floor(seedrandom((countIndex * seedRef.current).toString())() * 6);
                    const itemClasses = clsx({
                        "group-[.enter]/action:delay-0": i == 0,
                        "group-[.enter]/action:delay-100": i == 1,
                        "group-[.enter]/action:delay-200": i == 2,
                        "group-[.enter]/action:delay-300": i == 3,
                        "group-[.enter]/action:delay-400": i == 4,
                        "group-[.enter]/action:delay-500": i == 5,
                        "group-[.enter]/action:delay-600": i == 6,
                        "group-[.enter]/action:delay-700": i == 7,
                        "group-[.enter]/action:delay-800": i == 8,
                        "group-[.enter]/action:delay-900": i == 9,
                        "group-[.enter]/action:delay-1000": i >= 10,
                        "group-[.exit]/action:delay-0": Math.max(10 - i) == 0,
                        "group-[.exit]/action:delay-100": Math.max(0, 10 - i) == 1,
                        "group-[.exit]/action:delay-200": Math.max(0, 10 - i) == 2,
                        "group-[.exit]/action:delay-300": Math.max(0, 10 - i) == 3,
                        "group-[.exit]/action:delay-400": Math.max(0, 10 - i) == 4,
                        "group-[.exit]/action:delay-500": Math.max(0, 10 - i) == 5,
                        "group-[.exit]/action:delay-600": Math.max(0, 10 - i) == 6,
                        "group-[.exit]/action:delay-700": Math.max(0, 10 - i) == 7,
                        "group-[.exit]/action:delay-800": Math.max(0, 10 - i) == 8,
                        "group-[.exit]/action:delay-900": Math.max(0, 10 - i) == 9,
                        "group-[.exit]/action:delay-1000": Math.max(0, 10 - i) >= 10,
                        "inline-block opacity-0 group-[.enter]/action:opacity-100 translate-y-[10px] group-[.enter]/action:translate-y-0 transition-[transform,opacity] duration-500": true,
                        "text-[var(--dark)]": theme == "light",
                        "text-[var(--light)]": theme == "dark" 
                    });
                    return (
                        <span className={itemClasses}>
                            {children}
                        </span>
                    )
                }}>
                    {paragraph}
                </SplitText>
            )}
        </>
    )
}

export default React.memo(Description);