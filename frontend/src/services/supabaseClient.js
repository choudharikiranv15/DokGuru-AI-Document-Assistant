import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

// In production, environment variables must be configured
// Configuration errors will be caught at runtime
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
