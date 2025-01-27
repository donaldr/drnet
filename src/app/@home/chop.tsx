import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import opentype from "opentype.js";
//import paper from "paper/dist/paper-full";
import paper from "paper-jsdom-canvas";
import Matter from "matter-js";
import "pathseg";
import clsx from "clsx";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import { useDebounce } from "@/lib/customhooks";

// module aliases
const Engine = Matter.Engine,
  //Render = Matter.Render,
  Runner = Matter.Runner,
  Body = Matter.Body,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Vector = Matter.Vector,
  World = Matter.World,
  Svg = Matter.Svg;

export default function Chop({
  show = false,
  children,
}: Readonly<{
  show: boolean;
  children: React.ReactNode;
}>) {
  const [size, setSize] = useState<[number, number] | undefined>();
  const [cursorPosition, setCursorPosition] = useState<
    [number, number] | undefined
  >();
  const requestRef = useRef<number>(0);
  const [font, setFont] = useState<ReturnType<typeof opentype.parse> | null>(
    null
  );
  const [pathMap, setPathMap] = useState<
    Array<[SVGPathElement, typeof paper.Path]>
  >([]);
  const [originalPositions, setOriginalPositions] = useState<
    Array<{ x: number; y: number }>
  >([]);
  const cursorPositionRef = useRef(cursorPosition);
  const animateToPositionRef = useRef<[number, number]>(null);
  const detailsRef = useRef<
    Array<{
      distance: number | null;
      positions: Array<{ x: number; y: number }>;
      bb: { left?: number; right?: number; top?: number; bottom?: number };
      endAnnealing: number;
    }>
  >([]);
  const [engine] = useState(Engine.create());
  const [cursorCircle, setCursorCircle] =
    useState<ReturnType<typeof Bodies.circle>>();
  const [chopClasses, setChopClasses] = useState("");
  const [reveal, setReveal] = useState(false);
  const { scroll } = useLocomotiveScroll();
  const offsetRef = useRef(0);
  const [active, setActive] = useState(false);
  const debouncer = useDebounce();

  useEffect(() => {
    if (scroll) {
      scroll.on("scroll", (obj: any) => {
        setActive("home-target" in obj.currentElements);
        /*
        offsetRef.current = Math.min(
          1,
          obj.scroll.y / document.documentElement.clientHeight
        );
        */
      });
    }
  }, [scroll]);

  const animate = useCallback(() => {
    if (animateToPositionRef.current) {
      setCursorPosition((prev) => {
        if (animateToPositionRef.current) {
          if (prev) {
            const newCoords = [
              prev[0] * 0.9 + animateToPositionRef.current![0] * 0.1,
              prev[1] * 0.9 + animateToPositionRef.current![1] * 0.1,
            ];
            if (
              Math.round(newCoords[0]) ==
                Math.round(animateToPositionRef.current![0]) &&
              Math.round(newCoords[1]) ==
                Math.round(animateToPositionRef.current![1])
            ) {
              animateToPositionRef.current = null;
            }
            return newCoords as [number, number];
          } else {
            return [...animateToPositionRef.current!];
          }
        }
        return prev;
      });
    }
    if (cursorPositionRef.current) {
      Body.setPosition(cursorCircle!, {
        x: cursorPositionRef.current[0],
        y: cursorPositionRef.current[1],
      });
    } else {
    }
    if (pathMap.length) {
      pathMap.forEach((p, index) => {
        const op = originalPositions[index];
        const mp = cursorPositionRef.current;
        const cursorVector = {
          x: p[1].position.x - (mp ? mp[0] : 0),
          y: p[1].position.y - (mp ? mp[1] : 0),
        };
        const cursorNorm = Vector.normalise(cursorVector);
        const cursorMag =
          1 / Math.pow(Math.max(20, Vector.magnitude(cursorVector)), 3);
        const positionVector = {
          x: p[1].position.x - op.x,
          y:
            p[1].position.y -
            op.y +
            (offsetRef.current
              ? offsetRef.current * document.documentElement.clientHeight
              : 0),
        };
        const positionNorm = Vector.normalise(positionVector);
        const positionMag = Vector.magnitude(positionVector);
        const velocityTowardsTarget =
          positionMag == 0
            ? 0
            : Vector.dot(p[1].velocity, positionVector) / positionMag;
        const drag = Vector.mult(
          positionNorm,
          positionMag < 0.01
            ? 0
            : Math.max(0, (0.01 * -velocityTowardsTarget) / (2 * positionMag))
        );
        const d = detailsRef.current[index];
        d.positions.push({ x: p[1].position.x, y: p[1].position.y });
        if (d.positions.length > 200) {
          d.positions.shift();
        }
        d.bb.left = d.bb.left
          ? d.positions.reduce((prev, curr) => (prev.x < curr.x ? prev : curr))
              .x
          : p[1].position.x;
        d.bb.right = d.bb.right
          ? d.positions.reduce((prev, curr) => (prev.x > curr.x ? prev : curr))
              .x
          : p[1].position.x;
        d.bb.top = d.bb.top
          ? d.positions.reduce((prev, curr) => (prev.y < curr.y ? prev : curr))
              .y
          : p[1].position.y;
        d.bb.bottom = d.bb.bottom
          ? d.positions.reduce((prev, curr) => (prev.y > curr.y ? prev : curr))
              .y
          : p[1].position.y;
        d.distance =
          d.distance == null
            ? positionMag
            : d.distance * 0.9 + positionMag * 0.1;

        if (cursorMag > 1 / 2000000) {
          Body.applyForce(
            p[1],
            { x: p[1].position.x, y: p[1].position.y },
            Vector.mult(cursorNorm, 100 * cursorMag)
          );
        }
        Body.applyForce(
          p[1],
          { x: p[1].position.x, y: p[1].position.y },
          Vector.mult(positionNorm, -positionMag / 100000)
        );
        Body.rotate(
          p[1],
          1 *
            Math.min(0.1, 1 / positionMag) *
            (p[1].angle > Math.PI
              ? Math.min(10, 2 * Math.PI - p[1].angle)
              : Math.max(-10, -p[1].angle))
        );
        Body.applyForce(p[1], { x: p[1].position.x, y: p[1].position.y }, drag);

        const maxTravel = Math.sqrt(
          Math.pow(d.bb.right! - d.bb.left!, 2) +
            Math.pow(d.bb.bottom! - d.bb.top!, 2)
        );

        if (
          maxTravel < 5 &&
          (d.distance > 5 ||
            (Math.abs(p[1].angle) > Math.PI / 4 &&
              Math.abs(p[1].angle) < (3 * Math.PI) / 4))
        ) {
          detailsRef.current[index].endAnnealing = Date.now() + 2000;
        }
        if (detailsRef.current[index].endAnnealing > Date.now()) {
          Body.applyForce(
            p[1],
            { x: p[1].bounds.min.x, y: p[1].bounds.min.y },
            { x: 0, y: -0.0003 }
          );
        }

        if (maxTravel < 5 && d.distance < 5) {
          p[0].setAttribute("fill", "darkred");
          p[0].setAttribute("filter", "url(#red-glow)");
        } else {
          p[0].setAttribute("fill", "gray");
          p[0].setAttribute("filter", "");
        }

        p[0].setAttribute(
          "transform",
          `translate(${p[1].position.x.toString()},${p[1].position.y.toString()}) rotate(${
            (360 * p[1].angle) / (Math.PI * 2)
          }) translate(${-op.x},${-op.y})`
        );
      });
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [requestRef, pathMap, cursorPositionRef, cursorCircle, originalPositions]);

  useEffect(() => {
    // either from an URL
    const buffer = fetch("/fonts/mekon-block.woff").then((res) =>
      res.arrayBuffer()
    );

    buffer.then((data) => {
      setFont(opentype.parse(data));
    });
  }, []);

  useEffect(() => {
    if (pathMap.length && show && reveal && active) {
      requestRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(requestRef.current);
    }
  }, [pathMap, show, reveal, animate, active]);

  useEffect(() => {
    const runner = Runner.create();
    Runner.run(runner, engine);
  }, [engine]);

  useEffect(() => {
    if (font && size) {
      const page: SVGElement = document.getElementById(
        "chop"
      ) as unknown as SVGElement;
      Array.from(page.children).forEach((child) => {
        if (child.tagName == "path") {
          page.removeChild(child);
        }
      });
      paper.clear();
      detailsRef.current = [];
      World.clear(engine.world, false);
      Engine.clear(engine);
      //const c: HTMLCanvasElement = document.getElementById("myCanvas") as HTMLCanvasElement;
      paper.setup();
      //paper.setup(c);
      const allPaths: Array<any> = [];
      const paths = font.getPaths(
        children!.toString()!,
        0,
        0,
        document.documentElement.clientWidth / children!.toString().length
      );
      let fullWidth = 0;
      let fullHeight = 0;
      paths.forEach((path: any) => {
        const pathDataStrings = path.toPathData().split("Z");
        pathDataStrings.pop();
        let twoPaths = false;
        pathDataStrings.forEach((pathDataString: any) => {
          while (!twoPaths) {
            const p = new paper.Path(pathDataString + "Z");
            fullWidth = Math.max(p.bounds.x + p.bounds.width, fullWidth);
            fullHeight = Math.max(p.bounds.height, fullHeight);

            p.fillColor = "black";
            const xCenter = p.bounds.centerX;
            const yCenter = p.bounds.centerY;
            const randomAngle = Math.random() * Math.PI;

            const p1 = new paper.Point(
              xCenter + 1000 * Math.cos(randomAngle),
              yCenter + 1000 * Math.sin(randomAngle)
            );
            const p2 = new paper.Point(
              xCenter - 1000 * Math.cos(randomAngle),
              yCenter - 1000 * Math.sin(randomAngle)
            );

            const line = new paper.Path.Line(p1, p2);

            //const newAngle = (Math.random() - 0.5) * 180;

            line.strokeWidth = 1;
            line.strokeColor = "black";
            //line.rotate(newAngle);

            line.remove();

            const intersections = p.getIntersections(line);

            const newLine = new paper.Path.Line(
              intersections[0].point,
              intersections[intersections.length - 1].point
            );
            newLine.strokeWidth = 1;
            newLine.strokeColor = "black";

            const result = p.divide(line, { trace: false });

            twoPaths = result.children.length == 2;

            if (!twoPaths) {
              continue;
            }

            const c0 = result.children[0].insertAbove(p);
            const c1 = result.children[0].insertAbove(p);

            allPaths.push(c0);
            allPaths.push(c1);
            detailsRef.current.push({
              distance: null,
              positions: [],
              bb: {},
              endAnnealing: 0,
            });
            detailsRef.current.push({
              distance: null,
              positions: [],
              bb: {},
              endAnnealing: 0,
            });
          }
          twoPaths = false;
        });
      });

      allPaths.forEach((path: any) => {
        path.position.x += size[0] / 2 - fullWidth / 2;
        path.position.y += size[1] / 2 + fullHeight / 2;
      });

      /*
      // create a renderer
      var render = Render.create({
          canvas: c,
          engine: engine
      });

      render.canvas.width = 800;
      render.canvas.height = 600;
      */

      const svgs = allPaths.map((p) => {
        const pEl = p.exportSVG({ bounds: "view" });
        page.appendChild(pEl);
        pEl.setAttribute("opacity", 0.9);
        pEl.setAttribute("fill", "white");
        return pEl;
      });

      // create two boxes and a ground
      const elements = [
        ...allPaths.map((p) => {
          return Bodies.fromVertices(0, 0, [
            Svg.pathToVertices(p.exportSVG({ bounds: "view" }), 1),
          ]);
        }),
      ];
      elements.forEach((el, index) => {
        const path = allPaths[index];
        el.friction = 0;
        Body.setMass(el, 1);
        Body.translate(el, {
          x: path.bounds.left + (el.position.x - el.bounds.min.x),
          y: path.bounds.top + (el.position.y - el.bounds.min.y),
        });
      });

      const ground = Bodies.rectangle(size[0] / 2, size[1], size[0], 100, {
        isStatic: true,
      });
      const ceiling = Bodies.rectangle(size[0] / 2, -50, size[0], 100, {
        isStatic: true,
      });
      const leftWall = Bodies.rectangle(-50, size[1] / 2, 100, size[1], {
        isStatic: true,
      });
      const rightWall = Bodies.rectangle(
        size[0] + 50,
        size[1] / 2,
        100,
        size[1],
        { isStatic: true }
      );

      const mc = Bodies.circle(0, 0, 10, { isStatic: true });

      setCursorCircle(mc);

      // add all of the bodies to the world
      Composite.add(engine.world, [
        ...elements,
        ground,
        ceiling,
        leftWall,
        rightWall,
        mc,
      ]);

      // run the renderer
      //Render.run(render);

      // create runner

      const map = svgs.map(
        (svg, index) => [svg, elements[index]] as [SVGPathElement, any]
      );
      setPathMap(map);
      const ops = elements.map((el) => {
        return {
          x: el.position.x,
          y: el.position.y,
        };
      });
      setOriginalPositions(ops);

      // run the engine
    }
  }, [children, font, engine, size]);

  const updateSize = useCallback(() => {
    debouncer(() =>
      setSize([
        document.documentElement.clientWidth,
        document.documentElement.clientHeight,
      ])
    );
  }, []);

  useLayoutEffect(() => {
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, [updateSize]);

  useLayoutEffect(() => {
    function mousemove(e: MouseEvent) {
      if (!animateToPositionRef.current) {
        setCursorPosition((prev) => {
          if (prev === undefined) {
            Composite.add(engine.world, cursorCircle!);
          }
          return [e.clientX, e.clientY];
        });
      }
    }
    function touchstart(e: TouchEvent) {
      animateToPositionRef.current = [
        e.touches[0].clientX,
        e.touches[0].clientY,
      ];
    }
    function touchend(e: TouchEvent) {
      setCursorPosition(undefined);
      Composite.remove(engine.world, cursorCircle!);
    }
    function touchmove(e: TouchEvent) {
      animateToPositionRef.current = null;
      setCursorPosition((prev) => {
        if (prev === undefined) {
          Composite.add(engine.world, cursorCircle!);
        }
        return [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
      });
    }
    if (show && reveal) {
      window.addEventListener("mousemove", mousemove);
      window.addEventListener("touchstart", touchstart);
      window.addEventListener("touchmove", touchmove);
      //window.addEventListener("touchend", touchend);
      //window.addEventListener("touchcancel", touchend);
    }
    return () => {
      window.removeEventListener("mousemove", mousemove);
      window.removeEventListener("touchstart", touchstart);
      window.removeEventListener("touchmove", touchmove);
      window.removeEventListener("touchend", touchend);
      window.removeEventListener("touchcancel", touchend);
    };
  }, [show, reveal]);

  useEffect(() => {
    cursorPositionRef.current = cursorPosition;
  }, [cursorPosition]);

  useLayoutEffect(() => {
    if (size) {
      engine.gravity.scale = 0.0;
      if (cursorPosition) {
        engine.gravity.x = (cursorPosition[0] - size[0] / 2) / size[0];
        engine.gravity.y = (cursorPosition[1] - size[1] / 2) / size[1];
      }
    }
  }, [cursorPosition, size, engine]);

  useLayoutEffect(() => {
    setChopClasses(
      clsx({
        "duration-1000": true,
        hidden: !show && !reveal,
        "opacity-100": show && reveal,
        "opacity-0": (show && !reveal) || (!show && reveal),
        "transition-opacity": true,
        "will-change-opacity": true,
        "font-[mekon-block]": true,
        "tracking-[1dvw]": true,
        absolute: true,
        "w-full": true,
        "h-full": true,
        flex: true,
        "items-center": true,
        "justify-center": true,
        "z-10": true,
        "bg-[var(--dark)]": true,
        "text-7xl": true,
        "font-bold": true,
        "cursor-none": true,
        "light-grain": true,
      })
    );
    if (show) {
      setTimeout(() => {
        setReveal(true);
      }, 10);
    } else {
      setTimeout(() => {
        setReveal(false);
      }, 1000);
    }
  }, [show, reveal]);

  return (
    <div className={chopClasses}>
      {
        //<canvas id="myCanvas" width="600" height="400" className="absolute"/>
      }
      <svg
        id="chop"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        fill="currentColor"
      >
        <defs>
          <filter
            id="red-glow"
            filterUnits="userSpaceOnUse"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="5"
              result="blur5"
            />
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur10"
            />
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="20"
              result="blur20"
            />
            <feMerge result="blur-merged">
              <feMergeNode in="blur5" />
              <feMergeNode in="blur10" />
              <feMergeNode in="blur20" />
            </feMerge>
            <feFlood floodColor="rgb(255,64,64)" result="glowColor" />
            <feComposite
              in="glow-color"
              in2="blur-merged"
              operator="in"
              result="red-blur"
            />
            <feMerge>
              <feMergeNode in="red-blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {cursorPosition && (
          <circle
            id="mouseCircle"
            cx={cursorPosition[0]}
            cy={cursorPosition[1]}
            r={10}
            fill="red"
          />
        )}
      </svg>
    </div>
  );
}
