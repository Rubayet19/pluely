import { ShortcutAction } from "@/types";

export const DEFAULT_SHORTCUT_ACTIONS: ShortcutAction[] = [
  {
    id: "toggle_dashboard",
    name: "Toggle Dashboard",
    description: "Open/Close the dashboard window",
    defaultKey: {
      macos: "cmd+shift+d",
      windows: "ctrl+shift+d",
      linux: "ctrl+shift+d",
    },
  },
  {
    id: "toggle_window",
    name: "Toggle Window",
    description: "Show/Hide the main window",
    defaultKey: {
      macos: "cmd+backslash",
      windows: "ctrl+backslash",
      linux: "ctrl+backslash",
    },
  },
  {
    id: "focus_input",
    name: "Refocus Input Box",
    description: "Bring Pluely forward and place the cursor in the input area",
    defaultKey: {
      macos: "cmd+shift+i",
      windows: "ctrl+shift+i",
      linux: "ctrl+shift+i",
    },
  },
  {
    id: "move_window",
    name: "Move Window",
    description: "Move overlay with arrow keys (hold to move continuously)",
    defaultKey: {
      macos: "cmd",
      windows: "ctrl",
      linux: "ctrl",
    },
  },
  {
    id: "system_audio",
    name: "System Audio",
    description: "Toggle system audio capture",
    defaultKey: {
      macos: "cmd+shift+u",
      windows: "ctrl+shift+u",
      linux: "ctrl+shift+u",
    },
  },
  {
    id: "mute_voice",
    name: "Mute Voice",
    description: "Mute/unmute audio capture in voice mode",
    defaultKey: {
      macos: "cmd+shift+m",
      windows: "ctrl+shift+m",
      linux: "ctrl+shift+m",
    },
  },
  {
    id: "audio_recording",
    name: "Voice Input",
    description: "Start voice recording",
    defaultKey: {
      macos: "cmd+shift+a",
      windows: "ctrl+shift+a",
      linux: "ctrl+shift+a",
    },
  },
  {
    id: "screenshot",
    name: "Screenshot",
    description: "Capture screenshot",
    defaultKey: {
      macos: "cmd+shift+s",
      windows: "ctrl+shift+s",
      linux: "ctrl+shift+s",
    },
  },
  {
    id: "send_screenshots",
    name: "Send Screenshots",
    description: "Send accumulated screenshots in auto mode",
    defaultKey: {
      macos: "cmd+shift+enter",
      windows: "ctrl+shift+enter",
      linux: "ctrl+shift+enter",
    },
  },
  {
    id: "toggle_conversation",
    name: "Toggle Conversation View",
    description: "Toggle between AI response and full conversation in voice mode",
    defaultKey: {
      macos: "cmd+k",
      windows: "ctrl+k",
      linux: "ctrl+k",
    },
  },
  {
    id: "scroll_response",
    name: "Scroll Response",
    description: "Scroll AI response with up/down arrow keys (hold to scroll continuously)",
    defaultKey: {
      macos: "cmd+shift",
      windows: "ctrl+shift",
      linux: "ctrl+shift",
    },
  },
];
