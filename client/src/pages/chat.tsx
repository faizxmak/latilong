import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { useConversation, useChatStream, useCreateConversation } from "@/hooks/use-chat";
import { Loader2, MapPin, Sparkles } from "lucide-react";

export default function ChatPage() {
  const [match, params] = useRoute("/chat/:id");
  const id = params?.id ? parseInt(params.id) : null;
  const createConversation = useCreateConversation();
  
  // Create a new conversation if on root and none exists
  // For now, we'll show a landing state if no ID
  
  const { data: conversation, isLoading: isLoadingConv } = useConversation(id);
  const { sendMessage, isStreaming, streamedContent } = useChatStream(id || 0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, streamedContent]);

  // If no ID, show empty state or redirect logic could be here.
  // We'll handle "No ID" by showing a welcome screen in the main area.
  
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full relative w-full pt-16 md:pt-0">
        {!id ? (
          <WelcomeScreen onCreate={() => createConversation.mutate("New Trip")} isCreating={createConversation.isPending} />
        ) : (
          <>
            {/* Header (Desktop only - mobile is in Sidebar overlay) */}
            <header className="h-16 border-b flex items-center px-6 justify-between bg-white/50 backdrop-blur-sm z-10 hidden md:flex">
              <div className="flex flex-col">
                <h1 className="font-semibold text-lg truncate max-w-md">
                  {conversation?.title || "Trip Planner"}
                </h1>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Online
                </span>
              </div>
            </header>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth"
            >
              {isLoadingConv ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex justify-center my-6">
                    <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                      Today
                    </span>
                  </div>
                  
                  {/* System Welcome Message - Fake it if empty */}
                  {(!conversation?.messages || conversation.messages.length === 0) && (
                    <ChatBubble 
                      role="assistant" 
                      content="Hi there! I'm your travel buddy. Where are we going today? I can help with hotels, transport costs, and itinerary ideas."
                      timestamp={new Date()}
                    />
                  )}

                  {conversation?.messages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      role={msg.role as "user" | "assistant"}
                      content={msg.content}
                      timestamp={msg.createdAt || undefined}
                    />
                  ))}

                  {/* Streaming Content Bubble */}
                  {isStreaming && (
                    <ChatBubble
                      role="assistant"
                      content={streamedContent}
                      isStreaming={true}
                      timestamp={new Date()}
                    />
                  )}
                  
                  <div className="h-4" /> {/* Spacer */}
                </>
              )}
            </div>

            {/* Input Area */}
            <ChatInput 
              onSend={sendMessage} 
              disabled={isLoadingConv || isStreaming}
              isStreaming={isStreaming}
            />
          </>
        )}
      </main>
    </div>
  );
}

function WelcomeScreen({ onCreate, isCreating }: { onCreate: () => void, isCreating: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-background to-white">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 animate-bounce duration-[3000ms]">
        <Sparkles className="w-12 h-12 text-primary" />
      </div>
      
      <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight text-foreground">
        Where to next?
      </h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
        I can help you find the best hotels, estimate transport costs, and plan your perfect itinerary.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mb-8">
        {[
          "Plan a weekend in Paris",
          "Hotels in Tokyo under $100",
          "Transport costs in London",
          "Safe areas in Mexico City"
        ].map((prompt, i) => (
          <button 
            key={i}
            onClick={onCreate} 
            className="p-4 text-left text-sm bg-white border border-border/50 hover:border-primary/40 hover:shadow-md rounded-xl transition-all duration-200 group"
          >
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              "{prompt}"
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={onCreate}
        disabled={isCreating}
        className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50"
      >
        {isCreating ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Creating...
          </span>
        ) : (
          "Start Planning"
        )}
      </button>
    </div>
  );
}
