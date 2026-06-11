import { neon } from '@neondatabase/serverless';

let bootstrapPromise: Promise<void> | null = null;

export async function ensureDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  if (!bootstrapPromise) {
    const sql = neon(databaseUrl);
    bootstrapPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id text NOT NULL UNIQUE,
          name text NOT NULL DEFAULT 'Eco Warrior',
          email text NOT NULL DEFAULT 'eco.warrior@verdant.io',
          avatar text DEFAULT 'Leaf',
          location text NOT NULL DEFAULT 'San Francisco, USA',
          monthly_budget_kg numeric(10,3) NOT NULL DEFAULT 400,
          total_carbon_kg numeric(10,3) NOT NULL DEFAULT 0,
          streak integer NOT NULL DEFAULT 1,
          level integer NOT NULL DEFAULT 1,
          xp integer NOT NULL DEFAULT 120,
          preferences jsonb NOT NULL DEFAULT '{"dailyReminder":true,"weeklyReport":false,"milestoneAlerts":true,"useMetric":true,"defaultCategory":"transport","profileVisibility":"public","showOnLeaderboard":true}'::jsonb,
          joined_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{"dailyReminder":true,"weeklyReport":false,"milestoneAlerts":true,"useMetric":true,"defaultCategory":"transport","profileVisibility":"public","showOnLeaderboard":true}'::jsonb`;
      await sql`
        CREATE TABLE IF NOT EXISTS activities (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          category text NOT NULL,
          sub_category text NOT NULL,
          value numeric(12,3) NOT NULL,
          unit text NOT NULL,
          carbon_kg numeric(12,3) NOT NULL,
          notes text,
          ai_suggestion text,
          timestamp timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS badges (
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          badge_id text NOT NULL,
          name text NOT NULL,
          description text NOT NULL,
          icon text NOT NULL,
          rarity text NOT NULL,
          earned_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (user_id, badge_id)
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS challenges (
          id text PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title text NOT NULL,
          description text NOT NULL,
          category text NOT NULL,
          target_reduction_kg numeric(10,3) NOT NULL,
          current_progress_kg numeric(10,3) NOT NULL DEFAULT 0,
          duration text NOT NULL,
          xp_reward integer NOT NULL,
          participants integer NOT NULL DEFAULT 0,
          status text NOT NULL DEFAULT 'active',
          ends_at timestamptz NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS insight_cache (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          request_hash text NOT NULL,
          payload jsonb NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS rate_limits (
          key text NOT NULL,
          bucket text NOT NULL,
          count integer NOT NULL DEFAULT 0,
          reset_at timestamptz NOT NULL,
          PRIMARY KEY (key, bucket)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS activities_user_timestamp_idx ON activities(user_id, timestamp DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS challenges_user_status_idx ON challenges(user_id, status)`;
      await sql`CREATE INDEX IF NOT EXISTS insight_cache_user_hash_idx ON insight_cache(user_id, request_hash)`;
    })();
  }

  await bootstrapPromise;
}
