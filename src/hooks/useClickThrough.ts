import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

/**
 * Manages window click-through state for the overlay window.
 * When active, mouse events pass through to the app behind.
 *
 * @param shouldClickThrough - Whether content is showing that warrants click-through
 * @param inputRef - Optional ref to the input element, used to detect when user is typing
 */
export function useClickThrough(
  shouldClickThrough: boolean,
  inputRef?: React.RefObject<HTMLInputElement | null> | null
) {
  const isInputFocusedRef = useRef(false);
  const currentStateRef = useRef(false);

  // Apply click-through state
  useEffect(() => {
    const newState = shouldClickThrough && !isInputFocusedRef.current;

    if (newState !== currentStateRef.current) {
      currentStateRef.current = newState;
      invoke("set_click_through", { ignore: newState }).catch((e) =>
        console.error("Failed to set click-through:", e)
      );
    }
  }, [shouldClickThrough]);

  // Listen for focus-text-input event (global shortcut to re-focus input)
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setup = async () => {
      unlisten = await listen("focus-text-input", () => {
        // Temporarily disable click-through so user can type
        if (currentStateRef.current) {
          isInputFocusedRef.current = true;
          currentStateRef.current = false;
          invoke("set_click_through", { ignore: false }).catch((e) =>
            console.error("Failed to disable click-through:", e)
          );
        }
      });
    };

    setup();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Track input blur to re-engage click-through
  useEffect(() => {
    const input = inputRef?.current;
    if (!input) return;

    const handleBlur = () => {
      if (isInputFocusedRef.current) {
        isInputFocusedRef.current = false;
        // Re-engage click-through if content is still showing
        if (shouldClickThrough && !currentStateRef.current) {
          currentStateRef.current = true;
          invoke("set_click_through", { ignore: true }).catch((e) =>
            console.error("Failed to re-enable click-through:", e)
          );
        }
      }
    };

    input.addEventListener("blur", handleBlur);
    return () => input.removeEventListener("blur", handleBlur);
  }, [inputRef, shouldClickThrough]);

  // Cleanup: disable click-through when unmounting
  useEffect(() => {
    return () => {
      if (currentStateRef.current) {
        currentStateRef.current = false;
        invoke("set_click_through", { ignore: false }).catch(() => {});
      }
    };
  }, []);
}
