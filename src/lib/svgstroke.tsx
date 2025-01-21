import React, { RefObject, useEffect, useState } from "react";
import { FunctionComponent, ReactNode } from "react";
import { svgPathProperties } from "svg-path-properties";

export interface RenderSVGProps {
  pathsCSS: string;
}

export interface SVGStrokeProps extends React.CSSProperties {
  id?: string;
  offset?: number;
  startStroke: number;
  strokeLength: number;
  svgPath: SVGPathElement | null;
  renderSVGPath: (pathCSS: React.CSSProperties) => ReactNode;
  reverse?: boolean;
  lengthRef?: RefObject<number>;
  margin?: number;
}

const SVGStroke: FunctionComponent<SVGStrokeProps> = ({
  //color,
  id,
  offset = 0,
  startStroke = 0,
  strokeLength = 0,
  reverse = false,
  svgPath,
  renderSVGPath,
  lengthRef,
  margin = 0,
  ...rest
}: SVGStrokeProps) => {
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (length == 0 && svgPath) {
      const properties = new svgPathProperties(svgPath.getAttribute("d")!);
      const l = properties.getTotalLength();
      setLength(l);
      if (lengthRef) {
        lengthRef.current = l;
      }
    }
  }, [id, svgPath, length, lengthRef]);

  const rev = reverse ? -1 : 1;
  const m = length ? margin / length : 0;
  return (
    <React.Fragment>
      {renderSVGPath({
        ...((!length || strokeLength == 0) && { visibility: "hidden" }),
        ...rest,
        strokeDashoffset: rev * -(offset + startStroke + m) * length,
        strokeDasharray: `${rev * length * Math.max(0, strokeLength - m * 2)} ${
          rev * length * (1 - Math.max(0, strokeLength - m * 2))
        }`,
      })}
    </React.Fragment>
  );
};

export default React.memo(SVGStroke);
