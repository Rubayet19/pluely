import { Loader2 } from "lucide-react";

const isMac = navigator.platform.toLowerCase().includes("mac");

interface RecordingPanelProps {
  isVadMode: boolean;
  isProcessing: boolean;
  isAIProcessing: boolean;
}

export const RecordingPanel = ({
  isVadMode,
  isProcessing,
  isAIProcessing,
}: RecordingPanelProps) => {
  const isWorking = isProcessing || isAIProcessing;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
      {/* Manual Mode */}
      {!isVadMode && (
        <div className="p-3 space-y-2">
          {isWorking ? (
            <div className="flex items-center justify-end gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">
                {isProcessing ? "Transcribing..." : "Generating..."}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground">
                  Listening...
                </span>
              </div>
              <div className="text-[8px] text-muted-foreground/60">
                <kbd className="px-1 py-0.5 rounded bg-muted font-mono">
                  {isMac ? "\u2318\u21E7" : "Ctrl+Shift+"}Enter
                </kbd>{" "}
                send to AI
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
