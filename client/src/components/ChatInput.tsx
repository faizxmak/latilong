import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export function ChatInput({ onSend, disabled, isStreaming }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !disabled && !isStreaming) {
      onSend(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t bg-white/80 backdrop-blur-md sticky bottom-0 z-10"
    >
      <div className="max-w-4xl mx-auto relative flex items-end gap-2">
        <div className="relative flex-1 bg-muted/50 rounded-3xl border border-transparent focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-md transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about hotels, transport, or trip ideas..."
            className="w-full bg-transparent px-5 py-3.5 max-h-[150px] min-h-[52px] resize-none outline-none text-sm md:text-base placeholder:text-muted-foreground/70"
            disabled={disabled || isStreaming}
            rows={1}
          />
        </div>
        <Button
          type="submit"
          size="icon"
          className={cn(
            "h-[52px] w-[52px] rounded-full shrink-0 shadow-md transition-all",
            message.trim() ? "bg-primary" : "bg-muted text-muted-foreground shadow-none"
          )}
          disabled={!message.trim() || disabled || isStreaming}
        >
          {isStreaming ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className={cn("h-5 w-5", message.trim() && "ml-0.5")} />
          )}
        </Button>
      </div>
      <div className="text-center mt-2">
        <p className="text-[10px] text-muted-foreground">
          AI can make mistakes. Check details with official sources.
        </p>
      </div>
    </form>
  );
}
