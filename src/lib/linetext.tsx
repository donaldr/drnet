import { useEffect, useState } from "react";
import opentype from "opentype.js";
import { useGlobalState } from "./state";

export const useLineText = (text: string, size: number) => {
  const [font, setFont] = useState<ReturnType<typeof opentype.parse>>();
  const [paths, setPaths] = useState<Array<string>>();
  const [width, setWidth] = useState<number | undefined>();
  const [height, setHeight] = useState<number | undefined>();
  const [fonts, setFonts] = useGlobalState("fonts");

  useEffect(() => {
    if (!font) {
      if (fonts["/fonts/mecsoft.ttf"]) {
        setFont(fonts["/fonts/mecsoft.ttf"]);
      } else {
        const buffer = fetch("/fonts/mecsoft.ttf").then((res) =>
          res.arrayBuffer()
        );
        buffer.then((data) => {
          setFont(opentype.parse(data));
        });
      }
    }
  }, [fonts, font]);

  useEffect(() => {
    if (font) {
      setFonts((oldFonts) => ({
        ...oldFonts,
        ...("/fonts/mecsoft.ttf" in oldFonts && { "/fonts/mecsoft.ttf": font }),
      }));
    }
  }, [font, setFonts]);

  useEffect(() => {
    if (font) {
      setWidth(font.getAdvanceWidth(text, size));
      setHeight(size + 1);
      setPaths(
        text.split("").reduce(
          (prev: any, curr, index) => {
            const path = font.getPath(curr, prev[0] as number, size, size);

            let previousWasM = false;
            const commands: typeof path.commands = path.commands.map(
              (command) => {
                const returnCommand: typeof command = {
                  ...command,
                  ...(command.type == "M" && { type: "Z" }),
                  ...(previousWasM && { type: "M" }),
                } as typeof command;
                if (previousWasM) {
                  previousWasM = false;
                }
                if (command.type == "M") {
                  previousWasM = true;
                }
                return returnCommand;
              }
            );

            path.commands = commands.filter((command) => {
              return command.type != "Z";
            });

            let advance = font.getAdvanceWidth(curr, size);
            if (index < text.length - 1 && text[index + 1] == "R") {
              advance -= size * 0.1;
            }
            return [prev[0] + advance, [...prev[1], path.toPathData(2)]];
          },
          [0, []]
        )[1]
      );
    }
  }, [font, size, text]);

  return { paths, width, height };
};
