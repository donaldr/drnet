import hexToHsl from "hex-to-hsl";
import { WorkData } from "./workitems";
import { memo } from "react";

function Squares({
  index,
  theme,
  color,
  count,
  minWidth,
  maxWidth,
  minSpeed,
  maxSpeed,
  height,
  top,
}: Readonly<{
  index: string;
  theme: string;
  color: string;
  count: number;
  minWidth: number;
  maxWidth: number;
  minSpeed: number;
  maxSpeed: number;
  height: number;
  top: number;
}>) {
  const hsl = hexToHsl(color);
  return [...Array(count)].map((item, i) => {
    return (
      <div
        className="absolute"
        data-scroll
        data-scroll-speed={minSpeed + Math.random() * (maxSpeed - minSpeed)}
        key={`${index}-square-${i}`}
        style={{
          width: `${minWidth + Math.random() * (maxWidth - minWidth)}vw`,
          left: `${Math.random() * 100}vw`,
          opacity: Math.random() * 0.5,
          height: `${height}vh`,
          top: `${top}vh`,
        }}
      >
        <div
          className={`absolute w-full`}
          style={{
            backgroundColor: `hsl(${hsl[0]},${
              theme == "dark" ? hsl[1] : hsl[1] + (100 - hsl[1]) * Math.random()
            }%,${
              theme == "dark"
                ? hsl[2] + (100 - hsl[2]) * Math.random() * 0.5
                : hsl[2] * (1 - Math.random() * 0.25)
            }%)`,
            height: `${10 + Math.random() * 100}vh`,
            top: `${Math.random() * height}vh`,
          }}
        ></div>
      </div>
    );
  });
}

export default memo(Squares);
