# Multi-Screenshot Auto Mode with Send Shortcut

**Date:** 2026-03-26
**Status:** Approved

## Problem

Auto mode currently sends each screenshot immediately on capture (Ctrl+Shift+S) with the configured `autoPrompt`. Users cannot accumulate multiple screenshots before sending them as a batch.

## Solution

Change auto mode so Ctrl+Shift+S accumulates screenshots into the existing `attachedFiles[]` array. Add a new global shortcut `send_screenshots` (Ctrl+Shift+Enter / Cmd+Shift+Enter) that submits all accumulated screenshots with the `autoPrompt` and clears the array immediately.

## Design

### 1. New Shortcut: `send_screenshots`

- **Default binding:** Cmd+Shift+Enter (Mac) / Ctrl+Shift+Enter (Windows/Linux)
- **Action:** Submits all accumulated screenshots with the auto prompt

**Files:**
- `src/config/shortcuts.ts` — add `send_screenshots` to default shortcuts config
- `src/types/shortcuts.ts` — add `send_screenshots` to the shortcut action union type
- `src-tauri/src/shortcuts.rs` — add `"send_screenshots"` case in `handle_shortcut_action` that emits `trigger-send-screenshots` event

Same registration/event pattern as existing `screenshot` and `voice_screenshot` shortcuts.

### 2. Auto Mode Behavior Change

**Current behavior:** `handleScreenshotSubmit(base64, config.autoPrompt)` immediately sends to AI.

**New behavior:** Auto mode Ctrl+Shift+S appends the screenshot to `state.attachedFiles[]` — same path as manual mode. No immediate submission.

**New event listener in `useGlobalShortcuts.ts`:** Listen for `trigger-send-screenshots`:
1. If `attachedFiles.length === 0`, silently ignore (no-op)
2. Read `autoPrompt` from screenshot config
3. Submit all accumulated screenshots with `autoPrompt` as the message
4. Clear `attachedFiles[]` immediately on send

**File:** `useCompletion.ts` — modify the auto mode branch in `handleScreenshotSubmit` to accumulate instead of immediately submit.

### 3. UI

No new UI components needed. The existing thumbnail row and counter badge from `attachedFiles[]` already render accumulated screenshots with individual remove buttons. Users see their screenshots in the app UI as they accumulate.

**Settings text update:** `ScreenshotConfigs.tsx` — update the auto mode description from "only one screenshot can be submitted at a time" to reflect batch behavior with the send shortcut.

### 4. Edge Cases

- **Max limit:** Existing `MAX_FILES = 6` cap applies. 7th capture attempt is silently ignored.
- **Mode switching mid-accumulation:** Screenshots stay in `attachedFiles[]` and behave as normal manual mode attachments. No special handling.
- **Ctrl+Shift+Enter in manual mode:** No-op (silently ignored). Only triggers in auto mode with screenshots present.
- **Ctrl+Shift+Enter in voice mode:** No-op. Voice mode has its own submission flow via transcription.
- **Zero screenshots on send:** Silently ignored.
