# Multi-Screenshot Voice Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to attach up to 6 screenshots in voice mode (currently limited to 1), with a horizontal thumbnail row UI and individual remove buttons.

**Architecture:** Frontend-only change across 2 files. The hook (`useSystemAudio.ts`) changes its ref type from `string | null` to `string[]` and adds cleanup to lifecycle functions. The component (`speech/index.tsx`) changes state from single to array, updates handlers, and renders a thumbnail row. No Rust/backend changes — `imagesBase64: string[]` already supports multiple images.

**Tech Stack:** React, TypeScript, Tauri, Tailwind CSS, Lucide icons

**Spec:** `docs/superpowers/specs/2026-03-23-multi-screenshot-voice-mode-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/hooks/useSystemAudio.ts` | Modify | Change `screenshotRef` type, fix speech-detected handler, add cleanup to `stopCapture` and `startNewConversation` |
| `src/pages/app/components/speech/index.tsx` | Modify | Change state to array, update handlers, add MAX_SCREENSHOTS constant, render thumbnail row UI |

---

### Task 1: Update `screenshotRef` type and speech-detected handler in hook

**Files:**
- Modify: `src/hooks/useSystemAudio.ts:113` (ref declaration)
- Modify: `src/hooks/useSystemAudio.ts:254-256` (speech-detected handler)

- [ ] **Step 1: Change `screenshotRef` from single to array**

At line 113, change:
```typescript
// Before:
const screenshotRef = useRef<string | null>(null);
// After:
const screenshotRef = useRef<string[]>([]);
```

- [ ] **Step 2: Fix speech-detected handler to use array**

At lines 254-256, change:
```typescript
// Before:
// Capture screenshot BEFORE setting isProcessing (which clears the screenshot state)
const images = screenshotRef.current ? [screenshotRef.current] : [];
screenshotRef.current = null;
// After:
// Capture screenshots BEFORE setting isProcessing (which clears the screenshot state)
const images = [...screenshotRef.current];
screenshotRef.current = [];
```

Note: `[]` is truthy in JS, so the old `screenshotRef.current ? ...` pattern would always produce `[[]]` with the new array type. Using spread + length-agnostic copy avoids this.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Type errors in `speech/index.tsx` (expected — component still uses old `string | null` pattern). No errors in `useSystemAudio.ts` itself.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useSystemAudio.ts
git commit -m "feat: change screenshotRef to string[] for multi-screenshot support"
```

---

### Task 2: Add cleanup to `stopCapture` and `startNewConversation` in hook

**Files:**
- Modify: `src/hooks/useSystemAudio.ts:626-636` (stopCapture)
- Modify: `src/hooks/useSystemAudio.ts:773-789` (startNewConversation)

- [ ] **Step 1: Add `screenshotRef.current = []` to `stopCapture`**

At line 636 (after `setIsPopoverOpen(false);`), add:
```typescript
      screenshotRef.current = [];
