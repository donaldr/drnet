import { LocomotiveScrollOptions, Scroll } from "locomotive-scroll";
import {
  createContext,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDebounce } from "use-debounce";
import useResizeObserver from "use-resize-observer";

type WithChildren<T = Record<string, unknown>> = T & {
  children?: React.ReactNode;
};

export interface LocomotiveScrollContextValue {
  scroll: Scroll | null;
  isReady: boolean;
}

export const LocomotiveScrollContext =
  createContext<LocomotiveScrollContextValue>({
    scroll: null,
    isReady: false,
  });

export interface LocomotiveScrollProviderProps {
  options: LocomotiveScrollOptions;
  containerRef: RefObject<HTMLDivElement | null>;
  onUpdate?: (scroll: Scroll) => void;
  location?: string;
  onLocationChange?: (scroll: Scroll) => void;
  start: boolean;
}

export function LocomotiveScrollProvider({
  children,
  options,
  containerRef,
  onUpdate,
  location,
  onLocationChange,
  start,
}: WithChildren<LocomotiveScrollProviderProps>) {
  const { height: containerHeight } = useResizeObserver<HTMLDivElement>({
    ref: containerRef as RefObject<HTMLDivElement>,
  });
  const [isReady, setIsReady] = useState(false);
  const [libset, setLibset] = useState(false);
  const LocomotiveScrollLibRef = useRef<typeof Scroll | null>(null);
  const LocomotiveScrollRef = useRef<Scroll | null>(null);
  const [height] = useDebounce(containerHeight, 100);

  useEffect(() => {
    (async () => {
      try {
        LocomotiveScrollLibRef.current = (
          await import("locomotive-scroll")
        ).default;
        setLibset(true);
      } catch (error) {
        throw Error(`react-locomotive-scroll: ${error}`);
      }
    })();

    return () => {
      LocomotiveScrollRef.current?.destroy();
      setIsReady(false);
    };
  }, []);

  useEffect(() => {
    if (start && LocomotiveScrollLibRef.current) {
      try {
        const dataScrollContainer = document.querySelector(
          "[data-scroll-container]"
        );

        if (!dataScrollContainer) {
          console.warn(
            `react-locomotive-scroll: [data-scroll-container] dataset was not found. You likely forgot to add it which will prevent Locomotive Scroll to work.`
          );
        }

        LocomotiveScrollRef.current = new LocomotiveScrollLibRef.current({
          el: dataScrollContainer ?? undefined,
          ...options,
        });

        setIsReady(true); // Re-render the context
      } catch (error) {
        throw Error(`react-locomotive-scroll: ${error}`);
      }
    }
  }, [start, libset, options]);

  useEffect(() => {
    if (!LocomotiveScrollRef.current) {
      return;
    }

    LocomotiveScrollRef.current.update();

    if (onUpdate) {
      onUpdate(LocomotiveScrollRef.current);
    }
  }, [height, start, onUpdate]);

  useEffect(() => {
    if (!LocomotiveScrollRef.current || !location) {
      return;
    }

    LocomotiveScrollRef.current.update();

    if (onLocationChange) {
      onLocationChange(LocomotiveScrollRef.current);
    }
  }, [location, onLocationChange]);

  return (
    <LocomotiveScrollContext.Provider
      value={{ scroll: LocomotiveScrollRef.current, isReady }}
    >
      {children}
    </LocomotiveScrollContext.Provider>
  );
}

export function useLocomotiveScroll(): LocomotiveScrollContextValue {
  const context = useContext(LocomotiveScrollContext);

  if (context === undefined) {
    console.warn(
      "react-locomotive-scroll: the context is missing. You may be using the hook without registering LocomotiveScrollProvider, or you may be using the hook in a component which is not wrapped by LocomotiveScrollProvider."
    );
  }

  return context;
}
