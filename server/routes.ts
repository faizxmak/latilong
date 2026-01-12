import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerAuthRoutes } from "./auth/routes";
import { setupSession, registerOAuthRoutes } from "./auth/oauth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Session and OAuth
  setupSession(app);
  
  // Setup JWT Authentication
  registerAuthRoutes(app);
  
  // Setup OAuth Routes
  registerOAuthRoutes(app);

  // Register Integration Routes
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Business Routes
  app.get(api.cities.list.path, async (req, res) => {
    const cities = await storage.getCities();
    res.json(cities);
  });

  app.get(api.cities.get.path, async (req, res) => {
    const city = await storage.getCityBySlug(req.params.slug);
    if (!city) {
      return res.status(404).json({ message: "City not found" });
    }
    const budget = await storage.getBudgetRanges(city.id);
    res.json({ ...city, budgetRanges: budget });
  });

  app.get(api.hotels.list.path, async (req, res) => {
    const cityId = Number(req.query.cityId);
    const budgetLevel = req.query.budgetLevel as 'low' | 'medium' | 'high' | undefined;

    if (!cityId) {
      return res.status(400).json({ message: "cityId is required" });
    }

    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (budgetLevel) {
      const budget = await storage.getBudgetRanges(cityId);
      if (budget) {
        if (budgetLevel === 'low') {
          minPrice = budget.lowMin;
          maxPrice = budget.lowMax;
        } else if (budgetLevel === 'medium') {
          minPrice = budget.mediumMin;
          maxPrice = budget.mediumMax;
        } else if (budgetLevel === 'high') {
          minPrice = budget.highMin;
          maxPrice = undefined;
        }
      }
    }

    const hotels = await storage.getHotels(cityId, minPrice, maxPrice);
    res.json(hotels);
  });

  // Seed data on startup
  await storage.seedData();

  return httpServer;
}
