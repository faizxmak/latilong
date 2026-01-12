import { db } from "./db";
import {
  cities, hotels, budgetRanges, transportCosts,
  type City, type Hotel, type BudgetRange, type TransportCost
} from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  getCities(): Promise<City[]>;
  getCityBySlug(slug: string): Promise<City | undefined>;
  getBudgetRanges(cityId: number): Promise<BudgetRange | undefined>;
  getHotels(cityId: number, minPrice?: number, maxPrice?: number): Promise<(Hotel & { transportCosts: TransportCost[] })[]>;
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCities(): Promise<City[]> {
    return await db.select().from(cities);
  }

  async getCityBySlug(slug: string): Promise<City | undefined> {
    const [city] = await db.select().from(cities).where(eq(cities.slug, slug));
    return city;
  }

  async getBudgetRanges(cityId: number): Promise<BudgetRange | undefined> {
    const [range] = await db.select().from(budgetRanges).where(eq(budgetRanges.cityId, cityId));
    return range;
  }

  async getHotels(cityId: number, minPrice?: number, maxPrice?: number): Promise<(Hotel & { transportCosts: TransportCost[] })[]> {
    let query = db.select().from(hotels).where(eq(hotels.cityId, cityId));
    
    if (minPrice !== undefined) {
      query = query.where(gte(hotels.avgPrice, minPrice));
    }
    if (maxPrice !== undefined) {
      query = query.where(lte(hotels.avgPrice, maxPrice));
    }

    const result = await query;
    
    // Fetch transport costs for these hotels
    // This is N+1 but fine for small dataset
    const hotelsWithTransport = await Promise.all(result.map(async (hotel) => {
      const costs = await db.select().from(transportCosts).where(eq(transportCosts.hotelId, hotel.id));
      return { ...hotel, transportCosts: costs };
    }));

    return hotelsWithTransport;
  }

  async seedData(): Promise<void> {
    const existing = await this.getCities();
    if (existing.length > 0) return;

    // Seed Paris
    const [paris] = await db.insert(cities).values({
      name: "Paris",
      slug: "paris",
      description: "The City of Light, known for its cafes, culture, and iconic landmarks.",
      imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80",
    }).returning();

    await db.insert(budgetRanges).values({
      cityId: paris.id,
      lowMin: 50, lowMax: 120,
      mediumMin: 121, mediumMax: 250,
      highMin: 251,
      currency: "EUR"
    });

    // Seed Hotels in Paris
    const [hotel1] = await db.insert(hotels).values({
      cityId: paris.id,
      name: "Hôtel de la Paix",
      area: "Montmartre",
      avgPrice: 90,
      safetyScore: 8,
      valueScore: 9,
      description: "Charming budget hotel near Sacré-Cœur.",
      imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80",
      tags: ["budget", "romantic"],
    }).returning();

    await db.insert(transportCosts).values({
      hotelId: hotel1.id,
      fromLocation: "CDG Airport",
      minPrice: 55,
      maxPrice: 65,
      currency: "EUR",
      method: "Taxi",
      warning: "Only take official taxis from the stand",
    });

    const [hotel2] = await db.insert(hotels).values({
      cityId: paris.id,
      name: "Le Marais Boutique",
      area: "Le Marais",
      avgPrice: 180,
      safetyScore: 9,
      valueScore: 8,
      description: "Stylish boutique hotel in the heart of the historic district.",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80",
      tags: ["boutique", "central"],
    }).returning();

     await db.insert(transportCosts).values({
      hotelId: hotel2.id,
      fromLocation: "CDG Airport",
      minPrice: 60,
      maxPrice: 70,
      currency: "EUR",
      method: "Taxi",
    });
  }
}

export const storage = new DatabaseStorage();