```

- [ ] **Step 2: Add `screenshotRef.current = []` to `startNewConversation`**

At line 788 (after `setUseSystemPrompt(true);`), add:
```typescript
    screenshotRef.current = [];
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSystemAudio.ts
git commit -m "feat: clear screenshotRef on stop capture and new conversation"
```

---

### Task 3: Change component state from single to array and update effects

**Files:**
- Modify: `src/pages/app/components/speech/index.tsx:76-77` (state declaration)
- Modify: `src/pages/app/components/speech/index.tsx:104-113` (effects)

- [ ] **Step 1: Add MAX_SCREENSHOTS constant**

After the imports (line 29, before the component function), add:
```typescript
const MAX_SCREENSHOTS = 6;
```

- [ ] **Step 2: Change state from single to array**

At line 76, change:
```typescript
// Before:
const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
// After:
const [screenshots, setScreenshots] = useState<string[]>([]);
```

- [ ] **Step 3: Update sync effect to use array**

At lines 104-106, change:
```typescript
// Before:
useEffect(() => {
  screenshotRef.current = screenshotImage;
}, [screenshotImage, screenshotRef]);
// After:
useEffect(() => {
  screenshotRef.current = screenshots;
}, [screenshots, screenshotRef]);
```

- [ ] **Step 4: Update clear-on-processing effect to use array**

At lines 109-113, change:
```typescript
// Before:
useEffect(() => {
  if (isProcessing && screenshotImage) {
    setScreenshotImage(null);
  }
}, [isProcessing, screenshotImage]);
// After:
useEffect(() => {
  if (isProcessing && screenshots.length > 0) {
    setScreenshots([]);
  }
}, [isProcessing, screenshots.length]);
```

- [ ] **Step 5: Add effect to clear screenshots on new conversation**

After the clear-on-processing effect, add:
```typescript
// Clear screenshots when conversation changes (e.g., startNewConversation)
const conversationId = conversation.id;
useEffect(() => {
  setScreenshots([]);
}, [conversationId]);
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/app/components/speech/index.tsx
git commit -m "feat: change screenshot state from single to array with effects"
```

---

### Task 4: Update capture and remove handlers

**Files:**
- Modify: `src/pages/app/components/speech/index.tsx:131-163` (handlers)

- [ ] **Step 1: Update `handleCaptureScreenshot` to append to array**

At lines 131-146, replace the entire handler:
```typescript
const handleCaptureScreenshot = useCallback(async () => {
  if (isCapturingScreenshot) return;
  if (screenshots.length >= MAX_SCREENSHOTS) return;

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

- [ ] **Step 2: Update `handleRemoveScreenshot` to accept index**

At lines 161-163, replace:
```typescript
// Before:
const handleRemoveScreenshot = useCallback(() => {
  setScreenshotImage(null);
}, []);
// After:
const handleRemoveScreenshot = useCallback((index: number) => {
  setScreenshots(prev => prev.filter((_, i) => i !== index));
}, []);
```

**Note:** No changes needed to the `trigger-voice-screenshot` listener (lines 148-159 in `speech/index.tsx`) — it calls `handleCaptureScreenshot()` which already contains the `MAX_SCREENSHOTS` guard.

- [ ] **Step 3: Commit**

```bash
git add src/pages/app/components/speech/index.tsx
git commit -m "feat: update screenshot handlers for multi-image support"
```

---

### Task 5: Update screenshot button UI

**Files:**
- Modify: `src/pages/app/components/speech/index.tsx:237-256` (button)

- [ ] **Step 1: Update button disabled, variant, and label**

At lines 237-256, replace the screenshot button block:
```tsx
{hasActiveLicense && !setupRequired && supportsImages && (
  <Button
    size="sm"
    variant={screenshots.length > 0 ? "default" : "outline"}
    onClick={handleCaptureScreenshot}
    disabled={isCapturingScreenshot || screenshots.length >= MAX_SCREENSHOTS}
    className={cn(
      "h-6 text-[10px] gap-1 px-2",
      screenshots.length > 0 && "bg-primary text-primary-foreground"
    )}
    title={
      screenshots.length >= MAX_SCREENSHOTS
        ? `Maximum ${MAX_SCREENSHOTS} screenshots`
        : "Capture screenshot to include with transcription"
    }
  >
    {isCapturingScreenshot ? (
      <LoaderIcon className="w-3 h-3 animate-spin" />
    ) : (
      <CameraIcon className="w-3 h-3" />
    )}
    {screenshots.length > 0
      ? `Screenshot (${screenshots.length}/${MAX_SCREENSHOTS})`
      : "Screenshot"}
  </Button>
)}
```

- [ ] **Step 2: Verify the button renders without errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Remaining errors only in the preview section (not yet updated).

- [ ] **Step 3: Commit**

```bash
git add src/pages/app/components/speech/index.tsx
git commit -m "feat: update screenshot button for multi-image with counter badge"
```

---

### Task 6: Replace single preview with thumbnail row UI

**Files:**
- Modify: `src/pages/app/components/speech/index.tsx:293-318` (preview section)

- [ ] **Step 1: Replace single screenshot preview with thumbnail row**

At lines 293-318, replace the entire `{screenshotImage && (...)}` block:
```tsx
{screenshots.length > 0 && (
  <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-primary/5 border border-primary/20">
    <div className="flex items-center gap-1.5 overflow-x-auto">
      {screenshots.map((img, index) => (
        <div key={index} className="relative flex-shrink-0">
          <img
            src={`data:image/png;base64,${img}`}
            alt={`Screenshot ${index + 1}`}
            className="h-12 w-20 object-cover rounded"
          />
          <button
            type="button"
            onClick={() => handleRemoveScreenshot(index)}
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
          >
            <XIcon className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-medium">
        {screenshots.length}/{MAX_SCREENSHOTS} attached
      </p>
      <p className="text-[9px] text-muted-foreground">
        Will be sent with next transcription
      </p>
    </div>
  </div>
)}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/app/components/speech/index.tsx
git commit -m "feat: add multi-screenshot thumbnail row UI with remove buttons"
```

---

### Task 7: Build verification and manual test

**Files:** None (verification only)

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean — no errors.

- [ ] **Step 2: Run build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 3: Manual test checklist**

Build and install the app, then verify in voice mode:
1. Click Screenshot button → thumbnail appears in row with X button
2. Click Screenshot again → second thumbnail appears
3. Click up to 6 → button becomes disabled, shows "Screenshot (6/6)"
4. Press Cmd+Shift+P at 6 → nothing happens (silent no-op)
5. Click X on middle thumbnail → it removes, others stay
6. Remove all → preview container disappears, button reverts to outline
7. Attach 3 screenshots, speak → all 3 sent with transcription, screenshots clear after send
8. Attach screenshots, click "New" → screenshots clear

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address any issues found during manual testing"
```
