import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ufkyppfzyggghrixikiaw.supabase.co'
const supabaseKey = 'sb_publishable_IqR-YG1I7Etq9qdLOiXKxw_SrPhA73R'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce'
  }
})