import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { authenticate } from "../../auth/jwt-auth";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).userId;
      const conversations = await chatStorage.getAllConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).userId;
      const conversation = await chatStorage.getConversation(id, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id, userId);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).userId;
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat", userId);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).userId;
      await chatStorage.deleteConversation(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", authenticate, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = (req.user as any).userId;
      const { content } = req.body;

      const conversation = await chatStorage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Check if this is the first message (greeting) or user input
      if (content) {
        // Save user message
        await chatStorage.createMessage(conversationId, "user", content);
      }

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId, userId);
      
      // If no messages yet, this is the initial greeting request
      if (messages.length === 0 && !content) {
        // Initial greeting trigger
      }

      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are latiNlong, a calm, friendly, and honest travel buddy. You help users plan trips confidently without overpaying or getting scammed. You sound like a well-traveled local friend, never robotic or overly verbose. Your goal is to guide the user naturally through planning their trip, focusing on destination, duration, and budget (Low/Medium/High)." },
          ...chatMessages
        ],
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

