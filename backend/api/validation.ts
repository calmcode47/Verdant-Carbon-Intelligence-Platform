import { z } from 'zod';

export const activityCategorySchema = z.enum(['transport', 'food', 'energy', 'lifestyle']);

export const createActivitySchema = z.object({
  category: activityCategorySchema,
  subCategory: z.string().min(1).max(80),
  value: z.coerce.number().positive().max(100_000),
  notes: z.string().trim().max(500).optional(),
  timestamp: z.coerce.date().optional(),
});

export const userPreferencesSchema = z.object({
  dailyReminder: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  milestoneAlerts: z.boolean().optional(),
  useMetric: z.boolean().optional(),
  defaultCategory: activityCategorySchema.optional(),
  profileVisibility: z.enum(['public', 'friends', 'private']).optional(),
  showOnLeaderboard: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(160).optional(),
  avatar: z.string().trim().max(80).optional(),
  location: z.string().trim().min(1).max(120).optional(),
  monthlyBudgetKg: z.coerce.number().positive().max(20_000).optional(),
  preferences: userPreferencesSchema.optional(),
});

export const insightSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum(['tip', 'warning', 'achievement', 'prediction']),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(600),
  potentialSavingKg: z.coerce.number().min(0).max(500),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  category: activityCategorySchema,
  actionItems: z.array(z.string().min(1).max(160)).min(1).max(5),
  generatedAt: z.coerce.date().optional(),
});

export const createChallengeFromInsightSchema = insightSchema;

export const insightsRequestSchema = z.object({
  activities: z.array(z.unknown()).max(80).optional(),
  user: z.unknown().optional(),
  summary: z.unknown().optional(),
  prompt: z.string().trim().max(2_000).optional(),
  userQuestion: z.string().trim().max(1_000).optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type InsightInput = z.infer<typeof insightSchema>;
