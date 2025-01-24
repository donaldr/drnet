import {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocomotiveScroll } from "react-locomotive-scroll";

import { WheelGestures } from "wheel-gestures";
import MA from "moving-average";

const wheelGestures = WheelGestures();
const ma = MA(5);

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

function useWaitWheelInitial() {
  const { scroll } = useLocomotiveScroll();
  const [intentionalWheel, setIntentionalWheel] = useState(false);
  const [intentionalTouchStart, setIntentionalTouchStart] = useState(0);
  const waitingRef = useRef(false);
  const readyRef = useRef(true);
  const countRef = useRef<number>(0);
  const previousMaRef = useRef<number>(0);
  const directionCountRef = useRef<number>(0);

  useEffect(() => {
    if (
      scroll &&
      (intentionalWheel || intentionalTouchStart) &&
      waitingRef.current
    ) {
      scroll.start();
      readyRef.current = true;
      waitingRef.current = false;
    }
  }, [intentionalWheel, intentionalTouchStart, scroll]);

  const wait = useCallback(() => {
    console.log("WAIT!");
    waitingRef.current = true;
  }, []);

  const stop = useCallback(() => {
    if (scroll) {
      readyRef.current = false;
      scroll.stop();
    }
  }, [scroll]);

  const test = () => {
    setIntentionalWheel(false);
    setIntentionalTouchStart(0);
  };

  const throttler = useThrottle();

  useEffect(() => {
    const throttleWheel = () => throttler(test, 10);
    document.documentElement.addEventListener("wheel", throttleWheel);
    wheelGestures.observe(document.documentElement);
    wheelGestures.on("wheel", (wheelEventState) => {
      ma.push(countRef.current, Math.abs(wheelEventState.axisVelocity[1]));
      const currentMa = ma.movingAverage();
      if (directionCountRef.current > 0) {
        if (currentMa >= previousMaRef.current) {
          directionCountRef.current += 1;
        } else {
          directionCountRef.current = -1;
        }
      } else if (directionCountRef.current < 0) {
        if (currentMa <= previousMaRef.current) {
          directionCountRef.current -= 1;
        } else {
          directionCountRef.current = 1;
        }
      } else {
        if (currentMa < previousMaRef.current) {
          directionCountRef.current = -1;
        } else if (currentMa > previousMaRef.current) {
          directionCountRef.current = 1;
        }
      }
      if (directionCountRef.current > 3) {
        setIntentionalWheel(true);
      }
      previousMaRef.current = currentMa;
      countRef.current += 1;
    });
  }, [throttler]);

  const touchstart = useCallback(() => {
    setIntentionalTouchStart((prev) => prev + 1);
  }, []);

  useEffect(() => {
    document.addEventListener("touchstart", touchstart);
    return () => document.removeEventListener("touchstart", touchstart);
  }, [touchstart]);

  return { wait, stop, readyRef };
}

type WaitWheelResult = {
  stop: () => void;
  wait: () => void;
  readyRef: RefObject<boolean>;
};

export function useWaitWheel() {
  return useContext(WaitWheelContext) as WaitWheelResult;
}

export const WaitWheelContext = createContext<WaitWheelResult | null>(null);

export function WaitWheelProvider({ children }: { children: ReactNode }) {
  const waitWheel = useWaitWheelInitial();
  return (
    <WaitWheelContext.Provider value={waitWheel}>
      {children}
    </WaitWheelContext.Provider>
  );
}

export const useThrottle = () => {
  const throttleSeed = useRef<ReturnType<typeof setTimeout> | null>(null);

  const throttleFunction = useRef((func: any, delay = 200) => {
    if (!throttleSeed.current) {
      // Call the callback immediately for the first time
      func();
      throttleSeed.current = setTimeout(() => {
        throttleSeed.current = null;
      }, delay);
    }
  });

  return throttleFunction.current;
};

export function useTemplateFunction(template: string) {
  return useCallback(() => {
    const sanitized = template
      .replace(/\$\{([\s]*[^;\s\{]+[\s]*)\}/g, function (_, match) {
        return `\$\{map.${match.trim()}\}`;
      })
      // Afterwards, replace anything that's not ${map.expressions}' (etc) with a blank string.
      .replace(/(\$\{(?!map\.)[^}]+\})/g, "");

    return Function("map", `return \`${sanitized}\``) as unknown as (
      map: Record<string, any>
    ) => string;
  }, [template]);
}
