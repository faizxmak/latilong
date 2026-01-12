import type { Express, Request, Response } from "express";
import { authStorage } from "./storage";
import { hashPassword, comparePassword, generateToken } from "./jwt-auth";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export function registerAuthRoutes(app: Express): void {
  // Signup endpoint
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await authStorage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const user = await authStorage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email!,
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword, 
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user
      const user = await authStorage.getUserByEmail(validatedData.email);
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await comparePassword(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email!,
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword, 
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.substring(7);
      const { verifyToken } = await import("./jwt-auth");
      const payload = verifyToken(token);

      if (!payload) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const user = await authStorage.getUserById(payload.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...userWithoutPassword } = user as any;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
}
