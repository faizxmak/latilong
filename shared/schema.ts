import { pgTable, text, serial, integer, boolean, jsonb, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

export * from "./models/chat";
export * from "./models/auth";

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
});

export const budgetRanges = pgTable("budget_ranges", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull().references(() => cities.id),
  lowMin: integer("low_min").notNull(),
  lowMax: integer("low_max").notNull(),
  mediumMin: integer("medium_min").notNull(),
  mediumMax: integer("medium_max").notNull(),
  highMin: integer("high_min").notNull(),
  currency: text("currency").notNull().default("USD"),
});

export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull().references(() => cities.id),
  name: text("name").notNull(),
  area: text("area").notNull(),
  avgPrice: integer("avg_price").notNull(),
  safetyScore: integer("safety_score").notNull(), // 1-10
  valueScore: integer("value_score").notNull(), // 1-10
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  tags: text("tags").array(), // e.g. ["budget", "safe", "central"]
});

export const transportCosts = pgTable("transport_costs", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull().references(() => hotels.id),
  fromLocation: text("from_location").notNull(), // "Airport", "Railway Station"
  minPrice: integer("min_price").notNull(),
  maxPrice: integer("max_price").notNull(),
  currency: text("currency").notNull().default("USD"),
  method: text("method").notNull(), // "Taxi", "Bus", "Train"
  warning: text("warning"), // "Avoid unlicensed taxis"
});

export const citiesRelations = relations(cities, ({ one, many }) => ({
  budgetRanges: one(budgetRanges, {
    fields: [cities.id],
    references: [budgetRanges.cityId],
  }),
  hotels: many(hotels),
}));

export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  city: one(cities, {
    fields: [hotels.cityId],
    references: [cities.id],
  }),
  transportCosts: many(transportCosts),
}));

export const transportCostsRelations = relations(transportCosts, ({ one }) => ({
  hotel: one(hotels, {
    fields: [transportCosts.hotelId],
    references: [hotels.id],
  }),
}));

export const insertCitySchema = createInsertSchema(cities).omit({ id: true });
export const insertBudgetRangeSchema = createInsertSchema(budgetRanges).omit({ id: true });
export const insertHotelSchema = createInsertSchema(hotels).omit({ id: true });
export const insertTransportCostSchema = createInsertSchema(transportCosts).omit({ id: true });

export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type BudgetRange = typeof budgetRanges.$inferSelect;
export type Hotel = typeof hotels.$inferSelect;
export type TransportCost = typeof transportCosts.$inferSelect;
