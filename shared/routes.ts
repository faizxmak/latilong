import { z } from 'zod';
import { cities, hotels, budgetRanges, transportCosts } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  cities: {
    list: {
      method: 'GET' as const,
      path: '/api/cities',
      responses: {
        200: z.array(z.custom<typeof cities.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/cities/:slug',
      responses: {
        200: z.custom<typeof cities.$inferSelect & { budgetRanges: typeof budgetRanges.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  hotels: {
    list: {
      method: 'GET' as const,
      path: '/api/hotels',
      input: z.object({
        cityId: z.coerce.number(),
        budgetLevel: z.enum(['low', 'medium', 'high']).optional(),
      }),
      responses: {
        200: z.array(z.custom<typeof hotels.$inferSelect & { transportCosts: (typeof transportCosts.$inferSelect)[] }>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
