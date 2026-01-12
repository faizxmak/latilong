import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertConversation, type Conversation, type Message } from "@shared/models/chat";
import { useState, useRef } from "react";
import { getToken } from "./use-auth";

// Types from the integration
type ChatMessage = Message;

function getAuthHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useConversations() {
  return useQuery({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch("/api/conversations", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return await res.json() as Conversation[];
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: ["/api/conversations", id],
    enabled: !!id,
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`/api/conversations/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return await res.json() as (Conversation & { messages: ChatMessage[] });
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return await res.json() as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const token = getToken();
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}

// Custom hook for streaming messages
export function useChatStream(conversationId: number) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  
  const sendMessage = async (content: string) => {
    setIsStreaming(true);
    setStreamedContent("");
    
    // Optimistic update could go here, but for simplicity we rely on the stream buffer UI
    
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        const lines = chunkValue.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") {
              // Standard OpenAI format, though our integration sends JSON
              continue;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                setStreamedContent((prev) => prev + data.content);
              }
              if (data.done) {
                // Refresh the full conversation to get the persisted message
                queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsStreaming(false);
      setStreamedContent("");
    }
  };

  return { sendMessage, isStreaming, streamedContent };
}
