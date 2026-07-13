# Multi-Screenshot Attachment in Voice Mode

**Date:** 2026-03-23
**Status:** Draft
**Scope:** Frontend-only change (React state + UI)

## Problem

Voice mode currently supports attaching only one screenshot at a time. The state is `screenshotImage: string | null` (single base64 PNG), and each new capture replaces the previous one. Users need to attach multiple screenshots to provide richer visual context with their voice transcriptions.

## Design

### Summary

Change the screenshot state from a single value to an array, cap at 6 images, render thumbnails in a horizontal row with individual remove buttons, and disable the capture button when the cap is reached (silent no-op). No backend or Rust changes required — `imagesBase64: string[]` already accepts multiple images.

### State Changes

**`useSystemAudio.ts` hook:**
- `screenshotRef`: `useRef<string | null>(null)` → `useRef<string[]>([])`
- Speech-detected handler (line 254-256): change from truthiness check to length check, capture full array copy, reset to `[]`:
  ```typescript
  // Before (single):
  const images = screenshotRef.current ? [screenshotRef.current] : [];
  screenshotRef.current = null;
  // After (multi):
  const images = [...screenshotRef.current];
  screenshotRef.current = [];
  ```
  Note: `[]` is truthy in JS, so the old `screenshotRef.current ? ...` pattern would break with an empty array ref.
- `startNewConversation` (line 773-789): add `screenshotRef.current = []` to clear stale screenshots when starting fresh
- `stopCapture` (line 615-642): add `screenshotRef.current = []` to prevent stale screenshots leaking across capture sessions

**`speech/index.tsx` component:**
- `screenshotImage: string | null` → `screenshots: string[]` (initialized to `[]`)
- `handleCaptureScreenshot`: append to array instead of replace, guard against `screenshots.length >= MAX_SCREENSHOTS`
- `handleRemoveScreenshot`: accept an index parameter, splice that element from the array
- Sync effect (line 104-106): sync `screenshots` array to `screenshotRef.current`
- Clear effect (line 109-113): reset to `[]` when `isProcessing` becomes true
- Add effect to clear `screenshots` when `conversation.id` changes (handles `startNewConversation` clearing UI thumbnails)

### Constants

```typescript
const MAX_SCREENSHOTS = 6;
```

Defined in `speech/index.tsx` (component-level constant, no config file needed).

### Capture Handler Changes

```typescript
const handleCaptureScreenshot = useCallback(async () => {
  if (isCapturingScreenshot) return;
  if (screenshots.length >= MAX_SCREENSHOTS) return; // silent no-op

  setIsCapturingScreenshot(true);
  try {
    const base64: string = await invoke("capture_to_base64");
    if (base64) {
      setScreenshots(prev => [...prev, base64]);
    }
  } catch (err) {
    console.error("Failed to capture screenshot:", err);
  } finally {
    setIsCapturingScreenshot(false);
  }
}, [isCapturingScreenshot, screenshots.length]);
```

### Remove Handler Changes

```typescript
const handleRemoveScreenshot = useCallback((index: number) => {
  setScreenshots(prev => prev.filter((_, i) => i !== index));
}, []);
```

### Screenshot Button Changes

The screenshot button (lines 237-256) needs three changes:
1. **Disabled state**: also disable when `screenshots.length >= MAX_SCREENSHOTS`
2. **Visual state**: show filled/primary variant when `screenshots.length > 0` (instead of checking `screenshotImage`)
3. **Counter badge**: show count when > 0 in button text, e.g., `Screenshot (3/6)`

The counter in the button text is separate from the counter in the thumbnail container (`3/6 attached`).

### UI: Thumbnail Row

Replace the single screenshot preview (lines 293-318) with a horizontal row of thumbnails:

```
┌──────────────────────────────────────────────┐
│ [img1 ×] [img2 ×] [img3 ×]    3/6 attached  │
│ Will be sent with next transcription         │
└──────────────────────────────────────────────┘
```

**Layout:**
- Container: same `bg-primary/5 border border-primary/20 rounded-lg p-2` styling
- Inner row: `flex items-center gap-1.5 overflow-x-auto` for horizontal scrolling if needed
- Each thumbnail: `h-12 w-20 object-cover rounded` with a small X button overlay (positioned absolute, top-right)
- Counter text: `{screenshots.length}/{MAX_SCREENSHOTS} attached` replacing "Screenshot attached"
- Helper text stays: "Will be sent with next transcription"
- Only render the container when `screenshots.length > 0`

### Data Flow

```
User presses screenshot button or Cmd+Shift+P
  → capture_to_base64() (unchanged Tauri command)
  → if screenshots.length < 6: append to screenshots[]
  → if screenshots.length >= 6: no-op (button already disabled)
  → UI renders horizontal thumbnail row with X buttons
  → User can remove individual screenshots by index
  → On speech-detected: screenshotRef.current (full array) captured as images[]
  → screenshotRef.current reset to []
  → images[] passed to processWithAI as imagesBase64 parameter
  → Screenshots state cleared when isProcessing becomes true
```

### What Does NOT Change

- **Rust/Tauri:** `capture_to_base64()` command — no modifications
- **AI response function:** `fetchAIResponse` already accepts `imagesBase64: string[]`
- **Shortcut system:** Cmd+Shift+P handler calls `handleCaptureScreenshot()` unchanged
- **Auto-clear behavior:** screenshots clear after transcription is sent (same, just clears array)
- **Global shortcut hook:** `useGlobalShortcuts.ts` — no changes needed

### Files Modified

| File | Changes |
|------|---------|
| `src/pages/app/components/speech/index.tsx` | State from single to array, handler updates, thumbnail row UI |
| `src/hooks/useSystemAudio.ts` | `screenshotRef` type from `string \| null` to `string[]`, speech-detected handler, `startNewConversation` cleanup, `stopCapture` cleanup |

### Edge Cases

- **Rapid shortcut presses:** Already guarded by `isCapturingScreenshot` flag — second press is a no-op while capture is in progress
- **Cap reached via shortcut:** Same `screenshots.length >= MAX_SCREENSHOTS` guard applies in handler, before invoking Tauri command
- **All screenshots removed:** Array becomes `[]`, preview container hides, button reverts to outline variant
- **Processing starts with partial screenshots:** All current screenshots are captured from ref and sent together
- **Memory with 6 full-res screenshots:** Each `capture_to_base64` returns a full-resolution PNG (potentially 10-20MB base64 on Retina). At 6 screenshots this could be ~60-120MB in memory. Acceptable because screenshots are transient (cleared after send) and the cap of 6 bounds the maximum. Image compression is out of scope for this change.
- **Stale screenshots across sessions:** `stopCapture` and `startNewConversation` now explicitly clear `screenshotRef.current = []` to prevent leakage
- **Shortcut at cap:** `trigger-voice-screenshot` event calls `handleCaptureScreenshot()` which has the `>= MAX_SCREENSHOTS` guard, so the shortcut is a no-op at cap — verified, no event handler changes needed

### Testing

- Attach 1 screenshot → verify thumbnail appears with X button
- Attach 6 screenshots → verify button becomes disabled, shortcut is no-op
- Remove middle screenshot → verify remaining thumbnails reindex correctly
- Send transcription with 3 screenshots → verify all 3 appear in `imagesBase64[]`
- Verify screenshots auto-clear after send
- Verify new conversation clears all screenshots
