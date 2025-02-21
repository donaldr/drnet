import { RefObject } from "react";
import { createGlobalState } from "react-hooks-global-state";

const initialState: {
  active: string;
  activeList: Array<string>;
  inView: Array<string>;
  fonts: Record<string, opentype.Font>;
  navigating: boolean;
  doneLoading: boolean;
} = {
  active: "",
  activeList: [],
  navigating: false,
  inView: [],
  fonts: {},
  doneLoading: false,
};
export const { useGlobalState } = createGlobalState(initialState);

export const manualPush = { current: false } as RefObject<boolean>;
export const navigating = { current: false } as RefObject<boolean>;
export const pathList = { current: [] } as RefObject<
  Array<{ pathName: string; id: string }>
>;

export const fontFetching = { current: {} } as RefObject<
  Record<string, boolean>
>;

const eventHandlerCount = { current: {} } as RefObject<Record<string, number>>;

export function incrementEventHandlerCount(label: string) {
  eventHandlerCount.current[label] = ++eventHandlerCount.current[label] || 0;
  //console.log(`${label} ${eventHandlerCount.current[label]}`);
}

export function decrementEventHandlerCount(label: string) {
  eventHandlerCount.current[label] = --eventHandlerCount.current[label] || 0;
  //console.log(`${label} ${eventHandlerCount.current[label]}`);
}
