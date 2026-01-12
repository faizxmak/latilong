import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Re-export types from shared schema for convenience
import type { City, Hotel, BudgetRange, TransportCost } from "@shared/schema";

export function useCities() {
  return useQuery({
    queryKey: [api.cities.list.path],
    queryFn: async () => {
      const res = await fetch(api.cities.list.path);
      if (!res.ok) throw new Error("Failed to fetch cities");
      return api.cities.list.responses[200].parse(await res.json());
    },
  });
}

export function useCity(slug: string) {
  return useQuery({
    queryKey: [api.cities.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.cities.get.path, { slug });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch city");
      return api.cities.get.responses[200].parse(await res.json());
    },
  });
}

export function useHotels(cityId?: number, budgetLevel?: 'low' | 'medium' | 'high') {
  return useQuery({
    queryKey: [api.hotels.list.path, cityId, budgetLevel],
    enabled: !!cityId,
    queryFn: async () => {
      const url = new URL(window.location.origin + api.hotels.list.path);
      url.searchParams.append("cityId", String(cityId));
      if (budgetLevel) {
        url.searchParams.append("budgetLevel", budgetLevel);
      }
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch hotels");
      return api.hotels.list.responses[200].parse(await res.json());
    },
  });
}
