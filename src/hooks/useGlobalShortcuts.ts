import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef } from "react";
import { getShortcutsConfig } from "@/lib";

// Global singleton to prevent multiple event listeners in StrictMode
let globalEventListeners: {
  focus?: UnlistenFn;
  audio?: UnlistenFn;
  screenshot?: UnlistenFn;
  sendScreenshots?: UnlistenFn;
  systemAudio?: UnlistenFn;
  muteVoice?: UnlistenFn;
  customShortcut?: UnlistenFn;
  registrationError?: UnlistenFn;
  scrollStart?: UnlistenFn;
  scrollStop?: UnlistenFn;
} = {};

// Global debounce for screenshot events to prevent duplicates
let lastScreenshotEventTime = 0;

// Global callback refs
let globalInputRef: HTMLInputElement | null = null;
let globalAudioCallback: (() => void) | null = null;
let globalScreenshotCallback: (() => void | Promise<void>) | null = null;
let globalSendScreenshotsCallback: (() => void | Promise<void>) | null = null;
let globalSystemAudioCallback: (() => void) | null = null;
let globalMuteVoiceCallback: (() => void) | null = null;
let globalCustomShortcutCallbacks: Map<string, () => void> = new Map();

// Global scroll state
let globalScrollRef: HTMLDivElement | null = null;
const scrollAnimationFrames: Map<string, number> = new Map();

