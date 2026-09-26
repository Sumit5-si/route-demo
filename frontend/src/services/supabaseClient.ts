import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mwmzebnpvrbzvdnqikzm.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bXplYm5wdnJienZkbnFpa3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDg1MTUsImV4cCI6MjEwNDcyNDUxNX0.gWLfzHQJsJbe1RQyAQ2bZUQL03Bdmo_b7zoCZXXGFS8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
