# Unify HUD Theme Across Voice and Completion Modes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the same dark semi-transparent color theme (currently only on voice mode) to all completion/chat mode popovers so they match visually.

**Architecture:** The voice mode already defines a `.voice-hud` CSS class in `global.css` that overrides CSS variables with a dark semi-transparent palette. We rename it to `.hud-theme` (since it's no longer voice-only), then add that class to all 4 completion PopoverContent elements. No new CSS variables or structural changes needed.

**Tech Stack:** CSS custom properties (oklch), Tailwind CSS, React (TSX)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/global.css:126-146` | Modify | Rename `.voice-hud` to `.hud-theme`, update comment |
| `src/pages/app/components/speech/index.tsx:219` | Modify | Update class from `voice-hud` to `hud-theme` |
| `src/pages/app/components/completion/Input.tsx:98` | Modify | Add `hud-theme` class to response PopoverContent |
| `src/pages/app/components/completion/Files.tsx:69` | Modify | Add `hud-theme` class to files PopoverContent |
| `src/pages/app/components/completion/MessageHistory.tsx:45` | Modify | Add `hud-theme` class to history PopoverContent |
| `src/pages/app/components/completion/Audio.tsx:48` | Modify | Add `hud-theme` class to audio config PopoverContent |

---

### Task 1: Rename `.voice-hud` to `.hud-theme` in CSS

**Files:**
- Modify: `src/global.css:126-146`

- [ ] **Step 1: Rename the CSS class and update the comment**

In `src/global.css`, change line 126-127 from:

```css
/* Voice mode HUD — dark semi-transparent overlay with white text */
.voice-hud {
```

to:

```css
/* HUD theme — dark semi-transparent overlay with light text (voice + completion modes) */
.hud-theme {
```

All CSS variable definitions inside the block stay exactly the same.

- [ ] **Step 2: Update the voice mode component to use the new class name**

In `src/pages/app/components/speech/index.tsx`, line 219, change:

```tsx
className="voice-hud select-none w-screen p-0 overflow-hidden border-0 shadow-none"
```

to:

```tsx
className="hud-theme select-none w-screen p-0 overflow-hidden border-0 shadow-none"
```

- [ ] **Step 3: Verify voice mode still works**

Run: `npm run dev` (or existing dev command)
Open the app, trigger voice mode — confirm it still has the dark semi-transparent theme, no visual regression.

- [ ] **Step 4: Commit**

```bash
git add src/global.css src/pages/app/components/speech/index.tsx
git commit -m "refactor: rename voice-hud to hud-theme for reuse across modes"
```

---

### Task 2: Apply `hud-theme` to completion Input popover (main response panel)

**Files:**
- Modify: `src/pages/app/components/completion/Input.tsx:95-99`

- [ ] **Step 1: Add `hud-theme` class to the PopoverContent**

In `src/pages/app/components/completion/Input.tsx`, line 98, change:

```tsx
className="w-screen p-0 border shadow-lg overflow-hidden"
```

to:

```tsx
className="hud-theme w-screen p-0 overflow-hidden border-0 shadow-none"
```

This matches the voice mode's border/shadow treatment (`border-0 shadow-none`) so the dark semi-transparent popover blends seamlessly with the desktop background.

- [ ] **Step 2: Verify the response panel**

Open the app, type a question in the input field, trigger a response. Confirm the response popover now has the dark semi-transparent background with light text, matching voice mode.

- [ ] **Step 3: Commit**

```bash
git add src/pages/app/components/completion/Input.tsx
git commit -m "feat: apply hud-theme to completion response panel"
```

---

### Task 3: Apply `hud-theme` to completion Files popover

**Files:**
- Modify: `src/pages/app/components/completion/Files.tsx:66-69`

- [ ] **Step 1: Add `hud-theme` class to the PopoverContent**

In `src/pages/app/components/completion/Files.tsx`, line 69, change:

```tsx
className="w-screen p-0 border shadow-lg overflow-hidden"
```

to:

```tsx
className="hud-theme w-screen p-0 overflow-hidden border-0 shadow-none"
```

- [ ] **Step 2: Verify the files popover**

Attach some images, open the files popover. Confirm it uses the dark theme with light text.

- [ ] **Step 3: Commit**

```bash
git add src/pages/app/components/completion/Files.tsx
git commit -m "feat: apply hud-theme to completion files panel"
```

---

### Task 4: Apply `hud-theme` to MessageHistory popover

**Files:**
- Modify: `src/pages/app/components/completion/MessageHistory.tsx:42-45`

- [ ] **Step 1: Add `hud-theme` class to the PopoverContent**

In `src/pages/app/components/completion/MessageHistory.tsx`, line 45, change:

```tsx
className="select-none w-screen p-0 mt-3 border overflow-hidden border-input/50"
```

to:

```tsx
className="hud-theme select-none w-screen p-0 mt-3 overflow-hidden border-0 shadow-none"
```

Note: `border-input/50` is removed because `.hud-theme` already sets `--border: oklch(1 0 0 / 12%)` and `border-0` removes the border entirely for the seamless look. The `mt-3` spacing is preserved.

- [ ] **Step 2: Also update the header divider inside MessageHistory**

On line 47, the inner border uses `border-input/50`. Since `.hud-theme` sets `--input: oklch(1 0 0 / 12%)`, this resolves to a subtle white border which is fine. No change needed here — the CSS variable override handles it.

- [ ] **Step 3: Verify the message history popover**

Have a multi-message conversation, click the message count button. Confirm the history popover uses the dark theme.

- [ ] **Step 4: Commit**

```bash
git add src/pages/app/components/completion/MessageHistory.tsx
git commit -m "feat: apply hud-theme to message history panel"
```

---

### Task 5: Apply `hud-theme` to Audio config popover

**Files:**
- Modify: `src/pages/app/components/completion/Audio.tsx:45-48`

- [ ] **Step 1: Add `hud-theme` class to the PopoverContent**

In `src/pages/app/components/completion/Audio.tsx`, line 48, change:

```tsx
className={`w-80 p-3 ${
  pluelyApiEnabled || speechProviderStatus ? "hidden" : ""
}`}
```

to:

```tsx
className={`hud-theme w-80 p-3 border-0 shadow-none ${
  pluelyApiEnabled || speechProviderStatus ? "hidden" : ""
}`}
```

- [ ] **Step 2: Fix the hardcoded orange text color**

On line 54, the orange text `text-orange-600` will look wrong on the dark background. Change line 54 from:

```tsx
<div className="font-semibold text-orange-600 mb-1">
```

to:

```tsx
<div className="font-semibold text-orange-400 mb-1">
```

And on line 60, change:

```tsx
<div className="mt-2 flex flex-row gap-1 items-center text-orange-600">
```

to:

```tsx
<div className="mt-2 flex flex-row gap-1 items-center text-orange-400">
```

The `400` shade has better contrast on dark backgrounds than `600`.

- [ ] **Step 3: Verify the audio config popover**

Trigger the audio popover when speech provider is not configured. Confirm the dark theme with readable orange warning text.

- [ ] **Step 4: Commit**

```bash
git add src/pages/app/components/completion/Audio.tsx
git commit -m "feat: apply hud-theme to audio config panel"
```

---

### Task 6: Final visual verification

- [ ] **Step 1: Test all popovers in sequence**

Open the app and verify each popover has the dark semi-transparent theme:
1. Voice mode HUD (existing — should be unchanged)
2. Completion response panel (type a question, get response)
3. Files panel (attach images, click paperclip)
4. Message history (have a conversation, click message count)
5. Audio config (when speech provider is missing)

- [ ] **Step 2: Test with both light and dark system themes**

The `.hud-theme` class uses fixed oklch values (not theme-dependent), so it should look the same regardless of OS theme. Verify this.

- [ ] **Step 3: Commit final state if any adjustments were needed**

```bash
git add -A
git commit -m "fix: final hud-theme visual adjustments"
```

(Skip this commit if no adjustments were needed.)
