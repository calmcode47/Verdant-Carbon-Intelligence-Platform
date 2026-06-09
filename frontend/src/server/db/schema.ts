import { relations } from 'drizzle-orm';
import {
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: text('session_id').notNull().unique(),
  name: text('name').notNull().default('Eco Warrior'),
  email: text('email').notNull().default('eco.warrior@verdant.io'),
  avatar: text('avatar').default('Leaf'),
  location: text('location').notNull().default('San Francisco, USA'),
  monthlyBudgetKg: numeric('monthly_budget_kg', { precision: 10, scale: 3 }).notNull().default('400'),
  totalCarbonKg: numeric('total_carbon_kg', { precision: 10, scale: 3 }).notNull().default('0'),
  streak: integer('streak').notNull().default(1),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(120),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable('activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  subCategory: text('sub_category').notNull(),
  value: numeric('value', { precision: 12, scale: 3 }).notNull(),
  unit: text('unit').notNull(),
  carbonKg: numeric('carbon_kg', { precision: 12, scale: 3 }).notNull(),
  notes: text('notes'),
  aiSuggestion: text('ai_suggestion'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
});

export const badges = pgTable(
  'badges',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    badgeId: text('badge_id').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    icon: text('icon').notNull(),
    rarity: text('rarity').notNull(),
    earnedAt: timestamp('earned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.badgeId] }),
  })
);

export const challenges = pgTable('challenges', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  targetReductionKg: numeric('target_reduction_kg', { precision: 10, scale: 3 }).notNull(),
  currentProgressKg: numeric('current_progress_kg', { precision: 10, scale: 3 }).notNull().default('0'),
  duration: text('duration').notNull(),
  xpReward: integer('xp_reward').notNull(),
  participants: integer('participants').notNull().default(0),
  status: text('status').notNull().default('active'),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insightCache = pgTable('insight_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  requestHash: text('request_hash').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimits = pgTable('rate_limits', {
  key: text('key').notNull(),
  bucket: text('bucket').notNull(),
  count: integer('count').notNull().default(0),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.key, table.bucket] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
  badges: many(badges),
  challenges: many(challenges),
}));

export type DbUser = typeof users.$inferSelect;
export type DbActivity = typeof activities.$inferSelect;
export type DbBadge = typeof badges.$inferSelect;
export type DbChallenge = typeof challenges.$inferSelect;
