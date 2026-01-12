import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

interface ChatBubbleProps {
  content: string;
  role: "user" | "assistant" | "system";
  timestamp?: string | Date;
  isStreaming?: boolean;
}

export function ChatBubble({ content, role, timestamp, isStreaming }: ChatBubbleProps) {
  const isUser = role === "user";
  const isSystem = role === "system";

  if (isSystem) {
    // Optionally hide system messages or render differently
    return null;
  }

  return (
    <div className={cn("flex w-full mb-4 animate-slide-in", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm relative group",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-white border border-border rounded-tl-sm text-foreground"
        )}
      >
        <div className="text-sm md:text-base leading-relaxed break-words prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
             components={{
              // Custom styling for markdown elements if needed
              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              a: ({href, children}) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-1 underline-offset-2 opacity-90 hover:opacity-100">
                  {children}
                </a>
              ),
             }}
          >
            {content}
          </ReactMarkdown>
          {isStreaming && (
             <span className="inline-block w-2 h-4 ml-1 align-middle bg-current animate-pulse" />
          )}
        </div>
        
        {timestamp && (
          <div className={cn(
            "text-[10px] mt-1 opacity-70 flex items-center gap-1",
            isUser ? "justify-end text-primary-foreground/80" : "justify-start text-muted-foreground"
          )}>
            {format(new Date(timestamp), "h:mm a")}
            {isUser && (
               /* Double tick icon simulation */
               <span className="text-[10px] tracking-tighter">✓✓</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