export const useGlobalShortcuts = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioCallbackRef = useRef<(() => void) | null>(null);
  const screenshotCallbackRef = useRef<(() => void) | null>(null);
  const sendScreenshotsCallbackRef = useRef<(() => void | Promise<void>) | null>(null);
  const systemAudioCallbackRef = useRef<(() => void) | null>(null);
  const muteVoiceCallbackRef = useRef<(() => void) | null>(null);
  const customShortcutCallbacksRef = useRef<Map<string, () => void>>(new Map());

  const checkShortcutsRegistered = useCallback(async (): Promise<boolean> => {
    try {
      const registered = await invoke<boolean>("check_shortcuts_registered");
      return registered;
    } catch (error) {
      console.error("Failed to check shortcuts:", error);
      return false;
    }
  }, []);

  const getShortcuts = useCallback(async (): Promise<Record<
    string,
    string
  > | null> => {
    try {
      const shortcuts = await invoke<Record<string, string>>(
        "get_registered_shortcuts"
      );
      return shortcuts;
    } catch (error) {
      console.error("Failed to get shortcuts:", error);
      return null;
    }
  }, []);

  const updateShortcuts = useCallback(async (): Promise<boolean> => {
    try {
      const config = getShortcutsConfig();
      await invoke("update_shortcuts", { config });
      return true;
    } catch (error) {
      console.error("Failed to update shortcuts:", error);
      return false;
    }
  }, []);

  // Register input element for auto-focus
  const registerInputRef = useCallback((input: HTMLInputElement | null) => {
    inputRef.current = input;
    globalInputRef = input;
  }, []);

  // Register audio callback
  const registerAudioCallback = useCallback((callback: () => void) => {
    audioCallbackRef.current = callback;
    globalAudioCallback = callback;
  }, []);

  // Register screenshot callback
  const registerScreenshotCallback = useCallback(
    (callback: () => void | Promise<void>) => {
      screenshotCallbackRef.current = callback;
      globalScreenshotCallback = callback;
    },
    []
  );

  // Register send screenshots callback
  const registerSendScreenshotsCallback = useCallback(
    (callback: () => void | Promise<void>) => {
      sendScreenshotsCallbackRef.current = callback;
      globalSendScreenshotsCallback = callback;
    },
    []
  );

  // Register system audio callback
  const registerSystemAudioCallback = useCallback((callback: () => void) => {
    systemAudioCallbackRef.current = callback;
    globalSystemAudioCallback = callback;
  }, []);

  // Register mute voice callback
  const registerMuteVoiceCallback = useCallback(
    (callback: (() => void) | null) => {
      muteVoiceCallbackRef.current = callback;
      globalMuteVoiceCallback = callback;
    },
    []
  );

  // Register custom shortcut callback
  const registerCustomShortcutCallback = useCallback(
    (actionId: string, callback: () => void) => {
      customShortcutCallbacksRef.current.set(actionId, callback);
      globalCustomShortcutCallbacks.set(actionId, callback);
    },
    []
  );

  // Unregister custom shortcut callback
  const unregisterCustomShortcutCallback = useCallback((actionId: string) => {
    customShortcutCallbacksRef.current.delete(actionId);
    globalCustomShortcutCallbacks.delete(actionId);
  }, []);

  // Register scroll area ref for scroll shortcut
  const registerScrollRef = useCallback((ref: HTMLDivElement | null) => {
    globalScrollRef = ref;
  }, []);

  // Setup event listeners using global singleton
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        // Clean up any existing global listeners first
        if (globalEventListeners.focus) {
          try {
            globalEventListeners.focus();
          } catch (error) {
            console.warn("Error cleaning up focus listener:", error);
          }
        }
        if (globalEventListeners.audio) {
          try {
            globalEventListeners.audio();
          } catch (error) {
            console.warn("Error cleaning up audio listener:", error);
          }
        }
        if (globalEventListeners.screenshot) {
          try {
            globalEventListeners.screenshot();
          } catch (error) {
            console.warn("Error cleaning up screenshot listener:", error);
          }
        }
        if (globalEventListeners.sendScreenshots) {
          try {
            globalEventListeners.sendScreenshots();
          } catch (error) {
            console.warn("Error cleaning up send screenshots listener:", error);
          }
        }
        if (globalEventListeners.systemAudio) {
          try {
            globalEventListeners.systemAudio();
          } catch (error) {
            console.warn("Error cleaning up system audio listener:", error);
          }
        }
        if (globalEventListeners.muteVoice) {
          try {
            globalEventListeners.muteVoice();
          } catch (error) {
            console.warn("Error cleaning up mute voice listener:", error);
          }
        }
        if (globalEventListeners.customShortcut) {
          try {
            globalEventListeners.customShortcut();
          } catch (error) {
            console.warn("Error cleaning up custom shortcut listener:", error);
          }
        }
        if (globalEventListeners.registrationError) {
          try {
            globalEventListeners.registrationError();
          } catch (error) {
            console.warn(
              "Error cleaning up shortcut registration error listener:",
              error
            );
          }
        }
        if (globalEventListeners.scrollStart) {
          try {
            globalEventListeners.scrollStart();
          } catch (error) {
            console.warn("Error cleaning up scroll start listener:", error);
          }
        }
        if (globalEventListeners.scrollStop) {
          try {
            globalEventListeners.scrollStop();
          } catch (error) {
            console.warn("Error cleaning up scroll stop listener:", error);
          }
        }

        // Listen for focus text input event
        const unlistenFocus = await listen("focus-text-input", () => {
          setTimeout(() => {
            if (globalInputRef) {
              globalInputRef.focus();
            }
          }, 100);
        });
        globalEventListeners.focus = unlistenFocus;

        // Listen for audio recording event
        const unlistenAudio = await listen("start-audio-recording", () => {
          if (globalAudioCallback) {
            globalAudioCallback();
          }
        });
        globalEventListeners.audio = unlistenAudio;

        // Listen for screenshot trigger event with debouncing
        const unlistenScreenshot = await listen("trigger-screenshot", () => {
          const now = Date.now();
          const timeSinceLastEvent = now - lastScreenshotEventTime;

          // Debounce screenshot events (300ms minimum interval)
          if (timeSinceLastEvent < 300) {
            return;
          }

          lastScreenshotEventTime = now;

          if (globalScreenshotCallback) {
            try {
              Promise.resolve(globalScreenshotCallback())
                .catch((error) => {
                  console.error("Screenshot shortcut callback failed:", error);
                })
                .then(() => {
                  // no-op
                });
            } catch (error) {
              console.error(
                "Failed to run screenshot shortcut callback:",
                error
              );
            }
          } else {
            console.warn(
              "Screenshot shortcut triggered but no callback registered."
            );
          }
        });
        globalEventListeners.screenshot = unlistenScreenshot;

        // Listen for send screenshots event (batch send in auto mode)
        const unlistenSendScreenshots = await listen(
          "trigger-send-screenshots",
          () => {
            if (globalSendScreenshotsCallback) {
              try {
                Promise.resolve(globalSendScreenshotsCallback()).catch(
                  (error) => {
                    console.error(
                      "Send screenshots shortcut callback failed:",
                      error
                    );
                  }
                );
              } catch (error) {
                console.error(
                  "Failed to run send screenshots shortcut callback:",
                  error
                );
              }
            }
          }
        );
        globalEventListeners.sendScreenshots = unlistenSendScreenshots;

        // Listen for system audio toggle event
        const unlistenSystemAudio = await listen("toggle-system-audio", () => {
          if (globalSystemAudioCallback) {
            globalSystemAudioCallback();
          }
        });
        globalEventListeners.systemAudio = unlistenSystemAudio;

        // Listen for mute voice toggle event
        const unlistenMuteVoice = await listen("toggle-mute-voice", () => {
          if (globalMuteVoiceCallback) {
            globalMuteVoiceCallback();
          }
        });
        globalEventListeners.muteVoice = unlistenMuteVoice;

        // Listen for custom shortcut events
        const unlistenCustomShortcut = await listen<{ action: string }>(
          "custom-shortcut-triggered",
          (event) => {
            const actionId = event.payload.action;
            const callback = globalCustomShortcutCallbacks.get(actionId);
            if (callback) {
              callback();
            } else {
              console.warn(
                `No callback registered for custom shortcut: ${actionId}`
              );
            }
          }
        );
        globalEventListeners.customShortcut = unlistenCustomShortcut;

        const unlistenRegistrationError = await listen<
          Array<[string, string, string]>
        >("shortcut-registration-error", (event) => {
          window.dispatchEvent(
            new CustomEvent("shortcutRegistrationError", {
              detail: event.payload,
            })
          );
        });
        globalEventListeners.registrationError = unlistenRegistrationError;

        // Listen for scroll response start (continuous scroll while held)
        const unlistenScrollStart = await listen<{ direction: string }>(
          "scroll-response-start",
          (event) => {
            const { direction } = event.payload;
            if (!globalScrollRef) return;

            const viewport = globalScrollRef.querySelector(
              "[data-radix-scroll-area-viewport]"
            ) as HTMLElement | null;
            if (!viewport) return;

            // Don't start duplicate scroll for same direction
            if (scrollAnimationFrames.has(direction)) return;

            const step = direction === "up" ? -5 : 5;
            const loop = () => {
              viewport.scrollTop += step;
              scrollAnimationFrames.set(direction, requestAnimationFrame(loop));
            };
            scrollAnimationFrames.set(direction, requestAnimationFrame(loop));
          }
        );
        globalEventListeners.scrollStart = unlistenScrollStart;

        // Listen for scroll response stop
        const unlistenScrollStop = await listen<{ direction: string }>(
          "scroll-response-stop",
          (event) => {
            const { direction } = event.payload;
            const frameId = scrollAnimationFrames.get(direction);
            if (frameId !== undefined) {
              cancelAnimationFrame(frameId);
              scrollAnimationFrames.delete(direction);
            }
          }
        );
        globalEventListeners.scrollStop = unlistenScrollStop;
      } catch (error) {
        console.error("Failed to setup event listeners:", error);
      }
    };

    setupEventListeners();
  }, []);

  return {
    checkShortcutsRegistered,
    getShortcuts,
    updateShortcuts,
    registerInputRef,
    registerAudioCallback,
    registerScreenshotCallback,
    registerSendScreenshotsCallback,
    registerSystemAudioCallback,
    registerMuteVoiceCallback,
    registerCustomShortcutCallback,
    unregisterCustomShortcutCallback,
    registerScrollRef,
  };
};
