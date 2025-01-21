import { RefObject } from "react";
import { createGlobalState } from "react-hooks-global-state";

const initialState: {
  active: string;
  activeList: Array<string>;
  inView: Array<string>;
  fonts: Record<string, opentype.Font>;
  navigating: boolean;
} = {
  active: "",
  activeList: [],
  navigating: false,
  inView: [],
  fonts: {},
};
export const { useGlobalState } = createGlobalState(initialState);

export const manualPush = { current: false } as RefObject<boolean>;
export const navigating = { current: false } as RefObject<boolean>;
export const pathList = { current: [] } as RefObject<
  Array<{ pathName: string; id: string }>
>;
