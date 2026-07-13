import { ChatConversation } from "@/types";
import { Markdown, CopyButton } from "@/components";
import { BotIcon, HeadphonesIcon, Loader2, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  lastTranscription: string;
  lastAIResponse: string;
  isAIProcessing: boolean;
  conversation: ChatConversation;
  conversationMode: boolean;
  setConversationMode: (mode: boolean) => void;
};

export const ResultsSection = ({
  lastTranscription,
  lastAIResponse,
  isAIProcessing,
  conversation,
  conversationMode,
  setConversationMode,
}: Props) => {
  const hasResponse = lastAIResponse || isAIProcessing;
  const hasHistory = conversation.messages.length > 2;

  if (!hasResponse && !lastTranscription) {
    return null;
  }

  const isMac = navigator.platform.toLowerCase().includes("mac");
  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <div className="p-3 space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SparklesIcon className="w-3.5 h-3.5 text-primary" />
          <h4 className="text-xs font-medium">
            {conversationMode ? "Conversation" : "AI Response"}
          </h4>
        </div>
        <div className="flex items-center gap-2 select-none">
          <button
            type="button"
            onClick={() => setConversationMode(!conversationMode)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-medium transition-colors",
              conversationMode
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground border border-transparent hover:bg-muted/80"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: conversationMode ? "var(--primary)" : "var(--muted-foreground)" }} />
            {conversationMode ? "History" : "Latest"}
            <span className="text-[8px] opacity-50 ml-0.5">{modKey}+K</span>
          </button>
          {lastAIResponse && <CopyButton content={lastAIResponse} />}
        </div>
      </div>

      {/* RESPONSE MODE: System as text, then AI response */}
      {!conversationMode && (
        <div className="space-y-2">
          {/* System Input - Just text with bold label */}
          {lastTranscription && (
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold">System:</span> {lastTranscription}
            </p>
          )}

          {/* AI Response */}
          {hasResponse && (
            <div>
              {isAIProcessing && !lastAIResponse ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Generating response...
                  </span>
                </div>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none">
                  <Markdown>{lastAIResponse}</Markdown>
                  {isAIProcessing && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONVERSATION MODE: AI on top, then System, then history */}
      {conversationMode && (
        <div className="space-y-2">
          {/* AI Response - First (on top) */}
          {hasResponse && (
            <div className="rounded-md p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <BotIcon className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
                  AI
                </span>
              </div>
              {isAIProcessing && !lastAIResponse ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    Generating...
                  </span>
                </div>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none text-sm">
                  <Markdown>{lastAIResponse}</Markdown>
                  {isAIProcessing && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* System Input - Second */}
          {lastTranscription && (
            <div className="rounded-md border-l-2 border-primary/50 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <HeadphonesIcon className="h-3 w-3 text-primary" />
                <span className="text-[9px] font-medium text-primary uppercase tracking-wide">
                  System
                </span>
              </div>
              <p className="text-sm">{lastTranscription}</p>
            </div>
          )}

          {/* Previous Messages */}
          {hasHistory && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                Previous
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {conversation.messages
                  .slice(2)
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((message, index) => (
                    <div
                      key={message.id || index}
                      className={cn(
                        "p-2 rounded-md text-[11px]",
                        message.role === "user"
                          ? "border-l-2 border-primary/30"
                          : ""
                      )}
                    >
                      <span className="text-[8px] font-medium text-muted-foreground uppercase">
                        {message.role === "user" ? "System" : "AI"}
                      </span>
                      <div className="text-muted-foreground leading-relaxed mt-0.5">
                        <Markdown>{message.content}</Markdown>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
