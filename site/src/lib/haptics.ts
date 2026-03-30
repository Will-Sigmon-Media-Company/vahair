"use client";

import { WebHaptics } from "web-haptics";
import type { HapticInput, TriggerOptions } from "web-haptics";

let instance: WebHaptics | null = null;

function getInstance(): WebHaptics {
  if (!instance) {
    instance = new WebHaptics();
  }
  return instance;
}

export function haptic(input: HapticInput = "selection", options?: TriggerOptions) {
  if (typeof window === "undefined") return;
  getInstance().trigger(input, options);
}

export const tap = () => haptic("selection");
export const press = () => haptic("light");
export const confirm = () => haptic("success");
export const warn = () => haptic("warning");
export const reject = () => haptic("error");

export { WebHaptics };
export type { HapticInput, TriggerOptions };
